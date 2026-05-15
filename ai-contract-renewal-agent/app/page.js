"use client";

import { useMemo, useState } from "react";

const sampleForm = {
  renewalId: "REN-1001",
  contractId: "CON-2024-7781",
  contractName: "Cloud Observability Platform Renewal",
  vendorName: "Acme Observability Inc.",
  contractOwner: "Head of Engineering",
  department: "Engineering",
  businessUnit: "Platform",
  region: "EU",
  currentAnnualCost: "42000",
  proposedAnnualCost: "51000",
  currency: "EUR",
  currentEndDate: "2026-05-31",
  renewalStartDate: "2026-06-01",
  renewalTermMonths: "12",
  autoRenewal: false,
  noticePeriod: "60 days",
  businessJustification:
    "The platform is used for production monitoring, incident response, reliability reporting, latency tracking, and API health visibility. Engineering and SRE teams use it daily, and replacing it before the renewal date would create operational risk.",
  vendorPerformanceSummary:
    "Vendor support has been responsive overall. SLA uptime was acceptable, but there were two delayed support responses during critical incidents.",
  slaPerformance: "99.8 percent uptime against a 99.9 percent target.",
  incidentsOrComplaints: "Two P1 support delays in the last 12 months.",
  usageSummary: "Used daily by engineering, SRE, and platform teams.",
  alternativesConsidered:
    "Datadog and New Relic were reviewed, but migration effort is high.",
  switchingCostOrMigrationRisk:
    "High migration cost due to dashboards, alerts, integrations, and historical data dependency.",
  containsPersonalData: true,
  containsSecurityData: true,
  isCriticalVendor: true,
  policyContext:
    "Renewals above 50000 EUR require finance approval. Critical vendors require security review. Contracts involving personal data require privacy review. Price increases above 15 percent require commercial renegotiation. Legal must review renewal terms before execution.",
  contractTermsSummary:
    "Annual renewal with standard termination rights. Price increase of approximately 21 percent. Data processing agreement is included.",
};

