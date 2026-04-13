import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TransfersFilter } from "./transfers-filter";
type TransferStatus = "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_CONFIG: Record<
  TransferStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export default async function AdminTransfersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status } = await searchParams;

  const where = status ? { status: status as TransferStatus } : {};

  const transfers = await prisma.ownershipTransfer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
        select: { id: true, make: true, model: true, year: true },
      },
      fromUser: {
        select: { id: true, name: true, email: true },
      },
      toUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ownership Transfers</h1>
        <p className="text-muted-foreground">{transfers.length} transfer{transfers.length !== 1 ? "s" : ""}</p>
      </div>

      <TransfersFilter currentStatus={status} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">To</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Initiated</th>
                  <th className="px-4 py-3 font-medium">Expires / Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transfers found
                    </td>
                  </tr>
                )}
                {transfers.map((transfer: typeof transfers[number]) => {
                  const cfg = STATUS_CONFIG[transfer.status as TransferStatus];
                  const resolvedAt = transfer.acceptedAt ?? transfer.cancelledAt;

                  return (
                    <tr key={transfer.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {transfer.vehicle.year} {transfer.vehicle.make}{" "}
                            {transfer.vehicle.model}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {transfer.vehicle.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium">
                            {transfer.fromUser.name ?? "—"}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {transfer.fromUser.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {transfer.toUser ? (
                          <div>
                            <p className="text-xs font-medium">
                              {transfer.toUser.name ?? "—"}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {transfer.toUser.email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-mono text-muted-foreground">
                            {transfer.toEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(transfer.createdAt, "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {resolvedAt
                          ? format(resolvedAt, "dd MMM yyyy")
                          : transfer.expiresAt < new Date()
                          ? <span className="text-red-600">Expired {format(transfer.expiresAt, "dd MMM")}</span>
                          : `Exp. ${format(transfer.expiresAt, "dd MMM yyyy")}`
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
