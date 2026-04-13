import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { FileText, ExternalLink, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
type PlanVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";

const STATUS_CONFIG: Record<
  PlanVerificationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  VERIFIED: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    icon: AlertTriangle,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  REJECTED: {
    label: "Rejected",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export default async function AdminSourcesPage() {
  await requireAdmin();

  const sources = await prisma.maintenancePlanSourceDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { plans: true } },
      uploadedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Source Documents</h1>
          <p className="text-muted-foreground">
            {sources.length} document{sources.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Upload button — for now a placeholder; full upload via admin actions */}
        <Button variant="outline" disabled className="gap-1.5">
          <FileText className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Plans</th>
                  <th className="px-4 py-3 font-medium">Uploaded By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No source documents yet
                    </td>
                  </tr>
                )}
                {sources.map((doc: typeof sources[number]) => {
                  const statusCfg = STATUS_CONFIG[doc.verificationStatus as PlanVerificationStatus];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            {doc.yearRange && (
                              <p className="text-xs text-muted-foreground">
                                {doc.yearRange}
                                {doc.marketRegion && ` · ${doc.marketRegion}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {doc.make} {doc.model}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {doc.sourceType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc._count.plans > 0 ? (
                          <Link
                            href={`/admin/plans?sourceDocumentId=${doc.id}`}
                            className="text-primary hover:underline"
                          >
                            {doc._count.plans}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {doc.uploadedBy
                          ? doc.uploadedBy.name ?? doc.uploadedBy.email
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(doc.createdAt, "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={statusCfg.className}
                        >
                          <span className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {doc.fileUrl ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No file</span>
                        )}
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
