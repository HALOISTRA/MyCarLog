// Minimal Prisma client mock for Jest (unit tests only — no DB needed)
export const prisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  vehicle: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  reminder: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  maintenanceRecord: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  maintenancePlan: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  maintenancePlanItem: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  vehiclePlanAssignment: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  shareLink: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  ownershipTransfer: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  notificationLog: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  auditLog: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  vehicleDocument: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

export default prisma;
