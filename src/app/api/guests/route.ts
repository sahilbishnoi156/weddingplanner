import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWeddingId } from "@/lib/wedding";

async function getWeddingIdFromRequest(request: Request) {
  const header = request.headers.get("x-wedding-code");
  return await resolveWeddingId(header || undefined);
}

export async function GET(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request);
  if (!weddingId) return NextResponse.json([], { status: 200 });
  const rows = await prisma.guest.findMany({
    where: { weddingId },
    orderBy: { id: "asc" },
    select: { id: true, name: true, cityId: true },
  });
  const mapped = rows.map(
    (g: { name: string; id: number; cityId: number | null }) => ({
      id: g.id,
      name: g.name,
      city_id: g.cityId,
    })
  );
  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request);
  if (!weddingId)
    return NextResponse.json({ error: "invalid wedding" }, { status: 400 });
  const body = await request.json();
  const name = (body?.name || "").trim();
  const cityId = body?.cityId ?? null;
  if (!name)
    return NextResponse.json({ error: "name required" }, { status: 400 });
  const created = await prisma.guest.create({
    data: { name, cityId, weddingId },
    select: { id: true, name: true, cityId: true },
  });
  return NextResponse.json({
    id: created.id,
    name: created.name,
    city_id: created.cityId,
  });
}

export async function DELETE(request: Request) {
  const weddingId = await getWeddingIdFromRequest(request);
  if (!weddingId)
    return NextResponse.json({ error: "invalid wedding" }, { status: 400 });
  const body = await request.json();
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.check.deleteMany({ where: { guestId: id, weddingId } });
    const del = await prisma.guest.deleteMany({ where: { id, weddingId } });
    if (del.count === 0)
      return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "could not delete guest" },
      { status: 500 }
    );
  }
}
