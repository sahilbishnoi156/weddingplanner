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
  const rows = await prisma.category.findMany({ where: { weddingId }, orderBy: { id: "asc" }, select: { id: true, name: true, type: true } })
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const name = (body?.name || "").trim()
  const type = (body?.type || "checkbox").trim() || "checkbox"
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const created = await prisma.category.create({ data: { name, type, weddingId }, select: { id: true, name: true, type: true } })
    return NextResponse.json(created)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `Column '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not create category" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const id = Number(body?.id)
  const name = (body?.name || "").trim()
  const type = (body?.type || "checkbox").trim() || "checkbox"
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 })
  try {
    const updated = await prisma.category.updateMany({ where: { id, weddingId }, data: { name, type } })
    if (updated.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
    const row = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true, type: true } })
    return NextResponse.json(row)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `Column '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not update category" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const id = Number(body?.id)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await prisma.check.deleteMany({ where: { categoryId: id, weddingId } })
    const del = await prisma.category.deleteMany({ where: { id, weddingId } })
    if (del.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "could not delete category" }, { status: 500 })
  }
}
