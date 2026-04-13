"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createPlanItem, deletePlanItem } from "@/app/actions/admin";
// MaintenancePlanItem type — mirrored locally to avoid requiring prisma generate at edit time
interface MaintenancePlanItem {
  id: string;
  maintenancePlanId: string;
  category: string;
  itemName: string;
  description: string | null;
  mileageInterval: number | null;
  timeIntervalMonths: number | null;
  ruleType: string;
  warningLevel: string;
  sourceReference: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  category: z.enum([
    "OIL_CHANGE", "FILTER_AIR", "FILTER_CABIN", "FILTER_FUEL", "FILTER_OIL",
    "BRAKE_FLUID", "COOLANT", "SPARK_PLUGS", "TIMING_BELT", "TIMING_CHAIN",
    "TRANSMISSION_OIL", "TIRES", "BATTERY", "BRAKES", "SUSPENSION",
    "REGISTRATION", "INSURANCE", "INSPECTION", "SEASONAL_SERVICE",
    "GENERAL_SERVICE", "REPAIR", "CUSTOM",
  ]),
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  mileageInterval: z.coerce.number().int().positive().optional(),
  timeIntervalMonths: z.coerce.number().int().positive().optional(),
  ruleType: z.enum(["TIME_ONLY", "MILEAGE_ONLY", "WHICHEVER_FIRST", "INSPECT_ONLY", "CONDITIONAL"]),
  warningLevel: z.enum(["INFO", "NORMAL", "IMPORTANT", "CRITICAL"]),
  sourceReference: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  OIL_CHANGE: "Oil Change", FILTER_AIR: "Air Filter", FILTER_CABIN: "Cabin Filter",
  FILTER_FUEL: "Fuel Filter", FILTER_OIL: "Oil Filter", BRAKE_FLUID: "Brake Fluid",
  COOLANT: "Coolant", SPARK_PLUGS: "Spark Plugs", TIMING_BELT: "Timing Belt",
  TIMING_CHAIN: "Timing Chain", TRANSMISSION_OIL: "Transmission Oil",
  TIRES: "Tires", BATTERY: "Battery", BRAKES: "Brakes", SUSPENSION: "Suspension",
  REGISTRATION: "Registration", INSURANCE: "Insurance", INSPECTION: "Inspection",
  SEASONAL_SERVICE: "Seasonal Service", GENERAL_SERVICE: "General Service",
  REPAIR: "Repair", CUSTOM: "Custom",
};

const WARNING_COLORS: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700 border-blue-200",
  NORMAL: "bg-gray-100 text-gray-700 border-gray-200",
  IMPORTANT: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanItemsEditor({
  planId,
  initialItems,
}: {
  planId: string;
  initialItems: MaintenancePlanItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ItemFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      ruleType: "WHICHEVER_FIRST" as const,
      warningLevel: "NORMAL" as const,
      displayOrder: initialItems.length,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    data = data as ItemFormValues;
    const result = await createPlanItem(planId, data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Plan item added");
    reset();
    setShowForm(false);
    router.refresh();
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      const result = await deletePlanItem(itemId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Item deleted");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Plan Items ({initialItems.length})
          </CardTitle>
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            className="h-7 gap-1 text-xs"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Cancel" : "Add Item"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add item form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">New Plan Item</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select onValueChange={(v) => setValue("category", v as ItemFormValues["category"])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="itemName" className="text-xs">Item Name *</Label>
                <Input id="itemName" {...register("itemName")} className="h-8 text-xs" placeholder="e.g. Engine Oil Change" />
                {errors.itemName && <p className="text-xs text-destructive">{errors.itemName.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="mileageInterval" className="text-xs">Mileage Interval (km)</Label>
                <Input id="mileageInterval" type="number" {...register("mileageInterval")} className="h-8 text-xs" placeholder="e.g. 10000" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="timeIntervalMonths" className="text-xs">Time Interval (months)</Label>
                <Input id="timeIntervalMonths" type="number" {...register("timeIntervalMonths")} className="h-8 text-xs" placeholder="e.g. 12" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Rule Type</Label>
                <Select defaultValue="WHICHEVER_FIRST" onValueChange={(v) => setValue("ruleType", v as ItemFormValues["ruleType"])}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["TIME_ONLY", "MILEAGE_ONLY", "WHICHEVER_FIRST", "INSPECT_ONLY", "CONDITIONAL"].map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Warning Level</Label>
                <Select defaultValue="NORMAL" onValueChange={(v) => setValue("warningLevel", v as ItemFormValues["warningLevel"])}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["INFO", "NORMAL", "IMPORTANT", "CRITICAL"].map((w) => (
                      <SelectItem key={w} value={w} className="text-xs">{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sourceReference" className="text-xs">Source Reference</Label>
                <Input id="sourceReference" {...register("sourceReference")} className="h-8 text-xs" placeholder="e.g. Page 45, Table 3" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="displayOrder" className="text-xs">Display Order</Label>
                <Input id="displayOrder" type="number" {...register("displayOrder")} className="h-8 text-xs" />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea id="description" {...register("description")} className="text-xs resize-none" rows={2} placeholder="Optional description..." />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { reset(); setShowForm(false); }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        )}

        {/* Items list */}
        {initialItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plan items yet. Add the first one above.
          </p>
        ) : (
          <div className="space-y-2">
            {initialItems.map((item, idx) => (
              <div key={item.id}>
                {idx > 0 && <Separator />}
                <div className="flex items-start justify-between gap-3 py-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-medium text-sm">{item.itemName}</span>
                        <Badge variant="outline" className={`text-xs ${WARNING_COLORS[item.warningLevel]}`}>
                          {item.warningLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.mileageInterval && `Every ${item.mileageInterval.toLocaleString()} km`}
                        {item.mileageInterval && item.timeIntervalMonths && " or "}
                        {item.timeIntervalMonths && `${item.timeIntervalMonths} months`}
                        {!item.mileageInterval && !item.timeIntervalMonths && "No interval set"}
                        {" · "}
                        {item.ruleType.replace("_", " ")}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
