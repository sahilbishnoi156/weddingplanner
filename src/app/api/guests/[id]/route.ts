import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const id = Number(params.id)
  const name = body?.name
  const cityId = body?.cityId ?? null

  const rows = await sql`
    update guests
    set name = coalesce(${name}, name),
        city_id = ${cityId}
    where id = ${id}
    returning id, name, city_id
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await sql`delete from guests where id = ${id}`
  return NextResponse.json({ ok: true })
}
