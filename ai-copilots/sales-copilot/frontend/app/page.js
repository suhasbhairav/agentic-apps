"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  // Backend configuration - easily adjustable
  const [apiUrl] = useState("http://127.0.0.1:8000");
  
  // File upload state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! Upload a PDF document, and I'll analyze it so we can chat about its contents. What would you like to know?",
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
        showNotification("error", "Only PDF files are supported!");
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
        showNotification("error", "Only PDF files are supported!");
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
        showNotification("success", data.info || `"${file.name}" indexed successfully!`);
        setUploadedFiles((prev) => [...prev, file.name]);
        
        // Add status message to chat system
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: "system",
            content: `📄 System: Indexed "${file.name}" (${data.pages_indexed || 1} pages parsed). Ready for questions!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setFile(null);
      } else {
        showNotification("error", data.detail || "Failed to parse PDF document.");
      }
    } catch (err) {
      showNotification("error", "Could not connect to FastAPI server. Ensure it is running.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Send message to FastAPI chat endpoint
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: userText,
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
            content: `⚠️ Error from server: ${data.detail || "Something went wrong."}`,
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
          content: "❌ Failed to reach the server. Is your FastAPI service running?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
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
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Premium Top Navigation Panel */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V7h9v2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900">Sales AI CoPilot</h1>
              <p className="text-xs font-semibold tracking-wide text-transparent bg-gradient-to-r from-fuchsia-500 via-amber-500 to-emerald-500 bg-clip-text">
                Created by Suhas Bhairav
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:py-10">
        
        {/* Left column: PDF Uploading and Index Management */}
        <section className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-md font-bold tracking-tight text-zinc-900 mb-1">Upload Documents</h2>
            <p className="text-xs text-zinc-500 mb-4">Upload PDFs to vectorize and save to your local LlamaIndex storage.</p>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              
              <div className="mb-3 rounded-full bg-zinc-100 p-2.5 text-zinc-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-800 line-clamp-1">{file.name}</p>
                  <p className="text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-800">Drag & drop your PDF file here</p>
                  <p className="text-[11px] text-zinc-400">or click to browse your system</p>
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
                  className="w-1/3 rounded-xl border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex w-2/3 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Parsing...
                    </>
                  ) : (
                    "Upload & Index"
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
                <div className="mt-0.5">
                  {uploadNotification.type === "success" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div>{uploadNotification.message}</div>
              </div>
            )}
          </div>

          {/* Uploaded Files History tracker */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase mb-3">Recently Indexed</h3>
            {uploadedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs italic text-zinc-400">No PDFs uploaded in this session yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((filename, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs">
                    <svg className="h-4 w-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-zinc-700 truncate">{filename}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right column: Interactive Chat Terminal */}
        <section className="lg:col-span-8 flex flex-col h-[650px] rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-800">Contextual Assistant</h3>
                <p className="text-[11px] font-medium text-emerald-600">Active memory enabled</p>
              </div>
            </div>
            
            {/* Quick action: Clear chat UI */}
            <button
              onClick={() => setMessages([messages[0]])}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
            >
              Clear Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="rounded-full bg-zinc-100 px-3.5 py-1 text-[11px] font-medium text-zinc-600 border border-zinc-200/50">
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
                      ? "bg-zinc-100 text-zinc-600" 
                      : "bg-indigo-600 text-white"
                  }`}>
                    {isAssistant ? "AI" : "ME"}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isAssistant
                        ? "bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-100"
                        : "bg-indigo-600 text-white rounded-tr-none"
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[10px] text-zinc-400 ${
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-400">
                  AI
                </div>
                <div className="rounded-2xl rounded-tl-none bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-500">
                  <div className="flex space-x-1.5 items-center h-4">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatBottomRef} />
          </div>

          {/* Quick suggestions layout */}
          {messages.length === 1 && (
            <div className="px-6 py-2 border-t border-zinc-100">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickPrompt("What are the key points of the uploaded document?")}
                  className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition text-left"
                >
                  🔑 What are the key points of the document?
                </button>
                <button
                  onClick={() => handleQuickPrompt("Can you write a concise summary of this PDF?")}
                  className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition text-left"
                >
                  📝 Can you write a concise summary?
                </button>
              </div>
            </div>
          )}

          {/* Interactive Chat Input Area */}
          <div className="border-t border-zinc-100 bg-white p-4">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask something about your indexed documents..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-4 pr-14 text-sm font-medium text-zinc-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isGenerating}
                className="absolute right-2.5 rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400 transition"
                title="Send query"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-center text-zinc-400">
              Conversations use RAG to recall context dynamically from local databases.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}
