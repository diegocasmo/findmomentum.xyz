"use client";

import { useEffect } from "react";

export function SetTimezoneCookie() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    document.cookie = `user-timezone=${timezone}; path=/; SameSite=Lax`;
  }, []);

  return null;
}
