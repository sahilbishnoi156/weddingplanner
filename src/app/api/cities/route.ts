import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveWeddingId } from "@/lib/wedding"

async function getWeddingIdFromRequest(request: Request) {
  const header = request.headers.get("x-wedding-code")
  return await resolveWeddingId(header || undefined)
}

export async function GET(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json([], { status: 200 })
  const rows = await prisma.city.findMany({ where: { weddingId }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const name = (body?.name || "").trim()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const created = await prisma.city.create({ data: { name, weddingId }, select: { id: true, name: true } })
    return NextResponse.json(created)
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: `City '${name}' already exists.` }, { status: 409 })
    }
    return NextResponse.json({ error: "could not create city" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const id = Number(body?.id)
  const name = (body?.name || "").trim()
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 })
  try {
    const updated = await prisma.city.updateMany({ where: { id, weddingId }, data: { name } })
    if (updated.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
    const row = await prisma.city.findUnique({ where: { id }, select: { id: true, name: true } })
    return NextResponse.json(row)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `City '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not update city" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const id = Number(body?.id)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await prisma.guest.updateMany({ where: { cityId: id, weddingId }, data: { cityId: null } })
    const del = await prisma.city.deleteMany({ where: { id, weddingId } })
    if (del.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "could not delete city" }, { status: 500 })
  }
}
