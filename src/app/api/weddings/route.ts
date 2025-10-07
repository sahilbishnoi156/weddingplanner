import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    const wedding = await prisma.wedding.findUnique({ where: { code } });
    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.guest.deleteMany({ where: { weddingId: wedding.id } }),
      prisma.city.deleteMany({ where: { weddingId: wedding.id } }),
      prisma.category.deleteMany({ where: { weddingId: wedding.id } }),
      prisma.wedding.delete({ where: { id: wedding.id } }),
    ]);

    return NextResponse.json({
      message: "Wedding and related data deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete wedding" },
      { status: 500 }
    );
  }
}
