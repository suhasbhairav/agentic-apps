"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  // Backend configuration - easily adjustable
  const [apiUrl] = useState("http://127.0.0.1:8000");
  
  // File upload state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Support agent specific state
  const [supportTone, setSupportTone] = useState("empathetic"); // empathetic, professional, troubleshooting, concise
  const [activeTicket, setActiveTicket] = useState({
    id: "TKT-8492",
    customer: "Sarah Jenkins",
    tier: "VIP Customer",
    status: "OPEN",
    priority: "HIGH"
  });
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your Support CoPilot. Upload the latest product manuals, refund guidelines, or SLA policy PDFs, and I will help you draft perfectly structured customer replies in real-time. How can I assist you with your queue today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Event
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
        showNotification("error", "Only PDF documents (FAQs, SOPs, Manuals) are supported!");
      }
    }
  };

  // Handle File Selection via button
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setUploadNotification(null);
      } else {
        showNotification("error", "Only PDF documents (FAQs, SOPs, Manuals) are supported!");
      }
    }
  };

  const showNotification = (type, message) => {
    setUploadNotification({ type, message });
    setTimeout(() => {
      setUploadNotification(null);
    }, 5000);
  };

  // Upload PDF to FastAPI backend
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadNotification(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("success", data.info || `"${file.name}" indexed to Support KB!`);
        setUploadedFiles((prev) => [...prev, file.name]);
        
        // Add status message to chat system
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: "system",
            content: `📖 System: Added "${file.name}" to resolution memory. Custom answers will now include this policy context.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setFile(null);
      } else {
        showNotification("error", data.detail || "Failed to parse PDF document.");
      }
    } catch (err) {
      showNotification("error", "Could not connect to FastAPI server. Ensure your backend is running.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Send message to FastAPI chat endpoint
  const handleSendMessage = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    
    const rawText = customMessage || inputMessage;
    if (!rawText.trim() || isGenerating) return;

    // Inject support tone choice into user query if not already configured in prompt
    let userText = rawText.trim();
    if (supportTone !== "empathetic") {
      userText = `[Tone Instruction: Please respond in a ${supportTone} manner] ${userText}`;
    }

    setInputMessage("");
    
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // Add user message to UI (hide tone tags for cleaner reading)
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: rawText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsGenerating(true);

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content: data.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content: `⚠️ Error from knowledge base: ${data.detail || "Something went wrong."}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "❌ Failed to reach the knowledge database. Verify your FastAPI service is operational.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick copy response to clipboard tool (crucial for customer service workflows)
  const handleCopyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  // Quick action prompt buttons helper
  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
  };

  const renderMessageContent = (content) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-teal-950">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      { }
      {/* Premium Top Navigation Panel */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Customer Support CoPilot</h1>
              <p className="text-xs font-semibold tracking-wide text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text">
                Live Knowledge-Base Resolver Workspace
              </p>
            </div>
          </div>

          {/* Quick Active Ticket Simulator Header */}
          <div className="hidden sm:flex items-center gap-4 bg-slate-100 rounded-xl px-4 py-1.5 border border-slate-200">
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Queue</div>
              <div className="text-xs font-semibold text-slate-700">{activeTicket.customer} ({activeTicket.id})</div>
            </div>
            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
              {activeTicket.priority} Priority
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:py-10">
        
        { }
        {/* Left column: PDF Uploading and Customer Service Tooling */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Tone Context Customizer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Support Tone Preset</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "empathetic", label: "Empathetic", icon: "❤️" },
                { id: "professional", label: "Formal", icon: "💼" },
                { id: "troubleshooting", label: "Technical", icon: "🔧" },
                { id: "concise", label: "Concise / Quick", icon: "⚡" }
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSupportTone(tone.id)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border transition-all ${
                    supportTone === tone.id
                      ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span>{tone.icon}</span>
                  <span>{tone.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PDF Uploading */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-md font-bold tracking-tight text-slate-900 mb-1">Upload Support Guidelines</h2>
            <p className="text-xs text-slate-500 mb-4">Upload system manuals, troubleshooting scripts, or pricing tables to reference.</p>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-teal-500 bg-teal-50/50"
                  : "border-slate-300 hover:border-teal-400 hover:bg-slate-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              
              <div className="mb-3 rounded-full bg-slate-100 p-2.5 text-slate-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">Drag & drop policy/manual PDF</p>
                  <p className="text-[11px] text-slate-400">or click to browse your computer</p>
                </div>
              )}
            </div>

            {/* Actions for Selected File */}
            {file && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="w-1/3 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex w-2/3 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Parsing KB...
                    </>
                  ) : (
                    "Upload to Knowledge"
                  )}
                </button>
              </div>
            )}

            {/* Notification system */}
            {uploadNotification && (
              <div className={`mt-4 rounded-xl p-3 text-xs flex gap-2.5 ${
                uploadNotification.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}>
                <div className="mt-0.5 shrink-0">
                  {uploadNotification.type === "success" ? (
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div>{uploadNotification.message}</div>
              </div>
            )}
          </div>

          {/* Uploaded Files History tracker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">Active KB Documents</h3>
            {uploadedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <p className="text-xs italic text-slate-400">No documents uploaded. Standard knowledge models apply.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((filename, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <svg className="h-4 w-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-slate-700 truncate">{filename}</span>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                      Indexed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        { }
        {/* Right column: Interactive Chat Terminal */}
        <section className="lg:col-span-8 flex flex-col h-[680px] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Support Agent Agent Copilot</h3>
                <p className="text-[11px] font-medium text-emerald-600">Connected to local RAG databases</p>
              </div>
            </div>
            
            {/* Quick action: Clear chat UI */}
            <button
              onClick={() => setMessages([messages[0]])}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              Reset Terminal
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="rounded-full bg-teal-50 px-3.5 py-1 text-[11px] font-medium text-teal-800 border border-teal-200/50 flex items-center gap-1.5">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  {/* Avatar Icon */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isAssistant 
                      ? "bg-teal-50 text-teal-700 border border-teal-200" 
                      : "bg-teal-600 text-white shadow-sm"
                  }`}>
                    {isAssistant ? "AIP" : "ME"}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1 flex-1">
                    <div className={`rounded-2xl px-4 py-3 text-sm relative group ${
                      isAssistant
                        ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100"
                        : "bg-teal-600 text-white rounded-tr-none"
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>

                      {/* COPY BUTTON: Highly useful feature for customer support workflow */}
                      {isAssistant && msg.id !== "welcome" && (
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(msg.id, msg.content)}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm"
                          title="Copy reply to clipboard"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              Copy Draft
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[10px] text-slate-400 ${
                      isAssistant ? "text-left" : "text-right"
                    }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Response Generating Skeleton Indicator */}
            {isGenerating && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                  AIP
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-500">
                  <div className="flex space-x-1.5 items-center h-4">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatBottomRef} />
          </div>

          { }
          {/* Quick suggestions/Support Macro templates layout */}
          {messages.length === 1 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Support Macros & Scenarios:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickPrompt("Draft an apology to a user whose package was damaged during shipping. Suggest standard damage claim compensation from our policies.")}
                  className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-left text-slate-700 hover:border-teal-400 hover:shadow-sm transition duration-150 flex items-start gap-2"
                >
                  <span className="text-amber-500">📦</span>
                  <div>
                    <div className="font-semibold text-slate-800">Damaged Shipment</div>
                    <p className="text-[10px] text-slate-400">Draft apology and outline damage claim process</p>
                  </div>
                </button>
                <button
                  onClick={() => handleQuickPrompt("A customer wants a full refund on a non-refundable digital service because they forgot to cancel the auto-renewal. Draft an empathetic refusal, but offer a 25% account credit as a courtesy.")}
                  className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-left text-slate-700 hover:border-teal-400 hover:shadow-sm transition duration-150 flex items-start gap-2"
                >
                  <span className="text-teal-500">💳</span>
                  <div>
                    <div className="font-semibold text-slate-800">Refund Refusal Courtesy</div>
                    <p className="text-[10px] text-slate-400">Handle non-refundable SLA refusals gracefully</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Chat Input Area */}
          <div className="border-t border-slate-100 bg-white p-4">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask support manuals, policies, or draft email replies..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isGenerating}
                className="absolute right-2.5 rounded-lg bg-teal-600 p-2 text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                title="Ask Support Agent"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-center text-slate-400">
              The response will adapt dynamically to your selected <strong>{supportTone}</strong> tone setting.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}