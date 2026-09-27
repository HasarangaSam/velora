import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { redis } from "@/lib/redis";

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_EMAIL_FAILURE_LIMIT = 20;
const LOGIN_IP_FAILURE_LIMIT = 60;
const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
return current
`;

function getHashSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return "velora-development-only-auth-secret";
  throw new Error("AUTH_SECRET is required for authentication security operations.");
}

export function hashAuthValue(value: string, purpose: string) {
  return createHmac("sha256", getHashSecret())
    .update(`${purpose}:${value}`)
    .digest("hex");
}

export function safeDigestEqual(left: string, right: string) {
  if (!/^[\da-f]{64}$/i.test(left) || !/^[\da-f]{64}$/i.test(right)) return false;
  const leftBytes = Buffer.from(left, "hex");
  const rightBytes = Buffer.from(right, "hex");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

/**
 * Trust Vercel's overwritten client-IP header on Vercel. Self-hosted installs
 * must name a header that their reverse proxy overwrites, rather than trusting
 * a caller-controlled X-Forwarded-For value.
 */
export function getTrustedClientIp(requestHeaders: Pick<globalThis.Headers, "get">) {
  const validIp = (value: string | null) => {
    const address = value?.split(",")[0]?.trim();
    return address && isIP(address) ? address : null;
  };

  if (process.env.VERCEL) {
    return validIp(requestHeaders.get("x-forwarded-for"));
  }

  const configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (configuredHeader && /^[a-z0-9-]+$/.test(configuredHeader)) {
    return validIp(requestHeaders.get(configuredHeader));
  }

  return process.env.NODE_ENV === "development" ? "local-development" : null;
}

function redisKey(scope: string, value: string) {
  return `security:${scope}:${hashAuthValue(value, `rate-limit:${scope}`)}`;
}

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

export async function consumeSensitiveRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  try {
    const count = Number(await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      redisKey(scope, identifier),
      windowSeconds,
    ));
    return Number.isFinite(count) && count <= limit;
  } catch {
    console.warn(`Sensitive rate limit unavailable for ${scope}.`);
    return isDevelopment();
  }
}

function loginFailureKeys(email: string, ip?: string | null) {
  const keys = [redisKey("login-email", email)];
  if (ip) keys.push(redisKey("login-ip", ip));
  return keys;
}

export async function canAttemptCredentialLogin(email: string, ip?: string | null) {
  try {
    const keys = loginFailureKeys(email, ip);
    const counts = await redis.mget(...keys);
    const emailCount = Number(counts[0] ?? 0);
    const ipCount = ip ? Number(counts[1] ?? 0) : 0;
    return emailCount < LOGIN_EMAIL_FAILURE_LIMIT && ipCount < LOGIN_IP_FAILURE_LIMIT;
  } catch {
    console.warn("Credential sign-in throttling is unavailable.");
    return isDevelopment();
  }
}

export async function recordCredentialLoginFailure(email: string, ip?: string | null) {
  try {
    const keys = loginFailureKeys(email, ip);
    for (const key of keys) {
      await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        key,
        LOGIN_WINDOW_SECONDS,
      );
    }
  } catch {
    console.warn("Could not record a failed credential sign-in attempt.");
  }
}

export async function clearCredentialLoginFailures(email: string) {
  try {
    await redis.del(redisKey("login-email", email));
  } catch {
    // A successful sign-in should not be blocked just because a counter could
    // not be cleared. Its TTL will expire the old failures automatically.
    console.warn("Could not clear credential sign-in failures.");
  }
}
