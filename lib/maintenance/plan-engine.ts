import { prisma } from "@/lib/db";
import type {
  Vehicle,
  MaintenancePlan,
  MaintenancePlanItem,
  MaintenanceRecord,
} from "@/app/generated/prisma";
import { addMonths, isBefore } from "date-fns";

export type PlanMatchResult = {
  plan: MaintenancePlan & { planItems: MaintenancePlanItem[] };
  confidence: "EXACT" | "LIKELY" | "MANUAL_REVIEW";
  matchReasons: string[];
};

export type ServiceStatus = "UP_TO_DATE" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";

export type PlanItemStatus = {
  item: MaintenancePlanItem;
  status: ServiceStatus;
  nextDueDate?: Date;
  nextDueMileage?: number;
  lastService?: MaintenanceRecord;
  overdueDays?: number;
  overdueKm?: number;
};

/**
 * Find the best matching maintenance plan for a vehicle.
 * Never silently picks a bad match — returns confidence level.
 */
export async function findBestPlanForVehicle(
  vehicle: Vehicle
): Promise<PlanMatchResult | null> {
  const plans = await prisma.maintenancePlan.findMany({
    where: {
      make: { equals: vehicle.make, mode: "insensitive" },
      model: { equals: vehicle.model, mode: "insensitive" },
      verificationStatus: "VERIFIED",
    },
    include: { planItems: { orderBy: { displayOrder: "asc" } } },
  });

  if (plans.length === 0) return null;

  // Score each plan
  const scored = plans.map((plan) => {
    let score = 0;
    const reasons: string[] = [];

    // Year range match
    if (
      plan.yearFrom !== null &&
      plan.yearTo !== null &&
      vehicle.year >= plan.yearFrom &&
      vehicle.year <= plan.yearTo
    ) {
      score += 30;
      reasons.push(`Year ${vehicle.year} within ${plan.yearFrom}–${plan.yearTo}`);
    } else if (plan.yearFrom === null && plan.yearTo === null) {
      score += 10;
    }

    // Engine code exact match
    if (
      plan.engineCode &&
      vehicle.engineCode &&
      plan.engineCode.toLowerCase() === vehicle.engineCode.toLowerCase()
    ) {
      score += 25;
      reasons.push(`Engine code match: ${plan.engineCode}`);
    }

    // Fuel type
    if (plan.fuelType && plan.fuelType === vehicle.fuelType) {
      score += 15;
      reasons.push(`Fuel type: ${plan.fuelType}`);
    }

    // Transmission
    if (plan.transmission && plan.transmission === vehicle.transmission) {
      score += 10;
      reasons.push(`Transmission: ${plan.transmission}`);
    }

    // Market region
    if (plan.marketRegion && vehicle.marketRegion) {
      if (
        plan.marketRegion.toLowerCase() === vehicle.marketRegion.toLowerCase()
      ) {
        score += 10;
        reasons.push(`Market: ${plan.marketRegion}`);
      }
    }

    // Trim match
    if (
      plan.trim &&
      vehicle.trim &&
      plan.trim.toLowerCase() === vehicle.trim.toLowerCase()
    ) {
      score += 10;
      reasons.push(`Trim: ${plan.trim}`);
    }

    return { plan, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (!best || best.score < 10) return null;

  let confidence: "EXACT" | "LIKELY" | "MANUAL_REVIEW";
  if (best.score >= 50) confidence = "EXACT";
  else if (best.score >= 25) confidence = "LIKELY";
  else confidence = "MANUAL_REVIEW";

  return {
    plan: best.plan,
    confidence,
    matchReasons: best.reasons,
  };
}

/**
 * Calculate service status for each plan item based on vehicle history.
 */
export async function calculatePlanItemStatuses(
  vehicle: Vehicle,
  planItems: MaintenancePlanItem[]
): Promise<PlanItemStatus[]> {
  const results: PlanItemStatus[] = [];
  const now = new Date();

  for (const item of planItems) {
    // Find the most recent service record matching this item
    const lastService = await prisma.maintenanceRecord.findFirst({
      where: {
        vehicleId: vehicle.id,
        category: item.category,
      },
      orderBy: { performedAt: "desc" },
    });

    if (!lastService && !item.mileageInterval && !item.timeIntervalMonths) {
      results.push({ item, status: "UNKNOWN" });
      continue;
    }

    let nextDueDate: Date | undefined;
    let nextDueMileage: number | undefined;
    let status: ServiceStatus = "UNKNOWN";

    if (lastService) {
      if (item.timeIntervalMonths) {
        nextDueDate = addMonths(lastService.performedAt, item.timeIntervalMonths);
      }
      if (item.mileageInterval && lastService.mileageAtService) {
        nextDueMileage = lastService.mileageAtService + item.mileageInterval;
      }
    } else {
      // No service history — estimate from purchase
      if (vehicle.purchaseDate && item.timeIntervalMonths) {
        nextDueDate = addMonths(vehicle.purchaseDate, item.timeIntervalMonths);
      }
      if (vehicle.purchaseMileage && item.mileageInterval) {
        nextDueMileage = vehicle.purchaseMileage + item.mileageInterval;
      }
    }

    // Determine status based on rule type
    const dateOverdue = nextDueDate ? isBefore(nextDueDate, now) : false;
    const mileageOverdue =
      nextDueMileage !== undefined
        ? vehicle.currentMileage >= nextDueMileage
        : false;

    if (
      item.ruleType === "WHICHEVER_FIRST" ||
      item.ruleType === "TIME_ONLY" ||
      item.ruleType === "MILEAGE_ONLY"
    ) {
      if (dateOverdue || mileageOverdue) {
        status = "OVERDUE";
      } else if (nextDueDate || nextDueMileage) {
        // Due soon if within 30 days or 2000 km
        const dateDueSoon =
          nextDueDate && !dateOverdue
            ? nextDueDate.getTime() - now.getTime() <
              30 * 24 * 60 * 60 * 1000
            : false;
        const mileageDueSoon =
          nextDueMileage !== undefined && !mileageOverdue
            ? nextDueMileage - vehicle.currentMileage < 2000
            : false;
        status = dateDueSoon || mileageDueSoon ? "DUE_SOON" : "UP_TO_DATE";
      } else if (lastService) {
        status = "UP_TO_DATE";
      }
    } else {
      status = lastService ? "UP_TO_DATE" : "UNKNOWN";
    }

    const overdueDays =
      dateOverdue && nextDueDate
        ? Math.floor((now.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;
    const overdueKm =
      mileageOverdue && nextDueMileage
        ? vehicle.currentMileage - nextDueMileage
        : undefined;

    results.push({
      item,
      status,
      nextDueDate,
      nextDueMileage,
      lastService: lastService ?? undefined,
      overdueDays,
      overdueKm,
    });
  }

  return results;
}

/**
 * Generate reminder suggestions from a plan for a vehicle.
 * Returns new reminder data (not yet saved).
 */
export function generateReminderSuggestions(
  vehicle: Vehicle,
  planItems: PlanItemStatus[]
): Array<{
  category: string;
  title: string;
  dueDate?: Date;
  dueMileage?: number;
  recurrenceRule?: object;
  linkedPlanItemId: string;
  sourceType: string;
}> {
  return planItems
    .filter((s) => s.status !== "UP_TO_DATE" || !s.lastService)
    .map((s) => ({
      category: s.item.category,
      title: s.item.itemName,
      description: s.item.description ?? undefined,
      dueDate: s.nextDueDate,
      dueMileage: s.nextDueMileage,
      recurrenceRule: {
        intervalMonths: s.item.timeIntervalMonths ?? undefined,
        intervalKm: s.item.mileageInterval ?? undefined,
      },
      linkedPlanItemId: s.item.id,
      sourceType: "OFFICIAL_PLAN",
    }));
}
