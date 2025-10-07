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
  const created = await prisma.city.upsert({
    where: { name },
    create: { name },
    update: { name },
    select: { id: true, name: true },
  })
  return NextResponse.json(created)
}
