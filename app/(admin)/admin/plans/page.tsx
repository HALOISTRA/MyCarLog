import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Plus, ShieldCheck, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlansFilter } from "./plans-filter";
type PlanVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_CONFIG: Record<
  PlanVerificationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  VERIFIED: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    icon: AlertTriangle,
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default async function AdminPlansPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status } = await searchParams;

  const where = status
    ? { verificationStatus: status as PlanVerificationStatus }
    : {};

  const plans = await prisma.maintenancePlan.findMany({
    where,
    orderBy: [{ make: "asc" }, { model: "asc" }],
    include: {
      _count: { select: { planItems: true } },
      sourceDocument: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Plans</h1>
          <p className="text-muted-foreground">{plans.length} plans</p>
        </div>
        <Button asChild>
          <Link href="/admin/plans/new" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      <PlansFilter currentStatus={status} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Year Range</th>
                  <th className="px-4 py-3 font-medium">Engine</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No plans found
                    </td>
                  </tr>
                )}
                {plans.map((plan: typeof plans[number]) => {
                  const statusCfg = STATUS_CONFIG[plan.verificationStatus as PlanVerificationStatus];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={plan.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {plan.make} {plan.model}
                          </p>
                          {(plan.trim || plan.generation) && (
                            <p className="text-xs text-muted-foreground">
                              {[plan.trim, plan.generation].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {plan.yearFrom ?? "—"}
                        {plan.yearTo ? ` – ${plan.yearTo}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {plan.engine ?? "—"}
                        {plan.engineCode && (
                          <span className="ml-1 font-mono text-muted-foreground">
                            ({plan.engineCode})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {plan._count.planItems}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                        {plan.sourceDocument?.title ?? plan.sourceLabel ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={statusCfg.className}
                          variant="outline"
                        >
                          <span className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Link href={`/admin/plans/${plan.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
