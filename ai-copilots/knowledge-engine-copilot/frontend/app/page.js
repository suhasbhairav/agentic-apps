"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const DEFAULT_WORKFLOWS = [
  {
    workflow_id: "account_briefing",
    workflow_name: "Account Briefing",
    button_label: "Generate account brief",
    description:
      "Create a sales ready account briefing from uploaded knowledge.",
    endpoint: "/sales/account-briefing",
    icon: "🏢",
  },
  {
    workflow_id: "pain_point_finder",
    workflow_name: "Customer Pain Point Finder",
    button_label: "Find customer pain points",
    description: "Identify explicit and implied customer pains.",
    endpoint: "/sales/pain-point-finder",
    icon: "🎯",
  },
  {
    workflow_id: "objection_handling",
    workflow_name: "Objection Handling",
    button_label: "Prepare objection handling",
    description: "Generate likely objections and response angles.",
    endpoint: "/sales/objection-handling",
    icon: "🛡️",
  },
  {
    workflow_id: "proposal_draft",
    workflow_name: "Proposal Draft",
    button_label: "Draft proposal section",
    description: "Create a proposal section from sales knowledge.",
    endpoint: "/sales/proposal-draft",
    icon: "📄",
  },
  {
    workflow_id: "follow_up_email",
    workflow_name: "Follow Up Email",
    button_label: "Draft follow-up email",
    description: "Write a concise customer follow up email.",
    endpoint: "/sales/follow-up-email",
    icon: "✉️",
  },
  {
    workflow_id: "competitor_comparison",
    workflow_name: "Competitor Comparison",
    button_label: "Compare against competitors",
    description: "Prepare competitive positioning from documents.",
    endpoint: "/sales/competitor-comparison",
    icon: "⚔️",
  },
  {
    workflow_id: "renewal_risk_review",
    workflow_name: "Renewal Risk Review",
    button_label: "Review renewal risk",
    description: "Find churn, renewal, and retention risk signals.",
    endpoint: "/sales/renewal-risk-review",
    icon: "⚠️",
  },
  {
    workflow_id: "upsell_opportunity_finder",
    workflow_name: "Upsell Opportunity Finder",
    button_label: "Find upsell opportunities",
    description: "Identify expansion and cross sell opportunities.",
    endpoint: "/sales/upsell-opportunity-finder",
    icon: "📈",
  },
  {
    workflow_id: "meeting_preparation",
    workflow_name: "Meeting Preparation",
    button_label: "Prepare for meeting",
    description: "Create a customer meeting preparation brief.",
    endpoint: "/sales/meeting-preparation",
    icon: "🗓️",
  },
  {
    workflow_id: "crm_note_generator",
    workflow_name: "CRM Note Generator",
    button_label: "Generate CRM note",
    description: "Convert messy context into clean CRM notes.",
    endpoint: "/sales/crm-note-generator",
    icon: "🧾",
  },
];

const emptyPayload = {
  account_name: "Mittelstand Manufacturing GmbH",
  contact_name: "Head of Sales Operations",
  product_or_service: "Sales knowledge engine and workflow assistant",
  deal_stage: "Discovery",
  sales_context:
    "The sales team spends too much time searching old proposals, case studies, pricing notes, product documents, customer emails, and CRM notes before calls. Management wants AI, but the team does not want a blank chatbot.",
  user_question: "Prepare this for a realistic B2B sales workflow demo.",
};

