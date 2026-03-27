import { NextResponse } from "next/server";
import { z } from "zod";
import { generateComparisonVerdict } from "@/lib/ai";
import { buildCacheKey, getCachedJson, setCachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const comparePayloadSchema = z.object({
  productIds: z.array(z.string().min(1)).min(2).max(4),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const parsedPayload = comparePayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid compare payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productIds } = parsedPayload.data;
    const normalizedIds = [...productIds].sort().join(",");
    const cacheKey = buildCacheKey("compare", normalizedIds);
    const cachedPayload = await getCachedJson<{
      success: boolean;
      products: Array<Record<string, unknown>>;
      comparisonMatrix: Record<string, Record<string, string | number | string[] | null>>;
      comparison_matrix: Record<string, Record<string, string | number | string[] | null>>;
      aiVerdict: string;
      ai_verdict: string;
      recommendedProductId: string;
      recommended_product_id: string;
    }>(cacheKey);

    if (cachedPayload) {
      return NextResponse.json(cachedPayload);
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        sources: {
          where: { stockStatus: { not: "OUT_OF_STOCK" } },
          include: {
            source: {
              select: { name: true },
            },
          },
          orderBy: [{ price: "asc" }],
        },
      },
    });

    if (products.length < 2) {
      return NextResponse.json({ error: "Provide at least two valid product IDs to compare." }, { status: 404 });
    }

    const matrix = Object.fromEntries(
      products.map((product) => {
        const bestSource = product.sources[0];

        return [
          product.title,
          {
            category: product.category,
            rating: product.rating ?? 0,
            bestPrice: bestSource?.price ?? null,
            bestSource: bestSource?.source.name ?? null,
            stockStatus: bestSource?.stockStatus ?? "UNKNOWN",
            tags: product.tags.slice(0, 6),
          },
        ];
      }),
    );

    const pricedProducts = products
      .map((product) => {
        const bestSource = product.sources[0];
        const bestPrice = bestSource?.price ?? null;
        const rating = product.rating ?? 0;
        const valueScore = bestPrice === null ? Number.NEGATIVE_INFINITY : rating * 18 - bestPrice / 8;

        return {
          id: product.id,
          title: product.title,
          rating,
          bestPrice,
          valueScore,
        };
      })
      .filter((product) => product.bestPrice !== null);

    const cheapest = [...pricedProducts].sort((a, b) => a.bestPrice - b.bestPrice)[0];
    const topRated = [...pricedProducts].sort((a, b) => b.rating - a.rating)[0];
    const bestValue = [...pricedProducts].sort((a, b) => b.valueScore - a.valueScore)[0] ?? cheapest ?? topRated;

    const verdictLines: string[] = [];
    if (topRated) {
      verdictLines.push(`${topRated.title} has the strongest rating profile.`);
    }
    if (cheapest) {
      verdictLines.push(`${cheapest.title} is currently the lowest-price option.`);
    }
    if (bestValue) {
      verdictLines.push(`Best value pick: ${bestValue.title}.`);
    }

    const productCards = products.map((product) => {
      const bestSource = product.sources[0];

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        imageUrl: product.imageUrl,
        category: product.category,
        rating: product.rating ?? 0,
        bestPrice: bestSource?.price ?? null,
        bestSource: bestSource?.source.name ?? null,
        stockStatus: bestSource?.stockStatus ?? "UNKNOWN",
        tags: product.tags.slice(0, 6),
      };
    });

    const aiVerdict = await generateComparisonVerdict(
      productCards.map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        rating: product.rating,
        bestPrice: product.bestPrice,
        bestSource: product.bestSource,
        tags: product.tags,
      })),
    );
    const resolvedVerdict = aiVerdict?.verdict ?? verdictLines.join(" ");
    const resolvedRecommendedId = aiVerdict?.recommendedProductId ?? bestValue?.id ?? products[0].id;

    const responsePayload = {
      success: true,
      products: productCards,
      comparisonMatrix: matrix,
      comparison_matrix: matrix,
      aiVerdict: resolvedVerdict,
      ai_verdict: resolvedVerdict,
      recommendedProductId: resolvedRecommendedId,
      recommended_product_id: resolvedRecommendedId,
    };

    const compareTtl = Number(process.env.COMPARE_CACHE_TTL_SECONDS || 300);
    await setCachedJson(cacheKey, responsePayload, Number.isFinite(compareTtl) ? compareTtl : 300);

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("[COMPARE_API_ERROR]", err);
    return NextResponse.json({ error: "Comparison failed." }, { status: 500 });
  }
}
