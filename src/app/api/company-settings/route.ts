import { NextResponse } from "next/server";
import { pbGetCompanySettings } from "@/lib/pocketbase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pbGetCompanySettings();
    return NextResponse.json({ settings: (result.items as unknown[]) || [] });
  } catch (e) {
    console.error("GET /api/company-settings:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
