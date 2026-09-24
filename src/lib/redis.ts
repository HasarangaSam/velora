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

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Redis getCache failed for key ${key}:`, error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 60,
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, "EX", ttlSeconds);
  } catch (error) {
    console.warn(`Redis setCache failed for key ${key}:`, error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`Redis invalidateCachePattern failed for ${pattern}:`, error);
  }
}

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
