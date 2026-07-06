"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Download, Eye, Edit2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  status: string;
  issueDate: string;
  createdAt: string;
  client: { id: number; name: string; email: string };
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  sent: "bg-blue-100 text-blue-700",
  draft: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabel: Record<string, string> = { paid: "Paguar", sent: "Dërguar", draft: "Draft", cancelled: "Anuluar" };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faturat</h1>
          <p className="text-slate-500 text-sm mt-1">{invoices.length} fatura gjithsej</p>
        </div>
        <Link href="/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm self-start">
          <Plus className="w-4 h-4" /> Faturë e Re
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totale", value: invoices.length, color: "text-slate-700" },
          { label: "Të Paguara", value: invoices.filter(i => i.status === "paid").length, color: "text-emerald-700" },
          { label: "Të Dërgura", value: invoices.filter(i => i.status === "sent").length, color: "text-blue-700" },
          { label: "Draft", value: invoices.filter(i => i.status === "draft").length, color: "text-slate-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm text-emerald-600 font-medium">Të Ardhura (Paguar)</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">€{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Në Pritje</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">€{pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Kërko fatura..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Të gjitha statuset</option>
          <option value="draft">Draft</option>
          <option value="sent">Dërguar</option>
          <option value="paid">Paguar</option>
          <option value="cancelled">Anuluar</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                {["Nr. Faturë", "Klienti", "Data Lëshimit", "Shuma", "Statusi", "Veprime"].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {search || filterStatus !== "all" ? "Nuk u gjetën fatura." : <>Nuk ka fatura. <Link href="/invoices/new" className="text-indigo-600 hover:underline">Krijo faturën e parë</Link></>}
                </td></tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-slate-800">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/clients/${inv.client.id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600">{inv.client.name}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(inv.issueDate), "d MMM yyyy", { locale: sq })}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">€{inv.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>{statusLabel[inv.status]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/invoices/${inv.id}`} className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Shiko">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/invoices/${inv.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Ndrysho">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <Link href={`/invoices/${inv.id}?download=pdf`} className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Shkarko PDF">
                          <Download className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
