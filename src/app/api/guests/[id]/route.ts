import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { resolveWeddingId } from "@/lib/wedding"

async function getWeddingIdFromRequest(request: Request) {
  const header = request.headers.get("x-wedding-code")
  return await resolveWeddingId(header || undefined)
}

export async function PATCH(request: Request, context: any) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const body = await request.json()
  const rawParams = context?.params
  const resolvedParams = typeof rawParams?.then === "function" ? await rawParams : rawParams
  const id = Number(resolvedParams?.id)
  const name = body?.name
  const cityId = body?.cityId ?? null

  const rows = await sql`
    update guests
    set name = coalesce(${name}, name),
        city_id = ${cityId}
    where id = ${id} and wedding_id = ${weddingId}
    returning id, name, city_id
  `
  return NextResponse.json(rows[0] || null)
}

export async function DELETE(request: Request, context: any) {
  const weddingId = await getWeddingIdFromRequest(request)
  if (!weddingId) return NextResponse.json({ error: "invalid wedding" }, { status: 400 })
  const rawParams = context?.params
  const resolvedParams = typeof rawParams?.then === "function" ? await rawParams : rawParams
  const id = Number(resolvedParams?.id)
  await sql`delete from guests where id = ${id} and wedding_id = ${weddingId}`
  return NextResponse.json({ ok: true })
}

