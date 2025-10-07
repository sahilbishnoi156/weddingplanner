import { prisma } from "@/lib/prisma";
import { normalizeCode, isValidCode } from "./code";

export async function resolveWeddingId(codeRaw?: string | null) {
  const code = normalizeCode(codeRaw || "");
  if (!isValidCode(code)) return null;
  const w = await prisma.wedding.findFirst({ where: { code, expiresAt: { gt: new Date() } }, select: { id: true } });
  return w?.id ?? null;
}
