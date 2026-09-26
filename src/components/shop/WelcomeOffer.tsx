"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

export default function WelcomeOffer() {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText("WELCOME500");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section aria-labelledby="welcome-offer-title" className="bg-stone-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8">
        <div className="flex items-start gap-4 sm:items-center">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-amber-200 sm:flex"><Sparkles size={20} /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">A little welcome from us</p>
            <h2 id="welcome-offer-title" className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">Take Rs. 500 off your first order</h2>
            <p className="mt-1 text-sm text-white/65">On orders over Rs. 3,000 · One-time offer for new customers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="rounded-lg border border-dashed border-white/35 px-4 py-2.5 font-mono text-sm font-semibold tracking-[0.12em] text-white">WELCOME500</div>
          <button type="button" onClick={() => void copyCode()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-stone-950 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {copied ? <Check size={16} /> : <Copy size={15} />}{copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>
    </section>
  );
}
