import { NextResponse } from "next/server";
import { z } from "zod";
import { inferSearchIntent } from "@/lib/ai";
import { buildCacheKey, getCachedJson, setCachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const searchPayloadSchema = z.object({
  query: z.string().trim().min(2).max(200),
  userId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const payload = await req.json().catch(() => null);
    const parsedPayload = searchPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid search payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { query } = parsedPayload.data;
    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 2);
    const cacheKey = buildCacheKey("search", normalizedQuery);
    const cachedPayload = await getCachedJson<{
      success: boolean;
      cacheHit: boolean;
      latencyMs: number;
      agentProcessing: {
        intent: string;
        extracted_categories: string[];
        features: string[];
        price: { max: number | null; currency: string };
        suggested_action: string;
        sentiment: string;
      };
      agent_processing: {
        intent: string;
        extracted_categories: string[];
        features: string[];
        price: { max: number | null; currency: string };
        suggested_action: string;
        sentiment: string;
      };
      results: Array<Record<string, unknown>>;
      message: string;
    }>(cacheKey);

    if (cachedPayload) {
      return NextResponse.json({
        ...cachedPayload,
        cacheHit: true,
        latencyMs: Date.now() - startedAt,
      });
    }

    const aiIntent = await inferSearchIntent(query);
    const aiCategories = aiIntent.extracted_categories.map((value) => value.toLowerCase());
    const aiFeatures = aiIntent.features.map((value) => value.toLowerCase());
    const combinedTokens = Array.from(new Set([...queryTokens, ...aiFeatures]));
    const budget = aiIntent.price.max;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          ...(combinedTokens.length > 0 ? [{ tags: { hasSome: combinedTokens } }] : []),
          ...(aiCategories.length > 0
            ? aiCategories.map((category) => ({
                category: { contains: category, mode: "insensitive" as const },
              }))
            : []),
        ],
      },
      include: {
        sources: {
          where: {
            stockStatus: { not: "OUT_OF_STOCK" },
            ...(budget ? { price: { lte: budget } } : {}),
          },
          include: {
            source: {
              select: { name: true },
            },
          },
          orderBy: [{ price: "asc" }],
        },
      },
      take: 24,
    });

    const results = products
      .map((product) => {
        const bestSource = product.sources[0];
        const lowerTitle = product.title.toLowerCase();
        const lowerCategory = product.category.toLowerCase();
        const tagSet = new Set(product.tags.map((tag) => tag.toLowerCase()));
        const titleMatches = combinedTokens.filter((token) => lowerTitle.includes(token)).length;
        const categoryMatches = [...combinedTokens, ...aiCategories].filter((token) => lowerCategory.includes(token)).length;
        const tagMatches = combinedTokens.filter((token) => tagSet.has(token)).length;

        const score = Math.min(
          99,
          Math.round(55 + titleMatches * 14 + categoryMatches * 10 + tagMatches * 8 + (product.rating ?? 0)),
        );

        return {
          id: product.id,
          name: product.title,
          category: product.category,
          description: product.description,
          imageUrl: product.imageUrl,
          price: bestSource?.price ?? null,
          source: bestSource?.source.name ?? null,
          stockStatus: bestSource?.stockStatus ?? null,
          affiliateUrl: bestSource?.url ?? null,
          score,
          tags: product.tags,
        };
      })
      .filter((item) => item.price !== null)
      .sort((a, b) => (b.score === a.score ? (a.price ?? 0) - (b.price ?? 0) : b.score - a.score));

    const agentExtraction = {
      ...aiIntent,
      extracted_categories:
        aiIntent.extracted_categories.length > 0
          ? aiIntent.extracted_categories
          : Array.from(new Set(results.map((item) => item.category))).slice(0, 3),
      features: combinedTokens,
      suggested_action: results.length > 1 ? "compare_prices" : aiIntent.suggested_action,
      sentiment: results.length > 0 ? aiIntent.sentiment : "exploratory",
    };

    const responsePayload = {
      success: true,
      cacheHit: false,
      latencyMs: Date.now() - startedAt,
      agentProcessing: agentExtraction,
      agent_processing: agentExtraction,
      results,
      message: "Search Agent processed and ranked products from the catalog.",
    };

    const searchTtl = Number(process.env.SEARCH_CACHE_TTL_SECONDS || 300);
    await setCachedJson(cacheKey, responsePayload, Number.isFinite(searchTtl) ? searchTtl : 300);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[SEARCH_AGENT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
