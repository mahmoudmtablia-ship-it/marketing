const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function isCacheConfigured() {
  return Boolean(redisUrl && redisToken);
}

async function runRedisCommand<T>(command: Array<string | number>) {
  if (!isCacheConfigured()) {
    return null;
  }

  try {
    const response = await fetch(redisUrl as string, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[UPSTASH_COMMAND_ERROR]", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as { result?: T };
    return payload.result ?? null;
  } catch (error) {
    console.error("[UPSTASH_FETCH_ERROR]", error);
    return null;
  }
}

export function buildCacheKey(namespace: string, key: string) {
  return `${namespace}:${key}`;
}

export async function getCachedJson<T>(key: string) {
  const result = await runRedisCommand<string>(["GET", key]);

  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result) as T;
  } catch (error) {
    console.error("[CACHE_PARSE_ERROR]", error);
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number) {
  return runRedisCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
}

export { isCacheConfigured };
