import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Validates if a string is a valid IANA timezone identifier
 * by attempting to use it with date-fns-tz
 */
export function isValidTimezone(timezone: string | undefined): boolean {
  if (!timezone) {
    return false;
  }

  // IANA timezones typically follow patterns like:
  // - Continent/City (e.g., "America/New_York")
  // - Area/Location (e.g., "Europe/London")
  // - Etc/GMT+X or Etc/GMT-X
  // - UTC
  const validFormat = /^([A-Za-z_]+)(\/[A-Za-z_]+)*(\/[A-Za-z0-9_+-]+)?$/;

  if (!validFormat.test(timezone)) {
    return false;
  }

  try {
    // If this works, the timezone is valid
    formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
    return true;
  } catch {
    return false;
  }
}

export async function getUserTimezone(): Promise<string> {
  if (typeof window === "undefined") {
    // Server-side: Get timezone from cookie
    const cookieStore = await cookies();
    const userTimezone = cookieStore.get("user-timezone")?.value;

    if (!isValidTimezone(userTimezone)) {
      console.warn(
        `Invalid timezone detected: ${userTimezone}. Defaulting to UTC.`
      );
      return "UTC";
    }

    return userTimezone || "UTC";
  }

  // Client-side: Get timezone from browser
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error("Error getting timezone:", error);
    return "UTC";
  }
}
