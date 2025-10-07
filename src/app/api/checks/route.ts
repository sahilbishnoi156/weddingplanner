import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveWeddingId } from "@/lib/wedding"

async function getWeddingIdFromRequest(request: Request) {
  const header = request.headers.get("x-wedding-code")
  return await resolveWeddingId(header || undefined)
}

export async function POST(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const guestId = Number(body?.guestId)
  const categoryId = Number(body?.categoryId)
  const checked = Boolean(body?.checked)
  if (!guestId || !categoryId) {
    return NextResponse.json({ error: "guestId and categoryId required" }, { status: 400 })
  }

  // Ensure guest and category belong to the wedding
  const [g, c] = await Promise.all([
    prisma.guest.findFirst({ where: { id: guestId, weddingId }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: categoryId, weddingId }, select: { id: true } }),
  ])
  if (!g || !c) return NextResponse.json({ error: "guest or category not found" }, { status: 404 })

  const res = await prisma.check.upsert({
    where: { guestId_categoryId: { guestId, categoryId } },
    update: { checked },
    create: { guestId, categoryId, checked, weddingId },
    select: { guestId: true, categoryId: true, checked: true },
  })
  return NextResponse.json({ guest_id: res.guestId, category_id: res.categoryId, checked: res.checked })
}
