import Link from "next/link";
import { History, Heart, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

async function getDashboardData() {
  try {
    const session = await getServerAuthSession();
    const email = session?.user?.email ?? undefined;
    const dbUser = email
      ? await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true },
        })
      : null;

    const userId = dbUser?.id;

    const [alertsCount, favoritesCount, wallet, historyCount, recentHistory, fallbackProduct] = await Promise.all([
      userId ? prisma.priceAlert.count({ where: { userId, isActive: true } }) : Promise.resolve(0),
      userId ? prisma.favorite.count({ where: { userId } }) : Promise.resolve(0),
      userId
        ? prisma.wallet.findUnique({
            where: { userId },
            select: { totalEarned: true, availableBalance: true, pendingBalance: true },
          })
        : Promise.resolve(null),
      userId ? prisma.browsingHistory.count({ where: { userId } }) : Promise.resolve(0),
      userId
        ? prisma.browsingHistory.findMany({
            where: { userId },
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                },
              },
            },
            orderBy: { viewedAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      prisma.product.findFirst({
        include: {
          sources: {
            where: { stockStatus: { not: "OUT_OF_STOCK" } },
            include: { source: { select: { name: true } } },
            orderBy: [{ price: "asc" }],
          },
        },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    let recommendation = fallbackProduct;

    if (recentHistory[0]) {
      const recentCategory = recentHistory[0].product.category;
      const recentProductId = recentHistory[0].product.id;

      const personalizedProduct = await prisma.product.findFirst({
        where: {
          id: { not: recentProductId },
          category: recentCategory,
        },
        include: {
          sources: {
            where: { stockStatus: { not: "OUT_OF_STOCK" } },
            include: { source: { select: { name: true } } },
            orderBy: [{ price: "asc" }],
          },
        },
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      });

      if (personalizedProduct) {
        recommendation = personalizedProduct;
      }
    }

    return {
      ok: true as const,
      sessionName: session?.user?.name ?? dbUser?.name ?? "shopper",
      hasDbUser: Boolean(dbUser),
      alertsCount,
      favoritesCount,
      wallet,
      historyCount,
      recentHistory,
      recommendation,
    };
  } catch (error) {
    console.error("[DASHBOARD_PAGE_ERROR]", error);
    return {
      ok: false as const,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data.ok) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
        Dashboard data is unavailable right now. Check `DATABASE_URL`, run your Prisma migration, then reload the page.
      </div>
    );
  }

  const bestSource = data.recommendation?.sources[0];
  const recommendationCopy = data.recommendation
    ? `${data.recommendation.title} is the strongest next candidate in ${data.recommendation.category}${
        bestSource?.price != null
          ? `, currently starting at ${formatCurrency(bestSource.price)} from ${bestSource?.source.name ?? "an active source"}.`
          : ". Pricing data will appear as soon as a live source is attached."
      }`
    : "Once products are seeded, we will surface the next best move here based on your browsing history.";
  const recommendationHref =
    data.recommendation && data.recentHistory[0]
      ? `/compare?ids=${data.recentHistory[0].product.id},${data.recommendation.id}`
      : data.recommendation
        ? `/search?q=${encodeURIComponent(data.recommendation.category)}`
        : "/search";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {data.sessionName}.</h1>
          <p className="mt-1 text-muted-foreground">Here is the latest live activity from your shopping workspace.</p>
        </div>
      </header>

      {!data.hasDbUser ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          You are signed in through the bootstrap auth flow. Personalized dashboard metrics will fill in automatically
          once your seeded database user shares the same email.
        </div>
      ) : null}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex gap-4">
          <Sparkles className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">AI Recommendation Agent</h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {recommendationCopy}
            </p>
            <Button asChild className="mt-4">
              <Link href={recommendationHref}>{data.recommendation ? "Open Recommendation" : "Browse Catalog"}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Active Price Alerts</h3>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold">{data.alertsCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Cashback Earned</h3>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(data.wallet?.totalEarned ?? 0)}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Available: {formatCurrency(data.wallet?.availableBalance ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Recent Views</h3>
            <History className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold">{data.historyCount}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Saved Products</h3>
            <Heart className="h-4 w-4 text-pink-400" />
          </div>
          <div className="text-3xl font-bold">{data.favoritesCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Button variant="ghost" asChild>
            <Link href="/search">Explore more products</Link>
          </Button>
        </div>

        {data.recentHistory.length > 0 ? (
          <div className="mt-4 space-y-3">
            {data.recentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/10 p-4 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-medium">{entry.product.title}</p>
                  <p className="text-sm text-muted-foreground">{entry.product.category}</p>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:mt-0">
                  {entry.viewedAt.toLocaleDateString("en-US")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
            No browsing history yet. Search the catalog to start building personalized recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
