"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Download, CheckCircle, Send, XCircle, Printer, Edit2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sq } from "date-fns/locale";
import { use } from "react";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: InvoiceItem[];
  client: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    taxId?: string;
  };
}

interface CompanySettings {
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
  logoSize: number;
  primaryColor: string;
  fontFamily: string;
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const statusLabel: Record<string, string> = { paid: "Paguar", sent: "Dërguar", draft: "Draft", cancelled: "Anuluar" };

async function loadImageDataUrl(src: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  // SVG: fetch text, parse viewBox for aspect ratio, render via blob URL
  if (/\.svg$/i.test(src)) {
    try {
      const resp  = await fetch(src);
      const svgText = await resp.text();
      let vw = 0, vh = 0;
      const vbMatch = svgText.match(/viewBox="([^"]+)"/);
      if (vbMatch) {
        const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
        if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) { vw = parts[2]; vh = parts[3]; }
      }
      if (!vw || !vh) {
        const wm = svgText.match(/\bwidth="(\d+(?:\.\d+)?)"/);  const hm = svgText.match(/\bheight="(\d+(?:\.\d+)?)"/); 
        if (wm && hm) { vw = parseFloat(wm[1]); vh = parseFloat(hm[1]); }
      }
      if (!vw || !vh) { vw = 1; vh = 1; }
      const rH = 300;
      const rW = Math.max(1, Math.round((vw / vh) * rH));
      const canvas = document.createElement("canvas");
      canvas.width = rW; canvas.height = rH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      await new Promise<void>((res) => {
        const img = new window.Image();
        const blob    = new Blob([svgText], { type: "image/svg+xml" });
        const blobUrl = URL.createObjectURL(blob);
        img.onload  = () => { ctx.drawImage(img, 0, 0, rW, rH); URL.revokeObjectURL(blobUrl); res(); };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); res(); };
        img.src = blobUrl;
      });
      return { dataUrl: canvas.toDataURL("image/png"), w: rW, h: rH };
    } catch { return null; }
  }
  // Raster images
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth  || 200;
      const h = img.naturalHeight || 200;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL("image/png"), w, h });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 158, 198];
}
function lightenRgb(c: [number, number, number], t: number): [number, number, number] {
  return c.map(v => Math.round(v + (255 - v) * t)) as [number, number, number];
}

