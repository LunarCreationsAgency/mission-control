import { NextRequest, NextResponse } from "next/server";
import { runWorkerCycle } from "@/lib/agent-worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/worker/run
 * Triggers one cycle of the agent worker loop.
 * Can be called via cron, OpenClaw heartbeat, or manually.
 * 
 * Optional body: { secret?: string } — if WORKER_SECRET is set, must match.
 */
export async function POST(req: NextRequest) {
  // Optional secret check
  const secret = process.env.WORKER_SECRET;
  if (secret) {
    const body = await req.json().catch(() => ({}));
    if (body.secret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  const { executed, errors } = await runWorkerCycle();
  const duration = Date.now() - start;

  return NextResponse.json({
    ok: true,
    executed,
    errors,
    duration_ms: duration,
  });
}

/**
 * GET /api/worker/run
 * Health check — returns status without executing.
 */
export async function GET() {
  return NextResponse.json({ ok: true, status: "ready" });
}
