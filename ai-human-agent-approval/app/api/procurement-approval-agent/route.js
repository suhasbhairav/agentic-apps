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

const MODEL = process.env.PROCUREMENT_AGENT_MODEL || "gpt-5-nano";
const MAX_REQUEST_CHARS = 14000;
const APPROVAL_TTL_SECONDS = 60 * 60 * 24;
const AGENT_VERSION = "procurement-approval-agent-v1";

const memoryStore = globalThis.__PROCUREMENT_APPROVAL_STORE__ || new Map();
globalThis.__PROCUREMENT_APPROVAL_STORE__ = memoryStore;

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

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log(`[STORAGE] Persisting to Upstash Redis...`);
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Redis SET failed");
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
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
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        cache: "no-store",
      });
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
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
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
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
}

function detectLocalSecurityIssues(text = "") {
  console.log(`[SECURITY] Running local security scanner...`);
  const raw = String(text).toLowerCase();
  const issues = [];
  const promptInjectionSignals = ["ignore previous instructions", "system prompt", "jailbreak", "bypass policy"];
  
  if (promptInjectionSignals.some((signal) => raw.includes(signal))) {
    console.warn(`[SECURITY_WARN] Possible prompt injection detected.`);
    issues.push("prompt_injection_attempt");
  }
  return issues;
}

/**
 * -------------------------------------------------------
 * Zod Schemas
 * -------------------------------------------------------
 */
const PolicyReviewOutput = z.object({
  policyStatus: z.enum(["compliant", "needs_review", "blocked", "insufficient_information"]),
  requiredApprovals: z.array(z.string()),
  policyConcerns: z.array(z.string()),
  missingInformation: z.array(z.string()),
  rationale: z.string(),
});

const VendorRiskOutput = z.object({
  vendorRisk: z.enum(["low", "medium", "high"]),
  riskFactors: z.array(z.string()),
  recommendedVendorAction: z.string(),
});

const BudgetImpactOutput = z.object({
  budgetRisk: z.enum(["low", "medium", "high"]),
  estimatedAnnualizedCost: z.number(),
  costConcerns: z.array(z.string()),
});

const BusinessCaseOutput = z.object({
  businessValue: z.enum(["low", "medium", "high"]),
  recommendation: z.enum(["approve", "approve_with_conditions", "request_more_information", "reject"]),
});

const PurchaseOrderDraft = z.object({
  requestId: z.string(),
  vendorName: z.string(),
  itemName: z.string(),
  amount: z.number(),
  currency: z.string(),
  approvalSummary: z.string(),
});

const FinalProcurementOutput = z.object({
  requestId: z.string(),
  executiveSummary: z.string(),
  decision: z.object({ recommendation: z.string(), confidence: z.number(), reason: z.string() }),
  policyReview: PolicyReviewOutput,
  vendorRisk: VendorRiskOutput,
  budgetImpact: BudgetImpactOutput,
  businessCase: BusinessCaseOutput,
  purchaseOrderDraft: PurchaseOrderDraft.nullable(),
  governance: z.object({ requiresHumanReview: z.boolean(), piiOrSecretsDetected: z.boolean(), riskLevel: z.string(), reviewReasons: z.array(z.string()) }),
});

/**
 * -------------------------------------------------------
 * Sensitive Tool (Needs Approval)
 * -------------------------------------------------------
 */
const submitPurchaseOrderTool = tool({
  name: "submit_purchase_order",
  description: "Sensitive action: Submits PO to ERP. Requires human approval.",
  parameters: PurchaseOrderDraft,
  needsApproval: true,
  execute: async (poDraft) => {
    console.log(`[TOOL_EXECUTE] Submitting PO for Request: ${poDraft.requestId}`);
    const dryRun = process.env.PROCUREMENT_DRY_RUN !== "false";
    return {
      executed: true,
      executionMode: dryRun ? "dry_run" : "live",
      purchaseOrderId: `PO-${Date.now()}`,
      status: dryRun ? "simulated" : "submitted",
      executedAt: new Date().toISOString(),
    };
  },
});

/**
 * -------------------------------------------------------
 * Specialist Agents
 * -------------------------------------------------------
 */
const policyReviewAgent = new Agent({
  name: "Policy Agent",
  model: MODEL,
  instructions: "Analyze procurement policy compliance. Return structured output.",
  outputType: PolicyReviewOutput,
});

const vendorRiskAgent = new Agent({
  name: "Vendor Risk Agent",
  model: MODEL,
  instructions: "Evaluate vendor risk. Return structured output.",
  outputType: VendorRiskOutput,
});

const budgetImpactAgent = new Agent({
  name: "Budget Agent",
  model: MODEL,
  instructions: "Evaluate budget impact. Return structured output.",
  outputType: BudgetImpactOutput,
});

