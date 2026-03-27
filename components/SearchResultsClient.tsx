"use client";

import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react";
import AffiliateButton from "@/components/AffiliateButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number | null;
  source: string | null;
  stockStatus?: string | null;
  affiliateUrl: string | null;
  score: number;
  tags: string[];
};

type SearchResponse = {
  success: boolean;
  latencyMs: number;
  message: string;
  results: SearchResult[];
  agentProcessing?: {
    intent: string;
    extracted_categories: string[];
    features: string[];
    price?: { max: number | null; currency: string };
    suggested_action: string;
    sentiment: string;
  };
};

function formatPrice(price: number | null) {
  if (price === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="h-40 rounded-xl bg-white/5" />
      <div className="mt-4 h-5 w-2/3 rounded bg-white/10" />
      <div className="mt-2 h-4 w-full rounded bg-white/5" />
      <div className="mt-2 h-4 w-1/2 rounded bg-white/5" />
      <div className="mt-5 h-10 rounded-xl bg-white/10" />
    </div>
  );
}

export default function SearchResultsClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
    setSelectedIds([]);

    if (!initialQuery.trim()) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadResults() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: initialQuery }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as SearchResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }

        setData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[SEARCH_RESULTS_CLIENT_ERROR]", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Search failed.");
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadResults();

    return () => controller.abort();
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return;
    }

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    });
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(-4),
    );
  }

  function handleCompare() {
    if (selectedIds.length < 2) {
      return;
    }

    startTransition(() => {
      router.push(`/compare?ids=${selectedIds.join(",")}`);
    });
  }

  const results = data?.results ?? [];
  const categories = data?.agentProcessing?.extracted_categories ?? [];
  const features = data?.agentProcessing?.features ?? [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Nexus AI</span>
          </Link>
          <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Search Results</h1>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Results for <strong>"{initialQuery || "smart shopping"}"</strong>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5"
                disabled={selectedIds.length < 2 || isPending}
                onClick={handleCompare}
              >
                Compare Selected ({selectedIds.length})
              </Button>
              <Button variant="outline" className="border-primary/20 bg-primary/10 text-primary" disabled>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Price Alerts Soon
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-xl">
              <div className="pl-4 pr-2">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find me great waterproof running shoes under $120"
                className="h-12 border-0 bg-transparent px-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="submit" className="rounded-xl px-5" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Search"}
              </Button>
            </div>
          </form>
        </div>

        {data?.agentProcessing ? (
          <div className="mb-6 grid gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Intent</p>
              <p className="mt-2 text-lg font-semibold capitalize">{data.agentProcessing.intent}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Categories</p>
              <p className="mt-2 text-sm text-slate-200">{categories.join(", ") || "General catalog"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Signals</p>
              <p className="mt-2 text-sm text-slate-200">{features.join(", ") || "No explicit filters detected"}</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {!initialQuery.trim() && !isLoading ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-xl font-semibold">Start with a product intent</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try something like "best travel headphones under $200" or "cheap waterproof running shoes".
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : null}

        {!isLoading && initialQuery.trim() && results.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-xl font-semibold">No matching products yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We searched the current catalog but did not find products for that query. Try a broader category or a
              higher budget.
            </p>
          </div>
        ) : null}

        {!isLoading && results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result) => {
              const isSelected = selectedIds.includes(result.id);

              return (
                <article
                  key={result.id}
                  className={`overflow-hidden rounded-2xl border bg-white/5 shadow-xl transition-all ${
                    isSelected ? "border-primary/60 shadow-[0_0_24px_rgba(59,130,246,0.2)]" : "border-white/10"
                  }`}
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                    {result.imageUrl ? (
                      <img src={result.imageUrl} alt={result.name} className="h-full w-full object-cover opacity-80" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white/80">
                        {result.name.charAt(0)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSelection(result.id)}
                      className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur"
                    >
                      <CheckCircle2 className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-white/40"}`} />
                      {isSelected ? "Selected" : "Select"}
                    </button>
                    <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Match {result.score}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{result.category}</p>
                      <h2 className="mt-2 text-xl font-bold">
                        <Link href={`/product/${result.id}`} className="transition-colors hover:text-primary">
                          {result.name}
                        </Link>
                      </h2>
                      <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">
                        {result.description || "Catalog result ranked by price, intent match, and source availability."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.tags.slice(0, 4).map((tag) => (
                        <span
                          key={`${result.id}-${tag}`}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xl font-black">{formatPrice(result.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.source || "Source pending"}
                          {result.stockStatus ? ` - ${result.stockStatus}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5 px-4">
                          <Link href={`/product/${result.id}`}>View</Link>
                        </Button>
                        <AffiliateButton
                          productId={result.id}
                          sourceAgent="Search"
                          className="rounded-full px-4"
                          disabled={!result.affiliateUrl}
                        >
                          <span className="flex items-center gap-2">
                            Buy
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </AffiliateButton>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
