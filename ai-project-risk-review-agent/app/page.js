"use client";

import { useMemo, useState } from "react";

const sampleForm = {
  projectId: "PROJ-2026-001",
  projectName: "Customer Data Platform Migration",
  requesterName: "Sam Copperfield",
  department: "Engineering",
  businessUnit: "Platform",
  region: "EU",
  projectType: "data_platform",
  businessOwner: "VP Product",
  technicalOwner: "Head of Platform",
  estimatedBudget: "180000",
  currency: "EUR",
  durationMonths: "5",
  targetGoLiveDate: "2026-09-30",
  teamSize: "8",
  urgency: "high",
  description:
    "Migrate customer data from legacy CRM and support systems into a unified customer data platform.",
  businessJustification:
    "Improve customer analytics, support personalization, reduce manual reporting, and create a single reliable customer view for product and support teams.",
  containsPersonalData: true,
  containsSensitiveData: true,
  usesExternalVendors: true,
  newTechnologyIntroduced: true,
  hardDeadline: true,
  criticalDependencies:
    "CRM API availability\nData warehouse access\nLegal approval\nVendor onboarding",
  knownConstraints:
    "Hard go-live date\nLimited data engineering capacity\nLegacy data quality issues",
  successCriteria:
    "Zero critical data loss\nGDPR compliant migration\nAnalytics dashboards available on launch",
  riskContext:
    "Projects involving personal data require privacy review. Projects introducing new infrastructure require architecture and security review. Projects above 100000 EUR require executive review. High-risk projects must be entered into the formal risk register before execution.",
};

