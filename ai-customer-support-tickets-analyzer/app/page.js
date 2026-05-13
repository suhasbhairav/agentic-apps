"use client";

import { useMemo, useState } from "react";

const sampleTicket = {
  ticket: {
    id: "ENT-48291",
    subject: "Payment deducted but enterprise renewal failed",
    description:
      "We attempted to renew our enterprise subscription today. The amount appears to have been deducted from our account, but the renewal still shows as failed in the billing portal. Our team may lose access tomorrow, and this is affecting 240 users across our finance and operations teams. Please treat this urgently.",
    channel: "email",
    createdAt: new Date().toISOString(),
    customerTier: "enterprise",
    language: "en",
    product: "Billing Portal",
  },
  customer: {
    name: "Priya Sharma",
    company: "Northstar Logistics Group",
    region: "EU",
  },
  slaPolicy: {
    enterpriseCriticalHours: 2,
    enterpriseHighHours: 8,
    standardHighHours: 24,
  },
  productContext:
    "Known issue: Some payment gateway callbacks were delayed after the latest billing-service deployment. Engineering is monitoring payment reconciliation jobs.",
};

const emptyForm = {
  ticketId: "",
  subject: "",
  description: "",
  channel: "email",
  customerTier: "enterprise",
  product: "",
  customerName: "",
  company: "",
  region: "EU",
  productContext: "",
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getSeverityStyle(severity) {
  const value = String(severity || "").toLowerCase();

  if (value === "sev1") {
    return "bg-red-500/15 text-red-200 ring-red-400/30";
  }

  if (value === "sev2") {
    return "bg-orange-500/15 text-orange-200 ring-orange-400/30";
  }

  if (value === "sev3") {
    return "bg-yellow-500/15 text-yellow-100 ring-yellow-400/30";
  }

  return "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30";
}

function getRiskStyle(risk) {
  const value = String(risk || "").toLowerCase();

  if (["high", "breached", "critical"].includes(value)) {
    return "bg-red-500/15 text-red-200 ring-red-400/30";
  }

  if (["medium", "negative"].includes(value)) {
    return "bg-yellow-500/15 text-yellow-100 ring-yellow-400/30";
  }

  if (["low", "none", "positive"].includes(value)) {
    return "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30";
  }

  return "bg-slate-500/15 text-slate-200 ring-slate-400/30";
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value, helper, tone = "default" }) {
  const toneMap = {
    default: "from-slate-900 to-slate-950 ring-white/10",
    red: "from-red-950/80 to-slate-950 ring-red-400/20",
    orange: "from-orange-950/70 to-slate-950 ring-orange-400/20",
    green: "from-emerald-950/70 to-slate-950 ring-emerald-400/20",
    blue: "from-blue-950/70 to-slate-950 ring-blue-400/20",
    purple: "from-purple-950/70 to-slate-950 ring-purple-400/20",
  };

  return (
    <div
      className={classNames(
        "rounded-3xl bg-gradient-to-br p-5 shadow-2xl ring-1",
        toneMap[tone] || toneMap.default
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value || "—"}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-400">
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
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
        />
      ) : (
        <input
          value={value}
          type={type}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
        />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value} className="bg-slate-950">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SkeletonResult() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-3xl bg-white/[0.06]"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[2rem] bg-white/[0.06]" />
    </div>
  );
}

function buildPayload(form) {
  return {
    ticket: {
      id: form.ticketId || `ENT-${Date.now()}`,
      subject: form.subject,
      description: form.description,
      channel: form.channel,
      createdAt: new Date().toISOString(),
      customerTier: form.customerTier,
      language: "en",
      product: form.product || "Unknown Product",
    },
    customer: {
      name: form.customerName,
      company: form.company,
      region: form.region,
    },
    slaPolicy: {
      enterpriseCriticalHours: 2,
      enterpriseHighHours: 8,
      standardHighHours: 24,
    },
    productContext: form.productContext,
  };
}

function mapSampleToForm() {
  return {
    ticketId: sampleTicket.ticket.id,
    subject: sampleTicket.ticket.subject,
    description: sampleTicket.ticket.description,
    channel: sampleTicket.ticket.channel,
    customerTier: sampleTicket.ticket.customerTier,
    product: sampleTicket.ticket.product,
    customerName: sampleTicket.customer.name,
    company: sampleTicket.customer.company,
    region: sampleTicket.customer.region,
    productContext: sampleTicket.productContext,
  };
}

