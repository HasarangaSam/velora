"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

type Suggestion = { name: string; slug: string; image: string | null; price: string | null };
type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  label?: string;
  onFocusChange?: (focused: boolean) => void;
};

export default function ProductSearchInput({
  value, onChange, onSubmit, placeholder = "Search products...", className = "", inputClassName = "",
  id, label, onFocusChange,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    const controller = new AbortController();
    if (query.length < 2) return () => controller.abort();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        setSuggestions(data.products ?? []);
        setSuggestionQuery(query);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
          setSuggestionQuery(query);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(value);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && <label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-600">{label}</label>}
      <form onSubmit={submit} className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); onFocusChange?.(true); }}
          onBlur={() => onFocusChange?.(false)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open && value.trim().length >= 2}
          className={`w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100 ${value ? "pr-10" : "pr-3"} ${inputClassName}`}
        />
        {value && (
          <button type="button" aria-label="Clear search" onClick={() => { onChange(""); setSuggestions([]); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      {open && value.trim().length >= 2 && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
          {(suggestionQuery === value.trim() ? suggestions : []).map((product) => (
            <Link key={product.slug} role="option" href={`/products/${product.slug}`} onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-stone-100 px-3 py-2.5 last:border-0 hover:bg-stone-50">
              <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {product.image && <img src={product.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{product.name}</span>
              {product.price && <span className="shrink-0 text-xs text-stone-500">LKR {Number(product.price).toLocaleString()}</span>}
            </Link>
          ))}
          {loading && <p className="px-4 py-3 text-xs text-stone-500">Searching…</p>}
          {!loading && (suggestionQuery !== value.trim() || suggestions.length === 0) && <p className="px-4 py-3 text-xs text-stone-500">No matching products yet.</p>}
          <button type="button" onClick={() => { onSubmit(value); setOpen(false); }}
            className="w-full border-t border-stone-100 px-4 py-3 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50">
            View all results for “{value.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
