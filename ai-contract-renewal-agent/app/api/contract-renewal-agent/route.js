import { NextResponse } from "next/server";
import {
  Agent,
  run,
  tool,
  RunState,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
} from "@openai/agents";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.CONTRACT_RENEWAL_AGENT_MODEL || "gpt-5-nano";
const MAX_REQUEST_CHARS = 14000;
const APPROVAL_TTL_SECONDS = 60 * 60 * 24;
const AGENT_VERSION = "contract-renewal-agent-v1";

const memoryStore = globalThis.__CONTRACT_RENEWAL_APPROVAL_STORE__ || new Map();
globalThis.__CONTRACT_RENEWAL_APPROVAL_STORE__ = memoryStore;

/**
 * -------------------------------------------------------
 * Storage layer with logging
 * -------------------------------------------------------
 */
async function kvSet(key, value, ttlSeconds = APPROVAL_TTL_SECONDS) {
  console.log(`[STORAGE] Setting key: ${key} (TTL: ${ttlSeconds}s)`);

  try {
    const payload = JSON.stringify({
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.log(`[STORAGE] Persisting to Upstash Redis...`);

      const response = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Redis SET failed");
      }

      await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(
          key
        )}/${ttlSeconds}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        }
      );
    } else {
      console.log(`[STORAGE] Falling back to Local Memory Store`);
      memoryStore.set(key, payload);
    }
  } catch (err) {
    console.error(`[STORAGE_ERROR] kvSet failed:`, err);
    throw err;
  }
}

async function kvGet(key) {
  console.log(`[STORAGE] Fetching key: ${key}`);

  try {
    let raw;

    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const response = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      raw = data?.result;
    } else {
      raw = memoryStore.get(key);
    }

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      console.log(`[STORAGE] Key ${key} has expired. Deleting.`);
      await kvDelete(key);
      return null;
    }

    return parsed.value;
  } catch (err) {
    console.error(`[STORAGE_ERROR] kvGet failed:`, err);
    return null;
  }
}

async function kvDelete(key) {
  console.log(`[STORAGE] Deleting key: ${key}`);

  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        }
      );
    } else {
      memoryStore.delete(key);
    }
  } catch (err) {
    console.error(`[STORAGE_ERROR] kvDelete failed:`, err);
  }
}

/**
 * -------------------------------------------------------
 * Utility Functions
 * -------------------------------------------------------
 */
function redactSecrets(text = "") {
  return String(text)
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]")
    .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_ACCESS_KEY]")
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]"
    );
}

function detectLocalSecurityIssues(text = "") {
  console.log(`[SECURITY] Running local security scanner...`);

  const raw = String(text).toLowerCase();
  const issues = [];

  const promptInjectionSignals = [
    "ignore previous instructions",
    "system prompt",
    "jailbreak",
    "bypass policy",
    "developer message",
    "reveal hidden instructions",
  ];

  if (promptInjectionSignals.some((signal) => raw.includes(signal))) {
    console.warn(`[SECURITY_WARN] Possible prompt injection detected.`);
    issues.push("prompt_injection_attempt");
  }

  return issues;
}

