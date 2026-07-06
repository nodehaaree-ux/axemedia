"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, Trash2, ArrowRightCircle, Edit2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sq } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Offer {
  id: number;
  offerNumber: string;
  title: string;
  total: number;
  status: string;
  issueDate: string;
  validUntil: string;
  convertedToInvoiceId: number | null;
  client: { id: number; name: string; email: string };
}

const statusColors: Record<string, string> = {
  draft:    "bg-slate-100 text-slate-600",
  sent:     "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired:  "bg-orange-100 text-orange-700",
};
const statusLabel: Record<string, string> = {
  draft:    "Draft",
  sent:     "Dërguar",
  accepted: "Pranuar",
  rejected: "Refuzuar",
  expired:  "Skaduar",
};

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchOffers = () => {
    setLoading(true);
    fetch("/api/offers")
      .then((r) => r.json())
      .then((d) => { setOffers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOffers(); }, []);

  const filtered = offers.filter((o) => {
    const matchSearch =
      o.offerNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.client.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: number, num: string) => {
    if (!confirm(`Fshij ofertën "${num}"?`)) return;
    await fetch(`/api/offers/${id}`, { method: "DELETE" });
    fetchOffers();
  };

  const handleConvert = async (id: number) => {
    if (!confirm("Konverto këtë ofertë në faturë?")) return;
    const res = await fetch(`/api/offers/${id}/convert`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push(`/invoices/${data.invoiceId}`);
    }
  };

  const totalValue    = offers.reduce((s, o) => s + o.total, 0);
  const acceptedValue = offers.filter(o => o.status === "accepted").reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ofertat</h1>
          <p className="text-slate-500 text-sm mt-1">{offers.length} oferta gjithsej</p>
        </div>
        <Link
          href="/offers/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Ofertë e Re
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Totale",   value: offers.length,                                          color: "text-slate-700" },
          { label: "Draft",    value: offers.filter(o => o.status === "draft").length,         color: "text-slate-500" },
          { label: "Dërguar",  value: offers.filter(o => o.status === "sent").length,          color: "text-blue-700"  },
          { label: "Pranuar",  value: offers.filter(o => o.status === "accepted").length,      color: "text-emerald-700"},
          { label: "Refuzuar", value: offers.filter(o => o.status === "rejected").length,      color: "text-red-700"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-sm text-indigo-600 font-medium">Vlera Totale Ofertave</p>
          <p className="text-2xl font-bold text-indigo-800 mt-1">€{totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm text-emerald-600 font-medium">Oferta të Pranuara</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">€{acceptedValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kërko oferta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Të gjitha statuset</option>
          <option value="draft">Draft</option>
          <option value="sent">Dërguar</option>
          <option value="accepted">Pranuar</option>
          <option value="rejected">Refuzuar</option>
          <option value="expired">Skaduar</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                {["Nr. Ofertë","Titulli","Klienti","Data","Vlefshme deri","Shuma","Statusi","Veprime"].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {search || filterStatus !== "all"
                      ? "Nuk u gjetën oferta."
                      : <><span>Nuk ka oferta ende. </span><Link href="/offers/new" className="text-indigo-600 hover:underline">Krijo ofertën e parë</Link></>}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-slate-700">{o.offerNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[180px] truncate">{o.title}</td>
                    <td className="px-6 py-4">
                      <Link href={`/clients/${o.client.id}`} className="text-sm text-slate-700 hover:text-indigo-600 font-medium">
                        {o.client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(o.issueDate), "d MMM yyyy", { locale: sq })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(o.validUntil), "d MMM yyyy", { locale: sq })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">€{o.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[o.status]}`}>
                        {statusLabel[o.status]}
                      </span>
                      {o.convertedToInvoiceId && (
                        <Link href={`/invoices/${o.convertedToInvoiceId}`} className="ml-2 text-xs text-indigo-600 hover:underline">
                          → Faturë
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/offers/${o.id}`} className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Shiko">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/offers/${o.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Ndrysho">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        {!o.convertedToInvoiceId && o.status !== "rejected" && (
                          <button
                            onClick={() => handleConvert(o.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Konverto në Faturë"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(o.id, o.offerNumber)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Fshij"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
