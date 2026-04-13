import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  FileText,
  ArrowRightLeft,
  Link2,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { AdminSidebarLink } from "./admin-sidebar-link";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/plans", label: "Maintenance Plans", icon: Wrench },
  { href: "/admin/sources", label: "Source Documents", icon: FileText },
  { href: "/admin/transfers", label: "Transfers", icon: ArrowRightLeft },
  { href: "/admin/share-links", label: "Share Links", icon: Link2 },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Admin top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-slate-900 text-white shadow-sm">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
          <Link href="/admin" className="font-bold tracking-tight text-white hover:text-blue-300 transition-colors">
            Vehicle Passport
          </Link>
          <span className="text-slate-400 text-sm">/</span>
          <span className="text-slate-300 text-sm font-medium">Admin Panel</span>
          <div className="ml-auto">
            <Link
              href="/garage"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              &larr; Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-slate-800/60 min-h-screen">
          <nav className="flex flex-col gap-0.5 p-3 pt-4" aria-label="Admin navigation">
            {adminNavItems.map((item) => (
              <AdminSidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                exact={item.exact}
              />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
