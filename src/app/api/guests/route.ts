import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const rows = await prisma.guest.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, cityId: true } })
  const mapped = rows.map((g) => ({ id: g.id, name: g.name, city_id: g.cityId }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const name = (body?.name || "").trim()
  const cityId = body?.cityId ?? null
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const created = await prisma.guest.create({
    data: { name, cityId },
    select: { id: true, name: true, cityId: true },
  })
  return NextResponse.json({ id: created.id, name: created.name, city_id: created.cityId })
}
