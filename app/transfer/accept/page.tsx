import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Wrench,
  DollarSign,
  StickyNote,
  MessageSquare,
} from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AcceptTransferButton } from "./accept-button";

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptTransferPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidToken message="No transfer token provided." />;
  }

  // Check auth — redirect to login if not logged in
  const session = await getSession();
  if (!session?.user) {
    redirect(`/auth/login?redirect=/transfer/accept?token=${token}`);
  }

  // Load transfer
  const transfer = await prisma.ownershipTransfer.findUnique({
    where: { token },
    include: {
      vehicle: true,
      fromUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!transfer) {
    return <InvalidToken message="Transfer not found. The link may be invalid." />;
  }

  const isExpired = transfer.expiresAt < new Date() || transfer.status === "EXPIRED";
  const isCancelled = transfer.status === "CANCELLED";
  const isAccepted = transfer.status === "ACCEPTED";

  if (isCancelled) {
    return (
      <StatusPage
        icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
        title="Transfer Cancelled"
        description="This transfer request has been cancelled by the sender."
      />
    );
  }

  if (isExpired) {
    return (
      <StatusPage
        icon={<Clock className="h-8 w-8 text-muted-foreground" />}
        title="Transfer Expired"
        description="This transfer link has expired. Please ask the sender to initiate a new transfer."
      />
    );
  }

  if (isAccepted) {
    return (
      <StatusPage
        icon={<CheckCircle2 className="h-8 w-8 text-green-600" />}
        title="Transfer Already Accepted"
        description="This transfer has already been completed."
        action={
          <Button asChild>
            <Link href="/garage">Go to My Garage</Link>
          </Button>
        }
      />
    );
  }

  const { vehicle, fromUser } = transfer;
  const senderName = fromUser.name ?? fromUser.email;

  // Check if current user email matches toEmail
  const emailMismatch =
    session.user.email?.toLowerCase() !== transfer.toEmail.toLowerCase();

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Vehicle Transfer</h1>
          <p className="mt-1 text-muted-foreground">
            <strong>{senderName}</strong> wants to transfer a vehicle to you
          </p>
        </div>

        {/* Email mismatch warning */}
        {emailMismatch && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This transfer was sent to <strong>{transfer.toEmail}</strong>, but
              you are logged in as <strong>{session.user.email}</strong>. Please
              log in with the correct email address to accept this transfer.
            </AlertDescription>
          </Alert>
        )}

        {/* Vehicle card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
              {vehicle.trim && (
                <Badge variant="outline">{vehicle.trim}</Badge>
              )}
            </div>
            {vehicle.engine && (
              <p className="text-sm text-muted-foreground">{vehicle.engine}</p>
            )}
            {vehicle.vin && (
              <p className="font-mono text-xs text-muted-foreground">
                VIN: {vehicle.vin}
              </p>
            )}
            <Separator className="my-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Offer expires{" "}
                <strong className="text-foreground">
                  {format(new Date(transfer.expiresAt), "dd MMM yyyy, HH:mm")}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* What's included */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What&apos;s Included</CardTitle>
            <CardDescription>The sender has chosen to share the following</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <TransferItem
                icon={Wrench}
                label="Maintenance history"
                included={transfer.includeServiceHistory}
              />
              <TransferItem
                icon={FileText}
                label="Document copies"
                included={transfer.includeDocuments}
              />
              <TransferItem
                icon={DollarSign}
                label="Cost information"
                included={transfer.includeCosts}
              />
              <TransferItem
                icon={StickyNote}
                label="Private notes"
                included={transfer.includePrivateNotes}
              />
            </ul>
          </CardContent>
        </Card>

        {/* Sender message */}
        {transfer.message && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Message from {senderName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{transfer.message}&rdquo;
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {!emailMismatch && (
          <div className="space-y-3">
            <Suspense fallback={null}>
              <AcceptTransferButton token={token} vehicleId={vehicle.id} />
            </Suspense>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t want this vehicle?{" "}
                <span className="font-medium text-foreground">
                  Simply ignore this email — the transfer will expire automatically.
                </span>
              </p>
            </div>
          </div>
        )}

        {emailMismatch && (
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href={`/auth/login?redirect=/transfer/accept?token=${token}`}>
                Log in with {transfer.toEmail}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TransferItem({
  icon: Icon,
  label,
  included,
}: {
  icon: React.ElementType;
  label: string;
  included: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icon
        className={`h-4 w-4 shrink-0 ${included ? "text-primary" : "text-muted-foreground/40"}`}
      />
      <span className={included ? "text-foreground" : "text-muted-foreground line-through"}>
        {label}
      </span>
      {included ? (
        <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-green-600" />
      ) : null}
    </li>
  );
}

function InvalidToken({ message }: { message: string }) {
  return (
    <StatusPage
      icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
      title="Invalid Transfer"
      description={message}
      action={
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      }
    />
  );
}

function StatusPage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}
