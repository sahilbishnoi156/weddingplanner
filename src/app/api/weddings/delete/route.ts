import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeCode, isValidCode } from "@/lib/code"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const raw = String(body?.code || "")
    const code = normalizeCode(raw)
    if (!isValidCode(code)) return NextResponse.json({ error: "invalid code" }, { status: 400 })

    // delete wedding and cascade via relations (Prisma configured onDelete: Cascade)
    await prisma.wedding.deleteMany({ where: { code } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "server error" }, { status: 500 })
  }
}
