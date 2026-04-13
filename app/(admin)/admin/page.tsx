import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  Users,
  Car,
  Link2,
  ArrowRightLeft,
  Wrench,
  ScrollText,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalVehicles,
    activeShareLinks,
    pendingTransfers,
    plansVerified,
    plansPending,
    plansTotal,
    unreadAuditCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.vehicle.count({ where: { archivedAt: null } }),
    prisma.shareLink.count({ where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
    prisma.ownershipTransfer.count({ where: { status: "PENDING" } }),
    prisma.maintenancePlan.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.maintenancePlan.count({ where: { verificationStatus: "PENDING" } }),
    prisma.maintenancePlan.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: yesterday } } }),
    prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, email: true } },
      },
    }),
  ]);

  const statCards = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Active Vehicles",
      value: totalVehicles,
      icon: Car,
      href: "/admin/vehicles",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Active Share Links",
      value: activeShareLinks,
      icon: Link2,
      href: "/admin/share-links",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      title: "Pending Transfers",
      value: pendingTransfers,
      icon: ArrowRightLeft,
      href: "/admin/transfers",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Maintenance Plans",
      value: plansTotal,
      subtitle: `${plansVerified} verified · ${plansPending} pending`,
      icon: Wrench,
      href: "/admin/plans",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/20",
    },
    {
      title: "Audit (24h)",
      value: unreadAuditCount,
      icon: ScrollText,
      href: "/admin/audit",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview — {format(now, "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`rounded-lg p-3 ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/plans/new">
          <Card className="transition-shadow hover:shadow-md cursor-pointer border-dashed">
            <CardContent className="flex items-center gap-3 pt-6">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Add Maintenance Plan</p>
                <p className="text-xs text-muted-foreground">Create a new verified plan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/sources">
          <Card className="transition-shadow hover:shadow-md cursor-pointer border-dashed">
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Source Documents</p>
                <p className="text-xs text-muted-foreground">Upload or review PDFs</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent audit log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            Recent Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAuditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent audit events.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Time</th>
                    <th className="pb-2 pr-4 font-medium">Actor</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAuditLogs.map((log: typeof recentAuditLogs[number]) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {format(log.createdAt, "dd MMM HH:mm")}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {log.actor
                          ? log.actor.name ?? log.actor.email
                          : <span className="text-muted-foreground">System</span>}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.actionType}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {log.targetType}
                        <span className="ml-1 font-mono opacity-60">
                          {log.targetId.slice(0, 8)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-right">
            <Link
              href="/admin/audit"
              className="text-xs text-primary hover:underline"
            >
              View all audit logs &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
