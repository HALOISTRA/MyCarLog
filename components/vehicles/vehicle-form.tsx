"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/types";
import { createVehicle, updateVehicle } from "@/app/actions/vehicles";

// ─── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  make: z.string().min(1, "Make is required / Marka je obavezna"),
  model: z.string().min(1, "Model is required / Model je obavezan"),
  year: z.coerce
    .number()
    .int()
    .min(1886, "Year too old")
    .max(new Date().getFullYear() + 2, "Year too far in future"),
  trim: z.string().optional(),
  generation: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  engine: z.string().optional(),
  engineCode: z.string().optional(),
  fuelType: z
    .enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG", "HYDROGEN", "OTHER"])
    .default("PETROL"),
  transmission: z
    .enum(["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER"])
    .default("MANUAL"),
  drivetrain: z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]).default("FWD"),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  marketRegion: z.string().optional(),
  currentMileage: z.coerce.number().int().min(0).default(0),
  mileageUnit: z.enum(["KM", "MI"]).default("KM"),
  purchaseDate: z.string().optional(),
  purchaseMileage: z.coerce.number().int().min(0).optional().or(z.literal("")),
  nickname: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  imageKey: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface VehicleFormProps {
  mode: "create" | "edit";
  vehicleId?: string;
  defaultValues?: Partial<FormValues>;
  onSuccess?: (vehicleId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1885 }, (_, i) => currentYear + 1 - i);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VehicleForm({
  mode,
  vehicleId,
  defaultValues,
  onSuccess,
}: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.imageUrl ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      fuelType: "PETROL",
      transmission: "MANUAL",
      drivetrain: "FWD",
      mileageUnit: "KM",
      currentMileage: 0,
      ...defaultValues,
    },
  });

  const watchedFuelType = watch("fuelType");
  const watchedTransmission = watch("transmission");
  const watchedDrivetrain = watch("drivetrain");
  const watchedMileageUnit = watch("mileageUnit");

  // Image preview handler (client-side only; actual upload via storage API)
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setValue("imageUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setValue("imageUrl", "");
    setValue("imageKey", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        purchaseMileage: values.purchaseMileage === "" ? undefined : values.purchaseMileage,
      };

      let result;
      if (mode === "create") {
        result = await createVehicle(payload);
      } else {
        if (!vehicleId) throw new Error("vehicleId missing for edit");
        result = await updateVehicle(vehicleId, payload);
      }

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      const newId = (result.data as { id: string }).id;
      toast.success(mode === "create" ? "Vehicle added!" : "Vehicle updated!");

      if (onSuccess) {
        onSuccess(newId);
      } else {
        router.push(`/garage/${newId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
      {/* ── Image upload ─────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle>Photo / Fotografija</SectionTitle>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "relative flex h-32 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted transition-colors",
              !imagePreview && "cursor-pointer hover:border-primary hover:bg-primary/5"
            )}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            role={imagePreview ? undefined : "button"}
            tabIndex={imagePreview ? undefined : 0}
            onKeyDown={(e) => {
              if (!imagePreview && (e.key === "Enter" || e.key === " ")) {
                fileInputRef.current?.click();
              }
            }}
          >
            {imagePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vehicle preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                  }}
                  className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-0.5 text-foreground backdrop-blur-sm hover:bg-background transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs text-center px-2">Click to upload</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageChange}
              aria-label="Upload vehicle photo"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:border-slate-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {imagePreview ? "Change photo" : "Upload photo"}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. Max 10&nbsp;MB.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Identity ─────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Vehicle Identity / Identitet vozila</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="make">
              Make <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground">(Marka)</span>
            </Label>
            <Input
              id="make"
              placeholder="e.g. Volkswagen"
              {...register("make")}
              aria-invalid={!!errors.make}
            />
            <FieldError message={errors.make?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">
              Model <span className="text-destructive">*</span>
            </Label>
            <Input
              id="model"
              placeholder="e.g. Golf"
              {...register("model")}
              aria-invalid={!!errors.model}
            />
            <FieldError message={errors.model?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">
              Year <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground">(Godina)</span>
            </Label>
            <Input
              id="year"
              type="number"
              placeholder={String(currentYear)}
              min={1886}
              max={currentYear + 2}
              {...register("year")}
              aria-invalid={!!errors.year}
            />
            <FieldError message={errors.year?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="trim">
              Trim / Varijanta
            </Label>
            <Input id="trim" placeholder="e.g. GTI, Sport" {...register("trim")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="generation">Generation / Generacija</Label>
            <Input id="generation" placeholder="e.g. Mk7, B8" {...register("generation")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname / Nadimak</Label>
            <Input id="nickname" placeholder="e.g. The Beast" {...register("nickname")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Color / Boja</Label>
            <Input id="color" placeholder="e.g. Midnight Blue" {...register("color")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              placeholder="17-character VIN"
              maxLength={17}
              {...register("vin")}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plate">
              Plate / Registracija
            </Label>
            <Input
              id="plate"
              placeholder="e.g. ZG-1234-AB"
              {...register("plate")}
              className="font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bodyType">Body Type / Karoserija</Label>
            <Input id="bodyType" placeholder="e.g. Sedan, Hatchback, SUV" {...register("bodyType")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marketRegion">Market Region / Tržište</Label>
            <Input id="marketRegion" placeholder="e.g. EU, US, HR" {...register("marketRegion")} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Engine & Drivetrain ───────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Engine & Drivetrain / Motor i pogon</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="engine">Engine / Motor</Label>
            <Input id="engine" placeholder="e.g. 2.0 TDI, 1.6i" {...register("engine")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="engineCode">Engine Code / Šifra motora</Label>
            <Input id="engineCode" placeholder="e.g. CJAA, B4204T" {...register("engineCode")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Fuel Type / Gorivo</Label>
            <Select
              value={watchedFuelType}
              onValueChange={(v) =>
                setValue("fuelType", v as FormValues["fuelType"])
              }
            >
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FUEL_TYPE_LABELS).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {labels.en} / {labels.hr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmission / Mjenjač</Label>
            <Select
              value={watchedTransmission}
              onValueChange={(v) =>
                setValue("transmission", v as FormValues["transmission"])
              }
            >
              <SelectTrigger id="transmission">
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRANSMISSION_LABELS).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {labels.en} / {labels.hr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drivetrain">Drivetrain / Pogon</Label>
            <Select
              value={watchedDrivetrain}
              onValueChange={(v) =>
                setValue("drivetrain", v as FormValues["drivetrain"])
              }
            >
              <SelectTrigger id="drivetrain">
                <SelectValue placeholder="Select drivetrain" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DRIVETRAIN_LABELS).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {labels.en} / {labels.hr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Mileage ───────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Mileage / Kilometraža</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="currentMileage">
              Current Mileage <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground">(Trenutna km)</span>
            </Label>
            <Input
              id="currentMileage"
              type="number"
              min={0}
              placeholder="0"
              {...register("currentMileage")}
              aria-invalid={!!errors.currentMileage}
            />
            <FieldError message={errors.currentMileage?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mileageUnit">Unit / Jedinica</Label>
            <Select
              value={watchedMileageUnit}
              onValueChange={(v) =>
                setValue("mileageUnit", v as FormValues["mileageUnit"])
              }
            >
              <SelectTrigger id="mileageUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KM">km</SelectItem>
                <SelectItem value="MI">mi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Purchase info ─────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Purchase Info / Kupnja</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="purchaseDate">Purchase Date / Datum kupnje</Label>
            <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchaseMileage">
              Mileage at Purchase / Km pri kupnji
            </Label>
            <Input
              id="purchaseMileage"
              type="number"
              min={0}
              placeholder="0"
              {...register("purchaseMileage")}
            />
            <FieldError message={errors.purchaseMileage?.message} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Notes ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Notes / Bilješke (private)</SectionTitle>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes / Bilješke</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Any private notes about this vehicle..."
            {...register("notes")}
          />
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:border-slate-700"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-32">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create"
            ? isSubmitting ? "Saving..." : "Save Vehicle / Spremi vozilo"
            : isSubmitting ? "Saving..." : "Update Vehicle / Spremi"}
        </Button>
      </div>
    </form>
  );
}

export default VehicleForm;
