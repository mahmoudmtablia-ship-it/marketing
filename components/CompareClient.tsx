"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import AffiliateButton from "@/components/AffiliateButton";
import { Button } from "@/components/ui/button";

type CompareProduct = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  rating: number;
  bestPrice: number | null;
  bestSource: string | null;
  stockStatus: string;
  tags: string[];
};

type CompareResponse = {
  success: boolean;
  products: CompareProduct[];
  aiVerdict?: string;
  ai_verdict?: string;
  recommendedProductId?: string;
  recommended_product_id?: string;
  comparisonMatrix?: Record<string, Record<string, string | number | string[] | null>>;
  comparison_matrix?: Record<string, Record<string, string | number | string[] | null>>;
};

function formatPrice(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function CompareClient({ initialIds }: { initialIds: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialIds.length < 2) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadComparison() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds: initialIds }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as CompareResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Comparison failed.");
        }

        setData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[COMPARE_CLIENT_ERROR]", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Comparison failed.");
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadComparison();

    return () => controller.abort();
  }, [initialIds]);

  const products = data?.products ?? [];
  const recommendedId = data?.recommendedProductId ?? data?.recommended_product_id;
  const verdict = data?.aiVerdict ?? data?.ai_verdict;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Nexus AI Platform</span>
          </Link>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5"
            disabled={isPending}
            onClick={() => startTransition(() => router.push("/search"))}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Comparison
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">AI Comparison Engine</h1>

        {initialIds.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-xl font-semibold">Pick at least two products first</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select products from the search results page, then come back here for a live comparison.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Open search</Link>
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Running the comparison engine against current product data.</p>
          </div>
        ) : null}

        {!isLoading && products.length > 0 ? (
          <>
            <div className="mb-10 rounded-2xl border border-primary/30 bg-primary/10 p-6 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Agent Verdict</h2>
              </div>
              <p className="text-lg leading-relaxed text-slate-200">
                {verdict || "The engine ranked these products using current price, rating, and stock data."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {products.map((product) => {
                const isRecommended = product.id === recommendedId;

                return (
                  <article
                    key={product.id}
                    className={`overflow-hidden rounded-2xl border bg-white/5 ${
                      isRecommended ? "border-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-white/10"
                    }`}
                  >
                    <div className="relative border-b border-white/10 p-6 text-center">
                      {isRecommended ? (
                        <div className="absolute right-0 top-0 rounded-bl-xl bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                          Best Value
                        </div>
                      ) : null}

                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="mx-auto mb-4 h-40 w-full rounded-xl object-cover opacity-80"
                        />
                      ) : (
                        <div className="mx-auto mb-4 flex h-40 w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-5xl font-bold text-white/50">
                          {product.title.charAt(0)}
                        </div>
                      )}

                      <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{product.category}</p>
                      <h3 className="mt-2 text-2xl font-bold">{product.title}</h3>
                      <p className="mt-2 text-3xl font-black">{formatPrice(product.bestPrice)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {product.bestSource || "Source pending"} - {product.stockStatus}
                      </p>

                      <AffiliateButton
                        productId={product.id}
                        sourceAgent="Compare"
                        className="mt-5 w-full rounded-xl"
                        disabled={product.bestPrice === null}
                      >
                        Buy Now
                      </AffiliateButton>
                    </div>

                    <div className="space-y-4 p-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Rating</span>
                        <span className="font-bold">{product.rating.toFixed(1)} / 5</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Stock</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          {product.stockStatus}
                        </span>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Summary</span>
                        <p className="mt-2 text-sm text-slate-300">
                          {product.description || "Catalog metadata available for this item, ready for richer AI summaries."}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Signals</span>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.tags.length > 0 ? (
                            product.tags.map((tag) => (
                              <span
                                key={`${product.id}-${tag}`}
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No AI tags yet.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
