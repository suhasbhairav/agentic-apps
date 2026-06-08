import Link from "next/link";
import { Brain, LayoutDashboard, Upload, Network, MessageSquare, Settings } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "AI Brain Chat", icon: MessageSquare, href: "/chat" },
    { name: "Knowledge Graph", icon: Network, href: "/graph" },
    { name: "Upload Center", icon: Upload, href: "/upload" },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Brain className="h-6 w-6 text-indigo-600" />
          <span>SB Brain</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
