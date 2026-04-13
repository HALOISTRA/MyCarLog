"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="flex items-center gap-0 text-sm font-medium"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "px-2 py-1 rounded-l-md border border-border transition-colors",
          locale === "en"
            ? "bg-primary text-primary-foreground font-bold border-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        EN
      </button>

      <div className="w-px h-5 bg-border shrink-0" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setLocale("hr")}
        aria-pressed={locale === "hr"}
        className={cn(
          "px-2 py-1 rounded-r-md border border-border transition-colors",
          locale === "hr"
            ? "bg-primary text-primary-foreground font-bold border-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        HR
      </button>
    </div>
  );
}

export default LanguageSwitcher;
