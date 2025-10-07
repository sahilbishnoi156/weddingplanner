import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCode, isValidCode } from "@/lib/code";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = String(body?.code || "");
    const code = normalizeCode(raw);
    if (!isValidCode(code)) return NextResponse.json({ error: "invalid code" }, { status: 400 });

    const wedding = await prisma.wedding.findUnique({ where: { code } });
    if (!wedding) return NextResponse.json({ error: "not found" }, { status: 404 });

    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const updated = await prisma.wedding.update({ where: { code }, data: { expiresAt }, select: { code: true, expiresAt: true } });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