const businessCaseAgent = new Agent({
  name: "Business Case Agent",
  model: MODEL,
  instructions: "Evaluate business value. Return structured output.",
});

/**
 * -------------------------------------------------------
 * Orchestrator
 * -------------------------------------------------------
 */
const procurementOrchestrator = new Agent({
  name: "Procurement Orchestrator",
  model: MODEL,
  instructions: "Coordinate specialist agents. Human approval is mandatory for PO submission.",
  tools: [
    policyReviewAgent.asTool({ toolName: "policy_review" }),
    vendorRiskAgent.asTool({ toolName: "vendor_risk" }),
    budgetImpactAgent.asTool({ toolName: "budget_impact" }),
    businessCaseAgent.asTool({ toolName: "business_case" }),
    submitPurchaseOrderTool,
  ],
  outputType: FinalProcurementOutput,
});

/**
 * -------------------------------------------------------
 * Route Handlers
 * -------------------------------------------------------
 */

async function handleAnalyze(body, startedAt) {
  console.log(`[FLOW] Starting Analysis flow...`);
  try {
    const request = body.request || {};
    const agentInput = `Analyze request ${request.requestId} for ${request.itemName} from ${request.vendorName}. Cost: ${request.estimatedCost}. Justification: ${request.businessJustification}`;
    
    console.log(`[AGENT] Invoking Orchestrator...`);
    const result = await run(procurementOrchestrator, agentInput, {
      context: { requestId: request.requestId }
    });

    if (result.interruptions?.length > 0) {
      console.log(`[FLOW] Interruption detected. PO submission requires human approval.`);
      const approvalId = `approval_${Date.now()}`;
      const record = {
        approvalId,
        serializedState: result.state.toString(),
        interruptions: result.interruptions,
        payload: body,
        createdAt: new Date().toISOString()
      };
      
      await kvSet(approvalId, record);

      return NextResponse.json({
        ok: true,
        status: "pending_human_approval",
        approvalId,
        pendingApprovals: result.interruptions.map(i => i.name),
        latencyMs: Date.now() - startedAt
      }, { status: 202 });
    }

    console.log(`[FLOW] Analysis completed without interruptions.`);
    return NextResponse.json({ ok: true, analysis: result.finalOutput, latencyMs: Date.now() - startedAt });

  } catch (err) {
    console.error(`[ANALYSIS_ERROR]`, err);
    throw err;
  }
}

async function handleApprovalDecision(body, startedAt, decision) {
  console.log(`[FLOW] Handling Decision: ${decision} for ID: ${body.approvalId}`);
  try {
    const record = await kvGet(body.approvalId);
    if (!record) throw new Error("Approval record not found");

    console.log(`[AGENT] Resuming agent state...`);
    const state = await RunState.fromString(procurementOrchestrator, record.serializedState);

    for (const interruption of record.interruptions) {
      if (decision === "approve") {
        console.log(`[DECISION] Manually approving: ${interruption.name}`);
        state.approve(interruption);
      } else {
        console.log(`[DECISION] Manually rejecting: ${interruption.name}`);
        state.reject(interruption, { message: body.comment || "Rejected by human" });
      }
    }

    const resumedResult = await run(procurementOrchestrator, state);
    console.log(`[FLOW] Resumed run finished.`);
    
    await kvDelete(body.approvalId);

    return NextResponse.json({
      ok: true,
      status: decision === "approve" ? "approved_and_resumed" : "rejected_and_resumed",
      analysis: resumedResult.finalOutput,
      latencyMs: Date.now() - startedAt
    });

  } catch (err) {
    console.error(`[APPROVAL_ERROR]`, err);
    throw err;
  }
}

export async function POST(req) {
  const startedAt = Date.now();
  console.log(`\n--- NEW REQUEST RECEIVED ---`);
  
  try {
    const body = await req.json();
    const action = body.action || "analyze";

    if (action === "analyze") return await handleAnalyze(body, startedAt);
    if (action === "approve") return await handleApprovalDecision(body, startedAt, "approve");
    if (action === "reject") return await handleApprovalDecision(body, startedAt, "reject");

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error(`[CRITICAL_ERROR]`, error);
    
    if (error instanceof InputGuardrailTripwireTriggered) {
      return NextResponse.json({ ok: false, blocked: true, guardrail: "input" }, { status: 400 });
    }
    if (error instanceof OutputGuardrailTripwireTriggered) {
      return NextResponse.json({ ok: false, blocked: true, guardrail: "output" }, { status: 502 });
    }

    return NextResponse.json({
      ok: false,
      error: "Internal failure",
      details: error.message
    }, { status: 500 });
  }
}