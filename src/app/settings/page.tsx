"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Upload, X, Building2, CheckCircle } from "lucide-react";
import Image from "next/image";

interface Settings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  website: string;
  bankAccount: string;
  swiftCode: string;
  logoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  invoiceFooter: string;
  offerFooter: string;
  logoSize: number;
  primaryColor: string;
  fontFamily: string;
}

const emptySettings: Settings = {
  name: "", tagline: "", address: "", phone: "",
  email: "", taxId: "", website: "", bankAccount: "", swiftCode: "",
  logoUrl: "", stampUrl: "", signatureUrl: "",
  invoiceFooter: "", offerFooter: "",
  logoSize: 22, primaryColor: "#009ec6", fontFamily: "helvetica",
};

const FONT_OPTIONS = [
  { value: "helvetica", label: "Helvetica", subtitle: "Modern, i pastër",   css: "Arial, Helvetica, sans-serif" },
  { value: "times",     label: "Times",     subtitle: "Elegant, me serifë",  css: "'Times New Roman', Times, serif" },
  { value: "courier",   label: "Courier",   subtitle: "Teknik, çerdhor",     css: "'Courier New', Courier, monospace" },
] as const;

export default function SettingsPage() {
  const [form,    setForm]    = useState<Settings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setForm(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/settings", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json(); setError(d.error || "Gabim gjatë ruajtjes"); }
    setSaving(false);
  };

  const handleUpload = async (file: File, type: "logo" | "stamp" | "signature") => {
    if (!file) return;
    const setBusy = type === "logo" ? setUploading : type === "stamp" ? setUploadingStamp : setUploadingSignature;
    setBusy(true); setError("");
    const fd = new FormData();
    fd.append(type, file);
    const res = await fetch(`/api/settings/${type}`, { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      setForm((prev) => ({ ...prev, [type === "logo" ? "logoUrl" : type === "stamp" ? "stampUrl" : "signatureUrl"]: d.url }));
    } else {
      const d = await res.json();
      setError(d.error || "Gabim gjatë ngarkimit");
    }
    setBusy(false);
  };

  const field = (key: keyof Settings, label: string, placeholder = "", type = "text", rows?: number) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  if (loading) return (
    <div className="p-8 space-y-4 max-w-3xl">
      {Array(6).fill(0).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cilësimet e Kompanisë</h1>
        <p className="text-slate-500 text-sm mt-1">
          Këto të dhëna shfaqen automatikisht në faturat dhe ofertat e gjeneruara
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error  && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
        {saved  && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Cilësimet u ruajtën me sukses!
          </div>
        )}

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Logo e Kompanisë</h2>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
              {form.logoUrl ? (
                <Image src={form.logoUrl} alt="Logo" width={96} height={96} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "logo"); }}
              />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Duke ngarkuar..." : "Ngarko Logo"}
              </button>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: "" })}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" /> Fshij logon
                </button>
              )}
              <p className="text-xs text-slate-400">JPG, PNG, WEBP ose SVG · Max 5MB</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Stampë & Nënshkrim</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Stampë</p>
              <div className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {form.stampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.stampUrl} alt="Stampë" className="w-full h-full object-contain" />
                ) : (
                  <p className="text-xs text-slate-400">Nuk ka stampë</p>
                )}
              </div>
              <input
                ref={stampRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "stamp"); }}
              />
              <button
                type="button"
                onClick={() => stampRef.current?.click()}
                disabled={uploadingStamp}
                className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-60"
              >
                {uploadingStamp ? "Duke ngarkuar..." : "Ngarko Stampë"}
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Nënshkrim</p>
              <div className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {form.signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.signatureUrl} alt="Nënshkrim" className="w-full h-full object-contain" />
                ) : (
                  <p className="text-xs text-slate-400">Nuk ka nënshkrim</p>
                )}
              </div>
              <input
                ref={signatureRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "signature"); }}
              />
              <button
                type="button"
                onClick={() => signatureRef.current?.click()}
                disabled={uploadingSignature}
                className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-60"
              >
                {uploadingSignature ? "Duke ngarkuar..." : "Ngarko Nënshkrim"}
              </button>
            </div>
          </div>
        </div>

        {field("bankAccount", "Llogaria Bankare", "IBAN ose numër llogarie")}
        {field("swiftCode", "Swift Code", "SWIFT/BIC")}
        {/* Design & Theme */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Dizajni &amp; Tema</h2>
          <p className="text-sm text-slate-500">Ngjyra dhe madhësia e logos në PDF-të e gjeneruara</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ngjyra Kryesore</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                />
                <span className="text-sm font-mono text-slate-600">{form.primaryColor}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Aplikohet në header, tabela dhe total të PDF-ve</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Madhësia e Logos:{" "}
                <span className="font-semibold" style={{ color: form.primaryColor }}>{form.logoSize} mm</span>
              </label>
              <input
                type="range"
                min={14}
                max={30}
                value={form.logoSize}
                onChange={(e) => setForm({ ...form, logoSize: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: form.primaryColor }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>14mm (vogël)</span><span>30mm (madh)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-slate-900">Fontet &amp; Tipografia</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fonti aplikohet në të gjithë tekstet e dokumentave PDF</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {FONT_OPTIONS.map((fo) => (
              <button
                key={fo.value}
                type="button"
                onClick={() => setForm({ ...form, fontFamily: fo.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.fontFamily === fo.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <p className="text-4xl font-bold text-slate-800 leading-none mb-2" style={{ fontFamily: fo.css }}>Aa</p>
                <p className="text-sm font-semibold text-slate-900">{fo.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fo.subtitle}</p>
                {form.fontFamily === fo.value && (
                  <CheckCircle className="w-4 h-4 text-indigo-500 mt-2" />
                )}
              </button>
            ))}
          </div>

          {/* Live preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/70" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
              <div className="w-2 h-2 rounded-full bg-green-400/70" />
              <span className="text-xs text-slate-400 ml-2">Parapamje Faturës</span>
            </div>
            <div
              className="p-5 bg-white text-xs"
              style={{ fontFamily: FONT_OPTIONS.find(f => f.value === form.fontFamily)?.css ?? "Arial, sans-serif" }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{form.name || "AXEmedia"}</p>
                  <p className="text-slate-500">{form.tagline || "Agjensi Marketingu & Dizajni"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl" style={{ color: form.primaryColor }}>FATURË</p>
                  <p className="text-slate-500">Nr: AXE-2026-0001</p>
                </div>
              </div>
              <div className="border-t-2 pt-3 flex justify-between gap-4" style={{ borderColor: form.primaryColor }}>
                <div>
                  <p className="text-slate-400 mb-0.5" style={{ fontSize: "10px" }}>FATURË PËR:</p>
                  <p className="font-semibold text-sm text-slate-900">Klient Shembull SH.P.K.</p>
                  <p className="text-slate-500">info@klienti.al · +355 69 111 1111</p>
                </div>
                <div className="text-right text-slate-500">
                  <p>Data: 20 Qer 2026</p>
                  <p>Afati: 27 Qer 2026</p>
                </div>
              </div>
              <table className="w-full mt-3 border-collapse" style={{ fontSize: "11px" }}>
                <thead>
                  <tr style={{ backgroundColor: form.primaryColor }}>
                    <th className="px-2 py-1.5 text-left text-white font-semibold">PËRSHKRIMI</th>
                    <th className="px-2 py-1.5 text-right text-white font-semibold">ÇMIMI</th>
                    <th className="px-2 py-1.5 text-right text-white font-semibold">SHUMA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: `${form.primaryColor}22` }}>
                    <td className="px-2 py-1.5 text-slate-700">Shërbim Dizajni Web</td>
                    <td className="px-2 py-1.5 text-right text-slate-700">€150.00</td>
                    <td className="px-2 py-1.5 text-right font-bold text-slate-900">€300.00</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 text-slate-700">Menaxhim Social Media</td>
                    <td className="px-2 py-1.5 text-right text-slate-700">€200.00</td>
                    <td className="px-2 py-1.5 text-right font-bold text-slate-900">€200.00</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <span className="px-3 py-1.5 text-white text-xs font-bold" style={{ backgroundColor: form.primaryColor }}>
                  TOTALI: €500.00
                </span>
              </div>
              <p className="text-xs mt-3 font-bold italic" style={{ color: form.primaryColor }}>
                Faleminderit për bashkëpunimin.
              </p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Informacioni i Kompanisë</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("name",    "Emri i Kompanisë *",   "AXEmedia")}
            {field("tagline", "Tagline / Nën-titulli", "Agjensi Marketingu & Dizajni")}
            {field("address", "Adresa",               "Tiranë, Shqipëri")}
            {field("phone",   "Telefoni",              "+355 69 000 0000")}
            {field("email",   "Email",                 "info@axemedia.al", "email")}
            {field("website", "Website",               "www.axemedia.al")}
          </div>
          <div>{field("taxId", "Numri Unik (NIPT)", "L12345678A")}</div>
        </div>

        {/* Document Footers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Teksti i Footer-it në Dokumenta</h2>
          {field("invoiceFooter", "Footer Fatura",  "Faleminderit për bashkëpunimin!", "text", 2)}
          {field("offerFooter",   "Footer Oferta",  "Kjo ofertë nuk është faturë...",  "text", 2)}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Duke ruajtur..." : "Ruaj Cilësimet"}
          </button>
        </div>
      </form>
    </div>
  );
}
