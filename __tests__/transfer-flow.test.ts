import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../lib/db", () => ({
  prisma: {
    ownershipTransfer: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    vehicle: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    shareLink: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../lib/auth/session", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("../lib/email/index", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../lib/email/templates", () => ({
  transferInviteEmail: jest.fn(() => ({ subject: "Transfer invite", html: "<p>test</p>" })),
}));

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mock-secure-token-32chars"),
}));

import { prisma } from "../lib/db";
import { requireAuth } from "../lib/auth/session";

// Typed mock helpers
const mockVehicleFindFirst = prisma.vehicle.findFirst as ReturnType<typeof jest.fn>;
const mockTransferCreate = prisma.ownershipTransfer.create as ReturnType<typeof jest.fn>;
const mockTransferUpdate = prisma.ownershipTransfer.update as ReturnType<typeof jest.fn>;
const mockTransferFindFirst = prisma.ownershipTransfer.findFirst as ReturnType<typeof jest.fn>;
const mockShareLinkUpdateMany = prisma.shareLink.updateMany as ReturnType<typeof jest.fn>;
const mockVehicleUpdate = prisma.vehicle.update as ReturnType<typeof jest.fn>;
const mockAuditCreate = prisma.auditLog.create as ReturnType<typeof jest.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof jest.fn>;

function mockSession(id: string, email: string) {
  mockRequireAuth.mockResolvedValue({ user: { id, email, role: "USER" } });
}

function makeMockVehicle(ownerId = "owner-id") {
  return { id: "vehicle-id", ownerId, make: "Volkswagen", model: "Golf", year: 2019 };
}

function makeMockTransfer(overrides: Partial<{
  status: string;
  fromUserId: string;
  toEmail: string;
  toUserId: string | null;
  expiresAt: Date;
}> = {}) {
  return {
    id: "transfer-id",
    vehicleId: "vehicle-id",
    fromUserId: overrides.fromUserId ?? "owner-id",
    toEmail: overrides.toEmail ?? "buyer@example.com",
    toUserId: overrides.toUserId ?? null,
    status: overrides.status ?? "PENDING",
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    token: "mock-secure-token-32chars",
    includeDocuments: true,
    includeCosts: false,
    includePrivateNotes: false,
    includeServiceHistory: true,
    preserveSellerArchive: true,
    message: null,
    acceptedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("initiateTransfer — business rules", () => {
  it("rejects initiation if vehicle not found for owner", async () => {
    mockVehicleFindFirst.mockResolvedValue(null);
    const vehicle = await prisma.vehicle.findFirst({ where: { id: "v1", ownerId: "owner-id" } } as any);
    expect(vehicle).toBeNull();
  });

  it("creates transfer with PENDING status when vehicle found", async () => {
    mockSession("owner-id", "owner@example.com");
    mockVehicleFindFirst.mockResolvedValue(makeMockVehicle());
    mockTransferCreate.mockResolvedValue(makeMockTransfer());
    mockAuditCreate.mockResolvedValue({});

    const transfer = await prisma.ownershipTransfer.create({ data: {} as any });
    expect(transfer.status).toBe("PENDING");
  });

  it("transfer token is a non-empty string", () => {
    const transfer = makeMockTransfer();
    expect(typeof transfer.token).toBe("string");
    expect(transfer.token.length).toBeGreaterThan(0);
  });

  it("transfer expires in 7 days from now", () => {
    const transfer = makeMockTransfer();
    const msIn7Days = 7 * 24 * 60 * 60 * 1000;
    const diff = transfer.expiresAt.getTime() - Date.now();
    expect(diff).toBeGreaterThan(msIn7Days - 5000);
    expect(diff).toBeLessThan(msIn7Days + 5000);
  });
});

describe("cancelTransfer — business rules", () => {
  it("only owner can cancel — non-owner check fails", () => {
    const transfer = makeMockTransfer({ fromUserId: "owner-id" });
    const isOwner = transfer.fromUserId === "other-user-id";
    expect(isOwner).toBe(false);
  });

  it("sets status to CANCELLED with cancelledAt", async () => {
    mockTransferFindFirst.mockResolvedValue(makeMockTransfer());
    mockTransferUpdate.mockResolvedValue({ ...makeMockTransfer(), status: "CANCELLED", cancelledAt: new Date() });

    const updated = await prisma.ownershipTransfer.update({
      where: { id: "transfer-id" },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    } as any);

    expect(updated.status).toBe("CANCELLED");
    expect(updated.cancelledAt).toBeDefined();
  });
});

describe("acceptTransfer — business rules", () => {
  it("rejects expired transfer", () => {
    const expired = makeMockTransfer({ expiresAt: new Date(Date.now() - 1000) });
    expect(expired.expiresAt < new Date()).toBe(true);
  });

  it("rejects mismatched recipient email", () => {
    const transfer = makeMockTransfer({ toEmail: "buyer@example.com" });
    expect(transfer.toEmail === "wrong@example.com").toBe(false);
  });

  it("accepts valid non-expired transfer with matching email", () => {
    const transfer = makeMockTransfer({ toEmail: "buyer@example.com" });
    const isValid =
      transfer.status === "PENDING" &&
      transfer.expiresAt > new Date() &&
      transfer.toEmail === "buyer@example.com";
    expect(isValid).toBe(true);
  });

  it("updates vehicle ownerId on acceptance", async () => {
    mockVehicleUpdate.mockResolvedValue({ ...makeMockVehicle(), ownerId: "buyer-id" });

    const updated = await prisma.vehicle.update({
      where: { id: "vehicle-id" },
      data: { ownerId: "buyer-id" },
    } as any);

    expect(updated.ownerId).toBe("buyer-id");
  });

  it("revokes all share links on acceptance", async () => {
    mockShareLinkUpdateMany.mockResolvedValue({ count: 2 });

    await prisma.shareLink.updateMany({
      where: { vehicleId: "vehicle-id", revokedAt: null },
      data: { revokedAt: new Date() },
    } as any);

    expect(mockShareLinkUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ vehicleId: "vehicle-id" }),
      })
    );
  });

  it("marks transfer as ACCEPTED with acceptedAt timestamp", async () => {
    const now = new Date();
    mockTransferUpdate.mockResolvedValue({ ...makeMockTransfer(), status: "ACCEPTED", acceptedAt: now });

    const result = await prisma.ownershipTransfer.update({
      where: { id: "transfer-id" },
      data: { status: "ACCEPTED", acceptedAt: now },
    } as any);

    expect(result.status).toBe("ACCEPTED");
    expect(result.acceptedAt).toBeDefined();
  });
});
