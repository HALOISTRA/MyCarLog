import { NextRequest } from "next/server";
import { expireOldTransfers } from "@/app/actions/transfers";

// GET /api/cron/expire-transfers
// Protected by Bearer token — expires pending transfers whose expiresAt has passed.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireOldTransfers();

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    console.log(
      `[cron/expire-transfers] expired ${result.data.count} transfers`
    );

    return Response.json({ ok: true, expiredCount: result.data.count });
  } catch (err) {
    console.error("[cron/expire-transfers]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
