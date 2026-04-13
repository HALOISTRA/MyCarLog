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
import { createReminder } from "@/app/actions/reminders";
import { MAINTENANCE_CATEGORY_LABELS } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    category: z.string().min(1, "Category is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    dueDate: z.string().optional(),
    dueMileage: z.string().optional(),
    leadTimeDays: z.string().default("30"),
    recurrenceType: z.enum(["none", "months", "km"]).default("none"),
    recurrenceValue: z.string().optional(),
  })
  .refine((d) => d.dueDate || d.dueMileage, {
    message: "At least one of due date or due mileage is required",
    path: ["dueDate"],
  });

type FormValues = z.infer<typeof formSchema>;

// ─── Constant options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = Object.entries(MAINTENANCE_CATEGORY_LABELS).map(
  ([value, labels]) => ({
    value,
    label: `${labels.en} / ${labels.hr}`,
  })
);

const LEAD_TIME_OPTIONS = [
  { value: "60", label: "60 days before" },
  { value: "30", label: "30 days before" },
  { value: "14", label: "14 days before" },
  { value: "7", label: "7 days before" },
  { value: "3", label: "3 days before" },
  { value: "1", label: "1 day before" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddReminderDialogProps {
  vehicleId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddReminderDialog({
  vehicleId,
  onSuccess,
  trigger,
}: AddReminderDialogProps) {
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
      leadTimeDays: "30",
      recurrenceType: "none",
    },
  });

  const category = watch("category");
  const leadTimeDays = watch("leadTimeDays");
  const recurrenceType = watch("recurrenceType");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // Build recurrence rule
      let recurrenceRule: { intervalMonths?: number; intervalKm?: number } | null = null;
      if (values.recurrenceType !== "none" && values.recurrenceValue) {
        const val = parseInt(values.recurrenceValue, 10);
        if (!isNaN(val) && val > 0) {
          recurrenceRule =
            values.recurrenceType === "months"
              ? { intervalMonths: val }
              : { intervalKm: val };
        }
      }

      const result = await createReminder(vehicleId, {
        category: values.category,
        title: values.title,
        description: values.description || null,
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        dueMileage: values.dueMileage
          ? parseInt(values.dueMileage, 10)
          : null,
        leadTimeDays: parseInt(values.leadTimeDays, 10),
        recurrenceRule,
      });

      if (result.success) {
        toast.success("Reminder added successfully");
        reset({
          leadTimeDays: "30",
          recurrenceType: "none",
        });
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Failed to add reminder");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setValue("category", v, { shouldValidate: true })
              }
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
              placeholder="e.g. Change engine oil"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any notes about this reminder"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Due date + mileage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueMileage">Due mileage (km)</Label>
              <Input
                id="dueMileage"
                type="number"
                min={0}
                placeholder="e.g. 100000"
                {...register("dueMileage")}
              />
            </div>
          </div>
          {errors.dueDate && (
            <p className="text-xs text-red-500">{errors.dueDate.message}</p>
          )}

          {/* Lead time */}
          <div className="space-y-1.5">
            <Label>Notify me</Label>
            <Select
              value={leadTimeDays}
              onValueChange={(v) => setValue("leadTimeDays", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  value={recurrenceType}
                  onValueChange={(v) =>
                    setValue(
                      "recurrenceType",
                      v as "none" | "months" | "km"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No recurrence</SelectItem>
                    <SelectItem value="months">Every N months</SelectItem>
                    <SelectItem value="km">Every N km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recurrenceType !== "none" && (
                <Input
                  type="number"
                  min={1}
                  placeholder={recurrenceType === "months" ? "e.g. 12" : "e.g. 15000"}
                  className="w-32"
                  {...register("recurrenceValue")}
                />
              )}
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
              {submitting ? "Saving…" : "Save reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
