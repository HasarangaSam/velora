import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisInstance() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    // Suppress unhandled redis errors in background
    console.warn("Redis client warning:", err?.message || err);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisInstance();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Check and record rate limit counter using atomic Redis commands.
 * Used for checkout limits and security throttling.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60,
): Promise<{ success: boolean; remaining: number }> {
  try {
    const key = `ratelimit:${identifier}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: limit - current };
  } catch (error) {
    // If Redis is unreachable, fail-open so users aren't locked out of the app
    console.warn("Rate limit check failed, failing open:", error);
    return { success: true, remaining: limit };
  }
}
