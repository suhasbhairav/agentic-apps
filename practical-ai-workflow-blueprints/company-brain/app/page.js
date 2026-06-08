import Link from "next/link";
import { Brain, Users, Zap, AlertTriangle, FileText, Activity } from "lucide-react";

export default function Home() {
  const stats = [
    { name: "Nodes in Graph", value: "1,284", icon: FileText, change: "+12%", changeType: "increase" },
    { name: "Connected People", value: "42", icon: Users, change: "+2", changeType: "increase" },
    { name: "Active Workflows", value: "18", icon: Zap, change: "Stable", changeType: "neutral" },
    { name: "Inferred Inefficiencies", value: "7", icon: AlertTriangle, change: "-2", changeType: "decrease" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Systems Overview</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Real-time analysis of your company's information and workflow patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/20">
                <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{item.name}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{item.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs font-medium ${
                item.changeType === 'decrease' ? 'text-emerald-600' : 
                item.changeType === 'increase' ? 'text-indigo-600' : 'text-zinc-500'
              }`}>
                {item.change}
              </span>
              <span className="text-xs text-zinc-400 italic">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Live Insights
            </h2>
            <button className="text-xs font-medium text-indigo-600 hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {[
              { title: "Redundant Vendor Detected", desc: "Two teams are paying for separate Notion instances.", priority: "High" },
              { title: "Bottleneck in Product Handoff", desc: "Design to Engineering handoff is averaging 12 days.", priority: "Medium" },
              { title: "Knowledge Silo: Marketing", desc: "Marketing strategy docs are not linked to Sales workflows.", priority: "Low" },
            ].map((insight) => (
              <div key={insight.title} className="flex gap-4 border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  insight.priority === 'High' ? 'bg-red-500' : 
                  insight.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <h3 className="text-sm font-semibold">{insight.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
          <Brain className="h-12 w-12 text-zinc-200 mb-4 dark:text-zinc-800" />
          <h2 className="text-lg font-semibold mb-2">Systems Map Preview</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs">
            Visualizing the connections between people, tools, and documentation.
          </p>
          <Link 
            href="/graph"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Open Knowledge Graph
          </Link>
        </div>
      </div>
    </div>
  );
}
