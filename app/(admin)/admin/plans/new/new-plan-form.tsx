"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { createMaintenancePlan } from "@/app/actions/admin";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  generation: z.string().optional(),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
  engine: z.string().optional(),
  engineCode: z.string().optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG", "HYDROGEN", "OTHER"]).optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER"]).optional(),
  marketRegion: z.string().optional(),
  sourceDocumentId: z.string().optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "NEEDS_REVIEW"]),
  sourceLabel: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SourceDoc {
  id: string;
  title: string;
  make: string;
  model: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewPlanForm({ sourceDocs }: { sourceDocs: SourceDoc[] }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      verificationStatus: "PENDING" as const,
    },
  });

  async function onSubmit(data: FormValues) {
    const result = await createMaintenancePlan(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Maintenance plan created");
    router.push(`/admin/plans/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vehicle Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="make">Make <span className="text-destructive">*</span></Label>
            <Input id="make" {...register("make")} placeholder="e.g. Toyota" />
            {errors.make && <p className="text-xs text-destructive">{errors.make.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Model <span className="text-destructive">*</span></Label>
            <Input id="model" {...register("model")} placeholder="e.g. Corolla" />
            {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trim">Trim</Label>
            <Input id="trim" {...register("trim")} placeholder="e.g. Comfort" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="generation">Generation</Label>
            <Input id="generation" {...register("generation")} placeholder="e.g. E210" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearFrom">Year From</Label>
            <Input id="yearFrom" type="number" {...register("yearFrom")} placeholder="e.g. 2018" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearTo">Year To</Label>
            <Input id="yearTo" type="number" {...register("yearTo")} placeholder="e.g. 2023" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="engine">Engine</Label>
            <Input id="engine" {...register("engine")} placeholder="e.g. 1.6 VVT-i" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="engineCode">Engine Code</Label>
            <Input id="engineCode" {...register("engineCode")} placeholder="e.g. 1ZR-FE" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select onValueChange={(v) => setValue("fuelType", v as FormValues["fuelType"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG", "HYDROGEN", "OTHER"].map((ft) => (
                  <SelectItem key={ft} value={ft}>{ft.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmission</Label>
            <Select onValueChange={(v) => setValue("transmission", v as FormValues["transmission"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                {["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="marketRegion">Market Region</Label>
            <Input id="marketRegion" {...register("marketRegion")} placeholder="e.g. EU, US, JP" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Source & Verification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Source Document</Label>
            <Select onValueChange={(v) => setValue("sourceDocumentId", v === "__none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {sourceDocs.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title} ({doc.make} {doc.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Verification Status</Label>
            <Select
              defaultValue="PENDING"
              onValueChange={(v) => setValue("verificationStatus", v as FormValues["verificationStatus"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["PENDING", "VERIFIED", "NEEDS_REVIEW", "REJECTED"].map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sourceLabel">Source Label</Label>
            <Input
              id="sourceLabel"
              {...register("sourceLabel")}
              placeholder="e.g. Official Toyota Service Manual 2018-2023"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Internal notes about this plan..."
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
