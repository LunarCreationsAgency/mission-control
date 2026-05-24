import { NextResponse } from "next/server";
import { pbUpdateCompanySettings } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const settings = await pbUpdateCompanySettings(id, body);
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PATCH /api/company-settings/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
