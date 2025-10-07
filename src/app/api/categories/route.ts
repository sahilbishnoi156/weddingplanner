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
  const created = await prisma.category.upsert({
    where: { name },
    create: { name, type },
    update: { name, type },
    select: { id: true, name: true, type: true },
  })
  return NextResponse.json(created)
}
