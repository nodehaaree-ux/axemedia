"use client";

import { useEffect, useRef, useState } from "react";
import { PackageSearch } from "lucide-react";

interface Service {
  id: number;
  name: string;
  defaultPrice: number;
  unit?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (name: string, price: number) => void;
  services: Service[];
  placeholder?: string;
  required?: boolean;
}

export default function ServiceAutocomplete({
  value, onChange, onSelect, services, placeholder = "Shërbimi / Produkti", required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const q = value.toLowerCase();
      const matches = services.filter((s) => s.name.toLowerCase().includes(q));
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setOpen(false);
    }
    setActiveIdx(-1);
  }, [value, services]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const select = (s: Service) => {
    onSelect(s.name, s.defaultPrice);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown")   { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")     { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); select(filtered[activeIdx]); }
    if (e.key === "Escape")      setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400 flex flex-col items-center gap-1">
              <PackageSearch className="w-5 h-5" />
              <span>Nuk u gjet asnjë shërbim</span>
            </div>
          ) : (
            filtered.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => select(s)}
                className={`w-full px-3 py-2.5 text-left text-sm flex justify-between items-center gap-2 transition-colors ${
                  idx === activeIdx ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-medium text-slate-800">{s.name}</span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                  €{s.defaultPrice.toFixed(2)} / {s.unit || "copë"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
