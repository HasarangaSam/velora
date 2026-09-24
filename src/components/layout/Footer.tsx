"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CreditCard, PackageCheck, Truck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-20 bg-[#211f1b] text-stone-100">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 shrink-0 text-[#c9b99f]" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium">Delivery across Sri Lanka</p>
              <p className="mt-0.5 text-xs text-stone-400">Shipping details at checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 shrink-0 text-[#c9b99f]" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium">Card and online banking</p>
              <p className="mt-0.5 text-xs text-stone-400">Choose a payment method at checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PackageCheck className="h-5 w-5 shrink-0 text-[#c9b99f]" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium">Order updates</p>
              <p className="mt-0.5 text-xs text-stone-400">Follow your orders from your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5">
              <span className="text-2xl font-semibold tracking-[0.12em] text-white">VELORA</span>
              <span className="mb-2 h-1.5 w-1.5 rounded-full bg-[#c9b99f]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-stone-400">
              Considered everyday clothing, made for life in Sri Lanka.
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-stone-500">Colombo, Sri Lanka</p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-300">Explore</h2>
            <ul className="mt-5 space-y-3 text-sm text-stone-400">
              <li><Link href="/shop" className="transition hover:text-white">All clothing</Link></li>
              <li><Link href="/shop?category=men" className="transition hover:text-white">Men</Link></li>
              <li><Link href="/shop?category=women" className="transition hover:text-white">Women</Link></li>
              <li><Link href="/shop?category=kids" className="transition hover:text-white">Kids</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-300">Your account</h2>
            <ul className="mt-5 space-y-3 text-sm text-stone-400">
              <li><Link href="/account" className="transition hover:text-white">Account details</Link></li>
              <li><Link href="/account/orders" className="transition hover:text-white">Orders</Link></li>
              <li><Link href="/cart" className="transition hover:text-white">Shopping cart</Link></li>
              <li><Link href="/login" className="transition hover:text-white">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-300">Need a hand?</h2>
            <p className="mt-5 text-sm leading-6 text-stone-400">For help with an order or a product, send us a note.</p>
            <a href="mailto:support@velora.lk" className="mt-3 inline-flex items-center gap-1.5 text-sm text-white transition hover:text-[#d8cbb7]">
              support@velora.lk <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-5 text-xs leading-5 text-stone-500">Payments are completed securely at checkout.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Velora. All rights reserved.</p>
          <p>Made for everyday living.</p>
        </div>
      </div>
    </footer>
  );
}
