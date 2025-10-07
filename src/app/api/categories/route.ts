import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const rows = await prisma.category.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, type: true } })
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const name = (body?.name || "").trim()
  const type = (body?.type || "checkbox").trim() || "checkbox"
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const created = await prisma.category.create({ data: { name, type }, select: { id: true, name: true, type: true } })
    return NextResponse.json(created)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `Column '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not create category" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = Number(body?.id)
  const name = (body?.name || "").trim()
  const type = (body?.type || "checkbox").trim() || "checkbox"
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 })
  try {
    const updated = await prisma.category.update({ where: { id }, data: { name, type }, select: { id: true, name: true, type: true } })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: `Column '${name}' already exists.` }, { status: 409 })
    return NextResponse.json({ error: "could not update category" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const id = Number(body?.id)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    // Delete checks for this category, Prisma will cascade if model configured; ensure explicit delete
    await prisma.check.deleteMany({ where: { categoryId: id } })
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "could not delete category" }, { status: 500 })
  }
}
