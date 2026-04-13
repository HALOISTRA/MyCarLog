"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Car, MailCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      const body = await res.json().catch(() => ({}));
      setServerError(body.message ?? "Something went wrong. Please try again.");
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-2">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{getValues("email")}</span>,
            we&apos;ve sent password reset instructions.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <Car className="h-6 w-6 text-primary" />
            Vehicle Passport
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Forgot your password?</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            No worries — enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          {serverError && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                  errors.email ? "border-destructive focus:ring-destructive/30" : "border-input"
                )}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground",
                "px-4 py-2.5 text-sm font-semibold",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
