import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OfferItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `AXE-${year}${month}-${random}`;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });

    if (!offer) return NextResponse.json({ error: "Oferta nuk u gjet" }, { status: 404 });
    if (offer.convertedToInvoiceId) {
      return NextResponse.json({ error: "Oferta është konvertuar tashmë" }, { status: 409 });
    }

    // Create invoice from offer
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const offerItems: OfferItemInput[] = offer.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        clientId: offer.clientId,
        dueDate,
        subtotal: offer.subtotal,
        tax: offer.tax,
        total: offer.total,
        notes: `Konvertuar nga oferta ${offer.offerNumber}: ${offer.title}`,
        items: {
          create: offerItems,
        },
      },
    });

    // Mark offer as accepted and link to invoice
    await prisma.offer.update({
      where: { id: parseInt(id) },
      data: { status: "accepted", convertedToInvoiceId: invoice.id },
    });

    return NextResponse.json({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
  } catch {
    return NextResponse.json({ error: "Failed to convert offer" }, { status: 500 });
  }
}
