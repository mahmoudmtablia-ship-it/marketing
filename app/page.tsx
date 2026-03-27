import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Sparkles, TrendingUp, Zap } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">Nexus AI</span>
          </div>
          <div className="flex items-center gap-4 hidden md:flex text-sm text-muted-foreground">
            <Link href="/search" className="hover:text-foreground transition-colors">Search</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signin">Log in</Link>
            </Button>
            <Button size="sm" className="bg-primary/90 hover:bg-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          <span>Powered by Next-Gen AI Agents</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50 max-w-4xl">
          Don't just search.<br className="md:hidden" /> Shop <span className="text-primary italic">Smarter.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl">
          Our AI agents analyze millions of products in real-time, predict price drops, and find the absolute best deals across the entire web tailored just for you.
        </p>

        {/* AI Search Bar */}
        <form action="/search" method="GET" className="w-full max-w-2xl relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl transition-all group-hover:bg-primary/30 group-hover:blur-2xl"></div>
          <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl transition-all focus-within:border-primary/50">
            <div className="pl-4 pr-2">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
              name="q"
              type="text" 
              placeholder="e.g., 'Find me the best noise-canceling headphones under $200 for travel'" 
              className="border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-14"
            />
            <Button type="submit" className="h-12 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Agent Search</span>
            </Button>
          </div>
        </form>

        {/* Features / Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-24 w-full max-w-4xl">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 glass transition-all hover:-translate-y-1">
            <Zap className="h-6 w-6 text-yellow-400 mb-3" />
            <h3 className="font-semibold text-lg">Real-Time</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center">Live price comparison</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 glass transition-all hover:-translate-y-1">
            <TrendingUp className="h-6 w-6 text-green-400 mb-3" />
            <h3 className="font-semibold text-lg">Price Drops</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center">Predictive analytics</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 glass transition-all hover:-translate-y-1">
            <Sparkles className="h-6 w-6 text-blue-400 mb-3" />
            <h3 className="font-semibold text-lg">AI Agents</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center">Personalized curation</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 glass transition-all hover:-translate-y-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-400 mb-3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h3 className="font-semibold text-lg">Rewards</h3>
            <p className="text-xs text-muted-foreground mt-1 text-center">Earn cashback</p>
          </div>
        </div>
      </section>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none"></div>
    </main>
  )
}
