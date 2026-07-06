import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { invoices: true } } },
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address, city, businessNumber, taxId, notes } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "Emri dhe emaili janë të detyrueshëm" }, { status: 400 });
    }
    const client = await prisma.client.create({
      data: { name, email, phone, address, city, businessNumber, taxId, notes },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email ekziston tashmë" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
