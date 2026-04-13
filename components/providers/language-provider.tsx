"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Locale } from "@/lib/i18n";

// ─── Context shape ────────────────────────────────────────────────────────────

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("locale="));
  const value = match?.split("=")[1];
  return value === "hr" ? "hr" : "en";
}

function setCookieLocale(locale: Locale) {
  // 1 year expiry, SameSite=Lax, no HttpOnly (needs to be readable client-side)
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `locale=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface LanguageProviderProps {
  children: ReactNode;
  /**
   * Optional initial locale. When provided (e.g. read server-side from the
   * request cookie), avoids a flash on first render. Falls back to reading
   * the cookie on the client when omitted.
   */
  initialLocale?: Locale;
}

export function LanguageProvider({
  children,
  initialLocale,
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? getInitialLocale
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookieLocale(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale][key] ?? translations["en"][key] ?? key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
