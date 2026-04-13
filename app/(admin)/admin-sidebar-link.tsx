"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AdminSidebarLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function AdminSidebarLink({
  href,
  label,
  icon: Icon,
  exact = false,
}: AdminSidebarLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
      {label}
    </Link>
  );
}
