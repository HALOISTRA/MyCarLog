import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export const metadata: Metadata = {
  title: "Add Vehicle",
};

export default async function NewVehiclePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/garage"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          My Garage
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Add Vehicle</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Vehicle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dodaj vozilo &mdash; fill in the details for your new vehicle.
        </p>
      </div>

      {/* Form */}
      <VehicleForm mode="create" />
    </div>
  );
}