async function generatePDF(invoice: Invoice, settings: CompanySettings) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const blue      = hexToRgb(settings.primaryColor || "#009ec6");
  const dark      = [30, 35, 45]    as [number, number, number];
  const black     = [20, 20, 30]    as [number, number, number];
  const gray      = [110, 118, 138] as [number, number, number];
  const lightGray = [245, 247, 249] as [number, number, number];
  const cardBg    = [250, 251, 253] as [number, number, number];
  const W = 210;
  const L = 15;
  const R = W - 15;
  const font = (settings.fontFamily || "helvetica") as "helvetica" | "times" | "courier";

  doc.setFont(font, "bold");
  doc.setFontSize(24);
  doc.setTextColor(...black);
  doc.text("FATURË/INVOICE", L, 28);

  if (settings.logoUrl) {
    const logoData = await loadImageDataUrl(settings.logoUrl);
    if (logoData) {
      const maxLogoWidth = 42;
      const maxLogoHeight = 18;
      const logoRatio = logoData.w / logoData.h;
      const logoW = Math.min(maxLogoWidth, Math.round(maxLogoHeight * logoRatio));
      const logoH = Math.round(Math.min(maxLogoHeight, logoW / Math.max(logoRatio, 0.01)));
      doc.addImage(logoData.dataUrl, "PNG", R - logoW, 10, logoW, logoH);
    }
  }

  const cardW = 58;
  const cardGap = 6;
  const cardY = 40;
  const cardX = [L, L + cardW + cardGap, L + 2 * (cardW + cardGap)];

  cardX.forEach((x) => {
    doc.setFillColor(...cardBg);
    doc.roundedRect(x, cardY, cardW, 44, 5, 5, "F");
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardW, 44, 5, 5, "S");
  });

  doc.setFont(font, "bold"); doc.setFontSize(9); doc.setTextColor(...blue);
  doc.text("Detajet", cardX[0] + 4, cardY + 10);
  doc.setFont(font, "normal"); doc.setFontSize(8); doc.setTextColor(...black);
  const detailsLines = [
    settings.name,
    settings.tagline,
  ].filter(Boolean) as string[];
  let currentY = cardY + 16;
  detailsLines.forEach((line) => { doc.text(line, cardX[0] + 4, currentY); currentY += 4.8; });

  doc.setFont(font, "bold"); doc.setFontSize(9); doc.setTextColor(...blue);
  doc.text("Detajet e Kompanisë", cardX[1] + 4, cardY + 10);
  doc.setFont(font, "normal"); doc.setFontSize(8); doc.setTextColor(...black);
  const companyLines = [
    settings.taxId ? `Nr Unik: ${settings.taxId}` : null,
    settings.bankAccount ? `Reiffeisen Bank: ${settings.bankAccount}` : null,
    settings.swiftCode ? `SWIFT: ${settings.swiftCode}` : null,
    settings.address || null,
  ].filter(Boolean) as string[];
  currentY = cardY + 16;
  companyLines.forEach((line) => { doc.text(line, cardX[1] + 4, currentY); currentY += 4.8; });

  doc.setFont(font, "bold"); doc.setFontSize(9); doc.setTextColor(...blue);
  doc.text("Detajet e Klientit", cardX[2] + 4, cardY + 10);
  doc.setFont(font, "normal"); doc.setFontSize(8); doc.setTextColor(...black);
  const clientLines = [
    invoice.client.name,
    invoice.client.email,
    invoice.client.phone ? invoice.client.phone : null,
  ].filter(Boolean) as string[];
  currentY = cardY + 16;
  clientLines.forEach((line) => { doc.text(line, cardX[2] + 4, currentY); currentY += 4.8; });

  const itemsTop = cardY + 55;
  doc.setFont(font, "bold"); doc.setFontSize(11); doc.setTextColor(...black);
  doc.text("Shërbimi/Produkti", L, itemsTop);
  doc.text("Çmimi", R, itemsTop, { align: "right" });
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.8);
  doc.line(L, itemsTop + 2, R, itemsTop + 2);

  let itemY = itemsTop + 7;
  const rowHeight = 15;
  invoice.items.forEach((item) => {
    doc.setFillColor(...lightGray);
    doc.roundedRect(L, itemY - 4, R - L, rowHeight, 6, 6, "F");
    doc.setFont(font, "normal"); doc.setFontSize(9); doc.setTextColor(...black);
    doc.text(item.description, L + 5, itemY + 5);
    doc.text(`€${item.total.toFixed(2)}`, R - 5, itemY + 5, { align: "right" });
    itemY += rowHeight + 6;
  });

  const summaryRowHeight = 9;
  doc.setFont(font, "normal"); doc.setFontSize(9); doc.setTextColor(...black);
  doc.text("Nëntotali", L + 5, itemY + 6);
  doc.text(`€${invoice.subtotal.toFixed(2)}`, R - 5, itemY + 6, { align: "right" });
  itemY += summaryRowHeight + 4;

  doc.text("TVSH", L + 5, itemY + 6);
  doc.text(`€${invoice.tax.toFixed(2)}`, R - 5, itemY + 6, { align: "right" });
  itemY += summaryRowHeight + 10;

  doc.setFillColor(...blue);
  doc.roundedRect(L, itemY - 4, R - L, rowHeight, 6, 6, "F");
  doc.setFont(font, "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text("TOTALI", L + 5, itemY + 6);
  doc.text(`€${invoice.total.toFixed(2)}`, R - 5, itemY + 6, { align: "right" });
  itemY += rowHeight + 12;

  const signAreaTop = itemY;
  const signWidth = 55;
  const signRightX = R - 60; // right area for Pranoi

  // Draw signature on the left (above the Dorëzoi line)
  let leftBottom = signAreaTop;
  const leftSigX = L;
  let dorëzoiLineY = signAreaTop + 30;
  if (settings.signatureUrl) {
    const signatureData = await loadImageDataUrl(settings.signatureUrl);
    if (signatureData) {
      const sigW = 55;
      const sigH = Math.min(30, (signatureData.h / signatureData.w) * sigW);
      const signatureY = signAreaTop + 6;
      doc.addImage(signatureData.dataUrl, "PNG", leftSigX, signatureY, sigW, sigH);
      leftBottom = Math.max(leftBottom, signatureY + sigH);
      dorëzoiLineY = signatureY + sigH + 4; // place line closer to signature
    }
  }

  // Draw stamp centered between left and right sign areas
  if (settings.stampUrl) {
    const stampData = await loadImageDataUrl(settings.stampUrl);
    if (stampData) {
      const stampW = 55;
      const stampH = Math.min(50, (stampData.h / stampData.w) * stampW);
      const stampCenterX = Math.round((L + (signRightX + signWidth)) / 2 - stampW / 2);
      const stampY = signAreaTop;
      doc.addImage(stampData.dataUrl, "PNG", stampCenterX, stampY, stampW, stampH);
      leftBottom = Math.max(leftBottom, stampY + stampH);
    }
  }

  // Draw Dorëzoi line and label (left)
  doc.setDrawColor(...gray); doc.setLineWidth(0.3);
  doc.line(L, dorëzoiLineY, L + signWidth, dorëzoiLineY);
  doc.setFont(font, "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text("Dorëzoi", L + signWidth / 2, dorëzoiLineY + 8, { align: "center" });

  // Draw Pranoi line and label (right)
  const pranoiLineY = dorëzoiLineY; // align horizontally
  doc.line(signRightX, pranoiLineY, signRightX + signWidth, pranoiLineY);
  doc.text("Pranoi", signRightX + signWidth / 2, pranoiLineY + 8, { align: "center" });
  doc.text(format(new Date(invoice.issueDate), "dd MMM yyyy", { locale: sq }), signRightX + signWidth / 2, pranoiLineY + 16, { align: "center" });

  const projectY = Math.max(leftBottom + 20, pranoiLineY + 30);
  doc.setFont(font, "bold"); doc.setFontSize(12); doc.setTextColor(...black);
  doc.text("Project details", L, projectY);
  const companyFooter = [
    settings.taxId ? `Nr Unik: ${settings.taxId}` : "",
    settings.bankAccount ? `Reiffeisen Bank: ${settings.bankAccount}` : "",
    settings.swiftCode ? `SWIFT: ${settings.swiftCode}` : "",
  ].filter(Boolean);
  const projectLines = doc.splitTextToSize(invoice.notes || settings.invoiceFooter || "", R - L);
  doc.setFont(font, "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
  doc.text(projectLines, L, projectY + 6);

  const footerY = 280;
  const columnWidth = (R - L) / 4;
  doc.setFont(font, "normal"); doc.setFontSize(7.5); doc.setTextColor(...gray);
  doc.text([settings.name || "", settings.tagline || ""].filter(Boolean), L, footerY);
  doc.text([
    settings.taxId ? `Nr Unik: ${settings.taxId}` : "",
    settings.bankAccount ? `Reiffeisen Bank: ${settings.bankAccount}` : "",
    settings.swiftCode ? `SWIFT: ${settings.swiftCode}` : "",
  ].filter(Boolean), L + columnWidth, footerY);
  doc.text([settings.address || ""].filter(Boolean), L + 2 * columnWidth, footerY);
  doc.text([
    settings.phone || "",
    settings.website || "",
    settings.email || "",
  ].filter(Boolean), L + 3 * columnWidth, footerY);

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice,  setInvoice]  = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchInvoice = useCallback(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchInvoice();
    fetch("/api/settings").then((r) => r.json()).then((d) => { if (!d.error) setSettings(d); });
  }, [fetchInvoice]);

  const updateStatus = async (status: string) => {
    if (!invoice) return;
    setUpdating(true);
    await fetch(`/api/invoices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchInvoice();
    setUpdating(false);
  };

  if (loading) return (
    <div className="p-6 lg:p-8"><div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-slate-200 rounded" /><div className="h-96 bg-slate-200 rounded-2xl" /></div></div>
  );
  if (!invoice) return (
    <div className="p-6 text-center text-slate-400">Fatura nuk u gjet. <Link href="/invoices" className="text-indigo-600">Kthehu</Link></div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[invoice.status]}`}>{statusLabel[invoice.status]}</span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Lëshuar {format(new Date(invoice.issueDate), "d MMMM yyyy", { locale: sq })}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === "draft" && (
            <button onClick={() => updateStatus("sent")} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
              <Send className="w-4 h-4" /> Shëno Dërguar
            </button>
          )}
          {invoice.status === "sent" && (
            <button onClick={() => updateStatus("paid")} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
              <CheckCircle className="w-4 h-4" /> Shëno Paguar
            </button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <button onClick={() => updateStatus("cancelled")} disabled={updating} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-60">
              <XCircle className="w-4 h-4" /> Anulo
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
            <Printer className="w-4 h-4" /> Printo
          </button>
          <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
            <Edit2 className="w-4 h-4" /> Ndrysho
          </Link>
          <button onClick={() => generatePDF(invoice, settings ?? { name:"AXEmedia", tagline:"Agjensi Marketingu & Dizajni", address:"Tiranë, Shqipëri", phone:"+355 69 000 0000", email:"info@axemedia.al", taxId:"", website:"www.axemedia.al", bankAccount:"", swiftCode:"", logoUrl:"", stampUrl:"", signatureUrl:"", invoiceFooter:"Faleminderit për bashkëpunimin!", logoSize: 22, primaryColor: "#009ec6", fontFamily: "helvetica" })} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Shkarko PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="invoice-print">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <p className="text-slate-900 text-3xl font-bold">FATURË/INVOICE</p>
            </div>
            <div className="flex items-end justify-end">
              {settings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-900 uppercase tracking-[0.12em] mb-4">Detajet</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{settings?.name}</p>
                {settings?.tagline && <p>{settings.tagline}</p>}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-900 uppercase tracking-[0.12em] mb-4">Detajet e Kompanisë</p>
              <div className="space-y-1 text-sm text-slate-600">
                {settings?.taxId && <p>Nr Unik: {settings.taxId}</p>}
                {settings?.bankAccount && <p>Reiffeisen Bank: {settings.bankAccount}</p>}
                {settings?.swiftCode && <p>SWIFT: {settings.swiftCode}</p>}
                {settings?.address && <p>{settings.address}</p>}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-900 uppercase tracking-[0.12em] mb-4">Detajet e Klientit</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{invoice.client.name}</p>
                <p>{invoice.client.email}</p>
                {invoice.client.phone && <p>{invoice.client.phone}</p>}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-900 text-sm font-semibold">Shërbimi/Produkti</p>
                <p className="text-slate-900 text-sm font-semibold">Çmimi</p>
              </div>
              <div className="space-y-4">
                {invoice.items.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-slate-50 p-5 flex items-center justify-between text-sm text-slate-700 shadow-sm">
                    <span>{item.description}</span>
                    <span className="font-semibold text-slate-900">€{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-3xl bg-slate-100 p-5 text-sm text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <span>Nëntotali</span>
                  <span>€{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>TVSH</span>
                  <span>€{invoice.tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 rounded-3xl bg-emerald-600 p-4 flex items-center justify-between font-semibold text-white">
                <span>TOTALI</span>
                <span>€{invoice.total.toFixed(2)}</span>
              </div>
            </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-[1.2fr_0.9fr] items-start">
            <div>
              <div className="mb-2 text-xs text-slate-500">Dorëzoi - Give</div>
              <div className="rounded-3xl bg-white p-4 border border-slate-200 shadow-sm h-32 flex items-center justify-center">
                {settings?.stampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.stampUrl} alt="Stampë" className="max-h-24 object-contain" />
                ) : (
                  <span className="text-slate-300">Stampë</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-2">Pranoi - Accept</div>
              <div className="border-t border-slate-300 pt-2 text-slate-600 text-sm">
                {settings?.signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.signatureUrl} alt="Nënshkrim" className="mx-auto max-h-20 object-contain" />
                ) : (
                  <div className="h-10" />
                )}
                <p className="mt-3">{format(new Date(invoice.issueDate), "dd MMM yyyy", { locale: sq })}</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-lg font-bold text-slate-900">Project details</p>
            <p className="mt-3 text-sm text-slate-600 leading-6">{invoice.notes || settings?.invoiceFooter || ""}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 text-[11px] text-slate-500">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{settings?.name}</p>
              {settings?.tagline && <p>{settings.tagline}</p>}
            </div>
            <div className="space-y-1">
              {settings?.taxId && <p>Nr Unik: {settings.taxId}</p>}
              {settings?.bankAccount && <p>Reiffeisen Bank: {settings.bankAccount}</p>}
              {settings?.swiftCode && <p>SWIFT: {settings.swiftCode}</p>}
              {settings?.address && <p>{settings.address}</p>}
            </div>
            <div className="space-y-1">
              {settings?.phone && <p>{settings.phone}</p>}
              {settings?.website && <p>{settings.website}</p>}
              {settings?.email && <p>{settings.email}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
