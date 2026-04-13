"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Car,
  Bell,
  FileText,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const navLinks = [
  { href: "/garage", labelKey: "nav.garage", fallback: "Garage", icon: Car },
  { href: "/reminders", labelKey: "nav.reminders", fallback: "Reminders", icon: Bell },
  { href: "/documents", labelKey: "nav.documents", fallback: "Documents", icon: FileText },
] as const;

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "User"}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
      />
    );
  }
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold ring-2 ring-white/20">
      {initials}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isAuthenticated = status === "authenticated";

  function handleSignOut() {
    setDropdownOpen(false);
    signOut({ callbackUrl: "/" });
  }

  return (
    <header className="nav-dark sticky top-0 z-50 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/garage"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500 group-hover:bg-blue-400 transition-colors">
            <Car className="h-5 w-5 text-white" />
          </span>
          <span className="hidden sm:inline font-bold text-lg text-white tracking-tight">
            Vehicle Passport
          </span>
          <span className="sm:hidden font-bold text-lg text-white">VP</span>
        </Link>

        {/* Desktop nav links (authenticated) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(({ href, labelKey, fallback, icon: Icon }) => {
              const active = pathname.startsWith(href);
              const label = t(labelKey) !== labelKey ? t(labelKey) : fallback;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-md",
                    active
                      ? "text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language switcher — always visible */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
          ) : isAuthenticated ? (
            /* User dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar
                  name={session.user?.name}
                  image={session.user?.image}
                />
                <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
                  {session.user?.name ?? session.user?.email}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-white/60 transition-transform hidden sm:block",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-2 w-52 z-20 rounded-lg border border-border bg-popover shadow-xl py-1 text-popover-foreground">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <UserAvatar name={session.user?.name} image={session.user?.image} />
                      {t("nav.profile") !== "nav.profile" ? t("nav.profile") : "Profile"}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {t("nav.settings") !== "nav.settings" ? t("nav.settings") : "Settings"}
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.signOut") !== "nav.signOut" ? t("nav.signOut") : "Sign out"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Unauthenticated buttons */
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-1.5 rounded-md bg-blue-500 text-white px-3 py-2 text-sm font-medium hover:bg-blue-400 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center rounded-md p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[hsl(var(--navy))] px-4 py-3 space-y-1">
          {/* Language switcher in mobile menu */}
          <div className="pb-2 border-b border-white/10 mb-2">
            <LanguageSwitcher />
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 py-2 px-1 mb-2 border-b border-white/10">
                <UserAvatar
                  name={session?.user?.name}
                  image={session?.user?.image}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              {navLinks.map(({ href, labelKey, fallback, icon: Icon }) => {
                const active = pathname.startsWith(href);
                const label = t(labelKey) !== labelKey ? t(labelKey) : fallback;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-500 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t("nav.settings") !== "nav.settings" ? t("nav.settings") : "Settings"}
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("nav.signOut") !== "nav.signOut" ? t("nav.signOut") : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-blue-500 text-white px-3 py-2.5 text-sm font-medium hover:bg-blue-400 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