const emptyForm = {
  renewalId: "",
  contractId: "",
  contractName: "",
  vendorName: "",
  contractOwner: "",
  department: "",
  businessUnit: "",
  region: "EU",
  currentAnnualCost: "",
  proposedAnnualCost: "",
  currency: "EUR",
  currentEndDate: "",
  renewalStartDate: "",
  renewalTermMonths: "12",
  autoRenewal: false,
  noticePeriod: "",
  businessJustification: "",
  vendorPerformanceSummary: "",
  slaPerformance: "",
  incidentsOrComplaints: "",
  usageSummary: "",
  alternativesConsidered: "",
  switchingCostOrMigrationRisk: "",
  containsPersonalData: false,
  containsSecurityData: false,
  isCriticalVendor: false,
  policyContext: "",
  contractTermsSummary: "",
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
      renewalId: form.renewalId || `REN-${Date.now()}`,
      contractId: form.contractId || `CON-${Date.now()}`,
      contractName: form.contractName,
      vendorName: form.vendorName,
      contractOwner: form.contractOwner,
      department: form.department,
      businessUnit: form.businessUnit,
      region: form.region,
      currentAnnualCost: toNumber(form.currentAnnualCost),
      proposedAnnualCost: toNumber(form.proposedAnnualCost),
      currency: form.currency,
      currentEndDate: form.currentEndDate,
      renewalStartDate: form.renewalStartDate,
      renewalTermMonths: toNumber(form.renewalTermMonths, 12),
      autoRenewal: Boolean(form.autoRenewal),
      noticePeriod: form.noticePeriod,
      businessJustification: form.businessJustification,
      vendorPerformanceSummary: form.vendorPerformanceSummary,
      slaPerformance: form.slaPerformance,
      incidentsOrComplaints: form.incidentsOrComplaints,
      usageSummary: form.usageSummary,
      alternativesConsidered: form.alternativesConsidered,
      switchingCostOrMigrationRisk: form.switchingCostOrMigrationRisk,
      containsPersonalData: Boolean(form.containsPersonalData),
      containsSecurityData: Boolean(form.containsSecurityData),
      isCriticalVendor: Boolean(form.isCriticalVendor),
      policyContext: form.policyContext,
      contractTermsSummary: form.contractTermsSummary,
      requestedAction:
        "Analyze this contract renewal request and recommend whether to renew, renew with conditions, renegotiate, request more information, or not renew.",
    },
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
      "blocked",
      "do_not_renew",
      "reject",
      "rejected",
      "poor",
    ].includes(normalized)
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (
    [
      "medium",
      "needs_review",
      "renew_with_conditions",
      "renegotiate",
      "request_more_information",
      "insufficient_information",
      "acceptable",
    ].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (
    [
      "low",
      "renew",
      "approved",
      "approve",
      "compliant",
      "good",
      "excellent",
      "renewed",
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

export default function Home() {
  const [form, setForm] = useState(sampleForm);
  const [result, setResult] = useState(null);
  const [approval, setApproval] = useState(null);
  const [humanDecision, setHumanDecision] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [approver, setApprover] = useState({
    name: "Suhas Bhairav",
    role: "Contract Manager",
    email: "suhas@example.com",
    comment: "Approved after contract renewal review.",
  });

  const payloadPreview = useMemo(() => buildPayload(form), [form]);

  const currentAnnualCost = toNumber(form.currentAnnualCost);
  const proposedAnnualCost = toNumber(form.proposedAnnualCost);
  const costChangePercent =
    currentAnnualCost > 0
      ? ((proposedAnnualCost - currentAnnualCost) / currentAnnualCost) * 100
      : 0;

  const canAnalyze =
    form.contractName.trim().length > 2 &&
    form.vendorName.trim().length > 2 &&
    form.businessJustification.trim().length > 20 &&
    proposedAnnualCost > 0;

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
        "Please provide contract name, vendor name, proposed annual cost, and a meaningful business justification."
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/contract-renewal-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      const data = await response.json();
      setRawResponse(data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Contract renewal analysis failed.");
      }

      if (data.status === "pending_human_approval") {
        setApproval(data);
        setResult(data.currentPartialOutput || null);
      } else {
        setResult(data.analysis || null);
      }
    } catch (err) {
      setError(err.message || "Unexpected contract renewal analysis failure.");
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
      const response = await fetch("/api/contract-renewal-agent", {
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
  const vendorPerformance = result?.vendorPerformance;
  const commercialImpact = result?.commercialImpact;
  const legalRisk = result?.legalRisk;
  const businessCase = result?.businessCase;
  const renewalExecutionDraft = result?.renewalExecutionDraft;

  const shouldShowLocalHumanReviewPanel =
    result &&
    !approval &&
    !humanDecision &&
    (result?.governance?.requiresHumanReview ||
      result?.decision?.recommendation === "renew" ||
      result?.decision?.recommendation === "renew_with_conditions" ||
      result?.decision?.recommendation === "renegotiate" ||
      result?.decision?.recommendation === "request_more_information" ||
      result?.decision?.recommendation === "do_not_renew");

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
              Enterprise Contract{" "}
              <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-violet-700 bg-clip-text text-transparent">
                Renewal Agent
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Analyze contract renewals with specialist AI agents for policy,
              vendor performance, commercial impact, legal risk, and business
              value. Sensitive renewal execution is paused until a human
              approves.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Workflow"
              value="Human in Loop"
              helper="Sensitive renewal execution waits for approval."
              tone="blue"
            />
            <MetricCard
              label="Specialists"
              value="5 Agents"
              helper="Policy, vendor performance, commercial, legal, and business case."
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
              helper="Ready for contract management, audit, and renewal workflows."
              tone="amber"
            />
          </div>
        </header>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Contract Renewal Request
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Enter renewal details and let the agent assess policy,
                  commercial risk, vendor performance, legal concerns, and
                  renewal readiness.
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
                label="Renewal ID"
                value={form.renewalId}
                onChange={(value) => updateField("renewalId", value)}
                placeholder="REN-1001"
              />

              <Field
                label="Contract ID"
                value={form.contractId}
                onChange={(value) => updateField("contractId", value)}
                placeholder="CON-2024-7781"
              />

              <Field
                label="Contract Name"
                value={form.contractName}
                onChange={(value) => updateField("contractName", value)}
                placeholder="Cloud Observability Platform Renewal"
              />

              <Field
                label="Vendor Name"
                value={form.vendorName}
                onChange={(value) => updateField("vendorName", value)}
                placeholder="Acme Observability Inc."
              />

              <Field
                label="Contract Owner"
                value={form.contractOwner}
                onChange={(value) => updateField("contractOwner", value)}
                placeholder="Head of Engineering"
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
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field
                label="Current Annual Cost"
                value={form.currentAnnualCost}
                onChange={(value) => updateField("currentAnnualCost", value)}
                placeholder="42000"
                type="number"
              />

              <Field
                label="Proposed Annual Cost"
                value={form.proposedAnnualCost}
                onChange={(value) => updateField("proposedAnnualCost", value)}
                placeholder="51000"
                type="number"
              />

              <Field
                label="Currency"
                value={form.currency}
                onChange={(value) => updateField("currency", value)}
                placeholder="EUR"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <Field
                label="Current End Date"
                value={form.currentEndDate}
                onChange={(value) => updateField("currentEndDate", value)}
                type="date"
              />

              <Field
                label="Renewal Start Date"
                value={form.renewalStartDate}
                onChange={(value) => updateField("renewalStartDate", value)}
                type="date"
              />

              <Field
                label="Renewal Term Months"
                value={form.renewalTermMonths}
                onChange={(value) => updateField("renewalTermMonths", value)}
                placeholder="12"
                type="number"
              />

              <Field
                label="Notice Period"
                value={form.noticePeriod}
                onChange={(value) => updateField("noticePeriod", value)}
                placeholder="60 days"
              />
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Price Change
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {currentAnnualCost > 0
                  ? `${costChangePercent.toFixed(2)}%`
                  : "—"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Calculated from current annual cost and proposed annual cost.
              </p>
            </div>

            <div className="mt-4">
              <Field
                label="Business Justification"
                value={form.businessJustification}
                onChange={(value) =>
                  updateField("businessJustification", value)
                }
                placeholder="Explain why the contract should be renewed, operational impact, business dependency, and risk of non-renewal."
                textarea
                rows={6}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Field
                label="Vendor Performance Summary"
                value={form.vendorPerformanceSummary}
                onChange={(value) =>
                  updateField("vendorPerformanceSummary", value)
                }
                placeholder="Summarize support quality, delivery history, reliability, and stakeholder feedback."
                textarea
                rows={5}
              />

              <Field
                label="SLA Performance"
                value={form.slaPerformance}
                onChange={(value) => updateField("slaPerformance", value)}
                placeholder="Example: 99.8 percent uptime against 99.9 percent target."
                textarea
                rows={5}
              />

              <Field
                label="Incidents or Complaints"
                value={form.incidentsOrComplaints}
                onChange={(value) =>
                  updateField("incidentsOrComplaints", value)
                }
                placeholder="List incidents, unresolved issues, complaints, or escalation history."
                textarea
                rows={5}
              />

              <Field
                label="Usage or Adoption Summary"
                value={form.usageSummary}
                onChange={(value) => updateField("usageSummary", value)}
                placeholder="Explain who uses the service and how often."
                textarea
                rows={5}
              />

              <Field
                label="Alternatives Considered"
                value={form.alternativesConsidered}
                onChange={(value) =>
                  updateField("alternativesConsidered", value)
                }
                placeholder="Mention alternative vendors, internal options, or replacement paths."
                textarea
                rows={5}
              />

              <Field
                label="Switching Cost or Migration Risk"
                value={form.switchingCostOrMigrationRisk}
                onChange={(value) =>
                  updateField("switchingCostOrMigrationRisk", value)
                }
                placeholder="Explain migration cost, operational risk, integration dependency, or switching barriers."
                textarea
                rows={5}
              />
            </div>

            <div className="mt-4 grid gap-3">
              <ToggleField
                label="Auto Renewal"
                description="Select this if the contract renews automatically unless notice is given."
                checked={form.autoRenewal}
                onChange={(value) => updateField("autoRenewal", value)}
              />

              <ToggleField
                label="Contains Personal Data"
                description="Select this if the vendor processes employee, customer, user, or personal information."
                checked={form.containsPersonalData}
                onChange={(value) =>
                  updateField("containsPersonalData", value)
                }
              />

              <ToggleField
                label="Contains Security Sensitive Data"
                description="Select this if the vendor touches logs, access control, secrets, infrastructure, vulnerabilities, or production systems."
                checked={form.containsSecurityData}
                onChange={(value) =>
                  updateField("containsSecurityData", value)
                }
              />

              <ToggleField
                label="Critical Vendor"
                description="Select this if the vendor is operationally important or difficult to replace."
                checked={form.isCriticalVendor}
                onChange={(value) => updateField("isCriticalVendor", value)}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Field
                label="Policy Context"
                value={form.policyContext}
                onChange={(value) => updateField("policyContext", value)}
                placeholder="Paste renewal policy, spend thresholds, finance rules, legal review rules, security rules, privacy rules, or approval rules."
                textarea
                rows={6}
              />

              <Field
                label="Contract Terms Summary"
                value={form.contractTermsSummary}
                onChange={(value) =>
                  updateField("contractTermsSummary", value)
                }
                placeholder="Summarize renewal terms, termination rights, liability, DPA, SLA terms, audit rights, and price increase clauses."
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
                  "Analyze Contract Renewal"
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
                    Specialist agents are reviewing renewal policy, vendor
                    performance, commercial impact, legal risk, and business
                    case...
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
                  <span className="text-4xl">📄</span>
                </div>
                <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                  Awaiting Contract Renewal Analysis
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Load the sample request or enter a new contract renewal case.
                  The system will analyze risk, renewal readiness, and pause
                  sensitive execution until a human decision is made.
                </p>
              </div>
            ) : null}

            {approval ? (
              <Section
                title="Backend Tool Approval Required"
                description="The agent prepared a sensitive contract renewal execution action. Execution is paused by the backend until an authorized human approves or rejects."
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
                    placeholder="Contract Manager"
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
                    placeholder="Approved after renewal review."
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
                description="The analysis requires human review. This panel records a human decision even when no backend tool execution was triggered."
              >
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Pill className="bg-blue-100 text-blue-800 ring-blue-200">
                      Human Review Required
                    </Pill>

                    <Pill
                      className={getRiskClass(
                        result?.decision?.recommendation
                      )}
                    >
                      Recommendation:{" "}
                      {result?.decision?.recommendation || "review"}
                    </Pill>

                    <Pill className={getRiskClass(result?.governance?.riskLevel)}>
                      Risk: {result?.governance?.riskLevel || "unknown"}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-blue-950">
                    The AI has completed the contract renewal analysis. A human
                    decision is required before this renewal should move forward.
                  </p>
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
                    placeholder="Contract Manager"
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
                    placeholder="Approved after contract renewal review."
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
                      decision?.recommendation === "do_not_renew"
                        ? "red"
                        : decision?.recommendation === "renegotiate" ||
                          decision?.recommendation ===
                            "renew_with_conditions" ||
                          decision?.recommendation ===
                            "request_more_information"
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
                        : policyReview?.policyStatus === "blocked"
                        ? "red"
                        : "amber"
                    }
                  />

                  <MetricCard
                    label="Vendor Performance"
                    value={vendorPerformance?.performanceRating}
                    helper={vendorPerformance?.recommendedVendorAction}
                    tone={
                      vendorPerformance?.renewalRiskFromPerformance === "high"
                        ? "red"
                        : vendorPerformance?.renewalRiskFromPerformance ===
                          "medium"
                        ? "amber"
                        : "green"
                    }
                  />

                  <MetricCard
                    label="Proposed Annual Cost"
                    value={
                      commercialImpact?.proposedAnnualCost
                        ? `${commercialImpact.proposedAnnualCost} ${
                            form.currency || commercialImpact.currency || ""
                          }`
                        : "—"
                    }
                    helper={`Commercial risk: ${
                      commercialImpact?.commercialRisk || "—"
                    }`}
                    tone={
                      commercialImpact?.commercialRisk === "high"
                        ? "red"
                        : commercialImpact?.commercialRisk === "medium"
                        ? "amber"
                        : "blue"
                    }
                  />
                </div>

                <Section
                  title="Executive Summary"
                  description="One concise view of the renewal recommendation and human approval requirement."
                >
                  <p className="text-sm leading-7 text-slate-700">
                    {result.executiveSummary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill className={getRiskClass(decision?.recommendation)}>
                      {decision?.recommendation}
                    </Pill>

                    <Pill className={getRiskClass(result.governance?.riskLevel)}>
                      Risk: {result.governance?.riskLevel}
                    </Pill>

                    <Pill className="bg-slate-100 text-slate-700 ring-slate-200">
                      Confidence:{" "}
                      {Math.round((decision?.confidence || 0) * 100)}%
                    </Pill>

                    <Pill
                      className={
                        result.governance?.requiresHumanReview
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }
                    >
                      Human Review:{" "}
                      {result.governance?.requiresHumanReview
                        ? "Required"
                        : "Optional"}
                    </Pill>
                  </div>
                </Section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Renewal Policy Review"
                    description="Approval path, renewal constraints, missing requirements, and policy concerns."
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
                        {policyReview?.requiredApprovals?.length ? (
                          policyReview.requiredApprovals.map((item) => (
                            <Pill
                              key={item}
                              className="bg-blue-50 text-blue-700 ring-blue-200"
                            >
                              {item}
                            </Pill>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            No approvals returned.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Renewal Constraints
                      </p>
                      <ListBlock
                        items={policyReview?.renewalConstraints || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Policy Concerns
                      </p>
                      <ListBlock items={policyReview?.policyConcerns || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Missing Information
                      </p>
                      <ListBlock
                        items={policyReview?.missingInformation || []}
                      />
                    </div>
                  </Section>

                  <Section
                    title="Vendor Performance"
                    description="SLA performance, support quality, operational dependency, and renewal risk from performance."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill
                        className={getRiskClass(
                          vendorPerformance?.performanceRating
                        )}
                      >
                        Rating: {vendorPerformance?.performanceRating}
                      </Pill>

                      <Pill
                        className={getRiskClass(
                          vendorPerformance?.renewalRiskFromPerformance
                        )}
                      >
                        Risk:{" "}
                        {vendorPerformance?.renewalRiskFromPerformance}
                      </Pill>
                    </div>

                    <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                      {vendorPerformance?.serviceLevelSummary}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Performance Concerns
                      </p>
                      <ListBlock
                        items={vendorPerformance?.performanceConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Recommended Vendor Action
                      </p>
                      <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
                        {vendorPerformance?.recommendedVendorAction}
                      </p>
                    </div>
                  </Section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Commercial Impact"
                    description="Cost change, annualized renewal cost, commercial risk, and negotiation levers."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MetricCard
                        label="Current Annual Cost"
                        value={`${commercialImpact?.currentAnnualCost || 0} ${
                          form.currency
                        }`}
                        tone="slate"
                      />

                      <MetricCard
                        label="Proposed Annual Cost"
                        value={`${commercialImpact?.proposedAnnualCost || 0} ${
                          form.currency
                        }`}
                        tone="blue"
                      />

                      <MetricCard
                        label="Cost Change"
                        value={`${
                          commercialImpact?.costChangePercent?.toFixed
                            ? commercialImpact.costChangePercent.toFixed(2)
                            : commercialImpact?.costChangePercent || 0
                        }%`}
                        tone={
                          commercialImpact?.costChangePercent > 15
                            ? "amber"
                            : "green"
                        }
                      />

                      <MetricCard
                        label="Commercial Risk"
                        value={commercialImpact?.commercialRisk}
                        tone={
                          commercialImpact?.commercialRisk === "high"
                            ? "red"
                            : commercialImpact?.commercialRisk === "medium"
                            ? "amber"
                            : "green"
                        }
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Cost Concerns
                      </p>
                      <ListBlock
                        items={commercialImpact?.costConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Negotiation Levers
                      </p>
                      <ListBlock
                        items={commercialImpact?.negotiationLevers || []}
                      />
                    </div>
                  </Section>

                  <Section
                    title="Legal Risk"
                    description="Contract clauses, renewal language, liability, termination, data processing, and legal review actions."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(legalRisk?.legalRisk)}>
                        Legal Risk: {legalRisk?.legalRisk}
                      </Pill>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Contract Concerns
                      </p>
                      <ListBlock items={legalRisk?.contractConcerns || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Clauses to Review
                      </p>
                      <ListBlock items={legalRisk?.clausesToReview || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Recommended Legal Action
                      </p>
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                        {legalRisk?.recommendedLegalAction}
                      </p>
                    </div>
                  </Section>
                </div>

                <Section
                  title="Business Case"
                  description="Business value, operational dependency, renewal recommendation, and rationale."
                >
                  <div className="flex flex-wrap gap-2">
                    <Pill className={getRiskClass(businessCase?.businessValue)}>
                      Value: {businessCase?.businessValue}
                    </Pill>

                    <Pill
                      className={getRiskClass(
                        businessCase?.renewalRecommendation
                      )}
                    >
                      {businessCase?.renewalRecommendation}
                    </Pill>
                  </div>

                  <p className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                    {businessCase?.rationale}
                  </p>
                </Section>

                {renewalExecutionDraft ? (
                  <Section
                    title="Renewal Execution Draft"
                    description="Prepared by the agent. Actual renewal execution requires human approval."
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        label="Vendor"
                        value={renewalExecutionDraft.vendorName}
                        tone="slate"
                      />

                      <MetricCard
                        label="Contract"
                        value={renewalExecutionDraft.contractName}
                        tone="blue"
                      />

                      <MetricCard
                        label="Term"
                        value={`${renewalExecutionDraft.renewalTermMonths} months`}
                        tone="violet"
                      />

                      <MetricCard
                        label="Proposed Cost"
                        value={`${renewalExecutionDraft.proposedAnnualCost} ${renewalExecutionDraft.currency}`}
                        tone="amber"
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Effective Date
                      </p>
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                        {renewalExecutionDraft.effectiveDate}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Approval Summary
                      </p>
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                        {renewalExecutionDraft.approvalSummary}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Conditions
                      </p>
                      <ListBlock items={renewalExecutionDraft.conditions} />
                    </div>
                  </Section>
                ) : null}

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
          Enterprise Contract Renewal Agent · Human in the loop · Guardrailed
          renewal execution · Structured renewal intelligence
        </footer>
      </div>
    </main>
  );
}