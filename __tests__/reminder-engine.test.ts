import { describe, it, expect, jest } from "@jest/globals";

// Mock DB before any imports that depend on it
jest.mock("../lib/db", () => ({ prisma: {} }));
jest.mock("../app/generated/prisma", () => ({}));

import { computeReminderStatus, enrichReminderWithStatus } from "../lib/reminders/engine";
import { addDays, subDays } from "date-fns";

// Minimal Reminder mock factory
function makeReminder(overrides: Partial<{
  dueDate: Date | null;
  dueMileage: number | null;
  leadTimeDays: number;
  status: string;
  snoozedUntil: Date | null;
}> = {}) {
  return {
    id: "test-id",
    vehicleId: "v1",
    sourceType: "USER_CUSTOM",
    category: "OIL_CHANGE",
    title: "Oil Change",
    description: null,
    dueDate: overrides.dueDate !== undefined ? overrides.dueDate : null,
    dueMileage: overrides.dueMileage !== undefined ? overrides.dueMileage : null,
    recurrenceRule: null,
    leadTimeDays: overrides.leadTimeDays ?? 30,
    status: (overrides.status ?? "UPCOMING") as any,
    lastTriggeredAt: null,
    completedAt: null,
    snoozedUntil: overrides.snoozedUntil !== undefined ? overrides.snoozedUntil : null,
    linkedPlanItemId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const NOW = new Date("2025-06-15T12:00:00Z");
const CURRENT_MILEAGE = 90_000;

describe("computeReminderStatus", () => {
  it("returns OVERDUE when due date is in the past", () => {
    const reminder = makeReminder({ dueDate: subDays(NOW, 5) });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("OVERDUE");
  });

  it("returns OVERDUE when mileage exceeds due mileage", () => {
    const reminder = makeReminder({ dueMileage: 85_000 });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("OVERDUE");
  });

  it("returns DUE_SOON when due date is within lead time days", () => {
    const reminder = makeReminder({ dueDate: addDays(NOW, 15), leadTimeDays: 30 });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("DUE_SOON");
  });

  it("returns UPCOMING when due date is beyond lead time", () => {
    const reminder = makeReminder({ dueDate: addDays(NOW, 60), leadTimeDays: 30 });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("UPCOMING");
  });

  it("returns COMPLETED when status is COMPLETED", () => {
    const reminder = makeReminder({ status: "COMPLETED", dueDate: subDays(NOW, 10) });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("COMPLETED");
  });

  it("returns COMPLETED when status is DISMISSED", () => {
    const reminder = makeReminder({ status: "DISMISSED", dueDate: subDays(NOW, 10) });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("COMPLETED");
  });

  it("returns UPCOMING when snoozed until a future date", () => {
    const reminder = makeReminder({ dueDate: subDays(NOW, 1), snoozedUntil: addDays(NOW, 7) });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("UPCOMING");
  });

  it("returns OVERDUE when snoozed date is in the past and due date is overdue", () => {
    const reminder = makeReminder({ dueDate: subDays(NOW, 5), snoozedUntil: subDays(NOW, 1) });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("OVERDUE");
  });

  it("prioritizes OVERDUE if either date or mileage is overdue (WHICHEVER_FIRST logic)", () => {
    const reminder = makeReminder({
      dueDate: addDays(NOW, 20),   // not overdue by date
      dueMileage: 85_000,           // overdue by mileage
      leadTimeDays: 30,
    });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("OVERDUE");
  });

  it("returns UPCOMING when no due date or mileage set but status is UPCOMING", () => {
    const reminder = makeReminder({ dueDate: null, dueMileage: null });
    expect(computeReminderStatus(reminder as any, CURRENT_MILEAGE, NOW)).toBe("UPCOMING");
  });
});

describe("enrichReminderWithStatus", () => {
  it("calculates positive daysUntilDue for future due date", () => {
    const reminder = makeReminder({ dueDate: addDays(NOW, 10) });
    const result = enrichReminderWithStatus(reminder as any, CURRENT_MILEAGE, NOW);
    expect(result.daysUntilDue).toBe(10);
  });

  it("calculates negative daysUntilDue for past due date", () => {
    const reminder = makeReminder({ dueDate: subDays(NOW, 5) });
    const result = enrichReminderWithStatus(reminder as any, CURRENT_MILEAGE, NOW);
    expect(result.daysUntilDue).toBe(-5);
  });

  it("calculates mileageUntilDue correctly", () => {
    const reminder = makeReminder({ dueMileage: 100_000 });
    const result = enrichReminderWithStatus(reminder as any, CURRENT_MILEAGE, NOW);
    expect(result.mileageUntilDue).toBe(10_000);
  });

  it("calculates negative mileageUntilDue when overdue", () => {
    const reminder = makeReminder({ dueMileage: 85_000 });
    const result = enrichReminderWithStatus(reminder as any, CURRENT_MILEAGE, NOW);
    expect(result.mileageUntilDue).toBe(-5_000);
  });

  it("includes computedStatus in result", () => {
    const reminder = makeReminder({ dueDate: subDays(NOW, 2) });
    const result = enrichReminderWithStatus(reminder as any, CURRENT_MILEAGE, NOW);
    expect(result.computedStatus).toBe("OVERDUE");
  });
});
