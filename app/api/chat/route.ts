import { NextResponse } from "next/server";
import { z } from "zod";
import { generateShoppingAssistantReply, inferSearchIntent } from "@/lib/ai";
import { buildCacheKey, getCachedJson, setCachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const chatPayloadSchema = z.object({
  message: z.string().trim().min(2).max(300),
});

function formatPrice(value: number | null) {
  if (value === null) {
    return "price pending";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function buildFallbackReply(
  message: string,
  suggestions: Array<{
    id: string;
    title: string;
    category: string;
    price: number | null;
    source: string | null;
  }>,
) {
  if (suggestions.length === 0) {
    return `I could not find a direct catalog match for "${message}" yet. Try a broader category, a different budget, or open search for a wider scan.`;
  }

  const [topMatch, secondMatch] = suggestions;
  const lead = `${topMatch.title} looks like the strongest match right now at ${formatPrice(topMatch.price)}${topMatch.source ? ` from ${topMatch.source}` : ""}.`;

  if (!secondMatch) {
    return `${lead} I surfaced the best catalog option I found, and you can open it for a deeper comparison.`;
  }

  return `${lead} I also found ${secondMatch.title} as an alternative in ${secondMatch.category}, so you can compare value before buying.`;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json().catch(() => null);
    const parsedPayload = chatPayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid chat payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { message } = parsedPayload.data;
    const normalizedMessage = message.toLowerCase();
    const cacheKey = buildCacheKey("chat", normalizedMessage);
    const cachedPayload = await getCachedJson<{
      success: boolean;
      reply: string;
      suggestions: Array<{
        id: string;
        title: string;
        category: string;
        price: number | null;
        source: string | null;
      }>;
    }>(cacheKey);

    if (cachedPayload) {
      return NextResponse.json(cachedPayload);
    }

    const aiIntent = await inferSearchIntent(message);
    const messageTokens = normalizedMessage.split(/\s+/).filter((token) => token.length > 2);
    const aiCategories = aiIntent.extracted_categories.map((value) => value.toLowerCase());
    const aiFeatures = aiIntent.features.map((value) => value.toLowerCase());
    const combinedTokens = Array.from(new Set([...messageTokens, ...aiCategories, ...aiFeatures]));
    const budget = aiIntent.price.max;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: "insensitive" } },
          { description: { contains: message, mode: "insensitive" } },
          { category: { contains: message, mode: "insensitive" } },
          ...(combinedTokens.length > 0 ? [{ tags: { hasSome: combinedTokens } }] : []),
          ...aiCategories.map((category) => ({
            category: { contains: category, mode: "insensitive" as const },
          })),
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
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ price: "asc" }],
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    const suggestions = products
      .map((product) => {
        const bestSource = product.sources[0];

        return {
          id: product.id,
          title: product.title,
          category: product.category,
          description: product.description,
          price: bestSource?.price ?? null,
          source: bestSource?.source.name ?? null,
          tags: product.tags.slice(0, 6),
        };
      })
      .filter((product) => product.price !== null);

    const aiReply = await generateShoppingAssistantReply(
      message,
      suggestions.map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        category: suggestion.category,
        description: suggestion.description,
        bestPrice: suggestion.price,
        bestSource: suggestion.source,
        tags: suggestion.tags,
      })),
    );

    const recommendedIds = new Set((aiReply?.recommendedProductIds ?? []).slice(0, 3));
    const orderedSuggestions = suggestions.sort((a, b) => {
      const aRank = recommendedIds.has(a.id) ? 0 : 1;
      const bRank = recommendedIds.has(b.id) ? 0 : 1;
      return aRank - bRank;
    });

    const responsePayload = {
      success: true,
      reply: aiReply?.reply ?? buildFallbackReply(message, orderedSuggestions),
      suggestions: orderedSuggestions.map(({ id, title, category, price, source }) => ({
        id,
        title,
        category,
        price,
        source,
      })),
    };

    await setCachedJson(cacheKey, responsePayload, 180);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[CHAT_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Chat assistant failed." }, { status: 500 });
  }
}