export default function Home() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const payloadPreview = useMemo(() => buildPayload(form), [form]);

  const canAnalyze =
    form.subject.trim().length > 3 && form.description.trim().length > 10;

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function analyzeTicket() {
    setError("");
    setResult(null);
    setRawResponse(null);

    if (!canAnalyze) {
      setError(
        "Please provide a meaningful ticket subject and description before analysis."
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/ticket-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      const data = await response.json();

      setRawResponse(data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Ticket analysis failed.");
      }

      setResult(data.analysis);
    } catch (err) {
      setError(err.message || "Unexpected analysis failure.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const severity = result?.classification?.severity;
  const urgency = result?.classification?.urgency;
  const slaRisk = result?.slaAssessment?.slaRisk;
  const escalationRequired = result?.escalation?.required;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[20%] h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.9)]" />
              Multi-Agent Support Intelligence
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Enterprise Customer Ticket Analyzer
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Analyze high-value support tickets with specialized AI agents for
              severity, SLA risk, sentiment, escalation, root cause, and
              customer-ready response drafting.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:min-w-64">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              System Status
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <p className="text-sm font-semibold text-emerald-200">
                Orchestrator Ready
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Guardrails, specialist agents, and structured output enabled.
            </p>
          </div>
        </header>

        <section className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Specialists"
            value="5 Agents"
            helper="Sentiment, severity, root cause, SLA, response drafting."
            tone="blue"
          />
          <MetricCard
            label="Guardrails"
            value="Input + Output"
            helper="Prompt injection, secret leakage, unsafe output checks."
            tone="green"
          />
          <MetricCard
            label="Decision Layer"
            value="Orchestrated"
            helper="One manager agent combines specialist outputs."
            tone="purple"
          />
          <MetricCard
            label="Enterprise Output"
            value="Structured JSON"
            helper="Ready for CRM, helpdesk, analytics, and automation."
            tone="orange"
          />
        </section>

        <div className="grid gap-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Ticket Input
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Enter a customer issue and let the agent team produce an
                  operational support analysis.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setForm(mapSampleToForm());
                    setError("");
                    setResult(null);
                    setRawResponse(null);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Load Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setError("");
                    setResult(null);
                    setRawResponse(null);
                  }}
                  className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Ticket ID"
                value={form.ticketId}
                onChange={(value) => updateField("ticketId", value)}
                placeholder="ENT-48291"
              />
              <Field
                label="Product"
                value={form.product}
                onChange={(value) => updateField("product", value)}
                placeholder="Billing Portal"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Subject"
                value={form.subject}
                onChange={(value) => updateField("subject", value)}
                placeholder="Payment deducted but renewal failed"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Ticket Description"
                value={form.description}
                onChange={(value) => updateField("description", value)}
                placeholder="Describe the customer issue, business impact, urgency, errors, and any context..."
                textarea
                rows={8}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Channel"
                value={form.channel}
                onChange={(value) => updateField("channel", value)}
                options={[
                  { label: "Email", value: "email" },
                  { label: "Chat", value: "chat" },
                  { label: "Phone", value: "phone" },
                  { label: "Portal", value: "portal" },
                  { label: "Slack", value: "slack" },
                ]}
              />
              <SelectField
                label="Customer Tier"
                value={form.customerTier}
                onChange={(value) => updateField("customerTier", value)}
                options={[
                  { label: "Enterprise", value: "enterprise" },
                  { label: "Strategic", value: "strategic" },
                  { label: "Growth", value: "growth" },
                  { label: "Standard", value: "standard" },
                ]}
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Customer Name"
                value={form.customerName}
                onChange={(value) => updateField("customerName", value)}
                placeholder="Optional"
              />
              <Field
                label="Company"
                value={form.company}
                onChange={(value) => updateField("company", value)}
                placeholder="Optional"
              />
            </div>

            <div className="mt-4">
              <Field
                label="Product Context / Known Incident Notes"
                value={form.productContext}
                onChange={(value) => updateField("productContext", value)}
                placeholder="Known incidents, recent deployments, system alerts, customer history, or support notes..."
                textarea
                rows={5}
              />
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={analyzeTicket}
                disabled={isAnalyzing || !canAnalyze}
                className={classNames(
                  "group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl px-6 py-4 text-sm font-bold text-slate-950 shadow-2xl transition sm:w-auto",
                  isAnalyzing || !canAnalyze
                    ? "cursor-not-allowed bg-slate-600 text-slate-300"
                    : "bg-cyan-300 hover:bg-cyan-200"
                )}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" />
                    Analyzing Ticket
                  </span>
                ) : (
                  "Run Multi-Agent Analysis"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowJson((current) => !current)}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
              >
                {showJson ? "Hide JSON Preview" : "Show JSON Preview"}
              </button>
            </div>

            {showJson ? (
              <pre className="mt-6 max-h-[32rem] overflow-auto rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                {JSON.stringify(payloadPreview, null, 2)}
              </pre>
            ) : null}
          </section>

          <section className="space-y-6">
            {isAnalyzing ? <SkeletonResult /> : null}

            {!isAnalyzing && !result ? (
              <div className="flex min-h-[34rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
                  <span className="text-4xl">🤖</span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                  Awaiting Ticket Analysis
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
                  Load the sample ticket or enter your own enterprise support
                  case. The agent team will classify severity, detect SLA risk,
                  assess sentiment, identify root causes, and draft the next
                  response.
                </p>
              </div>
            ) : null}

            {!isAnalyzing && result ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Severity"
                    value={severity?.toUpperCase()}
                    helper={result.classification?.category}
                    tone={
                      severity === "sev1"
                        ? "red"
                        : severity === "sev2"
                        ? "orange"
                        : "green"
                    }
                  />
                  <MetricCard
                    label="Urgency"
                    value={urgency}
                    helper={`Confidence: ${Math.round(
                      (result.classification?.confidence || 0) * 100
                    )}%`}
                    tone={urgency === "critical" ? "red" : "blue"}
                  />
                  <MetricCard
                    label="SLA Risk"
                    value={slaRisk}
                    helper={result.slaAssessment?.recommendedFirstResponseDeadline}
                    tone={
                      ["high", "breached"].includes(slaRisk)
                        ? "red"
                        : "purple"
                    }
                  />
                  <MetricCard
                    label="Escalation"
                    value={escalationRequired ? "Required" : "Not Required"}
                    helper={result.escalation?.targetTeam}
                    tone={escalationRequired ? "red" : "green"}
                  />
                </div>

                <Section
                  title="Executive Summary"
                  description="A concise operational summary for support leadership."
                >
                  <p className="text-sm leading-7 text-slate-300">
                    {result.executiveSummary}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill className={getSeverityStyle(severity)}>
                      {severity?.toUpperCase()}
                    </Pill>
                    <Pill className={getRiskStyle(urgency)}>{urgency}</Pill>
                    <Pill className={getRiskStyle(slaRisk)}>
                      SLA: {slaRisk}
                    </Pill>
                    <Pill
                      className={
                        escalationRequired
                          ? "bg-red-500/15 text-red-200 ring-red-400/30"
                          : "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30"
                      }
                    >
                      {escalationRequired ? "Escalate" : "No Escalation"}
                    </Pill>
                  </div>
                </Section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Section
                    title="Customer Sentiment"
                    description="Relationship risk, emotion, and frustration signals."
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Pill
                          className={getRiskStyle(
                            result.customerSentiment?.sentiment
                          )}
                        >
                          {result.customerSentiment?.sentiment}
                        </Pill>
                        <Pill
                          className={getRiskStyle(
                            result.customerSentiment?.relationshipRisk
                          )}
                        >
                          Relationship Risk:{" "}
                          {result.customerSentiment?.relationshipRisk}
                        </Pill>
                        <Pill
                          className={getRiskStyle(
                            result.customerSentiment?.emotionalIntensity
                          )}
                        >
                          Intensity:{" "}
                          {result.customerSentiment?.emotionalIntensity}
                        </Pill>
                      </div>

                      <p className="text-sm leading-7 text-slate-300">
                        {result.customerSentiment?.summary}
                      </p>

                      <div>
                        <p className="text-sm font-semibold text-white">
                          Frustration Signals
                        </p>
                        <ul className="mt-3 space-y-2">
                          {result.customerSentiment?.customerFrustrationSignals?.map(
                            (item, index) => (
                              <li
                                key={`${item}-${index}`}
                                className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                              >
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </Section>

                  <Section
                    title="SLA Assessment"
                    description="Response targets and breach-risk rationale."
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Pill className={getRiskStyle(slaRisk)}>
                          {slaRisk}
                        </Pill>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            First Response
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-white">
                            {
                              result.slaAssessment
                                ?.recommendedFirstResponseDeadline
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Resolution Target
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-white">
                            {result.slaAssessment?.recommendedResolutionTarget}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm leading-7 text-slate-300">
                        {result.slaAssessment?.rationale}
                      </p>
                    </div>
                  </Section>
                </div>

                <Section
                  title="Root Cause Analysis"
                  description="Probable causes, diagnostics, and internal checks."
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Pill className="bg-purple-500/15 text-purple-100 ring-purple-400/30">
                          {result.rootCauseAnalysis?.likelyCategory}
                        </Pill>
                      </div>

                      <p className="text-sm font-semibold text-white">
                        Probable Root Causes
                      </p>
                      <ul className="mt-3 space-y-2">
                        {result.rootCauseAnalysis?.probableRootCauses?.map(
                          (item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Suggested Internal Checks
                      </p>
                      <ul className="mt-3 space-y-2">
                        {result.rootCauseAnalysis?.suggestedInternalChecks?.map(
                          (item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Missing Information
                      </p>
                      <ul className="mt-3 space-y-2">
                        {result.rootCauseAnalysis?.missingInformation?.map(
                          (item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Diagnostic Questions
                      </p>
                      <ul className="mt-3 space-y-2">
                        {result.rootCauseAnalysis?.diagnosticQuestions?.map(
                          (item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Recommended Actions"
                  description="Prioritized operational plan for support, engineering, billing, security, or customer success."
                >
                  <div className="space-y-3">
                    {result.recommendedActions?.map((item, index) => (
                      <div
                        key={`${item.owner}-${item.action}-${index}`}
                        className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Pill className="bg-cyan-500/15 text-cyan-100 ring-cyan-400/30">
                                {item.owner}
                              </Pill>
                              <Pill className={getRiskStyle(item.priority)}>
                                {item.priority}
                              </Pill>
                            </div>
                            <p className="mt-3 text-sm font-semibold leading-6 text-white">
                              {item.action}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Customer Response Draft"
                  description="A safe, empathetic reply that support can review before sending."
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Pill className="bg-cyan-500/15 text-cyan-100 ring-cyan-400/30">
                          Customer Reply
                        </Pill>
                        <Pill className="bg-slate-500/15 text-slate-200 ring-slate-400/30">
                          Tone: {result.responseDraft?.tone}
                        </Pill>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-cyan-50">
                        {result.responseDraft?.customerReply}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Pill className="bg-purple-500/15 text-purple-100 ring-purple-400/30">
                          Internal Note
                        </Pill>
                        {result.responseDraft?.shouldAskForMoreInfo ? (
                          <Pill className="bg-yellow-500/15 text-yellow-100 ring-yellow-400/30">
                            Needs More Info
                          </Pill>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {result.responseDraft?.internalNote}
                      </p>

                      {result.responseDraft?.requestedCustomerInfo?.length ? (
                        <div className="mt-5">
                          <p className="text-sm font-semibold text-white">
                            Requested Customer Information
                          </p>
                          <ul className="mt-3 space-y-2">
                            {result.responseDraft.requestedCustomerInfo.map(
                              (item, index) => (
                                <li
                                  key={`${item}-${index}`}
                                  className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                                >
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Governance & Quality Checks"
                  description="Human review flags, hallucination risk, and operational safety indicators."
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Human Review
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {result.qualityChecks?.requiresHumanReview
                          ? "Required"
                          : "Optional"}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Hallucination Risk
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {result.qualityChecks?.hallucinationRisk}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        PII / Secrets
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {result.qualityChecks?.piiOrSecretsDetected
                          ? "Detected"
                          : "Not Detected"}
                      </p>
                    </div>
                  </div>

                  {result.qualityChecks?.reviewReasons?.length ? (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-white">
                        Review Reasons
                      </p>
                      <ul className="mt-3 space-y-2">
                        {result.qualityChecks.reviewReasons.map(
                          (item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300"
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-white">
                      Next Best Action
                    </p>
                    <p className="mt-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm leading-7 text-emerald-100 ring-1 ring-emerald-400/20">
                      {result.nextBestAction}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {result.tags?.map((tag) => (
                      <Pill
                        key={tag}
                        className="bg-slate-500/15 text-slate-200 ring-slate-400/30"
                      >
                        #{tag}
                      </Pill>
                    ))}
                  </div>
                </Section>

                {rawResponse ? (
                  <details className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-200">
                      View Raw API Response
                    </summary>
                    <pre className="mt-4 max-h-[34rem] overflow-auto rounded-3xl border border-white/10 bg-black/60 p-4 text-xs leading-6 text-slate-300">
                      {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </>
            ) : null}
          </section>
        </div>

        <footer className="border-t border-white/10 py-8 text-center text-xs leading-6 text-slate-500">
          Enterprise Ticket Intelligence UI · Multi-agent orchestration ·
          Guardrailed output · Human-in-the-loop ready
        </footer>
      </div>
    </main>
  );
}