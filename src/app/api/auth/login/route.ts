import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Simple hardcoded auth for now — replace with proper PocketBase auth later
    if (email !== "dustin@lunarcreations.de" && email !== "dustin.wulf@web.de") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (password !== "Du_752100!66") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession("dustin-wulf");

    const response = NextResponse.json({ success: true, user: { name: "Dustin W", email } });
    response.cookies.set("mc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("POST /api/auth/login:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 500 }
    );
  }
}
