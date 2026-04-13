"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VehicleOverview } from "@/components/vehicles/vehicle-overview";
import { Wrench, FileText, Bell, Users, LayoutDashboard } from "lucide-react";
import type { VehicleWithRelations } from "@/app/(app)/garage/[vehicleId]/page";

interface VehicleTabsProps {
  vehicle: VehicleWithRelations;
  documentCount: number;
  maintenanceCount: number;
  reminderCount: number;
}

export function VehicleTabs({
  vehicle,
  documentCount,
  maintenanceCount,
  reminderCount,
}: VehicleTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="overview" className="gap-1.5">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="gap-1.5">
          <Wrench className="h-3.5 w-3.5" />
          Maintenance
          {maintenanceCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {maintenanceCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Documents
          {documentCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {documentCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="reminders" className="gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          Reminders
          {reminderCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
              {reminderCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="ownership" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Ownership
        </TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="mt-0">
        <VehicleOverview vehicle={vehicle} />
      </TabsContent>

      {/* Maintenance — placeholder */}
      <TabsContent value="maintenance" className="mt-0">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Maintenance records coming soon
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Zapisi o održavanju uskoro
          </p>
        </div>
      </TabsContent>

      {/* Documents — placeholder */}
      <TabsContent value="documents" className="mt-0">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Document storage coming soon
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pohrana dokumenata uskoro
          </p>
        </div>
      </TabsContent>

      {/* Reminders — placeholder */}
      <TabsContent value="reminders" className="mt-0">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Reminder management coming soon
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upravljanje podsjetnicima uskoro
          </p>
        </div>
      </TabsContent>

      {/* Ownership — placeholder */}
      <TabsContent value="ownership" className="mt-0">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Ownership transfer coming soon
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Prijenos vlasništva uskoro
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default VehicleTabs;
