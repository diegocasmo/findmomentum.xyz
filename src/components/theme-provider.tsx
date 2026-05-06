"use client";

import * as React from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme-mode";
const COOKIE_KEY = "theme";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const ThemeContext = React.createContext<{
  setTheme: (mode: ThemeMode) => void;
} | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  document.cookie = `${COOKIE_KEY}=${resolved}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

function readMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>("system");

  React.useEffect(() => {
    const intent = readMode();
    setMode(intent);
    applyTheme(intent === "system" ? getSystemTheme() : intent);
  }, []);

  React.useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(mql.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode]);

  const setTheme = React.useCallback((next: ThemeMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next === "system" ? getSystemTheme() : next);
  }, []);

  return (
    <ThemeContext.Provider value={{ setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
