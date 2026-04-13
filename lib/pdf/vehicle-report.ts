import PDFDocument from "pdfkit";

type MaintenanceRecord = {
  performedAt: Date;
  mileageAtService: number | null;
  category: string;
  title: string;
  workshopName: string | null;
  costAmount: number | null;
  currency: string | null;
  description: string | null;
};

type Reminder = {
  title: string;
  category: string;
  dueDate: Date | null;
  dueMileage: number | null;
  status: string;
};

type Vehicle = {
  make: string;
  model: string;
  year: number;
  vin: string | null;
  plate: string | null;
  engine: string | null;
  fuelType: string;
  transmission: string;
  currentMileage: number;
  mileageUnit: string;
  color: string | null;
  maintenanceRecords: MaintenanceRecord[];
  reminders: Reminder[];
};

// ─── Colours & constants ────────────────────────────────────────────────────

const PRIMARY = "#1a1a2e";
const ACCENT = "#3b82f6";
const MUTED = "#6b7280";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("hr-HR");
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (!amount) return "—";
  return `${amount.toFixed(2)} ${currency ?? "EUR"}`;
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    OIL_CHANGE: "Oil Change",
    TIRE_ROTATION: "Tire Rotation",
    BRAKE_SERVICE: "Brake Service",
    AIR_FILTER: "Air Filter",
    FUEL_FILTER: "Fuel Filter",
    SPARK_PLUGS: "Spark Plugs",
    TIMING_BELT: "Timing Belt",
    COOLANT_FLUSH: "Coolant Flush",
    TRANSMISSION_SERVICE: "Transmission Service",
    BATTERY_REPLACEMENT: "Battery Replacement",
    INSPECTION: "Inspection",
    REPAIR: "Repair",
    OTHER: "Other",
  };
  return map[cat] ?? cat;
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    UPCOMING: "Upcoming",
    DUE_SOON: "Due Soon",
    OVERDUE: "Overdue",
    COMPLETED: "Completed",
    SNOOZED: "Snoozed",
  };
  return map[s] ?? s;
}

// ─── Main generator ─────────────────────────────────────────────────────────

