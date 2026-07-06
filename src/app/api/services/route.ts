import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const services = await prisma.service.findMany({
      where: q ? { name: { contains: q } } : undefined,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, defaultPrice, unit } = await req.json();
    if (!name) return NextResponse.json({ error: "Emri është i detyrueshëm" }, { status: 400 });
    const service = await prisma.service.create({
      data: { name, description, defaultPrice: parseFloat(defaultPrice) || 0, unit: unit || "copë" },
    });
    return NextResponse.json(service, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
