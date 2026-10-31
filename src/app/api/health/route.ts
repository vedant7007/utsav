import { NextResponse } from "next/server";
import { getModel } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

/** Liveness probe. Reports whether AI is configured without exposing any secret. */
export function GET(): NextResponse {
  return NextResponse.json(
    { status: "ok", ai: getModel() ? "gemini" : "offline" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
