import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlanItemsEditor } from "./plan-items-editor";
import { VerifyPlanButton } from "./verify-plan-button";

interface PageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { planId } = await params;

  const plan = await prisma.maintenancePlan.findUnique({
    where: { id: planId },
    include: {
      planItems: {
        orderBy: { displayOrder: "asc" },
      },
      sourceDocument: true,
      _count: { select: { vehicleAssignments: true } },
    },
  });

  if (!plan) notFound();

  const statusColors: Record<string, string> = {
    VERIFIED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    NEEDS_REVIEW: "bg-orange-100 text-orange-800 border-orange-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {plan.make} {plan.model}
            {plan.trim && <span className="text-muted-foreground font-normal"> {plan.trim}</span>}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={statusColors[plan.verificationStatus]}
            >
              {plan.verificationStatus.replace("_", " ")}
            </Badge>
            {plan.yearFrom && (
              <span className="text-sm text-muted-foreground">
                {plan.yearFrom}{plan.yearTo ? `–${plan.yearTo}` : "+"}
              </span>
            )}
            {plan.engine && (
              <span className="text-sm text-muted-foreground">{plan.engine}</span>
            )}
          </div>
        </div>

        {plan.verificationStatus !== "VERIFIED" && (
          <VerifyPlanButton planId={plan.id} />
        )}
      </div>

      {/* Plan Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan Details</CardTitle>
          <CardDescription>
            Used by {plan._count.vehicleAssignments} vehicle{plan._count.vehicleAssignments !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              { label: "Make", value: plan.make },
              { label: "Model", value: plan.model },
              { label: "Trim", value: plan.trim ?? "—" },
              { label: "Generation", value: plan.generation ?? "—" },
              { label: "Year From", value: plan.yearFrom?.toString() ?? "—" },
              { label: "Year To", value: plan.yearTo?.toString() ?? "—" },
              { label: "Engine", value: plan.engine ?? "—" },
              { label: "Engine Code", value: plan.engineCode ?? "—" },
              { label: "Fuel Type", value: plan.fuelType ?? "—" },
              { label: "Transmission", value: plan.transmission ?? "—" },
              { label: "Market Region", value: plan.marketRegion ?? "—" },
              {
                label: "Source",
                value: plan.sourceDocument?.title ?? plan.sourceLabel ?? "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {plan.notes && (
            <>
              <Separator className="my-3" />
              <div>
                <dt className="text-xs text-muted-foreground mb-1">Notes</dt>
                <dd className="text-sm">{plan.notes}</dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan items editor */}
      <PlanItemsEditor planId={plan.id} initialItems={plan.planItems} />
    </div>
  );
}
