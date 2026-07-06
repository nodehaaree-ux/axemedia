"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Check, X, PackageSearch } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description?: string;
  defaultPrice: number;
  unit?: string;
}

const emptyForm = { name: "", description: "", defaultPrice: "", unit: "copë" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || "", defaultPrice: String(s.defaultPrice), unit: s.unit || "copë" });
    setError("");
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); setError(""); setShowAdd(false); };

  const handleSave = async (id?: number) => {
    if (!form.name.trim()) { setError("Emri është i detyrueshëm"); return; }
    setSaving(true); setError("");
    const url    = id ? `/api/services/${id}` : "/api/services";
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetch_(); cancelEdit(); }
    else { const d = await res.json(); setError(d.error || "Gabim"); }
    setSaving(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Fshij shërbimin "${name}"?`)) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetch_();
  };

  const units = ["copë", "orë", "ditë", "muaj", "faqe", "video", "projekt", "paketë"];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shërbimet & Produktet</h1>
          <p className="text-slate-500 text-sm mt-1">
            Regjistro shërbime për ti gjetur shpejt gjatë krijimit të faturave dhe ofertave
          </p>
        </div>
        <button
          onClick={() => { cancelEdit(); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Shërbim i Ri
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Shto Shërbim të Ri</h2>
          {error && <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Emri *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="p.sh. Menaxhim Instagram"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Çmimi Default (€)</label>
              <input type="number" step="0.01" min="0" value={form.defaultPrice}
                onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Njësia</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Përshkrimi (opsional)</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detaje shtesë rreth shërbimit..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <X className="w-4 h-4" /> Anulo
              </button>
              <button onClick={() => handleSave()} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? "Duke ruajtur..." : "Ruaj Shërbimin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Emri</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Përshkrimi</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Çmimi Default</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Njësia</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>{Array(5).fill(0).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <PackageSearch className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Nuk ka shërbime të regjistruara.</p>
                    <button onClick={() => setShowAdd(true)} className="mt-2 text-indigo-600 text-sm hover:underline">
                      Shto shërbimin e parë
                    </button>
                  </td>
                </tr>
              ) : services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  {editId === s.id ? (
                    /* Inline edit row */
                    <>
                      <td className="px-4 py-2">
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Opsional..." className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.01" min="0" value={form.defaultPrice}
                          onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                          className="w-28 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          {units.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleSave(s.id)} disabled={saving}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* Normal row */
                    <>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{s.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{s.description || "—"}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-700">€{s.defaultPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">/{s.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
