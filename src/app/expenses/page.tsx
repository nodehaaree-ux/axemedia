"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

const categories = [
  "Qira", "Utilities", "Software", "Marketing", "Pagat", "Transport",
  "Ushqim", "Pajisje", "Kontabilitet", "Ligjore", "Tjetër"
];

const categoryColors: Record<string, string> = {
  "Qira": "bg-violet-100 text-violet-700",
  "Utilities": "bg-blue-100 text-blue-700",
  "Software": "bg-indigo-100 text-indigo-700",
  "Marketing": "bg-pink-100 text-pink-700",
  "Pagat": "bg-amber-100 text-amber-700",
  "Transport": "bg-cyan-100 text-cyan-700",
  "Pajisje": "bg-orange-100 text-orange-700",
  "Tjetër": "bg-slate-100 text-slate-600",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({ title: "", amount: "", category: categories[0], date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchExpenses = () => {
    setLoading(true);
    fetch("/api/expenses").then((r) => r.json()).then((data) => { setExpenses(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, []);

  const resetForm = () => {
    setForm({ title: "", amount: "", category: categories[0], date: new Date().toISOString().split("T")[0], notes: "" });
    setEditId(null);
    setError("");
    setShowForm(false);
  };

  const handleEdit = (exp: Expense) => {
    setForm({ title: exp.title, amount: String(exp.amount), category: exp.category, date: exp.date.split("T")[0], notes: exp.notes || "" });
    setEditId(exp.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editId ? `/api/expenses/${editId}` : "/api/expenses";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetchExpenses(); resetForm(); }
    else { const d = await res.json(); setError(d.error || "Gabim"); }
    setSaving(false);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Fshij shpenzimin "${title}"?`)) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchExpenses();
  };

  const filtered = expenses.filter(e => filterCategory === "all" || e.category === filterCategory);
  const totalThisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shpenzimet</h1>
          <p className="text-slate-500 text-sm mt-1">{expenses.length} shpenzime të regjistruara</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm self-start">
          <Plus className="w-4 h-4" /> Shto Shpenzim
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 rounded-xl p-3"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Ky Muaj</p>
              <p className="text-xl font-bold text-slate-900">€{totalThisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 rounded-xl p-3"><TrendingUp className="w-5 h-5 text-slate-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Gjithsej</p>
              <p className="text-xl font-bold text-slate-900">€{totalAll.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-xl p-3"><TrendingDown className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Mesatare/Muaj</p>
              <p className="text-xl font-bold text-slate-900">
                €{expenses.length ? (totalAll / Math.max(1, new Set(expenses.map(e => e.date.slice(0, 7))).size)).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editId ? "Edito Shpenzimin" : "Shto Shpenzim të Ri"}</h2>
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Titulli *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Qira zyrës..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shuma (€) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategoria *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shënime</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsionale..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                <X className="w-4 h-4" /> Anulo
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
                <Check className="w-4 h-4" />{saving ? "Duke ruajtur..." : editId ? "Ruaj Ndryshimet" : "Shto Shpenzimin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCategory("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCategory === "all" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
          Të gjitha
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCategory === c ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                {["Data", "Titulli", "Kategoria", "Shuma", "Shënime", "Veprime"].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {filterCategory !== "all" ? `Nuk ka shpenzime në kategorinë "${filterCategory}".` : "Nuk ka shpenzime ende."}
                </td></tr>
              ) : filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(exp.date), "d MMM yyyy", { locale: sq })}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{exp.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[exp.category] || "bg-slate-100 text-slate-600"}`}>{exp.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">€{exp.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{exp.notes || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(exp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(exp.id, exp.title)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
