import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeCode, isValidCode } from "@/lib/code"

export async function GET(request: Request) {
  // Accept wedding code via header X-WEDDING-CODE or query param ?code=
  const headerCode = request.headers.get("x-wedding-code") || ""
  const url = new URL(request.url)
  const queryCode = url.searchParams.get("code") || ""
  const raw = headerCode || queryCode
  const code = normalizeCode(raw)

  if (!isValidCode(code)) {
    // Return empty arrays so client can handle no-wedding state
    return NextResponse.json({ cities: [], categories: [], guests: [], checks: [] })
  }

  const wedding = await prisma.wedding.findFirst({ where: { code }, select: { id: true } })
  if (!wedding) return NextResponse.json({ cities: [], categories: [], guests: [], checks: [] })

  const [citiesRaw, categoriesRaw, guestsRaw, checksRaw] = await Promise.all([
    prisma.city.findMany({ where: { weddingId: wedding.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { weddingId: wedding.id }, orderBy: { id: "asc" }, select: { id: true, name: true, type: true } }),
    prisma.guest.findMany({ where: { weddingId: wedding.id }, orderBy: { id: "asc" }, select: { id: true, name: true, cityId: true } }),
    prisma.check.findMany({ where: { weddingId: wedding.id }, select: { guestId: true, categoryId: true, checked: true } }),
  ])

  const cities = citiesRaw
  const categories = categoriesRaw
  const guests = guestsRaw.map((g) => ({ id: g.id, name: g.name, city_id: g.cityId }))
  const checks = checksRaw.map((c) => ({ guest_id: c.guestId, category_id: c.categoryId, checked: c.checked }))

  return NextResponse.json({ cities, categories, guests, checks })
}
