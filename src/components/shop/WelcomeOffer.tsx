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
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-8">
        <div className="flex items-start gap-4 sm:items-center">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-amber-200 sm:flex"><Sparkles size={20} /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">A little welcome from us</p>
            <h2 id="welcome-offer-title" className="mt-1 text-lg font-medium leading-snug tracking-tight sm:text-2xl">Take Rs. 500 off your first order</h2>
            <p className="mt-1 text-xs leading-5 text-white/65 sm:text-sm">On orders over Rs. 3,000 · One-time offer for new customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:gap-3 sm:self-auto">
          <div className="rounded-lg border border-dashed border-white/35 px-3 py-2 font-mono text-xs font-semibold tracking-[0.12em] text-white sm:px-4 sm:py-2.5 sm:text-sm">WELCOME500</div>
          <button type="button" onClick={() => void copyCode()} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-stone-950 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-11 sm:px-4 sm:text-sm">
            {copied ? <Check size={16} /> : <Copy size={15} />}{copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>
    </section>
  );
}
