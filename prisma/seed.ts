/**
 * prisma/seed.ts
 * Comprehensive seed file for Vehicle Passport.
 * Run with: npx prisma db seed
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths, subYears } from "date-fns";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean up existing seed data ─────────────────────────────────────────
  await prisma.auditLog.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.vehiclePlanAssignment.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.shareLink.deleteMany({});
  await prisma.ownershipTransfer.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.maintenancePlanItem.deleteMany({});
  await prisma.maintenancePlan.deleteMany({});
  await prisma.maintenancePlanSourceDocument.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { in: ["demo@vehiclepassport.app", "admin@vehiclepassport.app"] } } });

  console.log("  ✓ Cleaned existing seed records");

  // ─── Users ────────────────────────────────────────────────────────────────
  const demoPasswordHash = await bcrypt.hash("demo1234", 12);
  const adminPasswordHash = await bcrypt.hash("admin1234", 12);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@vehiclepassport.app",
      name: "Demo User",
      passwordHash: demoPasswordHash,
      role: "USER",
      locale: "hr",
      timezone: "Europe/Zagreb",
      emailVerified: new Date(),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vehiclepassport.app",
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      locale: "en",
      timezone: "UTC",
      emailVerified: new Date(),
    },
  });

  console.log("  ✓ Created users: demo + admin");

  // ─── Maintenance Plan Source Document ─────────────────────────────────────
  const vwSourceDoc = await prisma.maintenancePlanSourceDocument.create({
    data: {
      title: "VW Golf Mk7 Service Schedule",
      make: "Volkswagen",
      model: "Golf",
      yearRange: "2013-2020",
      marketRegion: "EU",
      sourceType: "official_manual",
      verificationStatus: "VERIFIED",
      extractionNotes: "Extracted from official VW Service Schedule booklet for Golf Mk7 (5G). Covers 1.0 TSI / 1.5 TSI / 1.6 TDI / 2.0 TDI variants with LongLife service intervals.",
      uploadedByUserId: adminUser.id,
    },
  });

  console.log("  ✓ Created source document: VW Golf Mk7 Service Schedule");

  // ─── Maintenance Plan: VW Golf 2013-2020 ─────────────────────────────────
  const golfPlan = await prisma.maintenancePlan.create({
    data: {
      make: "Volkswagen",
      model: "Golf",
      trim: "1.6 TDI",
      generation: "Mk7",
      yearFrom: 2013,
      yearTo: 2020,
      engine: "1.6 TDI 85kW",
      engineCode: "CLHA",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      marketRegion: "EU",
      sourceDocumentId: vwSourceDoc.id,
      verificationStatus: "VERIFIED",
      sourceLabel: "Official VW Service Schedule",
      notes: "LongLife service intervals. Annual inspection recommended.",
      planItems: {
        create: [
          {
            category: "OIL_CHANGE",
            itemName: "Engine Oil & Filter",
            description: "VW 507.00 or 504.00 spec oil required for TDI engines. LongLife interval.",
            mileageInterval: 15000,
            timeIntervalMonths: 12,
            ruleType: "WHICHEVER_FIRST",
            warningLevel: "IMPORTANT",
            sourceReference: "VW Service Schedule p.12",
            displayOrder: 1,
          },
          {
            category: "FILTER_AIR",
            itemName: "Air Filter",
            description: "Paper element air filter replacement.",
            mileageInterval: 30000,
            timeIntervalMonths: null,
            ruleType: "MILEAGE_ONLY",
            warningLevel: "NORMAL",
            sourceReference: "VW Service Schedule p.15",
            displayOrder: 2,
          },
          {
            category: "FILTER_CABIN",
            itemName: "Cabin (Pollen) Filter",
            description: "Replace cabin air filter. Consider activated carbon variant for allergy sufferers.",
            mileageInterval: 15000,
            timeIntervalMonths: 12,
            ruleType: "WHICHEVER_FIRST",
            warningLevel: "NORMAL",
            sourceReference: "VW Service Schedule p.16",
            displayOrder: 3,
          },
          {
            category: "BRAKE_FLUID",
            itemName: "Brake Fluid",
            description: "DOT 4 brake fluid. Replace fully — do not top off.",
            mileageInterval: null,
            timeIntervalMonths: 24,
            ruleType: "TIME_ONLY",
            warningLevel: "IMPORTANT",
            sourceReference: "VW Service Schedule p.20",
            displayOrder: 4,
          },
          {
            category: "SPARK_PLUGS",
            itemName: "Glow Plugs (Diesel)",
            description: "Diesel glow plugs — inspect and replace as needed.",
            mileageInterval: 60000,
            timeIntervalMonths: null,
            ruleType: "MILEAGE_ONLY",
            warningLevel: "NORMAL",
            sourceReference: "VW Service Schedule p.18",
            displayOrder: 5,
          },
          {
            category: "TIMING_BELT",
            itemName: "Timing Belt + Water Pump",
            description: "Critical replacement. Always replace water pump simultaneously. Engine damage if neglected.",
            mileageInterval: 120000,
            timeIntervalMonths: 72,
            ruleType: "WHICHEVER_FIRST",
            warningLevel: "CRITICAL",
            sourceReference: "VW Service Schedule p.22",
            displayOrder: 6,
          },
          {
            category: "COOLANT",
            itemName: "Engine Coolant (G13)",
            description: "VW G13 coolant — lilac/violet colour. Do not mix with G12.",
            mileageInterval: null,
            timeIntervalMonths: 48,
            ruleType: "TIME_ONLY",
            warningLevel: "NORMAL",
            sourceReference: "VW Service Schedule p.19",
            displayOrder: 7,
          },
        ],
      },
    },
    include: { planItems: true },
  });

  console.log("  ✓ Created maintenance plan: VW Golf Mk7");

  // ─── Vehicle 1: 2019 VW Golf 1.6 TDI ─────────────────────────────────────
  const golf = await prisma.vehicle.create({
    data: {
      ownerId: demoUser.id,
      make: "Volkswagen",
      model: "Golf",
      trim: "1.6 TDI Highline",
      generation: "Mk7.5",
      year: 2019,
      vin: "WVWZZZ5KZLW123456",
      plate: "ZG-123-AB",
      engine: "1.6 TDI 85kW (115 KS)",
      engineCode: "CLHA",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      drivetrain: "FWD",
      bodyType: "Hatchback",
      color: "Atlantic Blue",
      marketRegion: "EU",
      currentMileage: 87500,
      mileageUnit: "KM",
      purchaseDate: new Date("2021-03-15"),
      purchaseMileage: 42000,
      nickname: "Plavi Golf",
      notes: "Kupljen 2021., redovito servisiran u ovlaštenom VW servisu. Kartica servisa uredna.",
    },
  });

  // ─── Vehicle 2: 2015 Toyota Yaris (archived/sold) ─────────────────────────
  const yaris = await prisma.vehicle.create({
    data: {
      ownerId: demoUser.id,
      make: "Toyota",
      model: "Yaris",
      trim: "1.0 VVT-i Active",
      generation: "Mk3",
      year: 2015,
      vin: "JTDKB3EF100012345",
      plate: "ST-456-CD",
      engine: "1.0 VVT-i 51kW",
      fuelType: "PETROL",
      transmission: "MANUAL",
      drivetrain: "FWD",
      bodyType: "Hatchback",
      color: "Pearl White",
      marketRegion: "EU",
      currentMileage: 98200,
      mileageUnit: "KM",
      purchaseDate: new Date("2016-06-01"),
      purchaseMileage: 8000,
      archivedAt: new Date("2024-11-01"),
      notes: "Prodano 2024. Sve originalne knjižice i ključevi predani kupcu.",
    },
  });

  // ─── Vehicle 3: 2022 Škoda Octavia 2.0 TDI ───────────────────────────────
  const octavia = await prisma.vehicle.create({
    data: {
      ownerId: demoUser.id,
      make: "Skoda",
      model: "Octavia",
      trim: "2.0 TDI Style",
      generation: "Mk4",
      year: 2022,
      vin: "TMBJJ7NX5N0567890",
      plate: "OS-789-EF",
      engine: "2.0 TDI 110kW (150 KS)",
      engineCode: "DTRD",
      fuelType: "DIESEL",
      transmission: "DCT",
      drivetrain: "FWD",
      bodyType: "Sedan",
      color: "Graphite Grey",
      marketRegion: "EU",
      currentMileage: 12000,
      mileageUnit: "KM",
      purchaseDate: new Date("2022-09-20"),
      purchaseMileage: 0,
      nickname: "Oktavija",
      notes: "Novo vozilo iz salona. Tvornička garancija do 2025.",
    },
  });

  console.log("  ✓ Created 3 vehicles: Golf, Yaris (archived), Octavia");

  // ─── Maintenance Records for Golf ─────────────────────────────────────────
  const oilChangeRecord = await prisma.maintenanceRecord.create({
    data: {
      vehicleId: golf.id,
      createdByUserId: demoUser.id,
      performedAt: new Date("2024-01-18"),
      mileageAtService: 80000,
      category: "OIL_CHANGE",
      title: "Zamjena ulja i filtera ulja",
      description: "Zamijenjeno motorno ulje VW 507.00 5W-30 (5L) i filter ulja. Resetiran servisni indikator.",
      partsUsed: "Castrol Edge Professional LL III 5W-30 5L, Mann HU 7019 z oil filter",
      laborNotes: "Drenaža ulja toplog motora, zamjena brtve ispusnog vijka.",
      costAmount: 85.00,
      currency: "EUR",
      workshopName: "Auto Centar Horvat, Zagreb",
      isOfficialPlanDerived: true,
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "OIL_CHANGE")?.id,
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: golf.id,
      createdByUserId: demoUser.id,
      performedAt: new Date("2023-06-05"),
      mileageAtService: 75000,
      category: "FILTER_AIR",
      title: "Zamjena filtera zraka",
      description: "Zamijenjen filter zraka motora.",
      partsUsed: "Mann C 24 030 air filter",
      costAmount: 35.00,
      currency: "EUR",
      workshopName: "Auto Centar Horvat, Zagreb",
      isOfficialPlanDerived: true,
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "FILTER_AIR")?.id,
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: golf.id,
      createdByUserId: demoUser.id,
      performedAt: new Date("2022-09-12"),
      mileageAtService: 60000,
      category: "TIMING_BELT",
      title: "Zamjena zupčastog remena i vodene pumpe",
      description: "Zamijenjen komplet zupčastog remena s napinjačem, vodicom i vodenom pumpom. Sljedeća zamjena na 120.000 km ili za 6 godina (2028.).",
      partsUsed: "INA timing belt kit 530 0544 10, Hepu P546 water pump",
      laborNotes: "Posao 4h. Provjereni ležajevi bregastog i radilice — uredni.",
      costAmount: 380.00,
      currency: "EUR",
      workshopName: "VW Ovlašteni Servis Kos, Zagreb",
      isOfficialPlanDerived: true,
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "TIMING_BELT")?.id,
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: golf.id,
      createdByUserId: demoUser.id,
      performedAt: new Date("2022-04-20"),
      mileageAtService: 58500,
      category: "BRAKE_FLUID",
      title: "Zamjena kočione tekućine",
      description: "Kompletna zamjena kočione tekućine DOT 4.",
      partsUsed: "Liqui Moly DOT 4 brake fluid 1L",
      costAmount: 45.00,
      currency: "EUR",
      workshopName: "Auto Centar Horvat, Zagreb",
      isOfficialPlanDerived: true,
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "BRAKE_FLUID")?.id,
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: golf.id,
      createdByUserId: demoUser.id,
      performedAt: new Date("2023-10-15"),
      mileageAtService: 82000,
      category: "INSPECTION",
      title: "Tehnički pregled — važeći do 2025-10",
      description: "Redovni tehnički pregled — položen bez primjedbi. Valjanost do listopada 2025.",
      costAmount: 55.00,
      currency: "EUR",
      workshopName: "Stanica za tehnički pregled 'Črnomerec'",
    },
  });

  console.log("  ✓ Created maintenance records for Golf");

  // ─── Reminders for Golf ───────────────────────────────────────────────────
  const now = new Date();

  // Oil change due at 95,000 km — UPCOMING
  await prisma.reminder.create({
    data: {
      vehicleId: golf.id,
      sourceType: "OFFICIAL_PLAN",
      category: "OIL_CHANGE",
      title: "Zamjena ulja — 95.000 km",
      description: "Redovita zamjena motornog ulja i filtera. VW 507.00 specifikacija.",
      dueDate: new Date("2025-01-18"),
      dueMileage: 95000,
      recurrenceRule: { intervalKm: 15000, intervalMonths: 12 },
      leadTimeDays: 30,
      status: "UPCOMING",
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "OIL_CHANGE")?.id,
    },
  });

  // Registration expiry — DUE_SOON (30 days from now)
  await prisma.reminder.create({
    data: {
      vehicleId: golf.id,
      sourceType: "USER_CUSTOM",
      category: "REGISTRATION",
      title: "Obnova registracije",
      description: "Godišnja obnova prometne dozvole. Provjeriti dostupnost termina u HAKSB-u.",
      dueDate: addDays(now, 28),
      dueMileage: null,
      recurrenceRule: { intervalMonths: 12 },
      leadTimeDays: 30,
      status: "DUE_SOON",
    },
  });

  // Insurance expiry — OVERDUE (5 days ago)
  await prisma.reminder.create({
    data: {
      vehicleId: golf.id,
      sourceType: "USER_CUSTOM",
      category: "INSURANCE",
      title: "Obnova osiguranja — AO",
      description: "Godišnje obnavljanje obveznog osiguranja od automobilske odgovornosti.",
      dueDate: subDays(now, 5),
      dueMileage: null,
      recurrenceRule: { intervalMonths: 12 },
      leadTimeDays: 14,
      status: "OVERDUE",
    },
  });

  // Timing belt check at 120,000 km — UPCOMING
  await prisma.reminder.create({
    data: {
      vehicleId: golf.id,
      sourceType: "OFFICIAL_PLAN",
      category: "TIMING_BELT",
      title: "Zamjena zupčastog remena — 120.000 km / 2028.",
      description: "Sljedeća obavezna zamjena zupčastog remena s vodenom pumpom. Kritičan servisni zahvat.",
      dueDate: new Date("2028-09-01"),
      dueMileage: 120000,
      recurrenceRule: { intervalKm: 120000, intervalMonths: 72 },
      leadTimeDays: 60,
      status: "UPCOMING",
      linkedPlanItemId: golfPlan.planItems.find(i => i.category === "TIMING_BELT")?.id,
    },
  });

  console.log("  ✓ Created reminders for Golf (UPCOMING, DUE_SOON, OVERDUE)");

  // ─── VehiclePlanAssignment: Golf → Golf Plan ───────────────────────────────
  await prisma.vehiclePlanAssignment.create({
    data: {
      vehicleId: golf.id,
      maintenancePlanId: golfPlan.id,
      assignedByUserId: demoUser.id,
      assignmentConfidence: "EXACT",
      isActive: true,
    },
  });

  console.log("  ✓ Assigned maintenance plan to Golf");

  // ─── ShareLink for Octavia ─────────────────────────────────────────────────
  await prisma.shareLink.create({
    data: {
      vehicleId: octavia.id,
      createdByUserId: demoUser.id,
      token: "share_octavia_demo_2024_abcdef123456",
      pinHash: null, // no PIN
      expiresAt: addDays(now, 90),
      label: "Dijeli s kupcem",
      visibilityConfig: {
        showMaintenance: true,
        showDocuments: true,
        showCosts: false,
        showVin: false,
        showPlate: true,
        showNotes: false,
      },
    },
  });

  console.log("  ✓ Created share link for Octavia");

  // ─── OwnershipTransfer: Yaris → buyer@example.com (PENDING) ───────────────
  await prisma.ownershipTransfer.create({
    data: {
      vehicleId: yaris.id,
      fromUserId: demoUser.id,
      toEmail: "buyer@example.com",
      status: "PENDING",
      token: "transfer_yaris_demo_token_xyz789abc",
      expiresAt: addDays(now, 7),
      includeDocuments: true,
      includeCosts: false,
      includePrivateNotes: false,
      includeServiceHistory: true,
      preserveSellerArchive: true,
      message: "Pozdrav! Šaljem vam pristupni link za preuzimanje dokumentacije vozila Toyota Yaris. Kontaktirajte me ako imate pitanja.",
    },
  });

  console.log("  ✓ Created pending ownership transfer for Yaris");

  // ─── AuditLog entries ──────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: demoUser.id,
        actionType: "USER_REGISTERED",
        targetType: "User",
        targetId: demoUser.id,
        metadata: { email: demoUser.email, source: "seed" },
        createdAt: subDays(now, 90),
      },
      {
        actorUserId: demoUser.id,
        actionType: "VEHICLE_CREATED",
        targetType: "Vehicle",
        targetId: golf.id,
        metadata: { vehicleName: "2019 Volkswagen Golf", plate: "ZG-123-AB" },
        createdAt: subDays(now, 85),
      },
      {
        actorUserId: demoUser.id,
        actionType: "VEHICLE_CREATED",
        targetType: "Vehicle",
        targetId: yaris.id,
        metadata: { vehicleName: "2015 Toyota Yaris", plate: "ST-456-CD" },
        createdAt: subDays(now, 84),
      },
      {
        actorUserId: demoUser.id,
        actionType: "VEHICLE_CREATED",
        targetType: "Vehicle",
        targetId: octavia.id,
        metadata: { vehicleName: "2022 Skoda Octavia", plate: "OS-789-EF" },
        createdAt: subDays(now, 83),
      },
      {
        actorUserId: demoUser.id,
        actionType: "MAINTENANCE_RECORD_ADDED",
        targetType: "MaintenanceRecord",
        targetId: oilChangeRecord.id,
        metadata: { vehicleId: golf.id, category: "OIL_CHANGE", mileage: 80000 },
        createdAt: subDays(now, 82),
      },
      {
        actorUserId: demoUser.id,
        actionType: "PLAN_ASSIGNED",
        targetType: "Vehicle",
        targetId: golf.id,
        metadata: { planName: "VW Golf Mk7", confidence: "EXACT" },
        createdAt: subDays(now, 80),
      },
      {
        actorUserId: demoUser.id,
        actionType: "VEHICLE_ARCHIVED",
        targetType: "Vehicle",
        targetId: yaris.id,
        metadata: { vehicleName: "2015 Toyota Yaris", reason: "sold" },
        createdAt: subDays(now, 60),
      },
      {
        actorUserId: demoUser.id,
        actionType: "TRANSFER_INITIATED",
        targetType: "OwnershipTransfer",
        targetId: yaris.id,
        metadata: { vehicleId: yaris.id, toEmail: "buyer@example.com" },
        createdAt: subDays(now, 2),
      },
      {
        actorUserId: adminUser.id,
        actionType: "PLAN_VERIFIED",
        targetType: "MaintenancePlan",
        targetId: golfPlan.id,
        metadata: { planName: "VW Golf Mk7", verifiedBy: "admin@vehiclepassport.app" },
        createdAt: subDays(now, 30),
      },
    ],
  });

  console.log("  ✓ Created audit log entries");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("   Demo user:  demo@vehiclepassport.app / demo1234");
  console.log("   Admin user: admin@vehiclepassport.app / admin1234");
  console.log("   Vehicles:   Golf (active), Yaris (archived), Octavia (active)");
  console.log("   Plan:       VW Golf Mk7 (VERIFIED, 7 items)");
  console.log("   Reminders:  4 (UPCOMING x2, DUE_SOON x1, OVERDUE x1)");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
