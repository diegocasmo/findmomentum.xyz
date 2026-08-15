import { createRootErrors } from "@/lib/utils/form";
import { rateLimit, type RateLimitConfig } from "@/lib/rate-limiter";
import type { ActionResult } from "@/types";

export function withRateLimit<
  TArgs extends unknown[],
  TResult extends ActionResult
>(
  action: (...args: TArgs) => Promise<TResult>,
  actionName: string,
  config: RateLimitConfig
) {
  return async function rateLimitedAction(...args: TArgs): Promise<TResult> {
    const isAllowed = await rateLimit(actionName, config);

    if (!isAllowed) {
      return {
        success: false,
        errors: createRootErrors("Too many requests. Please try again later."),
      } as TResult;
    }

    return action(...args);
  };
}
