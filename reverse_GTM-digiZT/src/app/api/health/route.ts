import { NextResponse } from "next/server";
import { isLlmEnabled } from "@/lib/llm/client";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: "ok", llm_enabled: isLlmEnabled() });
}
