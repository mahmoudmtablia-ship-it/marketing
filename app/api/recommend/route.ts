import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;

    const history = userId
      ? await prisma.browsingHistory.findMany({
          where: { userId },
          include: {
            product: {
              select: { id: true, category: true, tags: true },
            },
          },
          orderBy: { viewedAt: "desc" },
          take: 30,
        })
      : [];

    const recentProductIds = Array.from(new Set(history.map((entry) => entry.productId)));

    const categoryScores = new Map<string, number>();
    history.forEach((entry) => {
      const current = categoryScores.get(entry.product.category) ?? 0;
      categoryScores.set(entry.product.category, current + 1);
    });

    const preferredCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const preferredProducts = await prisma.product.findMany({
      where: {
        id: { notIn: recentProductIds },
        ...(preferredCategories.length > 0 ? { category: { in: preferredCategories } } : {}),
      },
      include: {
        sources: {
          where: { stockStatus: { not: "OUT_OF_STOCK" } },
          include: {
            source: { select: { name: true } },
          },
          orderBy: [{ price: "asc" }],
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 12,
    });

    const fallbackProducts =
      preferredProducts.length > 0
        ? []
        : await prisma.product.findMany({
            include: {
              sources: {
                where: { stockStatus: { not: "OUT_OF_STOCK" } },
                include: {
                  source: { select: { name: true } },
                },
                orderBy: [{ price: "asc" }],
              },
            },
            orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
            take: 12,
          });

    const productPool = preferredProducts.length > 0 ? preferredProducts : fallbackProducts;

    const recommendations = productPool
      .map((product) => {
        const bestSource = product.sources[0];
        const categoryAffinity = preferredCategories.includes(product.category) ? 12 : 0;
        const baseScore = Math.round(Math.min(99, 68 + (product.rating ?? 0) * 5 + categoryAffinity));

        const reason =
          preferredCategories.length > 0 && preferredCategories.includes(product.category)
            ? `Because you often explore ${product.category} products`
            : "Trending across the marketplace right now";

        return {
          id: product.id,
          title: product.title,
          matchScore: baseScore,
          reason,
          price: bestSource?.price ?? null,
          source: bestSource?.source.name ?? null,
          category: product.category,
        };
      })
      .filter((item) => item.price !== null)
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      agent: "Recommendation Engine",
      userProfile: {
        userId: userId ?? null,
        preferredCategories,
        recentlyViewedCount: history.length,
      },
      recommendations,
    });
  } catch (err) {
    console.error("[RECOMMEND_API_ERROR]", err);
    return NextResponse.json({ error: "Recommendation failed." }, { status: 500 });
  }
}
