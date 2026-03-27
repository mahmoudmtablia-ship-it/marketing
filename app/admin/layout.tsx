import { BarChart3, Users, Briefcase, Activity } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Activity className="h-5 w-5 text-indigo-500" />
            <Link href="/admin">Control Center</Link>
          </h2>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400">
            <Briefcase className="h-4 w-4" /> Products
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400">
            <Users className="h-4 w-4" /> System Users
          </Link>
          <div className="pt-2">
            <SignOutButton
              variant="ghost"
              className="w-full justify-start px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
        {children}
      </main>
    </div>
  );
}
