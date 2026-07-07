import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalClients, totalInvoices, totalRevenue, totalExpenses, recentInvoices, monthlyRevenue] =
      await Promise.all([
        prisma.client.count(),
        prisma.invoice.count(),
        prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "paid" } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.invoice.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { client: { select: { name: true } } },
        }),
        prisma.$queryRaw<{ month: string; revenue: number }[]>`
          SELECT DATE_FORMAT(issueDate, '%Y-%m') as month, SUM(total) as revenue
          FROM Invoice
          WHERE status = 'paid'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 6
        `,
      ]);

    return NextResponse.json({
      totalClients,
      totalInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      recentInvoices,
      monthlyRevenue,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
