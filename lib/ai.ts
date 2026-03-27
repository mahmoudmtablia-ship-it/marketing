import { z } from "zod";

export const searchIntentSchema = z.object({
  intent: z.string().default("research"),
  extracted_categories: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  price: z
    .object({
      max: z.number().nullable().default(null),
      currency: z.string().default("USD"),
    })
    .default({ max: null, currency: "USD" }),
  suggested_action: z.string().default("expand_search"),
  sentiment: z.string().default("exploratory"),
});

const comparisonVerdictSchema = z.object({
  verdict: z.string().min(1),
  recommendedProductId: z.string().nullable().default(null),
});

const shoppingAssistantReplySchema = z.object({
  reply: z.string().min(1),
  recommendedProductIds: z.array(z.string()).default([]),
});

type SearchIntent = z.infer<typeof searchIntentSchema>;

type CompareProductInput = {
  id: string;
  title: string;
  category: string;
  rating: number;
  bestPrice: number | null;
  bestSource: string | null;
  tags: string[];
};

function extractBudget(query: string): number | null {
  const match = query.match(/(?:under|below|less than|<=?)\s*\$?(\d{1,6})/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function heuristicSearchIntent(query: string): SearchIntent {
  const normalizedQuery = query.toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 2);
  const categories = [
    "audio",
    "headphones",
    "running shoes",
    "shoes",
    "wearables",
    "accessories",
    "home appliances",
  ].filter((category) => normalizedQuery.includes(category));

  return {
    intent: /(buy|best|deal|under|cheap|price)/i.test(query) ? "purchase" : "research",
    extracted_categories: categories,
    features: tokens,
    price: {
      max: extractBudget(query),
      currency: "USD",
    },
    suggested_action: categories.length > 0 ? "compare_prices" : "expand_search",
    sentiment: tokens.length > 2 ? "high_intent" : "exploratory",
  };
}

function getProviderConfig() {
  if (process.env.OPENAI_API_KEY) {
    return {
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    };
  }

  return null;
}

async function callJsonModel(systemPrompt: string, userPrompt: string) {
  const provider = getProviderConfig();
  if (!provider) {
    return null;
  }

  try {
    const response = await fetch(provider.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[AI_PROVIDER_ERROR]", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    console.error("[AI_FETCH_ERROR]", error);
    return null;
  }
}

export async function inferSearchIntent(query: string) {
  const aiPayload = await callJsonModel(
    [
      "You are an ecommerce search intent parser.",
      "Return only JSON with these keys:",
      "intent, extracted_categories, features, price, suggested_action, sentiment.",
      "price must be an object with max and currency.",
    ].join(" "),
    `Parse this shopping query: ${query}`,
  );

  if (!aiPayload) {
    return heuristicSearchIntent(query);
  }

  const parsed = searchIntentSchema.safeParse(aiPayload);
  return parsed.success ? parsed.data : heuristicSearchIntent(query);
}

export async function generateComparisonVerdict(products: CompareProductInput[]) {
  const aiPayload = await callJsonModel(
    [
      "You compare ecommerce products.",
      "Return only JSON with keys verdict and recommendedProductId.",
      "The verdict must be concise and decision-oriented.",
      "recommendedProductId must be one of the provided product ids or null.",
    ].join(" "),
    `Compare these products and pick the best value:\n${JSON.stringify(products)}`,
  );

  if (!aiPayload) {
    return null;
  }

  const parsed = comparisonVerdictSchema.safeParse(aiPayload);
  return parsed.success ? parsed.data : null;
}

export async function generateShoppingAssistantReply(
  message: string,
  products: Array<{
    id: string;
    title: string;
    category: string;
    description: string | null;
    bestPrice: number | null;
    bestSource: string | null;
    tags: string[];
  }>,
) {
  const aiPayload = await callJsonModel(
    [
      "You are an ecommerce shopping assistant.",
      "Return only JSON with keys reply and recommendedProductIds.",
      "The reply must be concise, specific, and grounded in the provided catalog products.",
      "recommendedProductIds must contain zero to three product ids from the provided products.",
    ].join(" "),
    `User message: ${message}\nCatalog matches: ${JSON.stringify(products)}`,
  );

  if (!aiPayload) {
    return null;
  }

  const parsed = shoppingAssistantReplySchema.safeParse(aiPayload);
  return parsed.success ? parsed.data : null;
}
