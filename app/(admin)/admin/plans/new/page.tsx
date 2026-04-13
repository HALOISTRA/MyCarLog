import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NewPlanForm } from "./new-plan-form";

export default async function NewPlanPage() {
  await requireAdmin();

  const sourceDocs = await prisma.maintenancePlanSourceDocument.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, make: true, model: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Maintenance Plan</h1>
        <p className="text-muted-foreground">
          Create an official maintenance plan for a vehicle model
        </p>
      </div>

      <NewPlanForm sourceDocs={sourceDocs} />
    </div>
  );
}
