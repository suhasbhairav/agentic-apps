"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I am SB Brain. I have access to your company's entire knowledge graph. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Brain Chat</h1>
          <p className="text-zinc-500 text-sm">Query your company's knowledge graph in plain English.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="h-3 w-3" />
          Powered by GPT-4o
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-24 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "assistant" ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}>
                  {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user" 
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black" 
                  : "bg-white border border-zinc-200 text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-50"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white animate-pulse">
              <Bot className="h-5 w-5" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-8 left-[calc(16rem+2rem)] right-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the company..."
            className="w-full rounded-2xl border border-zinc-200 bg-white px-6 py-4 pr-16 text-sm shadow-xl focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
          SB Brain executive decision support system
        </p>
      </div>
    </div>
  );
}
