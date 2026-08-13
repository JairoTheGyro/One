import { NextResponse } from "next/server";
import { modelRegistry } from "@/lib/models/registry";

export async function GET() {
  return NextResponse.json({ models: modelRegistry });
}
