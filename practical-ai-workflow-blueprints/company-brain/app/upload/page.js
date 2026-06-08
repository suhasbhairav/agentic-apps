"use client";

import { useState } from "react";
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setStatus({ type: "success", message: data.message });
      setFiles([]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setStatus({ type: "success", message: data.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
        <p className="text-zinc-500 text-sm">Add documents to the company knowledge graph.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div 
            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer group"
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              id="fileInput" 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md"
            />
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                <Upload className="h-6 w-6 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-sm font-semibold mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-zinc-500">PDF, DOCX, TXT, MD (Max 50MB)</p>
            </div>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-sm font-semibold">{files.length} files selected</span>
                  <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline">Clear all</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-900 last:border-0">
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-zinc-400">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button onClick={() => removeFile(index)} className="text-zinc-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50">
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload Files"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {status.message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${ingesting ? 'animate-spin' : ''}`} />
              Sync Brain
            </h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              After uploading new documents, sync the brain to update the knowledge graph and AI agent.
            </p>
            <button 
              onClick={handleIngest}
              disabled={ingesting || uploading}
              className="w-full bg-white text-indigo-600 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {ingesting ? "Processing..." : "Sync Brain Now"}
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold mb-4">Supported Connectors</h3>
            <div className="space-y-3">
              {[
                { name: "Google Drive", status: "Coming Soon" },
                { name: "Slack", status: "Coming Soon" },
                { name: "Notion", status: "Coming Soon" },
                { name: "Email (SMTP)", status: "Alpha" },
              ].map((conn) => (
                <div key={conn.name} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{conn.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase font-bold tracking-wider">{conn.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
