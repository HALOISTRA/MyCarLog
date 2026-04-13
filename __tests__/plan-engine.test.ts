import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { findBestPlanForVehicle } from "../lib/maintenance/plan-engine";

// Mock prisma
jest.mock("../lib/db", () => ({
  prisma: {
    maintenancePlan: {
      findMany: jest.fn(),
    },
    maintenanceRecord: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from "../lib/db";

const mockFindMany = prisma.maintenancePlan.findMany as ReturnType<typeof jest.fn>;

function makeVehicle(overrides: Partial<{
  make: string; model: string; year: number; engineCode: string | null;
  fuelType: string; transmission: string; marketRegion: string | null; trim: string | null;
  currentMileage: number; purchaseDate: Date | null; purchaseMileage: number | null;
}> = {}) {
  return {
    id: "v1",
    ownerId: "u1",
    make: overrides.make ?? "Volkswagen",
    model: overrides.model ?? "Golf",
    trim: overrides.trim ?? null,
    generation: null,
    year: overrides.year ?? 2019,
    vin: null,
    plate: null,
    engine: "1.6 TDI",
    engineCode: overrides.engineCode !== undefined ? overrides.engineCode : "CLHA",
    fuelType: (overrides.fuelType ?? "DIESEL") as any,
    transmission: (overrides.transmission ?? "MANUAL") as any,
    drivetrain: "FWD" as any,
    bodyType: "Hatchback",
    color: "Blue",
    marketRegion: overrides.marketRegion !== undefined ? overrides.marketRegion : "EU",
    currentMileage: overrides.currentMileage ?? 87_500,
    mileageUnit: "KM" as any,
    purchaseDate: overrides.purchaseDate !== undefined ? overrides.purchaseDate : new Date("2019-03-01"),
    purchaseMileage: overrides.purchaseMileage ?? 0,
    nickname: null,
    notes: null,
    imageUrl: null,
    imageKey: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makePlan(overrides: Partial<{
  id: string;
  yearFrom: number | null; yearTo: number | null;
  engineCode: string | null; fuelType: string | null;
  transmission: string | null; marketRegion: string | null; trim: string | null;
}> = {}) {
  return {
    id: overrides.id ?? "plan-1",
    make: "Volkswagen",
    model: "Golf",
    trim: overrides.trim ?? null,
    generation: null,
    yearFrom: overrides.yearFrom !== undefined ? overrides.yearFrom : 2013,
    yearTo: overrides.yearTo !== undefined ? overrides.yearTo : 2020,
    engine: "1.6 TDI",
    engineCode: overrides.engineCode !== undefined ? overrides.engineCode : "CLHA",
    fuelType: (overrides.fuelType !== undefined ? overrides.fuelType : "DIESEL") as any,
    transmission: (overrides.transmission !== undefined ? overrides.transmission : "MANUAL") as any,
    marketRegion: overrides.marketRegion !== undefined ? overrides.marketRegion : "EU",
    sourceDocumentId: "src-1",
    verificationStatus: "VERIFIED" as any,
    sourceLabel: "VW Golf Mk7 Official Service Schedule",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    planItems: [] as any[],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("findBestPlanForVehicle", () => {
  it("returns null when no plans found", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await findBestPlanForVehicle(makeVehicle() as any);
    expect(result).toBeNull();
  });

  it("returns EXACT confidence for a perfect match", async () => {
    mockFindMany.mockResolvedValue([makePlan()]);
    const result = await findBestPlanForVehicle(makeVehicle() as any);
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe("EXACT");
  });

  it("returns LIKELY or EXACT for partial match (year range only)", async () => {
    const plan = makePlan({ engineCode: null, fuelType: null, transmission: null, marketRegion: null });
    mockFindMany.mockResolvedValue([plan]);
    const result = await findBestPlanForVehicle(makeVehicle() as any);
    expect(result).not.toBeNull();
    expect(["EXACT", "LIKELY"]).toContain(result?.confidence);
  });

  it("returns null when year is outside plan range and no other criteria match", async () => {
    const plan = makePlan({ yearFrom: 2013, yearTo: 2016, engineCode: null, fuelType: null, transmission: null, marketRegion: null });
    mockFindMany.mockResolvedValue([plan]);
    const result = await findBestPlanForVehicle(makeVehicle({ year: 2019 }) as any);
    // Year 2019 outside 2013-2016, no other scoring matches → score 0 < threshold → null
    expect(result).toBeNull();
  });

  it("selects highest-scoring plan when multiple are returned", async () => {
    const goodPlan = makePlan({ id: "plan-good" });
    const weakPlan = makePlan({ id: "plan-weak", engineCode: null, fuelType: null, transmission: null, marketRegion: null });
    mockFindMany.mockResolvedValue([weakPlan, goodPlan]);
    const result = await findBestPlanForVehicle(makeVehicle() as any);
    expect(result?.plan.id).toBe("plan-good");
  });

  it("returns matchReasons array for a matched plan", async () => {
    mockFindMany.mockResolvedValue([makePlan()]);
    const result = await findBestPlanForVehicle(makeVehicle() as any);
    expect(Array.isArray(result?.matchReasons)).toBe(true);
    expect(result!.matchReasons.length).toBeGreaterThan(0);
  });
});
