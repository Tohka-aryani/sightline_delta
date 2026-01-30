import { NextRequest, NextResponse } from "next/server";
import { translateToEnglish } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<{ translated: string[] } | { error: string }>> {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = body?.names;
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { error: "Body must include 'names' array" },
        { status: 400 }
      );
    }
    const names = raw.map((n: unknown) => String(n ?? ""));

    const translated = await translateToEnglish(names);
    return NextResponse.json({ translated });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
