import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, Layers3, Sparkles } from "lucide-react";
import AffiliateButton from "@/components/AffiliateButton";
import PriceAlertButton from "@/components/PriceAlertButton";
import ProductViewTracker from "@/components/ProductViewTracker";
import SaveProductButton from "@/components/SaveProductButton";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function formatPrice(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

async function getProductPageData(id: string) {
  try {
    const currentUser = await getCurrentUser();
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        sources: {
          where: {
            stockStatus: { not: "OUT_OF_STOCK" },
          },
          include: {
            source: {
              select: {
                id: true,
                name: true,
                reliability: true,
              },
            },
          },
          orderBy: [{ price: "asc" }],
        },
      },
    });

    if (!product) {
      return null;
    }

    const [relatedProducts, favorite, activeAlert] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { not: product.id },
          category: product.category,
        },
        include: {
          sources: {
            where: {
              stockStatus: { not: "OUT_OF_STOCK" },
            },
            include: {
              source: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: [{ price: "asc" }],
          },
        },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
      currentUser
        ? prisma.favorite.findUnique({
            where: {
              userId_productId: {
                userId: currentUser.id,
                productId: product.id,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      currentUser
        ? prisma.priceAlert.findFirst({
            where: {
              userId: currentUser.id,
              productId: product.id,
              isActive: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              targetPrice: true,
              isActive: true,
            },
          })
        : Promise.resolve(null),
    ]);

    return {
      product,
      relatedProducts,
      currentUser,
      isSaved: Boolean(favorite),
      activeAlert,
    };
  } catch (error) {
    console.error("[PRODUCT_PAGE_ERROR]", error);
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getProductPageData(params.id);

  if (!data) {
    notFound();
  }

  const { product, relatedProducts, currentUser, isSaved, activeAlert } = data;
  const bestSource = product.sources[0];
  const suggestedAlertTarget = bestSource?.price ? Math.round(bestSource.price * 90) / 100 : activeAlert?.targetPrice ?? null;

  return (
    <main className="min-h-screen bg-background">
      <ProductViewTracker productId={product.id} />

      <nav className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Nexus AI</span>
          </Link>
          <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Link href="/search" className="transition-colors hover:text-foreground">
              Search
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="h-[360px] w-full object-cover" />
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-8xl font-black text-white/25">
                  {product.title.charAt(0)}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-[0.2em]">Agent Readout</span>
              </div>
              <p className="mt-4 text-slate-200">
                {product.description ||
                  "This product is in the live catalog and ready for comparison, affiliate routing, and analytics."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={`${product.id}-${tag}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{product.category}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{product.title}</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Rated {product.rating?.toFixed(1) ?? "0.0"} / 5 across the current catalog sources.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-muted-foreground">Best live price</p>
                <p className="mt-2 text-4xl font-black">{formatPrice(bestSource?.price ?? null)}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {bestSource?.source.name ?? "No active source"} {bestSource ? `- ${bestSource.stockStatus}` : ""}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <AffiliateButton
                    productId={product.id}
                    sourceAgent="ProductPage"
                    sourceId={bestSource?.sourceId}
                    className="h-11 flex-1 rounded-xl"
                    disabled={!bestSource}
                  >
                    Buy from Best Source
                  </AffiliateButton>
                  <Button asChild variant="outline" className="h-11 flex-1 rounded-xl border-white/10 bg-white/5">
                    <Link href={`/search?q=${encodeURIComponent(product.category)}`}>More in this category</Link>
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SaveProductButton
                    productId={product.id}
                    initialSaved={isSaved}
                    className="h-11 rounded-xl border-white/10 bg-white/5"
                  />
                  <PriceAlertButton
                    productId={product.id}
                    initialActive={Boolean(activeAlert?.isActive)}
                    targetPrice={activeAlert?.targetPrice ?? suggestedAlertTarget}
                    className="h-11 rounded-xl border-white/10 bg-white/5"
                  />
                </div>

                {!currentUser ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sign in to save this product, track price drops, and build personalized recommendations.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Source Comparison</h2>
              </div>

              <div className="mt-5 space-y-3">
                {product.sources.length > 0 ? (
                  product.sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/15 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{source.source.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {source.stockStatus} - reliability {(source.source.reliability * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black">{formatPrice(source.price)}</span>
                        <AffiliateButton
                          productId={product.id}
                          sourceAgent="ProductPage"
                          sourceId={source.sourceId}
                          className="rounded-xl px-4"
                        >
                          <span className="flex items-center gap-2">
                            Open
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </AffiliateButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">
                    No active sources attached to this product yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Related Picks</h2>
            {relatedProducts.length >= 2 ? (
              <Button asChild variant="outline" className="border-white/10 bg-white/5">
                <Link href={`/compare?ids=${product.id},${relatedProducts[0].id}`}>Compare with top alternative</Link>
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((related) => {
              const relatedBestSource = related.sources[0];

              return (
                <article key={related.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{related.category}</p>
                  <h3 className="mt-2 text-xl font-bold">{related.title}</h3>
                  <p className="mt-3 min-h-[48px] text-sm text-muted-foreground">
                    {related.description || "Available in the live catalog and ready for comparison."}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black">{formatPrice(relatedBestSource?.price ?? null)}</p>
                      <p className="text-xs text-muted-foreground">{relatedBestSource?.source.name ?? "No source yet"}</p>
                    </div>
                    <Button asChild className="rounded-xl">
                      <Link href={`/product/${related.id}`}>View</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
