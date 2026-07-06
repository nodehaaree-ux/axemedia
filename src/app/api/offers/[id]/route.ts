import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(id) },
      include: { client: true, items: true },
    });
    if (!offer) return NextResponse.json({ error: "Oferta nuk u gjet" }, { status: 404 });
    return NextResponse.json(offer);
  } catch {
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, convertedToInvoiceId, clientId, title, issueDate, validUntil, items, notes, taxRate } = body;

    // Full edit (from edit page)
    if (items !== undefined) {
      const rate = parseFloat(taxRate) || 0;
      const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice, 0);
      const tax   = subtotal * (rate / 100);
      const total = subtotal + tax;
      const offer = await prisma.offer.update({
        where: { id: parseInt(id) },
        data: {
          clientId:   parseInt(clientId),
          title,
          issueDate:  issueDate  ? new Date(issueDate)  : undefined,
          validUntil: validUntil ? new Date(validUntil) : undefined,
          subtotal, tax, total, notes,
          ...(status !== undefined && { status }),
          items: {
            deleteMany: {},
            create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
              description: item.description,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              total:       item.quantity * item.unitPrice,
            })),
          },
        },
        include: { client: true, items: true },
      });
      return NextResponse.json(offer);
    }

    // Status / convert update (from detail page)
    const offer = await prisma.offer.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(convertedToInvoiceId !== undefined && { convertedToInvoiceId }),
      },
      include: { client: true, items: true },
    });
    return NextResponse.json(offer);
  } catch {
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.offer.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
