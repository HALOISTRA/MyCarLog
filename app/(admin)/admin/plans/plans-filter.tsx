"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Pending", value: "PENDING" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Rejected", value: "REJECTED" },
];

export function PlansFilter({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleFilter(value: string) {
    const url = value ? `${pathname}?status=${value}` : pathname;
    router.push(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs",
            (currentStatus ?? "") === opt.value &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => handleFilter(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
