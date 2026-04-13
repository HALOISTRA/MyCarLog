"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPlan } from "@/app/actions/admin";

export function VerifyPlanButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyPlan(planId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Plan marked as verified");
        router.refresh();
      }
    });
  }

  return (
    <Button
      onClick={handleVerify}
      disabled={isPending}
      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
    >
      <ShieldCheck className="h-4 w-4" />
      {isPending ? "Verifying..." : "Verify Plan"}
    </Button>
  );
}