const emptyForm = {
  projectId: "",
  projectName: "",
  requesterName: "",
  department: "",
  businessUnit: "",
  region: "EU",
  projectType: "software",
  businessOwner: "",
  technicalOwner: "",
  estimatedBudget: "",
  currency: "EUR",
  durationMonths: "3",
  targetGoLiveDate: "",
  teamSize: "5",
  urgency: "medium",
  description: "",
  businessJustification: "",
  containsPersonalData: false,
  containsSensitiveData: false,
  usesExternalVendors: false,
  newTechnologyIntroduced: false,
  hardDeadline: false,
  criticalDependencies: "",
  knownConstraints: "",
  successCriteria: "",
  riskContext: "",
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function linesToArray(value = "") {
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPayload(form) {
  return {
    action: "analyze",
    request: {
      projectId: form.projectId || `PROJ-${Date.now()}`,
      projectName: form.projectName,
      requesterName: form.requesterName,
      department: form.department,
      businessUnit: form.businessUnit,
      region: form.region,
      projectType: form.projectType,
      businessOwner: form.businessOwner,
      technicalOwner: form.technicalOwner,
      estimatedBudget: toNumber(form.estimatedBudget),
      currency: form.currency,
      durationMonths: toNumber(form.durationMonths, 3),
      targetGoLiveDate: form.targetGoLiveDate,
      teamSize: toNumber(form.teamSize, 1),
      urgency: form.urgency,
      description: form.description,
      businessJustification: form.businessJustification,
      containsPersonalData: Boolean(form.containsPersonalData),
      containsSensitiveData: Boolean(form.containsSensitiveData),
      usesExternalVendors: Boolean(form.usesExternalVendors),
      newTechnologyIntroduced: Boolean(form.newTechnologyIntroduced),
      hardDeadline: Boolean(form.hardDeadline),
      criticalDependencies: linesToArray(form.criticalDependencies),
      knownConstraints: linesToArray(form.knownConstraints),
      successCriteria: linesToArray(form.successCriteria),
      riskContext: form.riskContext,
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
      "reject",
      "rejected",
      "blocked",
      "pause",
      "security_review_required",
      "legal_review_required",
    ].includes(normalized)
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (
    [
      "medium",
      "needs_review",
      "proceed_with_conditions",
      "request_more_information",
      "insufficient_information",
      "milestone_based",
      "biweekly",
    ].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (
    [
      "low",
      "proceed",
      "approved",
      "compliant",
      "submitted",
      "simulated",
      "weekly",
      "monthly",
      "strategic",
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
    role: "Project Review Board",
    email: "suhas@example.com",
    comment: "Approved after project risk review.",
  });

  const payloadPreview = useMemo(() => buildPayload(form), [form]);

  const canAnalyze =
    form.projectName.trim().length > 2 &&
    form.description.trim().length > 20 &&
    form.businessJustification.trim().length > 20 &&
    Number(form.estimatedBudget) > 0;

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
        "Please provide project name, estimated budget, project description, and a meaningful business justification."
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/project-risk-review-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      const data = await response.json();
      setRawResponse(data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Project risk review failed.");
      }

      if (data.status === "pending_human_approval") {
        setApproval(data);
        setResult(data.currentPartialOutput || null);
      } else {
        setResult(data.analysis || null);
      }
    } catch (err) {
      setError(err.message || "Unexpected project risk review failure.");
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
      const response = await fetch("/api/project-risk-review-agent", {
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
      mode: "local_project_review",
    });
  }

  const decision = result?.decision;
  const deliveryRisk = result?.deliveryRisk;
  const technicalRisk = result?.technicalRisk;
  const complianceRisk = result?.complianceRisk;
  const budgetTimelineRisk = result?.budgetTimelineRisk;
  const businessImpact = result?.businessImpact;
  const riskRegisterEntry = result?.riskRegisterEntry;

  const shouldShowLocalHumanReviewPanel =
    result &&
    !approval &&
    !humanDecision &&
    (result?.governance?.requiresHumanReview ||
      result?.decision?.recommendation === "proceed" ||
      result?.decision?.recommendation === "proceed_with_conditions" ||
      result?.decision?.recommendation === "request_more_information" ||
      result?.decision?.recommendation === "pause" ||
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
              Enterprise Project{" "}
              <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-violet-700 bg-clip-text text-transparent">
                Risk Review Agent
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Analyze project proposals with specialist AI agents for delivery
              risk, technical risk, compliance risk, budget and timeline
              exposure, and business impact. Formal risk register submission is
              paused until a human approves.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Workflow"
              value="Human in Loop"
              helper="Formal risk register submission waits for approval."
              tone="blue"
            />
            <MetricCard
              label="Specialists"
              value="5 Agents"
              helper="Delivery, technical, compliance, budget timeline, and business impact."
              tone="violet"
            />
            <MetricCard
              label="Action Safety"
              value="Approval Gate"
              helper="The agent can prepare, but not submit without review."
              tone="green"
            />
            <MetricCard
              label="Output"
              value="Structured JSON"
              helper="Ready for dashboards, PMO workflows, and audit trails."
              tone="amber"
            />
          </div>
        </header>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Project Risk Request
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Enter a project proposal and let the agent assess delivery,
                  technical, compliance, budget, timeline, and business risk.
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
                label="Project ID"
                value={form.projectId}
                onChange={(value) => updateField("projectId", value)}
                placeholder="PROJ-2026-001"
              />
              <Field
                label="Project Name"
                value={form.projectName}
                onChange={(value) => updateField("projectName", value)}
                placeholder="Customer Data Platform Migration"
              />
              <Field
                label="Requester Name"
                value={form.requesterName}
                onChange={(value) => updateField("requesterName", value)}
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
              <Field
                label="Business Owner"
                value={form.businessOwner}
                onChange={(value) => updateField("businessOwner", value)}
                placeholder="VP Product"
              />
              <Field
                label="Technical Owner"
                value={form.technicalOwner}
                onChange={(value) => updateField("technicalOwner", value)}
                placeholder="Head of Platform"
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
                label="Project Type"
                value={form.projectType}
                onChange={(value) => updateField("projectType", value)}
                options={[
                  { label: "Software", value: "software" },
                  { label: "Data Platform", value: "data_platform" },
                  { label: "AI System", value: "ai_system" },
                  { label: "Infrastructure", value: "infrastructure" },
                  { label: "Security", value: "security" },
                  { label: "Migration", value: "migration" },
                  { label: "Compliance", value: "compliance" },
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
                label="Estimated Budget"
                value={form.estimatedBudget}
                onChange={(value) => updateField("estimatedBudget", value)}
                placeholder="180000"
                type="number"
              />
              <Field
                label="Currency"
                value={form.currency}
                onChange={(value) => updateField("currency", value)}
                placeholder="EUR"
              />
              <Field
                label="Duration Months"
                value={form.durationMonths}
                onChange={(value) => updateField("durationMonths", value)}
                placeholder="5"
                type="number"
              />
              <Field
                label="Team Size"
                value={form.teamSize}
                onChange={(value) => updateField("teamSize", value)}
                placeholder="8"
                type="number"
              />
              <Field
                label="Target Go Live Date"
                value={form.targetGoLiveDate}
                onChange={(value) => updateField("targetGoLiveDate", value)}
                type="date"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Project Description"
                value={form.description}
                onChange={(value) => updateField("description", value)}
                placeholder="Describe what the project will deliver, what systems it touches, and why it matters."
                textarea
                rows={5}
              />
            </div>

            <div className="mt-4">
              <Field
                label="Business Justification"
                value={form.businessJustification}
                onChange={(value) =>
                  updateField("businessJustification", value)
                }
                placeholder="Explain expected business value, operational impact, stakeholders, and urgency."
                textarea
                rows={6}
              />
            </div>

            <div className="mt-4 grid gap-3">
              <ToggleField
                label="Contains Personal Data"
                description="Select this if the project processes employee, customer, user, or personal information."
                checked={form.containsPersonalData}
                onChange={(value) =>
                  updateField("containsPersonalData", value)
                }
              />

              <ToggleField
                label="Contains Sensitive Data"
                description="Select this if the project touches credentials, logs, financial data, health data, production systems, or security-sensitive information."
                checked={form.containsSensitiveData}
                onChange={(value) =>
                  updateField("containsSensitiveData", value)
                }
              />

              <ToggleField
                label="Uses External Vendors"
                description="Select this if external vendors, consultants, APIs, SaaS tools, or third-party platforms are involved."
                checked={form.usesExternalVendors}
                onChange={(value) =>
                  updateField("usesExternalVendors", value)
                }
              />

              <ToggleField
                label="Introduces New Technology"
                description="Select this if the project introduces a new framework, platform, infrastructure pattern, model, or vendor technology."
                checked={form.newTechnologyIntroduced}
                onChange={(value) =>
                  updateField("newTechnologyIntroduced", value)
                }
              />

              <ToggleField
                label="Hard Deadline"
                description="Select this if the target date is fixed due to regulatory, contractual, launch, migration, or executive commitment."
                checked={form.hardDeadline}
                onChange={(value) => updateField("hardDeadline", value)}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <Field
                label="Critical Dependencies"
                value={form.criticalDependencies}
                onChange={(value) =>
                  updateField("criticalDependencies", value)
                }
                placeholder={"CRM API availability\nLegal approval\nVendor onboarding"}
                textarea
                rows={6}
              />

              <Field
                label="Known Constraints"
                value={form.knownConstraints}
                onChange={(value) => updateField("knownConstraints", value)}
                placeholder={"Hard go-live date\nLimited data engineering capacity"}
                textarea
                rows={6}
              />

              <Field
                label="Success Criteria"
                value={form.successCriteria}
                onChange={(value) => updateField("successCriteria", value)}
                placeholder={"Zero data loss\nGDPR compliant migration"}
                textarea
                rows={6}
              />
            </div>

            <div className="mt-4">
              <Field
                label="Risk Policy Context"
                value={form.riskContext}
                onChange={(value) => updateField("riskContext", value)}
                placeholder="Paste project governance rules, PMO risk thresholds, compliance requirements, security review rules, executive approval rules, or risk register policies."
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
                  "Analyze Project Risk"
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
                    Specialist agents are reviewing delivery, technical,
                    compliance, budget timeline, and business impact risks...
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
                  <span className="text-4xl">⚠️</span>
                </div>
                <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                  Awaiting Project Risk Review
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Load the sample project or enter a new project proposal. The
                  system will analyze risks and pause formal risk register
                  submission until a human decision is made.
                </p>
              </div>
            ) : null}

            {approval ? (
              <Section
                title="Backend Tool Approval Required"
                description="The agent prepared a sensitive risk register submission. Execution is paused by the backend until an authorized human approves or rejects."
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
                    label="Reviewer Name"
                    value={approver.name}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Reviewer Name"
                  />
                  <Field
                    label="Reviewer Role"
                    value={approver.role}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        role: value,
                      }))
                    }
                    placeholder="Project Review Board"
                  />
                  <Field
                    label="Reviewer Email"
                    value={approver.email}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    placeholder="reviewer@example.com"
                  />
                </div>

                <div className="mt-4">
                  <Field
                    label="Review Comment"
                    value={approver.comment}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        comment: value,
                      }))
                    }
                    textarea
                    rows={4}
                    placeholder="Approved after project risk review."
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
                description="The analysis requires human review. This panel lets a reviewer approve or reject the project recommendation even when no backend tool execution was triggered."
              >
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Pill className="bg-blue-100 text-blue-800 ring-blue-200">
                      Human Review Required
                    </Pill>

                    <Pill className={getRiskClass(result?.decision?.recommendation)}>
                      Recommendation:{" "}
                      {result?.decision?.recommendation || "review"}
                    </Pill>

                    <Pill className={getRiskClass(result?.governance?.riskLevel)}>
                      Risk: {result?.governance?.riskLevel || "unknown"}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-blue-950">
                    The AI has completed the project risk review. A human
                    decision is required before this project should move forward.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Reviewer Name"
                    value={approver.name}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Reviewer Name"
                  />

                  <Field
                    label="Reviewer Role"
                    value={approver.role}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        role: value,
                      }))
                    }
                    placeholder="Project Review Board"
                  />

                  <Field
                    label="Reviewer Email"
                    value={approver.email}
                    onChange={(value) =>
                      setApprover((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    placeholder="reviewer@example.com"
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
                    placeholder="Approved after project risk review."
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
                      decision?.recommendation === "reject" ||
                      decision?.recommendation === "pause"
                        ? "red"
                        : decision?.recommendation ===
                            "proceed_with_conditions" ||
                          decision?.recommendation ===
                            "request_more_information"
                        ? "amber"
                        : "green"
                    }
                  />

                  <MetricCard
                    label="Overall Risk"
                    value={result?.governance?.riskLevel}
                    helper={`Human review: ${
                      result?.governance?.requiresHumanReview
                        ? "required"
                        : "optional"
                    }`}
                    tone={
                      result?.governance?.riskLevel === "critical" ||
                      result?.governance?.riskLevel === "high"
                        ? "red"
                        : result?.governance?.riskLevel === "medium"
                        ? "amber"
                        : "green"
                    }
                  />

                  <MetricCard
                    label="Delivery Risk"
                    value={deliveryRisk?.deliveryRisk}
                    helper={`Confidence: ${Math.round(
                      (deliveryRisk?.deliveryConfidence || 0) * 100
                    )}%`}
                    tone={
                      deliveryRisk?.deliveryRisk === "critical" ||
                      deliveryRisk?.deliveryRisk === "high"
                        ? "red"
                        : deliveryRisk?.deliveryRisk === "medium"
                        ? "amber"
                        : "green"
                    }
                  />

                  <MetricCard
                    label="Budget Exposure"
                    value={
                      budgetTimelineRisk?.estimatedBudgetExposure
                        ? `${budgetTimelineRisk.estimatedBudgetExposure} ${form.currency}`
                        : "—"
                    }
                    helper={`Budget risk: ${
                      budgetTimelineRisk?.budgetRisk || "—"
                    }`}
                    tone={
                      budgetTimelineRisk?.budgetRisk === "critical" ||
                      budgetTimelineRisk?.budgetRisk === "high"
                        ? "red"
                        : budgetTimelineRisk?.budgetRisk === "medium"
                        ? "amber"
                        : "blue"
                    }
                  />
                </div>

                <Section
                  title="Executive Summary"
                  description="One concise view of the project risk recommendation and human approval requirement."
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
                    title="Delivery Risk"
                    description="Timeline, dependencies, scope clarity, and delivery confidence."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(deliveryRisk?.deliveryRisk)}>
                        {deliveryRisk?.deliveryRisk}
                      </Pill>
                      <Pill className="bg-slate-100 text-slate-700 ring-slate-200">
                        Confidence:{" "}
                        {Math.round(
                          (deliveryRisk?.deliveryConfidence || 0) * 100
                        )}
                        %
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {deliveryRisk?.rationale}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Timeline Concerns
                      </p>
                      <ListBlock items={deliveryRisk?.timelineConcerns || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Dependency Risks
                      </p>
                      <ListBlock items={deliveryRisk?.dependencyRisks || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Scope Risks
                      </p>
                      <ListBlock items={deliveryRisk?.scopeRisks || []} />
                    </div>
                  </Section>

                  <Section
                    title="Technical Risk"
                    description="Architecture, integration, security, scalability, and technical debt."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill className={getRiskClass(technicalRisk?.technicalRisk)}>
                        {technicalRisk?.technicalRisk}
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {technicalRisk?.rationale}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Architecture Concerns
                      </p>
                      <ListBlock
                        items={technicalRisk?.architectureConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Integration Concerns
                      </p>
                      <ListBlock
                        items={technicalRisk?.integrationConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Security Concerns
                      </p>
                      <ListBlock items={technicalRisk?.securityConcerns || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Scalability Concerns
                      </p>
                      <ListBlock
                        items={technicalRisk?.scalabilityConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Technical Debt Concerns
                      </p>
                      <ListBlock
                        items={technicalRisk?.technicalDebtConcerns || []}
                      />
                    </div>
                  </Section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Compliance Risk"
                    description="Privacy, regulatory, data handling, audit, and review requirements."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill
                        className={getRiskClass(
                          complianceRisk?.complianceRisk
                        )}
                      >
                        {complianceRisk?.complianceRisk}
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {complianceRisk?.rationale}
                    </p>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Required Reviews
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {complianceRisk?.requiredReviews?.length ? (
                          complianceRisk.requiredReviews.map((item) => (
                            <Pill
                              key={item}
                              className="bg-blue-50 text-blue-700 ring-blue-200"
                            >
                              {item}
                            </Pill>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            No reviews returned.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Privacy Concerns
                      </p>
                      <ListBlock items={complianceRisk?.privacyConcerns || []} />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Regulatory Concerns
                      </p>
                      <ListBlock
                        items={complianceRisk?.regulatoryConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Data Handling Concerns
                      </p>
                      <ListBlock
                        items={complianceRisk?.dataHandlingConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Missing Information
                      </p>
                      <ListBlock
                        items={complianceRisk?.missingInformation || []}
                      />
                    </div>
                  </Section>

                  <Section
                    title="Budget and Timeline Risk"
                    description="Budget exposure, cost concerns, schedule risk, and mitigation ideas."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Pill
                        className={getRiskClass(
                          budgetTimelineRisk?.budgetRisk
                        )}
                      >
                        Budget Risk: {budgetTimelineRisk?.budgetRisk}
                      </Pill>
                      <Pill
                        className={getRiskClass(
                          budgetTimelineRisk?.timelineRisk
                        )}
                      >
                        Timeline Risk: {budgetTimelineRisk?.timelineRisk}
                      </Pill>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {budgetTimelineRisk?.rationale}
                    </p>

                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Estimated Budget Exposure
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {budgetTimelineRisk?.estimatedBudgetExposure
                          ? `${budgetTimelineRisk.estimatedBudgetExposure} ${form.currency}`
                          : "—"}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Cost Concerns
                      </p>
                      <ListBlock
                        items={budgetTimelineRisk?.costConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Schedule Concerns
                      </p>
                      <ListBlock
                        items={budgetTimelineRisk?.scheduleConcerns || []}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Mitigation Ideas
                      </p>
                      <ListBlock
                        items={budgetTimelineRisk?.mitigationIdeas || []}
                      />
                    </div>
                  </Section>
                </div>

                <Section
                  title="Business Impact"
                  description="Business value, urgency, stakeholder impact, value drivers, and downside of delay."
                >
                  <div className="flex flex-wrap gap-2">
                    <Pill className={getRiskClass(businessImpact?.businessImpact)}>
                      Impact: {businessImpact?.businessImpact}
                    </Pill>
                    <Pill className={getRiskClass(businessImpact?.urgency)}>
                      Urgency: {businessImpact?.urgency}
                    </Pill>
                    <Pill className={getRiskClass(businessImpact?.recommendation)}>
                      {businessImpact?.recommendation}
                    </Pill>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {businessImpact?.rationale}
                  </p>

                  <div className="mt-5 grid gap-6 xl:grid-cols-3">
                    <div>
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Stakeholder Impact
                      </p>
                      <ListBlock items={businessImpact?.stakeholderImpact || []} />
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Value Drivers
                      </p>
                      <ListBlock items={businessImpact?.valueDrivers || []} />
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-black text-slate-950">
                        Downside If Delayed
                      </p>
                      <ListBlock items={businessImpact?.downsideIfDelayed || []} />
                    </div>
                  </div>
                </Section>

                {riskRegisterEntry ? (
                  <Section
                    title="Risk Register Entry"
                    description="Prepared by the agent. Formal submission requires human approval."
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        label="Project"
                        value={riskRegisterEntry.projectName}
                        tone="slate"
                      />
                      <MetricCard
                        label="Risk Level"
                        value={riskRegisterEntry.overallRiskLevel}
                        tone={
                          riskRegisterEntry.overallRiskLevel === "critical" ||
                          riskRegisterEntry.overallRiskLevel === "high"
                            ? "red"
                            : riskRegisterEntry.overallRiskLevel === "medium"
                            ? "amber"
                            : "green"
                        }
                      />
                      <MetricCard
                        label="Review Cadence"
                        value={riskRegisterEntry.reviewCadence}
                        tone="blue"
                      />
                      <MetricCard
                        label="Escalation"
                        value={
                          riskRegisterEntry.escalationRequired ? "Yes" : "No"
                        }
                        helper={riskRegisterEntry.escalationReason}
                        tone={
                          riskRegisterEntry.escalationRequired ? "red" : "green"
                        }
                      />
                    </div>

                    <div className="mt-5 grid gap-6 xl:grid-cols-3">
                      <div>
                        <p className="mb-3 text-sm font-black text-slate-950">
                          Primary Risks
                        </p>
                        <ListBlock items={riskRegisterEntry.primaryRisks || []} />
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-black text-slate-950">
                          Mitigation Actions
                        </p>
                        <ListBlock
                          items={riskRegisterEntry.mitigationActions || []}
                        />
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-black text-slate-950">
                          Owners
                        </p>
                        <ListBlock items={riskRegisterEntry.owners || []} />
                      </div>
                    </div>
                  </Section>
                ) : null}

                <Section
                  title="Governance"
                  description="Human review, risk level, PII or secret flags, agent version, and audit indicators."
                >
                  <div className="grid gap-4 sm:grid-cols-4">
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
                        result.governance?.riskLevel === "critical" ||
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

                    <MetricCard
                      label="Agent Version"
                      value={result.governance?.agentVersion}
                      tone="slate"
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
          Enterprise Project Risk Review Agent · Human in the loop ·
          Guardrailed risk register submission · Structured project governance
        </footer>
      </div>
    </main>
  );
}