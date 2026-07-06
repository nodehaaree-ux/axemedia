import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateOfferNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `AXE-OFR-${year}${month}-${random}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Client role: only show their own offers
    const where =
      session?.user?.role === "client" && session.user.clientId
        ? { clientId: Number(session.user.clientId) }
        : {};

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    return NextResponse.json(offers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, title, validUntil, items, notes, taxRate = 18 } = body;

    if (!clientId || !title || !validUntil || !items?.length) {
      return NextResponse.json(
        { error: "Klienti, titulli, data e vlefshmërisë dhe artikujt janë të detyrueshëm" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    const offerNumber = generateOfferNumber();

    const offer = await prisma.offer.create({
      data: {
        offerNumber,
        title,
        clientId: parseInt(clientId),
        validUntil: new Date(validUntil),
        subtotal,
        tax,
        total,
        notes,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
