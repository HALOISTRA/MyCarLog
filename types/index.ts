import type { Session } from "next-auth";

// Extend NextAuth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

// Share link visibility config
export interface ShareVisibilityConfig {
  showMaintenance: boolean;
  showDocuments: boolean;
  showCosts: boolean;
  showVin: boolean;
  showPlate: boolean;
  showNotes: boolean;
}

// Notification preferences
export interface NotificationPrefs {
  email: boolean;
  inApp: boolean;
  leadDays: number[];
}

// Recurrence rule
export interface RecurrenceRule {
  intervalMonths?: number;
  intervalKm?: number;
}

// Vehicle summary for cards
export interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  plate?: string | null;
  currentMileage: number;
  mileageUnit: string;
  imageUrl?: string | null;
  nickname?: string | null;
  overdueCount: number;
  dueSoonCount: number;
  archivedAt?: Date | null;
}

// Fuel type labels (bilingual)
export const FUEL_TYPE_LABELS: Record<string, { en: string; hr: string }> = {
  PETROL: { en: "Petrol", hr: "Benzin" },
  DIESEL: { en: "Diesel", hr: "Dizel" },
  ELECTRIC: { en: "Electric", hr: "Električni" },
  HYBRID: { en: "Hybrid", hr: "Hibrid" },
  PLUGIN_HYBRID: { en: "Plug-in Hybrid", hr: "Plug-in Hibrid" },
  LPG: { en: "LPG", hr: "Plin (LPG)" },
  CNG: { en: "CNG", hr: "Plin (CNG)" },
  HYDROGEN: { en: "Hydrogen", hr: "Vodik" },
  OTHER: { en: "Other", hr: "Ostalo" },
};

export const TRANSMISSION_LABELS: Record<string, { en: string; hr: string }> =
  {
    MANUAL: { en: "Manual", hr: "Manualni" },
    AUTOMATIC: { en: "Automatic", hr: "Automatski" },
    CVT: { en: "CVT", hr: "CVT" },
    DCT: { en: "Dual-clutch (DCT)", hr: "Dvokupljungeni (DCT)" },
    OTHER: { en: "Other", hr: "Ostalo" },
  };

export const DRIVETRAIN_LABELS: Record<string, { en: string; hr: string }> = {
  FWD: { en: "Front-wheel drive", hr: "Prednji pogon" },
  RWD: { en: "Rear-wheel drive", hr: "Stražnji pogon" },
  AWD: { en: "All-wheel drive", hr: "Pogon na sva četiri" },
  FOUR_WD: { en: "4WD", hr: "4×4" },
};

export const MAINTENANCE_CATEGORY_LABELS: Record<
  string,
  { en: string; hr: string }
> = {
  OIL_CHANGE: { en: "Oil Change", hr: "Zamjena ulja" },
  FILTER_AIR: { en: "Air Filter", hr: "Zrakopropusni filtar" },
  FILTER_CABIN: { en: "Cabin Filter", hr: "Filter kabine" },
  FILTER_FUEL: { en: "Fuel Filter", hr: "Filter goriva" },
  FILTER_OIL: { en: "Oil Filter", hr: "Filter ulja" },
  BRAKE_FLUID: { en: "Brake Fluid", hr: "Kočiona tekućina" },
  COOLANT: { en: "Coolant", hr: "Rashladna tekućina" },
  SPARK_PLUGS: { en: "Spark Plugs", hr: "Svjećice" },
  TIMING_BELT: { en: "Timing Belt", hr: "Zupčasti remen" },
  TIMING_CHAIN: { en: "Timing Chain", hr: "Zupčasti lanac" },
  TRANSMISSION_OIL: { en: "Transmission Oil", hr: "Ulje mjenjača" },
  TIRES: { en: "Tires", hr: "Gume" },
  BATTERY: { en: "Battery", hr: "Akumulator" },
  BRAKES: { en: "Brakes", hr: "Kočnice" },
  SUSPENSION: { en: "Suspension", hr: "Ovjes" },
  REGISTRATION: { en: "Registration", hr: "Registracija" },
  INSURANCE: { en: "Insurance", hr: "Osiguranje" },
  INSPECTION: { en: "Technical Inspection", hr: "Tehnički pregled" },
  SEASONAL_SERVICE: { en: "Seasonal Service", hr: "Sezonski servis" },
  GENERAL_SERVICE: { en: "General Service", hr: "Opći servis" },
  REPAIR: { en: "Repair", hr: "Popravak" },
  CUSTOM: { en: "Custom", hr: "Prilagođeno" },
};

export const DOCUMENT_CATEGORY_LABELS: Record<
  string,
  { en: string; hr: string }
> = {
  REGISTRATION: { en: "Registration", hr: "Prometna dozvola" },
  INSURANCE: { en: "Insurance", hr: "Polica osiguranja" },
  INSPECTION: { en: "Inspection", hr: "Tehnički pregled" },
  INVOICE: { en: "Invoice / Receipt", hr: "Račun / Potvrda" },
  SERVICE_BOOK: { en: "Service Book", hr: "Servisna knjižica" },
  OWNERSHIP: { en: "Ownership Papers", hr: "Vlasnički dokumenti" },
  WARRANTY: { en: "Warranty", hr: "Jamstvo" },
  PHOTO: { en: "Photo", hr: "Fotografija" },
  OTHER: { en: "Other", hr: "Ostalo" },
};

export type AppLocale = "en" | "hr";
