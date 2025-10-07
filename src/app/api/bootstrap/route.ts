import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [citiesRaw, categoriesRaw, guestsRaw, checksRaw] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, type: true } }),
    prisma.guest.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, cityId: true } }),
    prisma.check.findMany({ select: { guestId: true, categoryId: true, checked: true } }),
  ])

  const cities = citiesRaw
  const categories = categoriesRaw
  const guests = guestsRaw.map((g) => ({ id: g.id, name: g.name, city_id: g.cityId }))
  const checks = checksRaw.map((c) => ({ guest_id: c.guestId, category_id: c.categoryId, checked: c.checked }))

  return NextResponse.json({ cities, categories, guests, checks })
}
