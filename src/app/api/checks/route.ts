import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.json()
  const guestId = Number(body?.guestId)
  const categoryId = Number(body?.categoryId)
  const checked = Boolean(body?.checked)
  if (!guestId || !categoryId) {
    return NextResponse.json({ error: "guestId and categoryId required" }, { status: 400 })
  }

  const res = await prisma.check.upsert({
    where: { guestId_categoryId: { guestId, categoryId } },
    update: { checked },
    create: { guestId, categoryId, checked },
    select: { guestId: true, categoryId: true, checked: true },
  })
  return NextResponse.json({ guest_id: res.guestId, category_id: res.categoryId, checked: res.checked })
}
