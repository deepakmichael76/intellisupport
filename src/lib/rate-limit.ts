import { RateLimiterMemory } from "rate-limiter-flexible";

const limiters = new Map<string, RateLimiterMemory>();

function getLimiter(key: string, points: number, duration: number) {
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new RateLimiterMemory({ points, duration })
    );
  }
  return limiters.get(key)!;
}

export async function rateLimit(
  identifier: string,
  type: "auth" | "chat" | "api" = "api"
): Promise<{ success: boolean; retryAfter?: number }> {
  const config = {
    auth: { points: 10, duration: 60 },
    chat: { points: 30, duration: 60 },
    api: { points: 60, duration: 60 },
  }[type];

  const limiter = getLimiter(type, config.points, config.duration);

  try {
    await limiter.consume(identifier);
    return { success: true };
  } catch (rej) {
    const retryAfter = Math.ceil((rej as { msBeforeNext?: number }).msBeforeNext! / 1000);
    return { success: false, retryAfter };
  }
}
