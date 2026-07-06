"use client";

import { useEffect, useState } from "react";
import { Users, FileText, TrendingUp, TrendingDown, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

interface Stats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  totalExpenses: number;
  recentInvoices: {
    id: number;
    invoiceNumber: string;
    total: number;
    status: string;
    createdAt: string;
    client: { name: string };
  }[];
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  sent: "bg-blue-100 text-blue-700",
  draft: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  paid: "Paguar",
  sent: "Dërguar",
  draft: "Draft",
  cancelled: "Anuluar",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { title: "Klientë Total", value: stats?.totalClients ?? 0, icon: Users, color: "bg-indigo-500", href: "/clients" },
    { title: "Fatura Total", value: stats?.totalInvoices ?? 0, icon: FileText, color: "bg-violet-500", href: "/invoices" },
    { title: "Të Ardhura", value: `€${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "bg-emerald-500", href: "/invoices" },
    { title: "Shpenzime", value: `€${(stats?.totalExpenses ?? 0).toFixed(2)}`, icon: TrendingDown, color: "bg-rose-500", href: "/expenses" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Mirë se vini, <span className="text-indigo-600">AXEmedia</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: sq })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Klient i Ri
          </Link>
          <Link href="/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Faturë e Re
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ title, value, icon: Icon, color, href }) => (
          <Link key={title} href={href} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {loading ? <span className="inline-block w-16 h-7 bg-slate-200 animate-pulse rounded" /> : value}
                </p>
              </div>
              <div className={`${color} rounded-xl p-3 opacity-90`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Shiko detajet</span><ArrowUpRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Faturat e Fundit</h2>
          <Link href="/invoices" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            Të gjitha <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                {["Nr. Faturë","Klient","Data","Shuma","Statusi"].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>{Array(5).fill(0).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : !stats?.recentInvoices?.length ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Nuk ka fatura ende.{" "}
                  <Link href="/invoices/new" className="text-indigo-600 hover:underline">Krijo faturën e parë</Link>
                </td></tr>
              ) : (
                stats.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium text-indigo-600 hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{inv.client.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(inv.createdAt), "d MMM yyyy", { locale: sq })}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">€{inv.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>{statusLabel[inv.status]}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/clients/new", label: "Regjistro Klient", icon: Users, color: "text-indigo-600" },
          { href: "/invoices/new", label: "Krijo Faturë", icon: FileText, color: "text-violet-600" },
          { href: "/expenses", label: "Shto Shpenzim", icon: TrendingDown, color: "text-rose-600" },
          { href: "/calendar", label: "Planifiko Post", icon: TrendingUp, color: "text-emerald-600" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col items-center gap-2 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all shadow-sm text-center">
            <Icon className={`w-6 h-6 ${color}`} />
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

