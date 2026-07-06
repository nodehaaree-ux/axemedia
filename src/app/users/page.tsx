"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  UserCircle,
  Users,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

interface Client { id: number; name: string }

interface User {
  id:       number;
  name:     string;
  email:    string;
  role:     string;
  active:   boolean;
  clientId: number | null;
  client:   { id: number; name: string } | null;
  createdAt: string;
}

const EMPTY_FORM = {
  name:     "",
  email:    "",
  password: "",
  role:     "staff",
  clientId: "",
  active:   true,
};

const roleLabels: Record<string, string> = {
  admin:  "Administrator",
  staff:  "Staf",
  client: "Klient",
};

const roleBadge: Record<string, string> = {
  admin:  "bg-indigo-100 text-indigo-700",
  staff:  "bg-emerald-100 text-emerald-700",
  client: "bg-amber-100 text-amber-700",
};

export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<"create" | "edit" | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form,     setForm]     = useState({ ...EMPTY_FORM });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [uRes, cRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/clients"),
    ]);
    if (uRes.ok) setUsers(await uRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModal("create");
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      name:     u.name,
      email:    u.email,
      password: "",
      role:     u.role,
      clientId: u.clientId ? String(u.clientId) : "",
      active:   u.active,
    });
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      clientId: form.clientId ? Number(form.clientId) : null,
    };

    let res: Response;
    if (modal === "create") {
      res = await fetch("/api/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    } else {
      res = await fetch(`/api/users/${editUser!.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    }

    setSaving(false);
    if (res.ok) {
      setModal(null);
      fetchAll();
    } else {
      const data = await res.json();
      setError(data.error ?? "Gabim gjatë ruajtjes");
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Fshi përdoruesin "${u.name}"? Ky veprim nuk mund të kthehet.`)) return;
    await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    fetchAll();
  };

  const toggleActive = async (u: User) => {
    await fetch(`/api/users/${u.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...u, active: !u.active }),
    });
    fetchAll();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Përdoruesit</h1>
            <p className="text-sm text-slate-500">Menaxhimi i llogarive dhe roleve</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Përdorues i ri
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["admin", "staff", "client"].map((r) => (
          <div key={r} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">{roleLabels[r]}</p>
            <p className="text-2xl font-bold text-slate-900">
              {users.filter((u) => u.role === r && u.active).length}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Duke ngarkuar...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Nuk ka përdorues. Klikoni &quot;Përdorues i ri&quot; për të filluar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Emri</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Roli</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Klienti</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Statusi</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Veprimet</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        {u.role === "admin"
                          ? <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          : <UserCircle className="w-3.5 h-3.5 text-indigo-600" />
                        }
                      </div>
                      <span className="font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.client?.name ?? (u.role === "client" ? <span className="text-red-400">—</span> : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        u.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {u.active
                        ? <><CheckCircle className="w-3 h-3" /> Aktiv</>
                        : <><XCircle    className="w-3 h-3" /> Joaktiv</>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Ndrysho"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Fshi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {modal === "create" ? "Përdorues i ri" : "Ndrysho përdoruesin"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Emri i plotë</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Emri Mbiemri"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@axemedia.al"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {modal === "edit" ? "Fjalëkalim i ri (lëre bosh për të mbajtur)" : "Fjalëkalimi"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Roli</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Administrator</option>
                    <option value="staff">Staf</option>
                    <option value="client">Klient</option>
                  </select>
                </div>

                {form.role === "client" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Lidhe me klient</label>
                    <select
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Zgjidh klientin —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {modal === "edit" && (
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={form.active as boolean}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="active" className="text-sm text-slate-700">Llogaria aktive</label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Duke ruajtur..." : modal === "create" ? "Krijo" : "Ruaj ndryshimet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
