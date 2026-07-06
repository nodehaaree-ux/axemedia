import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: { invoices: { orderBy: { createdAt: "desc" }, take: 5 }, _count: { select: { invoices: true, posts: true } } },
    });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, address, city, businessNumber, taxId, notes } = body;
    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, address, city, businessNumber, taxId, notes },
    });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
