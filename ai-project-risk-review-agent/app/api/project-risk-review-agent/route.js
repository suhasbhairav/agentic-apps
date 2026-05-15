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

const MODEL = process.env.PROJECT_RISK_AGENT_MODEL || "gpt-5-nano";
const MAX_REQUEST_CHARS = 14000;
const APPROVAL_TTL_SECONDS = 60 * 60 * 24;
const AGENT_VERSION = "project-risk-review-agent-v1";

const memoryStore = globalThis.__PROJECT_RISK_REVIEW_STORE__ || new Map();
globalThis.__PROJECT_RISK_REVIEW_STORE__ = memoryStore;

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

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * -------------------------------------------------------
 * Zod Schemas
 * -------------------------------------------------------
 */

const DeliveryRiskOutput = z.object({
  deliveryRisk: z.enum(["low", "medium", "high", "critical"]),
  timelineConcerns: z.array(z.string()),
  dependencyRisks: z.array(z.string()),
  scopeRisks: z.array(z.string()),
  deliveryConfidence: z.number().min(0).max(1),
  rationale: z.string(),
});

const TechnicalRiskOutput = z.object({
  technicalRisk: z.enum(["low", "medium", "high", "critical"]),
  architectureConcerns: z.array(z.string()),
  integrationConcerns: z.array(z.string()),
  securityConcerns: z.array(z.string()),
  scalabilityConcerns: z.array(z.string()),
  technicalDebtConcerns: z.array(z.string()),
  rationale: z.string(),
});

const ComplianceRiskOutput = z.object({
  complianceRisk: z.enum(["low", "medium", "high", "critical"]),
  privacyConcerns: z.array(z.string()),
  regulatoryConcerns: z.array(z.string()),
  dataHandlingConcerns: z.array(z.string()),
  requiredReviews: z.array(z.string()),
  missingInformation: z.array(z.string()),
  rationale: z.string(),
});

const BudgetTimelineRiskOutput = z.object({
  budgetRisk: z.enum(["low", "medium", "high", "critical"]),
  timelineRisk: z.enum(["low", "medium", "high", "critical"]),
  estimatedBudgetExposure: z.number(),
  costConcerns: z.array(z.string()),
  scheduleConcerns: z.array(z.string()),
  mitigationIdeas: z.array(z.string()),
  rationale: z.string(),
});

