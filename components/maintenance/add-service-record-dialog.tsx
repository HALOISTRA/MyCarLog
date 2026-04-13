"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMaintenanceRecord } from "@/app/actions/maintenance";
import { MAINTENANCE_CATEGORY_LABELS } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const CURRENCIES = ["EUR", "USD", "GBP", "HRK", "CHF", "SEK", "NOK", "DKK"];

const formSchema = z.object({
  performedAt: z.string().min(1, "Date is required"),
  mileageAtService: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  partsUsed: z.string().max(2000).optional(),
  laborNotes: z.string().max(2000).optional(),
  workshopName: z.string().max(200).optional(),
  costAmount: z.string().optional(),
  currency: z.string().default("EUR"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = Object.entries(MAINTENANCE_CATEGORY_LABELS).map(
  ([value, labels]) => ({
    value,
    label: `${labels.en} / ${labels.hr}`,
  })
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddServiceRecordDialogProps {
  vehicleId: string;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddServiceRecordDialog({
  vehicleId,
  onSuccess,
}: AddServiceRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      performedAt: format(new Date(), "yyyy-MM-dd"),
      currency: "EUR",
    },
  });

  const currency = watch("currency");
  const category = watch("category");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await createMaintenanceRecord(vehicleId, {
        performedAt: new Date(values.performedAt),
        mileageAtService: values.mileageAtService
          ? parseInt(values.mileageAtService, 10)
          : null,
        category: values.category,
        title: values.title,
        description: values.description || null,
        partsUsed: values.partsUsed || null,
        laborNotes: values.laborNotes || null,
        workshopName: values.workshopName || null,
        costAmount: values.costAmount
          ? parseFloat(values.costAmount)
          : null,
        currency: values.currency,
      });

      if (result.success) {
        toast.success("Service record added successfully");
        reset({
          performedAt: format(new Date(), "yyyy-MM-dd"),
          currency: "EUR",
        });
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Failed to add record");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Service Record
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Service Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
          {/* Row: Date + Mileage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="performedAt">
                Date performed <span className="text-red-500">*</span>
              </Label>
              <Input
                id="performedAt"
                type="date"
                {...register("performedAt")}
              />
              {errors.performedAt && (
                <p className="text-xs text-red-500">
                  {errors.performedAt.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mileageAtService">Mileage at service</Label>
              <Input
                id="mileageAtService"
                type="number"
                min={0}
                placeholder="e.g. 85000"
                {...register("mileageAtService")}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setValue("category", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Full oil change + filter"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Workshop */}
          <div className="space-y-1.5">
            <Label htmlFor="workshopName">Workshop / Service centre</Label>
            <Input
              id="workshopName"
              placeholder="e.g. AutoService Zagreb"
              {...register("workshopName")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What was done during this service?"
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Parts used */}
          <div className="space-y-1.5">
            <Label htmlFor="partsUsed">Parts used</Label>
            <Textarea
              id="partsUsed"
              placeholder="List parts replaced or used"
              rows={2}
              {...register("partsUsed")}
            />
          </div>

          {/* Labor notes */}
          <div className="space-y-1.5">
            <Label htmlFor="laborNotes">Labor notes</Label>
            <Textarea
              id="laborNotes"
              placeholder="Any notes about the labor performed"
              rows={2}
              {...register("laborNotes")}
            />
          </div>

          {/* Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="costAmount">Cost (optional)</Label>
              <Input
                id="costAmount"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("costAmount")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
