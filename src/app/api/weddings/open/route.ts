import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCode, isValidCode } from "@/lib/code";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = String(body?.code || "");
    const code = normalizeCode(raw);
    if (!isValidCode(code)) return NextResponse.json({ error: "invalid code" }, { status: 400 });

    const wedding = await prisma.wedding.findFirst({ where: { code, expiresAt: { gt: new Date() } }, select: { id: true, code: true, expiresAt: true } });
    if (!wedding) return NextResponse.json({ error: "not found or expired" }, { status: 404 });
    return NextResponse.json(wedding);
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