const BusinessImpactOutput = z.object({
  businessImpact: z.enum(["low", "medium", "high", "strategic"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  stakeholderImpact: z.array(z.string()),
  valueDrivers: z.array(z.string()),
  downsideIfDelayed: z.array(z.string()),
  recommendation: z.enum([
    "proceed",
    "proceed_with_conditions",
    "request_more_information",
    "pause",
    "reject",
  ]),
  rationale: z.string(),
});

const RiskRegisterEntry = z.object({
  projectId: z.string(),
  projectName: z.string(),
  overallRiskLevel: z.enum(["low", "medium", "high", "critical"]),
  primaryRisks: z.array(z.string()),
  mitigationActions: z.array(z.string()),
  owners: z.array(z.string()),
  reviewCadence: z.enum(["weekly", "biweekly", "monthly", "milestone_based"]),
  escalationRequired: z.boolean(),
  escalationReason: z.string(),
});

const FinalProjectRiskOutput = z.object({
  projectId: z.string(),
  projectName: z.string(),
  executiveSummary: z.string(),

  decision: z.object({
    recommendation: z.enum([
      "proceed",
      "proceed_with_conditions",
      "request_more_information",
      "pause",
      "reject",
    ]),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
  }),

  deliveryRisk: DeliveryRiskOutput,
  technicalRisk: TechnicalRiskOutput,
  complianceRisk: ComplianceRiskOutput,
  budgetTimelineRisk: BudgetTimelineRiskOutput,
  businessImpact: BusinessImpactOutput,

  riskRegisterEntry: RiskRegisterEntry.nullable(),

  governance: z.object({
    requiresHumanReview: z.boolean(),
    piiOrSecretsDetected: z.boolean(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    reviewReasons: z.array(z.string()),
    agentVersion: z.string(),
  }),
});

/**
 * -------------------------------------------------------
 * Sensitive Tool: Risk Register Submission
 * -------------------------------------------------------
 */
const submitRiskRegisterEntryTool = tool({
  name: "submit_risk_register_entry",
  description:
    "Sensitive action: creates or updates a formal project risk register entry. Requires human approval.",
  parameters: RiskRegisterEntry,
  needsApproval: true,
  execute: async (riskEntry) => {
    console.log(
      `[TOOL_EXECUTE] Submitting risk register entry for Project: ${riskEntry.projectId}`
    );

    const dryRun = process.env.PROJECT_RISK_DRY_RUN !== "false";

    return {
      executed: true,
      executionMode: dryRun ? "dry_run" : "live",
      riskRegisterId: `RISK-${Date.now()}`,
      status: dryRun ? "simulated" : "submitted",
      projectId: riskEntry.projectId,
      projectName: riskEntry.projectName,
      overallRiskLevel: riskEntry.overallRiskLevel,
      escalationRequired: riskEntry.escalationRequired,
      executedAt: new Date().toISOString(),
    };
  },
});

/**
 * -------------------------------------------------------
 * Specialist Agents
 * -------------------------------------------------------
 */

const deliveryRiskAgent = new Agent({
  name: "Delivery Risk Agent",
  model: MODEL,
  instructions: `
You are a project delivery risk analyst.

Analyze:
- delivery feasibility
- scope clarity
- timeline pressure
- dependency risk
- resource constraints
- delivery confidence

Return only structured output that matches the schema.
Do not approve or reject the project alone. Only assess delivery risk.
`,
  outputType: DeliveryRiskOutput,
});

const technicalRiskAgent = new Agent({
  name: "Technical Risk Agent",
  model: MODEL,
  instructions: `
You are a senior technical architecture risk analyst.

Analyze:
- architecture risk
- integration risk
- security risk
- scalability risk
- technical debt risk
- operational reliability risk

Return only structured output that matches the schema.
`,
  outputType: TechnicalRiskOutput,
});

const complianceRiskAgent = new Agent({
  name: "Compliance Risk Agent",
  model: MODEL,
  instructions: `
You are a compliance and governance risk analyst.

Analyze:
- privacy risk
- regulatory risk
- data handling risk
- auditability
- security review needs
- missing compliance information

Return only structured output that matches the schema.
`,
  outputType: ComplianceRiskOutput,
});

const budgetTimelineRiskAgent = new Agent({
  name: "Budget Timeline Risk Agent",
  model: MODEL,
  instructions: `
You are a budget and timeline risk analyst.

Analyze:
- budget exposure
- cost overrun risk
- timeline slippage risk
- estimation quality
- schedule dependencies
- mitigation ideas

Return only structured output that matches the schema.
`,
  outputType: BudgetTimelineRiskOutput,
});

const businessImpactAgent = new Agent({
  name: "Business Impact Agent",
  model: MODEL,
  instructions: `
You are a business impact reviewer.

Analyze:
- business value
- urgency
- stakeholder impact
- downside of delay
- strategic relevance
- whether the project should proceed, proceed with conditions, pause, reject, or require more information

Return only structured output that matches the schema.
`,
  outputType: BusinessImpactOutput,
});

/**
 * -------------------------------------------------------
 * Orchestrator
 * -------------------------------------------------------
 */

const projectRiskOrchestrator = new Agent({
  name: "Project Risk Review Orchestrator",
  model: MODEL,
  instructions: `
You are a project risk review orchestrator.

Your job:
1. Coordinate specialist risk agents.
2. Produce a complete project risk review.
3. Identify delivery, technical, compliance, budget, timeline, and business risks.
4. Recommend whether the project should proceed.
5. Create a risk register entry when the project has medium, high, or critical risk.
6. Human approval is mandatory before submitting a formal risk register entry.

Rules:
- Never hide uncertainty.
- If important information is missing, mark the recommendation as request_more_information.
- If compliance, security, or privacy risks are serious, require human review.
- If risk level is high or critical, require human review.
- If a risk register entry is required, call submit_risk_register_entry.
- The final answer must match the FinalProjectRiskOutput schema.
`,
  tools: [
    deliveryRiskAgent.asTool({ toolName: "delivery_risk" }),
    technicalRiskAgent.asTool({ toolName: "technical_risk" }),
    complianceRiskAgent.asTool({ toolName: "compliance_risk" }),
    budgetTimelineRiskAgent.asTool({ toolName: "budget_timeline_risk" }),
    businessImpactAgent.asTool({ toolName: "business_impact" }),
    submitRiskRegisterEntryTool,
  ],
  outputType: FinalProjectRiskOutput,
});

/**
 * -------------------------------------------------------
 * Route Handlers
 * -------------------------------------------------------
 */

async function handleAnalyze(body, startedAt) {
  console.log(`[FLOW] Starting Project Risk Review flow...`);

  try {
    const request = body.request || {};

    const rawPayload = safeStringify(request);

    if (rawPayload.length > MAX_REQUEST_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: `Request too large. Maximum allowed size is ${MAX_REQUEST_CHARS} characters.`,
        },
        { status: 413 }
      );
    }

    const localSecurityIssues = detectLocalSecurityIssues(rawPayload);
    const piiOrSecretsDetected =
      redactSecrets(rawPayload) !== rawPayload || localSecurityIssues.length > 0;

    const sanitizedPayload = redactSecrets(rawPayload);

    const agentInput = `
Analyze the following project for delivery, technical, compliance, budget, timeline, and business risk.

Project payload:
${sanitizedPayload}

Local security scan:
${safeStringify({
  piiOrSecretsDetected,
  localSecurityIssues,
})}

Agent version:
${AGENT_VERSION}

Important:
- If the project has medium, high, or critical risk, prepare a risk register entry.
- If formal risk register submission is needed, use the submit_risk_register_entry tool.
- Formal submission requires human approval.
`;

    console.log(`[AGENT] Invoking Project Risk Orchestrator...`);

    const result = await run(projectRiskOrchestrator, agentInput, {
      context: {
        projectId: request.projectId || request.requestId || "UNKNOWN_PROJECT",
        agentVersion: AGENT_VERSION,
        piiOrSecretsDetected,
      },
    });

    if (result.interruptions?.length > 0) {
      console.log(
        `[FLOW] Interruption detected. Risk register submission requires human approval.`
      );

      const approvalId = `risk_approval_${Date.now()}`;

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
            "Project risk review completed, but formal risk register submission requires human approval.",
          latencyMs: Date.now() - startedAt,
        },
        { status: 202 }
      );
    }

    console.log(`[FLOW] Project risk review completed without interruptions.`);

    return NextResponse.json({
      ok: true,
      status: "completed",
      analysis: result.finalOutput,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(`[ANALYSIS_ERROR]`, err);
    throw err;
  }
}

async function handleApprovalDecision(body, startedAt, decision) {
  console.log(`[FLOW] Handling Decision: ${decision} for ID: ${body.approvalId}`);

  try {
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

    console.log(`[AGENT] Resuming agent state...`);

    const state = await RunState.fromString(
      projectRiskOrchestrator,
      record.serializedState
    );

    for (const interruption of record.interruptions) {
      if (decision === "approve") {
        console.log(`[DECISION] Manually approving: ${interruption.name}`);
        state.approve(interruption);
      } else {
        console.log(`[DECISION] Manually rejecting: ${interruption.name}`);
        state.reject(interruption, {
          message: body.comment || "Risk register submission rejected by human",
        });
      }
    }

    const resumedResult = await run(projectRiskOrchestrator, state);

    console.log(`[FLOW] Resumed run finished.`);

    await kvDelete(body.approvalId);

    return NextResponse.json({
      ok: true,
      status:
        decision === "approve"
          ? "approved_and_resumed"
          : "rejected_and_resumed",
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
 * POST Route
 * -------------------------------------------------------
 */

export async function POST(req) {
  const startedAt = Date.now();

  console.log(`\n--- NEW PROJECT RISK REVIEW REQUEST RECEIVED ---`);

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
        error: "Invalid action. Use analyze, approve, or reject.",
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
          error: "Input guardrail blocked this request.",
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
          error: "Output guardrail blocked this response.",
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