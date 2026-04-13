"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptTransfer } from "@/app/actions/transfers";

interface AcceptTransferButtonProps {
  token: string;
  vehicleId: string;
}

export function AcceptTransferButton({
  token,
  vehicleId,
}: AcceptTransferButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    const result = await acceptTransfer(token);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Vehicle transfer accepted! Welcome to your new vehicle.");
    router.push(`/garage/${result.data.vehicleId}`);
  }

  return (
    <Button
      size="lg"
      className="w-full gap-2"
      onClick={handleAccept}
      disabled={loading}
    >
      <CheckCircle2 className="h-5 w-5" />
      {loading ? "Accepting Transfer..." : "Accept Transfer"}
    </Button>
  );
}