export default function Home() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState(
    DEFAULT_WORKFLOWS[0],
  );
  const [payload, setPayload] = useState(emptyPayload);

  const [runningWorkflow, setRunningWorkflow] = useState(false);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [workflowError, setWorkflowError] = useState(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Upload sales PDFs, then use the workflow buttons. The chatbot is only a fallback. The main demo is action based.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/demo/frontend-buttons`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.buttons) && data.buttons.length > 0) {
          const enhanced = data.buttons.map((item, index) => ({
            ...item,
            workflow_name:
              DEFAULT_WORKFLOWS.find((w) => w.workflow_id === item.workflow_id)
                ?.workflow_name || item.label,
            icon: DEFAULT_WORKFLOWS[index]?.icon || "⚡",
          }));

          setWorkflows(enhanced);
          setSelectedWorkflow(enhanced[0]);
        }
      })
      .catch(() => {
        setWorkflows(DEFAULT_WORKFLOWS);
      });
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const showNotification = (type, message) => {
    setUploadNotification({ type, message });
    setTimeout(() => setUploadNotification(null), 5000);
  };

  const handlePayloadChange = (field, value) => {
    setPayload((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    }

    if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setUploadNotification(null);
      } else {
        showNotification("error", "Only PDF files are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setUploadNotification(null);
      } else {
        showNotification("error", "Only PDF files are supported.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadNotification(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload PDF.");
      }

      showNotification(
        "success",
        data.info || `"${file.name}" uploaded and indexed.`,
      );

      setUploadedFiles((prev) => [
        {
          name: file.name,
          pages: data.pages_indexed || 1,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev,
      ]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: "system",
          content: `Indexed "${file.name}" with ${
            data.pages_indexed || 1
          } parsed pages.`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      setFile(null);
    } catch (err) {
      showNotification(
        "error",
        err.message || "Could not connect to FastAPI server.",
      );
    } finally {
      setUploading(false);
    }
  };

  const runWorkflow = async (workflow) => {
    setSelectedWorkflow(workflow);
    setRunningWorkflow(true);
    setWorkflowResult(null);
    setWorkflowError(null);

    try {
      const endpoint =
        workflow.endpoint || `/workflows/${workflow.workflow_id}/run`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Workflow failed.");
      }

      setWorkflowResult(data);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setWorkflowError(err.message || "Could not run workflow.");
    } finally {
      setRunningWorkflow(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();

    setChatInput("");
    setChatLoading(true);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Chat failed.");
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || "No response returned.",
          sources: data.sources || [],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            err.message ||
            "Could not reach the server. Make sure FastAPI is running.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const resetDemoPayload = () => {
    setPayload(emptyPayload);
  };

  const renderText = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <br key={index} />;
      }

      if (/^\d+\./.test(trimmed)) {
        return (
          <p key={index} className="mt-4 font-semibold text-slate-950">
            {trimmed}
          </p>
        );
      }

      if (trimmed.startsWith("-")) {
        return (
          <p
            key={index}
            className="ml-4 text-sm leading-relaxed text-slate-700"
          >
            {trimmed}
          </p>
        );
      }

      return (
        <p key={index} className="text-sm leading-relaxed text-slate-700">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">
              ⚡
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950">
                Sales Knowledge Engine
              </h1>
              <p className="text-xs font-medium text-slate-500">
                10 AI workflow buttons for sales teams. No blank chatbot
                required.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            FastAPI + LlamaIndex + OpenAI
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">
              Upload sales documents
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Upload proposals, case studies, sales decks, product docs, CRM
              exports, or account notes as PDFs.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
                📎
              </div>

              {file ? (
                <div>
                  <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Drop PDF here
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    or click to browse
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="col-span-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Indexing..." : "Upload and Index"}
                </button>
              </div>
            )}

            {uploadNotification && (
              <div
                className={`mt-4 rounded-2xl border px-3 py-3 text-xs leading-relaxed ${
                  uploadNotification.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {uploadNotification.message}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Indexed in session
              </h3>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                {uploadedFiles.length}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {uploadedFiles.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs italic text-slate-400">
                  No PDFs uploaded yet.
                </p>
              ) : (
                uploadedFiles.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="line-clamp-1 text-xs font-semibold text-slate-800">
                      {item.name}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {item.pages} pages indexed · {item.time}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Sales context
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  This is the context passed into every workflow button.
                </p>
              </div>

              <button
                onClick={resetDemoPayload}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Reset demo context
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputBox
                label="Account name"
                value={payload.account_name}
                onChange={(value) => handlePayloadChange("account_name", value)}
              />

              <InputBox
                label="Contact name"
                value={payload.contact_name}
                onChange={(value) => handlePayloadChange("contact_name", value)}
              />

              <InputBox
                label="Product or service"
                value={payload.product_or_service}
                onChange={(value) =>
                  handlePayloadChange("product_or_service", value)
                }
              />

              <InputBox
                label="Deal stage"
                value={payload.deal_stage}
                onChange={(value) => handlePayloadChange("deal_stage", value)}
              />
            </div>

            <div className="mt-3 space-y-3">
              <TextAreaBox
                label="Sales context"
                value={payload.sales_context}
                onChange={(value) =>
                  handlePayloadChange("sales_context", value)
                }
                rows={5}
              />

              <TextAreaBox
                label="Extra instruction"
                value={payload.user_question}
                onChange={(value) =>
                  handlePayloadChange("user_question", value)
                }
                rows={3}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Workflow buttons
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Screenshot friendly AI actions. Each button runs a complete
                sales workflow.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {workflows.map((workflow) => {
                const isSelected =
                  selectedWorkflow?.workflow_id === workflow.workflow_id;

                return (
                  <button
                    key={workflow.workflow_id}
                    onClick={() => runWorkflow(workflow)}
                    disabled={runningWorkflow}
                    className={`group rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700 group-hover:bg-indigo-100"
                        }`}
                      >
                        {workflow.icon || "⚡"}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {workflow.button_label}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {workflow.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-5 lg:col-span-4">
          <div
            ref={resultRef}
            className="min-h-[520px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Workflow output
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Result from the selected workflow action.
                </p>
              </div>

              {selectedWorkflow && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                  {selectedWorkflow.workflow_name || selectedWorkflow.label}
                </span>
              )}
            </div>

            {runningWorkflow && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

                  <p className="text-sm font-semibold text-slate-800">
                    Running sales workflow...
                  </p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  The system is retrieving relevant documents and converting
                  them into a structured sales action.
                </p>
              </div>
            )}

            {workflowError && (
              <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {workflowError}
              </div>
            )}

            {!runningWorkflow && !workflowResult && !workflowError && (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
                  🧠
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-950">
                  Select a workflow button
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Upload documents, adjust the sales context, then click a
                  workflow button to generate a screenshot ready result.
                </p>
              </div>
            )}

            {workflowResult && (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-slate-950">
                    {workflowResult.workflow_name}
                  </h3>

                  <div className="mt-4 max-w-none">
                    {renderText(workflowResult.output)}
                  </div>
                </div>

                {workflowResult.suggested_next_actions?.length > 0 && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Suggested next actions
                    </h3>

                    <div className="mt-3 space-y-2">
                      {workflowResult.suggested_next_actions.map(
                        (action, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs text-emerald-900 shadow-sm"
                          >
                            {action}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <SourcesPanel sources={workflowResult.sources || []} />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Fallback chat
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Keep chat secondary. The demo should lead with workflow actions.
              </p>
            </div>

            <div className="mt-4 h-72 space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {chatMessages.map((msg) => {
                if (msg.role === "system") {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                    >
                      {msg.content}
                    </div>
                  );
                }

                const isAssistant = msg.role === "assistant";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isAssistant ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                        isAssistant
                          ? "border border-slate-200 bg-white text-slate-700"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a fallback question..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputBox({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function TextAreaBox({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function SourcesPanel({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-950">Sources</h3>

        <p className="mt-2 text-xs text-slate-500">
          No source snippets returned. Upload richer PDFs or check backend
          retrieval.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-950">Retrieved sources</h3>

      <div className="mt-3 space-y-3">
        {sources.map((source, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-800">
                {source.file_name || "Unknown source"}
              </p>

              {source.page_label && (
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                  Page {source.page_label}
                </span>
              )}
            </div>

            {typeof source.score === "number" && (
              <p className="mt-1 text-[10px] text-slate-400">
                Similarity score: {source.score.toFixed(3)}
              </p>
            )}

            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-500">
              {source.text_preview || "No preview available."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
