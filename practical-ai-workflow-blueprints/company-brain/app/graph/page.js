"use client";

import { useState, useEffect } from "react";
import { Network, FileText, User, Wrench, Search, Filter, MoreHorizontal, Loader2, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export default function GraphPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetch("/api/graph")
      .then(res => res.json())
      .then(data => {
        if (data.nodes) setNodes(data.nodes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 relative h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-zinc-500 text-sm">Mapping the connections between documents, people, and systems.</p>
        </div>
        <button 
          onClick={() => setShowVisualizer(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Network className="h-4 w-4" />
          Visualize Interactive Graph
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading company brain graph...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No documents indexed yet.</p>
            <p className="text-sm">Upload company files to see the graph come alive.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                <th className="px-6 py-4">Node Name</th>
                <th className="px-6 py-4">Inferred People</th>
                <th className="px-6 py-4">Tools/Stack</th>
                <th className="px-6 py-4">Processes</th>
                <th className="px-6 py-4">Last Sync</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {nodes.map((node, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    {node.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {node.entities.people.slice(0, 3).map(p => (
                        <span key={p} className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-[10px] text-zinc-600">{p}</span>
                      ))}
                      {node.entities.people.length > 3 && <span className="text-[10px] text-zinc-400">+{node.entities.people.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {node.entities.tools.slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-[10px] text-emerald-600">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    <div className="flex flex-wrap gap-1">
                      {node.entities.processes.slice(0, 2).map(proc => (
                        <span key={proc} className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-[10px] text-amber-600">{proc}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs italic">
                    {new Date(node.lastSync).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showVisualizer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-8"
          >
            <div className="flex items-center justify-between mb-8 text-white">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Network className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">System Knowledge Map</h2>
                  <p className="text-zinc-400 text-sm">Force-directed visualization of company entities</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVisualizer(false)}
                className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 relative rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden flex">
              <div className="flex-1 relative">
                <KnowledgeGraph nodes={nodes} onNodeClick={setSelectedNode} />
                
                {/* Legend */}
                <div className="absolute bottom-8 left-8 p-4 bg-black/50 backdrop-blur-md border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#4f46e5]" />
                    <span className="text-[10px] text-white uppercase font-bold tracking-widest">Document</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                    <span className="text-[10px] text-white uppercase font-bold tracking-widest">Person</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <span className="text-[10px] text-white uppercase font-bold tracking-widest">Tool</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#6366f1]" />
                    <span className="text-[10px] text-white uppercase font-bold tracking-widest">Process</span>
                  </div>
                </div>
              </div>

              {/* Inspector Panel */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div 
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-bold uppercase text-xs tracking-widest">Node Inspector</h3>
                      <button onClick={() => setSelectedNode(null)}><X className="h-4 w-4 text-zinc-500" /></button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Name</p>
                        <p className="text-white font-semibold">{selectedNode.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Type</p>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                          {selectedNode.type}
                        </span>
                      </div>
                      
                      {selectedNode.type === 'document' && (
                        <button className="w-full bg-white text-black py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">
                          Open Original Document
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
