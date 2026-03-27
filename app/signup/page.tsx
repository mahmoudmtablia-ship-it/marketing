import Link from "next/link";
import { Sparkles } from "lucide-react";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))] px-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
      <div className="absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-[140px]" />
      <div className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Back to home
          </Link>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Turn product research into one persistent, AI-assisted workspace.
          </h2>
          <p className="mt-5 max-w-lg text-base text-slate-300">
            Create an account to save products, track price alerts, collect outbound click history, and unlock the
            full marketplace dashboard.
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
