"use client";

import { useState, useRef, useEffect, use } from "react";
import { Shield, Lock, ArrowRight, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PinPage({ params }: Props) {
  const { token } = use(params);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${token}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Incorrect PIN. Please try again.");
        setPin("");
        inputRef.current?.focus();
        return;
      }

      // Redirect to share page (cookie is now set by the API)
      window.location.href = `/share/${token}`;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 dark:bg-blue-700 px-6 py-8 text-white text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold">PIN Required</h1>
            <p className="text-blue-100 text-sm mt-1">
              This vehicle profile is PIN protected
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="pin-input" className="text-sm font-medium">
                Enter 4-digit PIN
              </Label>
              <Input
                id="pin-input"
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                placeholder="••••"
                className="text-center text-2xl tracking-widest font-mono h-12"
                autoComplete="one-time-code"
                disabled={loading}
              />
              {error && (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={pin.length !== 4 || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verifying…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  View Vehicle Profile
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Vehicle Passport</span>
        </div>
      </div>
    </div>
  );
}
