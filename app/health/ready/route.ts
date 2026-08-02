import { NextResponse } from "next/server"; import { getPrismaClient } from "@/lib/db/prisma";
export const dynamic = "force-dynamic";
export async function GET() { try { await getPrismaClient().$queryRawUnsafe("SELECT 1"); return NextResponse.json({ status: "ready" }, { headers: { "cache-control": "no-store" } }); } catch { return NextResponse.json({ status: "not_ready" }, { status: 503, headers: { "cache-control": "no-store" } }); } }
