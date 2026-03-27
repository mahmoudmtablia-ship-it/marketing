import { RevenueChart } from "@/components/RevenueChart";
import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

async function getAdminData() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [usersCount, productsCount, sourcesCount, wallets, clickAgents, totalClicks, recentWeekClicks, recentClicks] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.source.count(),
      prisma.wallet.findMany({
        select: {
          totalEarned: true,
        },
      }),
      prisma.click.findMany({
        select: {
          sourceAgent: true,
        },
      }),
      prisma.click.count(),
      prisma.click.count({
        where: {
          clickedAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.click.findMany({
        include: {
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { clickedAt: "desc" },
        take: 8,
      }),
    ]);

    const totalRevenue = wallets.reduce((sum, wallet) => sum + wallet.totalEarned, 0);

    const chartMap = new Map<string, number>();
    clickAgents.forEach((click) => {
      chartMap.set(click.sourceAgent, (chartMap.get(click.sourceAgent) ?? 0) + 1);
    });

    const chartData = Array.from(chartMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"][index % 6],
      }))
      .sort((a, b) => b.value - a.value);

    return {
      ok: true as const,
      usersCount,
      productsCount,
      sourcesCount,
      totalRevenue,
      totalClicks,
      recentWeekClicks,
      chartData,
      recentClicks,
    };
  } catch (error) {
    console.error("[ADMIN_PAGE_ERROR]", error);
    return {
      ok: false as const,
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminData();

  if (!data.ok) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
        Admin analytics are unavailable right now. Check database connectivity and Prisma setup, then reload.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="mt-1 text-slate-400">Live operational metrics from the affiliate marketplace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm">
            Search Agent Ops: {data.productsCount > 0 ? "Catalog ready" : "Waiting for seed data"}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm">
            Tracking: {data.totalClicks > 0 ? "Live clicks detected" : "No click events yet"}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total Revenue</p>
          <h3 className="mt-2 text-2xl font-semibold">{formatCurrency(data.totalRevenue)}</h3>
          <p className="mt-2 text-xs font-medium text-emerald-500">Across wallet payouts tracked so far</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total Users</p>
          <h3 className="mt-2 text-2xl font-semibold">{data.usersCount}</h3>
          <p className="mt-2 text-xs font-medium text-emerald-500">Registered marketplace accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Outbound Clicks</p>
          <h3 className="mt-2 text-2xl font-semibold">{data.totalClicks}</h3>
          <p className="mt-2 text-xs font-medium text-emerald-500">{data.recentWeekClicks} in the last 7 days</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Catalog Coverage</p>
          <h3 className="mt-2 text-2xl font-semibold">{data.productsCount}</h3>
          <p className="mt-2 text-xs font-medium text-indigo-400">{data.sourcesCount} connected sources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="font-medium text-slate-300">Click Volume by Source Agent</h3>
          {data.chartData.length > 0 ? (
            <RevenueChart data={data.chartData} mode="count" />
          ) : (
            <div className="flex h-72 items-center justify-center text-sm italic text-slate-500">
              No click events yet. Trigger a few affiliate redirects to populate analytics.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="font-medium text-slate-300">Recent Click Activity</h3>
          {data.recentClicks.length > 0 ? (
            <div className="mt-5 space-y-3">
              {data.recentClicks.map((click) => (
                <div
                  key={click.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-100">{click.product.title}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{click.sourceAgent}</p>
                  </div>
                  <p className="text-xs text-slate-400">{click.clickedAt.toLocaleDateString("en-US")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm italic text-slate-500">
              No outbound activity yet. Search and buy flows will start filling this stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
