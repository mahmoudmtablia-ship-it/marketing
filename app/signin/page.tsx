import Link from "next/link";
import { Sparkles } from "lucide-react";
import SignInForm from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))] px-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
      <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-blue-500/15 blur-[140px]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Back to home
          </Link>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            One login for search, comparison, tracking, and revenue analytics.
          </h2>
          <p className="mt-5 max-w-lg text-base text-slate-300">
            The current build supports seeded admin and user accounts backed by Prisma. Once the database is migrated
            and seeded, this page becomes the entry point for the full platform workflow.
          </p>
        </div>

        <SignInForm />
      </div>
    </main>
  );
}