export async function generateVehiclePDF(vehicle: Vehicle): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 70).fill(PRIMARY);

    doc
      .fillColor("white")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Vehicle Passport", MARGIN, 20);

    doc
      .fillColor("#93c5fd")
      .fontSize(10)
      .font("Helvetica")
      .text("Service & Maintenance Report", MARGIN, 46);

    doc
      .fillColor("white")
      .fontSize(9)
      .text(`Generated: ${formatDate(new Date())}`, MARGIN, 46, { align: "right" });

    let y = 90;

    // ── Vehicle info card ────────────────────────────────────────────────────
    doc.rect(MARGIN, y, CONTENT_WIDTH, 100).fill(LIGHT_BG).stroke(BORDER);

    doc
      .fillColor(PRIMARY)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, MARGIN + 16, y + 14);

    const infoLeft = [
      ["VIN", vehicle.vin ?? "—"],
      ["Plate", vehicle.plate ?? "—"],
      ["Engine", vehicle.engine ?? "—"],
    ];
    const infoRight = [
      ["Fuel", vehicle.fuelType],
      ["Transmission", vehicle.transmission],
      ["Mileage", `${vehicle.currentMileage.toLocaleString()} ${vehicle.mileageUnit}`],
    ];

    const colLeft = MARGIN + 16;
    const colRight = MARGIN + CONTENT_WIDTH / 2 + 8;
    let infoY = y + 42;

    infoLeft.forEach(([label, value]) => {
      doc.fillColor(MUTED).fontSize(8).font("Helvetica").text(label, colLeft, infoY);
      doc.fillColor(PRIMARY).fontSize(9).font("Helvetica-Bold").text(value, colLeft + 80, infoY);
      infoY += 16;
    });

    infoY = y + 42;
    infoRight.forEach(([label, value]) => {
      doc.fillColor(MUTED).fontSize(8).font("Helvetica").text(label, colRight, infoY);
      doc.fillColor(PRIMARY).fontSize(9).font("Helvetica-Bold").text(value, colRight + 90, infoY);
      infoY += 16;
    });

    y += 118;

    // ── Service history ──────────────────────────────────────────────────────
    sectionTitle(doc, "Service History", y);
    y += 28;

    if (vehicle.maintenanceRecords.length === 0) {
      doc.fillColor(MUTED).fontSize(10).font("Helvetica").text("No service records found.", MARGIN, y);
      y += 20;
    } else {
      // Table header
      y = tableHeader(doc, y, ["Date", "Mileage", "Service", "Workshop", "Cost"]);

      vehicle.maintenanceRecords.forEach((r, i) => {
        // Page break check
        if (y > 750) {
          doc.addPage();
          y = MARGIN;
          y = tableHeader(doc, y, ["Date", "Mileage", "Service", "Workshop", "Cost"]);
        }

        const rowBg = i % 2 === 0 ? "white" : LIGHT_BG;
        doc.rect(MARGIN, y, CONTENT_WIDTH, 20).fill(rowBg);

        doc.fillColor(PRIMARY).fontSize(8.5).font("Helvetica");
        doc.text(formatDate(r.performedAt), MARGIN + 4, y + 5, { width: 70 });
        doc.text(r.mileageAtService ? `${r.mileageAtService.toLocaleString()}` : "—", MARGIN + 78, y + 5, { width: 70 });
        doc.text(categoryLabel(r.category), MARGIN + 152, y + 5, { width: 140 });
        doc.text(r.workshopName ?? "—", MARGIN + 296, y + 5, { width: 130 });
        doc.text(formatCurrency(r.costAmount, r.currency), MARGIN + 430, y + 5, { width: 65, align: "right" });

        y += 20;

        // Description (if any)
        if (r.description) {
          doc.fillColor(MUTED).fontSize(7.5).font("Helvetica-Oblique")
            .text(r.description, MARGIN + 152, y, { width: 343 });
          y += 14;
        }
      });
    }

    y += 20;

    // ── Reminders ────────────────────────────────────────────────────────────
    if (y > 700) { doc.addPage(); y = MARGIN; }

    sectionTitle(doc, "Reminders", y);
    y += 28;

    const activeReminders = vehicle.reminders.filter((r) => r.status !== "COMPLETED");

    if (activeReminders.length === 0) {
      doc.fillColor(MUTED).fontSize(10).font("Helvetica").text("No active reminders.", MARGIN, y);
    } else {
      y = tableHeader(doc, y, ["Reminder", "Category", "Due Date", "Due Mileage", "Status"]);

      activeReminders.forEach((r, i) => {
        if (y > 750) { doc.addPage(); y = MARGIN; }

        const rowBg = i % 2 === 0 ? "white" : LIGHT_BG;
        doc.rect(MARGIN, y, CONTENT_WIDTH, 20).fill(rowBg);
        doc.fillColor(PRIMARY).fontSize(8.5).font("Helvetica");
        doc.text(r.title, MARGIN + 4, y + 5, { width: 140 });
        doc.text(categoryLabel(r.category), MARGIN + 148, y + 5, { width: 110 });
        doc.text(formatDate(r.dueDate), MARGIN + 262, y + 5, { width: 80 });
        doc.text(r.dueMileage ? r.dueMileage.toLocaleString() : "—", MARGIN + 346, y + 5, { width: 80 });

        const status = statusLabel(r.status);
        const statusColor =
          r.status === "OVERDUE" ? "#dc2626" :
          r.status === "DUE_SOON" ? "#d97706" :
          r.status === "UPCOMING" ? "#2563eb" : MUTED;
        doc.fillColor(statusColor).text(status, MARGIN + 430, y + 5, { width: 65, align: "right" });

        y += 20;
      });
    }

    // ── Footer on each page ──────────────────────────────────────────────────
    const totalPages = (doc as any).bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .rect(0, 820, PAGE_WIDTH, 22)
        .fill("#f1f5f9");
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .font("Helvetica")
        .text(
          `${vehicle.year} ${vehicle.make} ${vehicle.model}  •  Vehicle Passport`,
          MARGIN,
          825
        )
        .text(`Page ${i + 1} of ${totalPages}`, MARGIN, 825, { align: "right" });
    }

    doc.end();
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22).fill(PRIMARY);
  doc.fillColor("white").fontSize(10).font("Helvetica-Bold").text(title, MARGIN + 10, y + 6);
  doc.rect(MARGIN, y + 22, CONTENT_WIDTH, 1).fill(BORDER);
}

function tableHeader(doc: PDFKit.PDFDocument, y: number, cols: string[]): number {
  doc.rect(MARGIN, y, CONTENT_WIDTH, 18).fill(ACCENT);
  doc.fillColor("white").fontSize(8).font("Helvetica-Bold");

  const colWidths = CONTENT_WIDTH / cols.length;
  cols.forEach((col, i) => {
    doc.text(col, MARGIN + 4 + i * colWidths, y + 4, { width: colWidths - 4 });
  });

  return y + 18;
}
