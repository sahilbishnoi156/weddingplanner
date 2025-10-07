import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const rows = await prisma.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const name = (body?.name || "").trim()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const created = await prisma.city.create({ data: { name }, select: { id: true, name: true } })
    return NextResponse.json(created)
  } catch (err: any) {
    // Handle unique constraint
    if (err?.code === "P2002") {
      return NextResponse.json({ error: `City '${name}' already exists.` }, { status: 409 })
    }
    return NextResponse.json({ error: "could not create city" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = Number(body?.id)
  const name = (body?.name || "").trim()
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 })
  try {
    const updated = await prisma.city.update({ where: { id }, data: { name }, select: { id: true, name: true } })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `City '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not update city" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const id = Number(body?.id)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    // Disassociate guests before deleting city so guests remain
    await prisma.guest.updateMany({ where: { cityId: id }, data: { cityId: null } })
    await prisma.city.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "could not delete city" }, { status: 500 })
  }
}
