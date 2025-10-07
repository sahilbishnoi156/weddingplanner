import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/code";

export async function POST() {
  // generate a unique code with retries
  const MAX = 6;
  let code = "";
  for (let i = 0; i < MAX; i++) {
    const candidate = generateCode(6);
    const exists = await prisma.wedding.findUnique({ where: { code: candidate } });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) return NextResponse.json({ error: "could not generate code" }, { status: 500 });

  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const created = await prisma.wedding.create({ data: { code, expiresAt }, select: { id: true, code: true, expiresAt: true } });
  return NextResponse.json(created);
}