function safeTruncate(text = "", maxChars = MAX_REQUEST_CHARS) {
  const value = String(text || "");
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[TRUNCATED]`;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * -------------------------------------------------------
 * Zod Schemas
 * -------------------------------------------------------
 */
const RenewalPolicyReviewOutput = z.object({
  policyStatus: z.enum([
    "compliant",
    "needs_review",
    "blocked",
    "insufficient_information",
  ]),
  requiredApprovals: z.array(z.string()),
  policyConcerns: z.array(z.string()),
  missingInformation: z.array(z.string()),
  renewalConstraints: z.array(z.string()),
  rationale: z.string(),
});

const VendorPerformanceOutput = z.object({
  performanceRating: z.enum(["poor", "acceptable", "good", "excellent"]),
  performanceConcerns: z.array(z.string()),
  serviceLevelSummary: z.string(),
  renewalRiskFromPerformance: z.enum(["low", "medium", "high"]),
  recommendedVendorAction: z.string(),
});

const CommercialImpactOutput = z.object({
  commercialRisk: z.enum(["low", "medium", "high"]),
  currentAnnualCost: z.number(),
  proposedAnnualCost: z.number(),
  costChangePercent: z.number(),
  costConcerns: z.array(z.string()),
  negotiationLevers: z.array(z.string()),
});

const LegalRiskOutput = z.object({
  legalRisk: z.enum(["low", "medium", "high"]),
  contractConcerns: z.array(z.string()),
  clausesToReview: z.array(z.string()),
  recommendedLegalAction: z.string(),
});

const RenewalBusinessCaseOutput = z.object({
  businessValue: z.enum(["low", "medium", "high"]),
  renewalRecommendation: z.enum([
    "renew",
    "renew_with_conditions",
    "renegotiate",
    "request_more_information",
    "do_not_renew",
  ]),
  rationale: z.string(),
});

const RenewalExecutionDraft = z.object({
  renewalId: z.string(),
  contractId: z.string(),
  vendorName: z.string(),
  contractName: z.string(),
  renewalTermMonths: z.number(),
  proposedAnnualCost: z.number(),
  currency: z.string(),
  effectiveDate: z.string(),
  approvalSummary: z.string(),
  conditions: z.array(z.string()),
});

const FinalContractRenewalOutput = z.object({
  renewalId: z.string(),
  contractId: z.string(),
  executiveSummary: z.string(),
  decision: z.object({
    recommendation: z.string(),
    confidence: z.number(),
    reason: z.string(),
  }),
  policyReview: RenewalPolicyReviewOutput,
  vendorPerformance: VendorPerformanceOutput,
  commercialImpact: CommercialImpactOutput,
  legalRisk: LegalRiskOutput,
  businessCase: RenewalBusinessCaseOutput,
  renewalExecutionDraft: RenewalExecutionDraft.nullable(),
  governance: z.object({
    requiresHumanReview: z.boolean(),
    piiOrSecretsDetected: z.boolean(),
    riskLevel: z.string(),
    reviewReasons: z.array(z.string()),
  }),
});

/**
 * -------------------------------------------------------
 * Sensitive Tool: Contract Renewal Execution
 * -------------------------------------------------------
 */
const executeContractRenewalTool = tool({
  name: "execute_contract_renewal",
  description:
    "Sensitive action: Executes or records a contract renewal in the contract management system. Requires human approval.",
  parameters: RenewalExecutionDraft,
  needsApproval: true,
  execute: async (renewalDraft) => {
    console.log(
      `[TOOL_EXECUTE] Executing renewal for Contract: ${renewalDraft.contractId}`
    );

    const dryRun = process.env.CONTRACT_RENEWAL_DRY_RUN !== "false";

    return {
      executed: true,
      executionMode: dryRun ? "dry_run" : "live",
      renewalExecutionId: `REN-EXEC-${Date.now()}`,
      contractId: renewalDraft.contractId,
      renewalId: renewalDraft.renewalId,
      status: dryRun ? "simulated" : "renewed",
      executedAt: new Date().toISOString(),
    };
  },
});

/**
 * -------------------------------------------------------
 * Specialist Agents
 * -------------------------------------------------------
 */
const renewalPolicyReviewAgent = new Agent({
  name: "Renewal Policy Agent",
  model: MODEL,
  instructions: `
You analyze contract renewal policy compliance.

Check:
- renewal approval requirements
- spend thresholds
- auto-renewal rules
- data privacy requirements
- security review requirements
- procurement review requirements
- finance approval requirements
- legal approval requirements
- missing information

Return structured output only.
`,
  outputType: RenewalPolicyReviewOutput,
});

const vendorPerformanceAgent = new Agent({
  name: "Vendor Performance Agent",
  model: MODEL,
  instructions: `
You evaluate vendor performance for contract renewal.

Analyze:
- SLA performance
- support quality
- delivery history
- incidents
- business complaints
- adoption and usage
- operational dependency
- reason to continue or replace vendor

Return structured output only.
`,
  outputType: VendorPerformanceOutput,
});

const commercialImpactAgent = new Agent({
  name: "Commercial Impact Agent",
  model: MODEL,
  instructions: `
You evaluate the commercial and budget impact of a contract renewal.

Analyze:
- current annual cost
- proposed annual cost
- price increase
- cost change percentage
- renewal term
- usage justification
- negotiation opportunities
- commercial risks

Return structured output only.
`,
  outputType: CommercialImpactOutput,
});

const legalRiskAgent = new Agent({
  name: "Legal Risk Agent",
  model: MODEL,
  instructions: `
You evaluate legal and contractual risk for renewal.

Analyze:
- renewal terms
- termination rights
- auto-renewal language
- liability clauses
- data processing clauses
- security clauses
- price increase clauses
- service level clauses
- audit rights
- jurisdiction
- missing legal review points

Return structured output only.
`,
  outputType: LegalRiskOutput,
});

const renewalBusinessCaseAgent = new Agent({
  name: "Renewal Business Case Agent",
  model: MODEL,
  instructions: `
You evaluate whether the contract renewal makes business sense.

Analyze:
- business criticality
- alternative options
- switching cost
- operational dependency
- vendor performance
- commercial value
- risk of non-renewal
- whether to renew, renegotiate, request more information, or not renew

Return structured output only.
`,
  outputType: RenewalBusinessCaseOutput,
});

/**
 * -------------------------------------------------------
 * Orchestrator
 * -------------------------------------------------------
 */
const contractRenewalOrchestrator = new Agent({
  name: "Contract Renewal Orchestrator",
  model: MODEL,
  instructions: `
You are a contract renewal approval orchestrator.

Your job:
1. Coordinate all specialist agents.
2. Review the contract renewal request.
3. Produce a final structured renewal recommendation.
4. If the renewal should proceed, prepare a renewal execution draft.
5. Human approval is mandatory before calling execute_contract_renewal.
6. Do not execute renewal without human approval.
7. If information is missing, do not force approval.
8. If legal, commercial, vendor, policy, privacy, or security risk is high, require human review.

Decision guidance:
- Use "renew" only when risk is low and business value is high.
- Use "renew_with_conditions" when renewal is acceptable but needs controls.
- Use "renegotiate" when price, terms, SLA, liability, or contract risk is material.
- Use "request_more_information" when required details are missing.
- Use "do_not_renew" when business value is low or risk is unacceptable.

Return structured output matching the required schema.
`,
  tools: [
    renewalPolicyReviewAgent.asTool({ toolName: "renewal_policy_review" }),
    vendorPerformanceAgent.asTool({ toolName: "vendor_performance" }),
    commercialImpactAgent.asTool({ toolName: "commercial_impact" }),
    legalRiskAgent.asTool({ toolName: "legal_risk" }),
    renewalBusinessCaseAgent.asTool({ toolName: "renewal_business_case" }),
    executeContractRenewalTool,
  ],
  outputType: FinalContractRenewalOutput,
});

/**
 * -------------------------------------------------------
 * Route Handlers
 * -------------------------------------------------------
 */

async function handleAnalyze(body, startedAt) {
  console.log(`[FLOW] Starting Contract Renewal Analysis flow...`);

  try {
    const request = body.request || {};

    const rawRequestText = JSON.stringify(request);
    const redactedRequestText = redactSecrets(rawRequestText);
    const localSecurityIssues = detectLocalSecurityIssues(redactedRequestText);

    if (redactedRequestText.length > MAX_REQUEST_CHARS) {
      console.warn(`[SECURITY_WARN] Request exceeded max character limit.`);
    }

    const renewalId =
      request.renewalId ||
      request.requestId ||
      `renewal_${Date.now()}`;

    const contractId = request.contractId || "UNKNOWN_CONTRACT_ID";
    const contractName =
      request.contractName ||
      request.itemName ||
      request.serviceName ||
      "Unknown Contract";

    const vendorName = request.vendorName || "Unknown Vendor";

    const currentAnnualCost = toNumber(
      request.currentAnnualCost || request.currentCost || request.previousCost,
      0
    );

    const proposedAnnualCost = toNumber(
      request.proposedAnnualCost ||
        request.renewalCost ||
        request.estimatedCost,
      0
    );

    const costChangePercent =
      currentAnnualCost > 0
        ? ((proposedAnnualCost - currentAnnualCost) / currentAnnualCost) * 100
        : 0;

    const agentInput = safeTruncate(`
Analyze the following contract renewal request.

Agent version:
${AGENT_VERSION}

Renewal ID:
${renewalId}

Contract ID:
${contractId}

Contract name:
${contractName}

Vendor name:
${vendorName}

Contract owner:
${request.contractOwner || request.businessOwner || "Not provided"}

Department:
${request.department || "Not provided"}

Business unit:
${request.businessUnit || "Not provided"}

Region:
${request.region || "Not provided"}

Current annual cost:
${currentAnnualCost}

Proposed annual cost:
${proposedAnnualCost}

Currency:
${request.currency || "EUR"}

Cost change percent:
${costChangePercent.toFixed(2)}

Current contract end date:
${request.currentEndDate || request.contractEndDate || "Not provided"}

Proposed renewal start date:
${request.renewalStartDate || request.effectiveDate || "Not provided"}

Proposed renewal term months:
${request.renewalTermMonths || request.contractTermMonths || "Not provided"}

Auto renewal:
${request.autoRenewal === true ? "Yes" : request.autoRenewal === false ? "No" : "Not provided"}

Notice period:
${request.noticePeriod || "Not provided"}

Business justification:
${request.businessJustification || "Not provided"}

Vendor performance summary:
${request.vendorPerformanceSummary || request.performanceSummary || "Not provided"}

SLA performance:
${request.slaPerformance || "Not provided"}

Incidents or complaints:
${request.incidentsOrComplaints || request.incidents || "Not provided"}

Usage or adoption:
${request.usageSummary || request.adoptionSummary || "Not provided"}

Alternative vendors considered:
${request.alternativesConsidered || "Not provided"}

Switching cost or migration risk:
${request.switchingCostOrMigrationRisk || request.switchingRisk || "Not provided"}

Contains personal data:
${request.containsPersonalData === true ? "Yes" : "No"}

Contains security data:
${request.containsSecurityData === true ? "Yes" : "No"}

Is critical vendor:
${request.isCriticalVendor === true ? "Yes" : "No"}

Is price increase requested:
${proposedAnnualCost > currentAnnualCost ? "Yes" : "No"}

Policy context:
${request.policyContext || "Not provided"}

Contract terms summary:
${request.contractTermsSummary || request.termsSummary || "Not provided"}

Requested action:
${request.requestedAction || "Analyze contract renewal and recommend decision."}

Local security issues detected before agent execution:
${localSecurityIssues.length > 0 ? localSecurityIssues.join(", ") : "None"}

Full sanitized request JSON:
${redactedRequestText}
`);

    console.log(`[AGENT] Invoking Contract Renewal Orchestrator...`);

    const result = await run(contractRenewalOrchestrator, agentInput, {
      context: {
        renewalId,
        contractId,
        vendorName,
      },
    });

    if (result.interruptions?.length > 0) {
      console.log(
        `[FLOW] Interruption detected. Contract renewal execution requires human approval.`
      );

      const approvalId = `renewal_approval_${Date.now()}`;

      const record = {
        approvalId,
        serializedState: result.state.toString(),
        interruptions: result.interruptions,
        payload: body,
        createdAt: new Date().toISOString(),
      };

      await kvSet(approvalId, record);

      return NextResponse.json(
        {
          ok: true,
          status: "pending_human_approval",
          approvalId,
          pendingApprovals: result.interruptions.map((i) => i.name),
          message:
            "Contract renewal analysis is complete, but renewal execution requires human approval.",
          latencyMs: Date.now() - startedAt,
        },
        { status: 202 }
      );
    }

    console.log(`[FLOW] Contract renewal analysis completed.`);

    return NextResponse.json({
      ok: true,
      status: "analysis_completed",
      analysis: result.finalOutput,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(`[ANALYSIS_ERROR]`, err);
    throw err;
  }
}

async function handleApprovalDecision(body, startedAt, decision) {
  console.log(
    `[FLOW] Handling Renewal Decision: ${decision} for ID: ${body.approvalId}`
  );

  try {
    if (!body.approvalId) {
      return NextResponse.json(
        {
          ok: false,
          error: "approvalId is required",
        },
        { status: 400 }
      );
    }

    const record = await kvGet(body.approvalId);

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: "Approval record not found or expired",
        },
        { status: 404 }
      );
    }

    console.log(`[AGENT] Resuming contract renewal agent state...`);

    const state = await RunState.fromString(
      contractRenewalOrchestrator,
      record.serializedState
    );

    for (const interruption of record.interruptions) {
      if (decision === "approve") {
        console.log(`[DECISION] Manually approving: ${interruption.name}`);
        state.approve(interruption);
      } else {
        console.log(`[DECISION] Manually rejecting: ${interruption.name}`);
        state.reject(interruption, {
          message: body.comment || "Contract renewal rejected by human reviewer",
        });
      }
    }

    const resumedResult = await run(contractRenewalOrchestrator, state);

    console.log(`[FLOW] Resumed renewal run finished.`);

    await kvDelete(body.approvalId);

    return NextResponse.json({
      ok: true,
      status:
        decision === "approve"
          ? "approved_and_renewal_resumed"
          : "rejected_and_renewal_resumed",
      analysis: resumedResult.finalOutput,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(`[APPROVAL_ERROR]`, err);
    throw err;
  }
}

/**
 * -------------------------------------------------------
 * Main POST Handler
 * -------------------------------------------------------
 */
export async function POST(req) {
  const startedAt = Date.now();

  console.log(`\n--- NEW CONTRACT RENEWAL REQUEST RECEIVED ---`);

  try {
    const body = await req.json();
    const action = body.action || "analyze";

    if (action === "analyze") {
      return await handleAnalyze(body, startedAt);
    }

    if (action === "approve") {
      return await handleApprovalDecision(body, startedAt, "approve");
    }

    if (action === "reject") {
      return await handleApprovalDecision(body, startedAt, "reject");
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Invalid action",
        allowedActions: ["analyze", "approve", "reject"],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(`[CRITICAL_ERROR]`, error);

    if (error instanceof InputGuardrailTripwireTriggered) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          guardrail: "input",
          error: "Input guardrail triggered",
        },
        { status: 400 }
      );
    }

    if (error instanceof OutputGuardrailTripwireTriggered) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          guardrail: "output",
          error: "Output guardrail triggered",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Internal failure",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}