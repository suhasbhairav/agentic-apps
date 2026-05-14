"use client";

import { useMemo, useState } from "react";

const sampleForm = {
  requestId: "REQ-1001",
  employeeName: "Sam Copperfield",
  department: "Engineering",
  businessUnit: "Platform",
  region: "EU",
  itemType: "software",
  itemName: "Observability Platform",
  vendorName: "Acme Observability Inc.",
  estimatedCost: "42000",
  currency: "EUR",
  contractTermMonths: "12",
  businessJustification:
    "We need an observability platform to monitor production APIs, reduce incident response time, improve reliability reporting for enterprise customers, and provide engineering teams with real time visibility into latency, error rates, and service health.",
  urgency: "high",
  requestedStartDate: "2026-06-01",
  containsPersonalData: true,
  containsSecurityData: true,
  isNewVendor: true,
  budgetOwner: "Head of Engineering",
  policyContext:
    "Purchases above 25000 EUR require budget owner and procurement approval. New vendors require vendor onboarding. Tools processing personal data require privacy review. Security sensitive tools require security review. Procurement must approve before any purchase order is submitted.",
};

const emptyForm = {
  requestId: "",
  employeeName: "",
  department: "",
  businessUnit: "",
  region: "EU",
  itemType: "software",
  itemName: "",
  vendorName: "",
  estimatedCost: "",
  currency: "EUR",
  contractTermMonths: "12",
  businessJustification: "",
  urgency: "medium",
  requestedStartDate: "",
  containsPersonalData: false,
  containsSecurityData: false,
  isNewVendor: false,
  budgetOwner: "",
  policyContext: "",
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildPayload(form) {
  return {
    action: "analyze",
    request: {
      requestId: form.requestId || `REQ-${Date.now()}`,
      employeeName: form.employeeName,
      department: form.department,
      businessUnit: form.businessUnit,
      region: form.region,
      itemType: form.itemType,
      itemName: form.itemName,
      vendorName: form.vendorName,
      estimatedCost: toNumber(form.estimatedCost),
      currency: form.currency,
      contractTermMonths: toNumber(form.contractTermMonths, 12),
      businessJustification: form.businessJustification,
      urgency: form.urgency,
      requestedStartDate: form.requestedStartDate,
      containsPersonalData: Boolean(form.containsPersonalData),
      containsSecurityData: Boolean(form.containsSecurityData),
      isNewVendor: Boolean(form.isNewVendor),
      budgetOwner: form.budgetOwner,
    },
    policyContext: form.policyContext,
  };
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

function getRiskClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (
    [
      "high",
      "critical",
      "reject",
      "rejected",
      "blocked",
      "security_review_required",
      "legal_review_required",
      "reject_vendor_for_now",
    ].includes(normalized)
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (
    [
      "medium",
      "needs_review",
      "approve_with_conditions",
      "request_more_information",
      "insufficient_information",
      "start_vendor_onboarding",
    ].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (
    [
      "low",
      "approve",
      "approved",
      "compliant",
      "approve_existing_vendor",
      "submitted",
      "simulated",
    ].includes(normalized)
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function MetricCard({ label, value, helper, tone = "blue" }) {
  const toneMap = {
    blue: "border-blue-100 bg-blue-50/70",
    green: "border-emerald-100 bg-emerald-50/70",
    amber: "border-amber-100 bg-amber-50/70",
    red: "border-red-100 bg-red-50/70",
    slate: "border-slate-200 bg-white",
    violet: "border-violet-100 bg-violet-50/70",
  };

  return (
    <div
      className={classNames(
        "rounded-3xl border p-5 shadow-sm",
        toneMap[tone] || toneMap.slate
      )}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value || "—"}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
      ) : null}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows = 4,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
      ) : (
        <input
          value={value}
          type={type}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={classNames(
        "flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition",
        checked
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <span>
        <span className="block text-sm font-bold text-slate-950">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={classNames(
          "mt-1 flex h-6 w-11 flex-none items-center rounded-full p-1 transition",
          checked ? "bg-blue-600" : "bg-slate-300"
        )}
      >
        <span
          className={classNames(
            "h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

function JsonBlock({ data }) {
  return (
    <pre className="max-h-[32rem] overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ListBlock({ items = [] }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No items returned.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ActionList({ actions = [] }) {
  if (!actions.length) {
    return <p className="text-sm text-slate-500">No actions returned.</p>;
  }

  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <div
          key={`${action.owner}-${action.action}-${index}`}
          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap gap-2">
            <Pill className="bg-blue-50 text-blue-700 ring-blue-200">
              {action.owner}
            </Pill>
            <Pill className={getRiskClass(action.priority)}>
              {action.priority}
            </Pill>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-950">
            {action.action}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {action.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState(sampleForm);
  const [result, setResult] = useState(null);
  const [approval, setApproval] = useState(null);
  const [humanDecision, setHumanDecision] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [approver, setApprover] = useState({
    name: "Suhas Bhairav",
    role: "Procurement Manager",
    email: "suhas@example.com",
    comment: "Approved after procurement review.",
  });

  const payloadPreview = useMemo(() => buildPayload(form), [form]);

  const canAnalyze =
    form.itemName.trim().length > 2 &&
    form.businessJustification.trim().length > 20 &&
    Number(form.estimatedCost) > 0;

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetAll(nextForm) {
    setForm(nextForm);
    setError("");
    setResult(null);
    setApproval(null);
    setHumanDecision(null);
    setRawResponse(null);
  }

  async function analyzeRequest() {
    setError("");
    setResult(null);
    setApproval(null);
    setHumanDecision(null);
    setRawResponse(null);

    if (!canAnalyze) {
      setError(
        "Please provide item name, estimated cost, and a meaningful business justification."
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/procurement-approval-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      const data = await response.json();
      setRawResponse(data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Procurement analysis failed.");
      }

      if (data.status === "pending_human_approval") {
        setApproval(data);
        setResult(data.currentPartialOutput || null);
      } else {
        setResult(data.analysis || null);
      }
    } catch (err) {
      setError(err.message || "Unexpected procurement analysis failure.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function decideApproval(decision) {
    if (!approval?.approvalId) {
      setError("No pending approval found.");
      return;
    }

    setError("");
    setIsApproving(true);

    try {
      const response = await fetch("/api/procurement-approval-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: decision,
          approvalId: approval.approvalId,
          approver: {
            name: approver.name,
            role: approver.role,
            email: approver.email,
          },
          comment: approver.comment,
        }),
      });

      const data = await response.json();
      setRawResponse(data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Failed to ${decision} approval.`);
      }

      setResult(data.analysis || null);
      setApproval(null);

      setHumanDecision({
        decision: decision === "approve" ? "approved" : "rejected",
        decidedAt: new Date().toISOString(),
        approver: {
          name: approver.name,
          role: approver.role,
          email: approver.email,
        },
        comment: approver.comment,
        mode: "backend_tool_resume",
      });
    } catch (err) {
      setError(err.message || "Unexpected approval decision failure.");
    } finally {
      setIsApproving(false);
    }
  }

  function decideLocalHumanReview(decision) {
    setHumanDecision({
      decision,
      decidedAt: new Date().toISOString(),
      approver: {
        name: approver.name,
        role: approver.role,
        email: approver.email,
      },
      comment: approver.comment,
      mode: "local_human_review",
    });
  }

  const decision = result?.decision;
  const policyReview = result?.policyReview;
  const vendorRisk = result?.vendorRisk;
  const budgetImpact = result?.budgetImpact;
  const businessCase = result?.businessCase;
  const executionResult = result?.executionResult;
  const humanApproval = result?.humanApproval;

  const shouldShowLocalHumanReviewPanel =
    result &&
    !approval &&
    !executionResult &&
    !humanDecision &&
    (result?.governance?.requiresHumanReview ||
      result?.humanApproval?.required ||
      result?.decision?.recommendation === "approve" ||
      result?.decision?.recommendation === "approve_with_conditions" ||
      result?.decision?.recommendation === "request_more_information" ||
      result?.decision?.recommendation === "reject");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12%] top-[-12%] h-[28rem] w-[28rem] rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute right-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[20%] h-[34rem] w-[34rem] rounded-full bg-violet-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="py-10 sm:py-14">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.45)]" />
              Human Approval AI Agent
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
              Enterprise Procurement{" "}
              <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-violet-700 bg-clip-text text-transparent">
                Approval Agent
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Analyze procurement requests with specialist AI agents for policy,
              vendor risk, budget impact, business value, and purchase order
              readiness. Sensitive execution is paused until a human approves.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Workflow"
              value="Human in Loop"
              helper="Sensitive purchase order submission waits for approval."
              tone="blue"
            />
            <MetricCard
              label="Specialists"
              value="4 Agents"
              helper="Policy, vendor risk, budget, and business case."
              tone="violet"
            />
            <MetricCard
              label="Action Safety"
              value="Approval Gate"
              helper="The agent can prepare, but not execute without review."
              tone="green"
            />
            <MetricCard
              label="Output"
              value="Structured JSON"
              helper="Ready for procurement, ERP, and audit workflows."
              tone="amber"
            />
          </div>
        </header>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Procurement Request
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Enter a purchase request and let the agent assess approval
                  readiness, risks, policy requirements, and action safety.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => resetAll(sampleForm)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Sample
                </button>

                <button
                  type="button"
                  onClick={() => resetAll(emptyForm)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Request ID"
                value={form.requestId}
                onChange={(value) => updateField("requestId", value)}
                placeholder="REQ-1001"
              />
              <Field
                label="Employee Name"
                value={form.employeeName}
                onChange={(value) => updateField("employeeName", value)}
                placeholder="Sam Copperfield"
              />
              <Field
                label="Department"
                value={form.department}
                onChange={(value) => updateField("department", value)}
                placeholder="Engineering"
              />
              <Field
                label="Business Unit"
                value={form.businessUnit}
                onChange={(value) => updateField("businessUnit", value)}
                placeholder="Platform"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Region"
                value={form.region}
                onChange={(value) => updateField("region", value)}
                options={[
                  { label: "EU", value: "EU" },
                  { label: "US", value: "US" },
                  { label: "UK", value: "UK" },
                  { label: "APAC", value: "APAC" },
                  { label: "Global", value: "Global" },
                ]}
              />
              <SelectField
                label="Item Type"
                value={form.itemType}
                onChange={(value) => updateField("itemType", value)}
                options={[
                  { label: "Software", value: "software" },
                  { label: "Hardware", value: "hardware" },
                  { label: "Cloud", value: "cloud" },
                  { label: "Consulting", value: "consulting" },
                  { label: "Data", value: "data" },
                  { label: "Security", value: "security" },
                  { label: "Other", value: "other" },
                ]}
              />
              <SelectField
                label="Urgency"
                value={form.urgency}
                onChange={(value) => updateField("urgency", value)}
                options={[
                  { label: "Low", value: "low" },
                  { label: "Medium", value: "medium" },
                  { label: "High", value: "high" },
                  { label: "Critical", value: "critical" },
                ]}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Item Name"
                value={form.itemName}
                onChange={(value) => updateField("itemName", value)}
                placeholder="Observability Platform"
              />
              <Field
                label="Vendor Name"
                value={form.vendorName}
                onChange={(value) => updateField("vendorName", value)}
                placeholder="Acme Observability Inc."
              />
              <Field
                label="Estimated Cost"
                value={form.estimatedCost}
                onChange={(value) => updateField("estimatedCost", value)}
                placeholder="42000"
                type="number"
              />
              <Field
                label="Currency"
                value={form.currency}
                onChange={(value) => updateField("currency", value)}
                placeholder="EUR"
              />
              <Field
                label="Contract Term Months"
                value={form.contractTermMonths}
                onChange={(value) => updateField("contractTermMonths", value)}
                placeholder="12"
                type="number"
              />
              <Field
                label="Requested Start Date"
                value={form.requestedStartDate}
                onChange={(value) => updateField("requestedStartDate", value)}
                type="date"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Budget Owner"
                value={form.budgetOwner}
                onChange={(value) => updateField("budgetOwner", value)}
                placeholder="Head of Engineering"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Business Justification"
                value={form.businessJustification}
                onChange={(value) =>
                  updateField("businessJustification", value)
                }
                placeholder="Explain the business need, operational impact, expected value, and urgency."
                textarea
                rows={7}
              />
            </div>

            <div className="mt-4 grid gap-3">
              <ToggleField
                label="Contains Personal Data"
                description="Select this if the tool processes employee, customer, user, or personal information."
                checked={form.containsPersonalData}
                onChange={(value) =>
                  updateField("containsPersonalData", value)
                }
              />
              <ToggleField
                label="Contains Security Sensitive Data"
                description="Select this if the tool touches logs, infrastructure, access control, secrets, vulnerabilities, or production systems."
                checked={form.containsSecurityData}
                onChange={(value) =>
                  updateField("containsSecurityData", value)
                }
              />
              <ToggleField
                label="New Vendor"
                description="Select this if the vendor is not already approved or onboarded."
                checked={form.isNewVendor}
                onChange={(value) => updateField("isNewVendor", value)}
              />
            </div>

            <div className="mt-4">
              <Field
                label="Policy Context"
                value={form.policyContext}
                onChange={(value) => updateField("policyContext", value)}
                placeholder="Paste procurement policy, approval rules, spend thresholds, vendor onboarding rules, privacy review rules, or security review rules."
                textarea
                rows={6}
              />
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={analyzeRequest}
                disabled={isAnalyzing || !canAnalyze}
                className={classNames(
                  "inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black shadow-sm transition sm:w-auto",
                  isAnalyzing || !canAnalyze
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-blue-600 text-white hover:bg-slate-950"
                )}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Running Agent
                  </span>
                ) : (
                  "Analyze Procurement Request"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPayload((current) => !current)}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                {showPayload ? "Hide Payload" : "Show Payload"}
              </button>
            </div>

            {showPayload ? (
              <div className="mt-6">
                <JsonBlock data={payloadPreview} />
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            {isAnalyzing ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className="text-sm font-bold text-slate-700">
                    Specialist agents are reviewing policy, vendor risk, budget,
                    and business case...
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                </div>
              </div>
            ) : null}

            {!isAnalyzing && !result && !approval ? (
              <div className="flex min-h-[34rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 ring-1 ring-blue-100">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                  Awaiting Procurement Analysis
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Load the sample request or enter a new procurement case. The
                  system will analyze approval readiness and pause sensitive
                  execution until a human decision is made.
                </p>
              </div>
            ) : null}

            {approval ? (
              <Section
                title="Backend Tool Approval Required"
                description="The agent prepared a sensitive purchase order action. Execution is paused by the backend until an authorized human approves or rejects."
              >
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Pill className="bg-amber-100 text-amber-800 ring-amber-200">
                      Pending Backend Approval
                    </Pill>
                    <Pill className="bg-white text-slate-700 ring-slate-200">
                      {approval.approvalId}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-amber-900">
                    {approval.message}
                  </p>

                  {approval.pendingApprovals?.length ? (
                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Pending Tool Action
                      </p>
                      <JsonBlock data={approval.pendingApprovals} />
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Approver Name"
                    value={approver.name}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Approver Name"
                  />
                  <Field
                    label="Approver Role"
                    value={approver.role}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        role: value,
                      }))
                    }
                    placeholder="Procurement Manager"
                  />
                  <Field
                    label="Approver Email"
                    value={approver.email}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    placeholder="approver@example.com"
                  />
                </div>

                <div className="mt-4">
                  <Field
                    label="Approval Comment"
                    value={approver.comment}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        comment: value,
                      }))
                    }
                    textarea
                    rows={4}
                    placeholder="Approved after review."
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={() => decideApproval("approve")}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                  >
                    {isApproving ? "Processing..." : "Approve and Resume"}
                  </button>

                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={() => decideApproval("reject")}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                  >
                    {isApproving ? "Processing..." : "Reject and Resume"}
                  </button>
                </div>
              </Section>
            ) : null}

            {shouldShowLocalHumanReviewPanel ? (
              <Section
                title="Human Review Decision"
                description="The analysis requires human review. This panel lets a human approve or reject the recommendation even when no backend tool execution was triggered."
              >
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Pill className="bg-blue-100 text-blue-800 ring-blue-200">
                      Human Review Required
                    </Pill>

                    <Pill className={getRiskClass(result?.decision?.recommendation)}>
                      Recommendation: {result?.decision?.recommendation || "review"}
                    </Pill>

                    <Pill className={getRiskClass(result?.governance?.riskLevel)}>
                      Risk: {result?.governance?.riskLevel || "unknown"}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-blue-950">
                    The AI has completed the procurement analysis. A human
                    decision is required before this request should move forward.
                  </p>

                  {result?.humanApproval?.reason ? (
                    <p className="mt-3 rounded-2xl border border-blue-200 bg-white p-4 text-sm leading-7 text-slate-700">
                      {result.humanApproval.reason}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Approver Name"
                    value={approver.name}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Approver Name"
                  />

                  <Field
                    label="Approver Role"
                    value={approver.role}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        role: value,
                      }))
                    }
                    placeholder="Procurement Manager"
                  />

                  <Field
                    label="Approver Email"
                    value={approver.email}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    placeholder="approver@example.com"
                  />
                </div>

                <div className="mt-4">
                  <Field
                    label="Human Review Comment"
                    value={approver.comment}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        comment: value,
                      }))
                    }
                    textarea
                    rows={4}
                    placeholder="Approved after review."
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => decideLocalHumanReview("approved")}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
                  >
                    Approve Recommendation
                  </button>

                  <button
                    type="button"
                    onClick={() => decideLocalHumanReview("rejected")}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-red-700 sm:w-auto"
                  >
                    Reject Recommendation
                  </button>
                </div>
              </Section>
            ) : null}

            {humanDecision ? (
              <Section
                title="Human Decision Recorded"
                description="This records the human decision in the UI for demo and review purposes."
              >
                <div
                  className={classNames(
                    "rounded-3xl border p-5",
                    humanDecision.decision === "approved"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex flex-wrap gap-2">
                    <Pill
                      className={
                        humanDecision.decision === "approved"
                          ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                          : "bg-red-100 text-red-800 ring-red-200"
                      }
                    >
                      {humanDecision.decision === "approved"
                        ? "Approved by Human"
                        : "Rejected by Human"}
                    </Pill>

                    <Pill className="bg-white text-slate-700 ring-slate-200">
                      {humanDecision.approver.name}
                    </Pill>

                    <Pill className="bg-white text-slate-700 ring-slate-200">
                      {humanDecision.approver.role}
                    </Pill>

                    <Pill className="bg-white text-slate-700 ring-slate-200">
                      {humanDecision.mode}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {humanDecision.comment}
                  </p>

                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Decision recorded at{" "}
                    {new Date(humanDecision.decidedAt).toLocaleString()}
                  </p>
                </div>
              </Section>
            ) : null}

            {result ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Recommendation"
                    value={decision?.recommendation}
                    helper={decision?.reason}
                    tone={
                      decision?.recommendation === "reject"
                        ? "red"
                        : decision?.recommendation ===
                          "approve_with_conditions"
                        ? "amber"
                        : "green"
                    }
                  />
                  <MetricCard
                    label="Policy"
                    value={policyReview?.policyStatus}
                    helper={`${
                      policyReview?.requiredApprovals?.length || 0
                    } approval areas`}
                    tone={
                      policyReview?.policyStatus === "compliant"
                        ? "green"
                        : "amber"
                    }
                  />
                  <MetricCard
                    label="Vendor Risk"
                    value={vendorRisk?.vendorRisk}
                    helper={vendorRisk?.recommendedVendorAction}
                    tone={
                      vendorRisk?.vendorRisk === "high"
                        ? "red"
                        : vendorRisk?.vendorRisk === "medium"
                        ? "amber"
                        : "green"
                    }
                  />
                  <MetricCard
                    label="Annualized Cost"
                    value={
                      budgetImpact?.estimatedAnnualizedCost
                        ? `${budgetImpact.estimatedAnnualizedCost} ${form.currency}`
                        : "—"
                    }
                    helper={`Budget risk: ${budgetImpact?.budgetRisk || "—"}`}
                    tone={
                      budgetImpact?.budgetRisk === "high"
                        ? "red"
                        : budgetImpact?.budgetRisk === "medium"
                        ? "amber"
                        : "blue"
                    }
                  />
                </div>

                <Section
                  title="Executive Summary"
                  description="One concise view of the procurement recommendation and human approval requirement."
                >
                  <p className="text-sm leading-7 text-slate-700">
                    {result.executiveSummary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill className={getRiskClass(decision?.recommendation)}>
                      {decision?.recommendation}
                    </Pill>
                    <Pill className={getRiskClass(humanApproval?.approvalType)}>
                      Approval: {humanApproval?.approvalType}
                    </Pill>
                    <Pill className={getRiskClass(result.governance?.riskLevel)}>
                      Risk: {result.governance?.riskLevel}
                    </Pill>
                    <Pill className="bg-slate-100 text-slate-700 ring-slate-200">
                      Confidence:{" "}
                      {Math.round((decision?.confidence || 0) * 100)}%
                    </Pill>
                  </div>
                </Section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Policy Review"
                    description="Approval path, missing requirements, and procurement policy concerns."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(policyReview?.policyStatus)}>
                        {policyReview?.policyStatus}
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {policyReview?.rationale}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Required Approvals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {policyReview?.requiredApprovals?.map((item) => (
                          <Pill
                            key={item}
                            className="bg-blue-50 text-blue-700 ring-blue-200"
                          >
                            {item}
                          </Pill>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Policy Concerns
                      </p>
                      <ListBlock items={policyReview?.policyConcerns || []} />
                    </div>
                  </Section>

                  <Section
                    title="Vendor Risk"
                    description="Vendor onboarding, due diligence, legal, privacy, and security risk."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(vendorRisk?.vendorRisk)}>
                        {vendorRisk?.vendorRisk}
                      </Pill>
                      <Pill
                        className={getRiskClass(
                          vendorRisk?.recommendedVendorAction
                        )}
                      >
                        {vendorRisk?.recommendedVendorAction}
                      </Pill>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Risk Factors
                      </p>
                      <ListBlock items={vendorRisk?.riskFactors || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Due Diligence Checks
                      </p>
                      <ListBlock
                        items={vendorRisk?.dueDiligenceChecks || []}
                      />
                    </div>
                  </Section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Budget Impact"
                    description="Cost, spend category, annualized impact, and budget owner action."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(budgetImpact?.budgetRisk)}>
                        Budget Risk: {budgetImpact?.budgetRisk}
                      </Pill>
                      <Pill className="bg-slate-100 text-slate-700 ring-slate-200">
                        {budgetImpact?.spendCategory}
                      </Pill>
                    </div>

                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Budget Owner Action
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {budgetImpact?.budgetOwnerAction}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Cost Concerns
                      </p>
                      <ListBlock items={budgetImpact?.costConcerns || []} />
                    </div>
                  </Section>

                  <Section
                    title="Business Case"
                    description="Business value, urgency, benefits, objections, and recommendation."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(businessCase?.businessValue)}>
                        Value: {businessCase?.businessValue}
                      </Pill>
                      <Pill
                        className={getRiskClass(
                          businessCase?.urgencyAssessment
                        )}
                      >
                        Urgency: {businessCase?.urgencyAssessment}
                      </Pill>
                      <Pill className={getRiskClass(businessCase?.recommendation)}>
                        {businessCase?.recommendation}
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {businessCase?.operationalImpact}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Benefits
                      </p>
                      <ListBlock items={businessCase?.benefits || []} />
                    </div>
                  </Section>
                </div>

                {result.purchaseOrderDraft ? (
                  <Section
                    title="Purchase Order Draft"
                    description="Prepared by the agent. Submission requires human approval."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MetricCard
                        label="Vendor"
                        value={result.purchaseOrderDraft.vendorName}
                        tone="slate"
                      />
                      <MetricCard
                        label="Amount"
                        value={`${result.purchaseOrderDraft.amount} ${result.purchaseOrderDraft.currency}`}
                        tone="blue"
                      />
                      <MetricCard
                        label="Item"
                        value={result.purchaseOrderDraft.itemName}
                        tone="slate"
                      />
                      <MetricCard
                        label="Term"
                        value={`${result.purchaseOrderDraft.contractTermMonths} months`}
                        tone="violet"
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Approval Summary
                      </p>
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                        {result.purchaseOrderDraft.approvalSummary}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Required Conditions
                      </p>
                      <ListBlock
                        items={result.purchaseOrderDraft.requiredConditions}
                      />
                    </div>
                  </Section>
                ) : null}

                {executionResult ? (
                  <Section
                    title="Execution Result"
                    description="This appears only after human approval or rejection flow is resumed."
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        label="Status"
                        value={executionResult.status}
                        helper={executionResult.executionMode}
                        tone={
                          executionResult.status === "submitted" ||
                          executionResult.status === "simulated"
                            ? "green"
                            : "red"
                        }
                      />
                      <MetricCard
                        label="PO ID"
                        value={executionResult.purchaseOrderId}
                        tone="blue"
                      />
                      <MetricCard
                        label="Amount"
                        value={`${executionResult.amount} ${executionResult.currency}`}
                        tone="violet"
                      />
                      <MetricCard
                        label="Executed"
                        value={executionResult.executed ? "Yes" : "No"}
                        tone="slate"
                      />
                    </div>

                    <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                      {executionResult.auditMessage}
                    </p>
                  </Section>
                ) : null}

                <Section
                  title="Recommended Actions"
                  description="Operational next steps for requester, procurement, security, privacy, finance, and leadership."
                >
                  <ActionList actions={result.recommendedActions || []} />
                </Section>

                <Section
                  title="Governance"
                  description="Human review, risk level, PII or secret flags, and audit indicators."
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                      label="Human Review"
                      value={
                        result.governance?.requiresHumanReview
                          ? "Required"
                          : "Optional"
                      }
                      tone={
                        result.governance?.requiresHumanReview
                          ? "amber"
                          : "green"
                      }
                    />
                    <MetricCard
                      label="Risk Level"
                      value={result.governance?.riskLevel}
                      tone={
                        result.governance?.riskLevel === "high"
                          ? "red"
                          : result.governance?.riskLevel === "medium"
                          ? "amber"
                          : "green"
                      }
                    />
                    <MetricCard
                      label="PII or Secrets"
                      value={
                        result.governance?.piiOrSecretsDetected
                          ? "Detected"
                          : "Not Detected"
                      }
                      tone={
                        result.governance?.piiOrSecretsDetected
                          ? "red"
                          : "green"
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-black text-slate-950">
                      Review Reasons
                    </p>
                    <ListBlock items={result.governance?.reviewReasons || []} />
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-black text-slate-950">
                      Next Best Action
                    </p>
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
                      {result.nextBestAction}
                    </p>
                  </div>

                  {result.tags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {result.tags.map((tag) => (
                        <Pill
                          key={tag}
                          className="bg-slate-100 text-slate-700 ring-slate-200"
                        >
                          #{tag}
                        </Pill>
                      ))}
                    </div>
                  ) : null}
                </Section>

                <Section
                  title="Email Draft to Approver"
                  description="A ready to review message for procurement, budget, or executive approval."
                >
                  <p className="whitespace-pre-wrap rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-950">
                    {result.emailDraftToApprover}
                  </p>
                </Section>
              </>
            ) : null}

            {rawResponse ? (
              <details className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-sm font-black text-slate-700">
                  View Raw API Response
                </summary>
                <div className="mt-4">
                  <JsonBlock data={rawResponse} />
                </div>
              </details>
            ) : null}
          </section>
        </div>

        <footer className="mt-10 border-t border-slate-200 py-8 text-center text-xs leading-6 text-slate-500">
          Enterprise Procurement Approval Agent · Human in the loop ·
          Guardrailed tool execution · Structured procurement intelligence
        </footer>
      </div>
    </main>
  );
}