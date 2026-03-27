import Link from "next/link";
import type { ReactNode } from "react";
import SignOutButton from "@/components/SignOutButton";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r border-border bg-background/50 backdrop-blur shrink-0 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Link href="/dashboard">User Hub</Link>
          </h2>
        </div>
        <nav className="space-y-2 px-4">
          <Link href="/dashboard" className="block p-3 rounded-lg bg-primary/10 text-primary font-medium">Overview</Link>
          <Link href="/search" className="block p-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground">Search Catalog</Link>
          <Link href="/compare" className="block p-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground">Compare Products</Link>
          <div className="pt-2">
            <SignOutButton variant="ghost" className="w-full justify-start p-3 text-muted-foreground hover:bg-white/5" />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
