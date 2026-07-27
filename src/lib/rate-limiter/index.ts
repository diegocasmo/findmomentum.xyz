import { headers } from "next/headers";

interface RateLimitWindow {
  count: number;
  startTime: number;
}

const rateLimitStore = new Map<string, RateLimitWindow>();

export interface RateLimitConfig {
  limit: number;
  window: number; // in milliseconds
}

export async function rateLimit(
  action: string,
  config: RateLimitConfig
): Promise<boolean> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const key = `rate-limit:${action}:${ip}`;

  const now = Date.now();
  const windowData = rateLimitStore.get(key) || { count: 0, startTime: now };

  if (now - windowData.startTime > config.window) {
    windowData.count = 0;
    windowData.startTime = now;
  }

  windowData.count++;
  rateLimitStore.set(key, windowData);

  return windowData.count <= config.limit;
}
