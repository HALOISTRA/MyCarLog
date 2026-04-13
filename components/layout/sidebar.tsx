"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Car, Bell, FileText, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

const navItems = [
  { href: "/garage", labelKey: "nav.garage", fallback: "Garage", icon: Car },
  { href: "/reminders", labelKey: "nav.reminders", fallback: "Reminders", icon: Bell },
  { href: "/documents", labelKey: "nav.documents", fallback: "Documents", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", fallback: "Settings", icon: Settings },
] as const;

function useNavLabel(labelKey: string, fallback: string) {
  const { t } = useLanguage();
  const translated = t(labelKey);
  return translated !== labelKey ? translated : fallback;
}

/**
 * DesktopSidebar — dark navy sidebar for desktop (w-64). Hidden on mobile.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession();

  function handleSignOut() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 min-h-screen nav-dark border-r border-white/10">
      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 pt-6 flex-1" aria-label="Sidebar navigation">
        {navItems.map(({ href, labelKey, fallback, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const label = t(labelKey) !== labelKey ? t(labelKey) : fallback;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-white/60")}
                strokeWidth={active ? 2.5 : 1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info + sign out */}
      {session?.user && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
              {session.user.name
                ? session.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "?"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-white/50 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("nav.signOut") !== "nav.signOut" ? t("nav.signOut") : "Sign out"}
          </button>
        </div>
      )}
    </aside>
  );
}

/**
 * MobileSidebar — fixed bottom navigation bar for mobile. Hidden on desktop (md:hidden).
 * Shows icons only (max 5 items).
 */
export function MobileSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Mobile shows max 5 items (icons only)
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-[hsl(var(--navy))] safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch justify-around h-16">
        {mobileItems.map(({ href, labelKey, fallback, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const label = t(labelKey) !== labelKey ? t(labelKey) : fallback;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full px-1 transition-colors",
                  active ? "text-blue-400" : "text-white/50 hover:text-white"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={label}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full transition-colors",
                    active ? "bg-blue-500/20" : ""
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", active ? "text-blue-400" : "text-white/50")}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileSidebar;
