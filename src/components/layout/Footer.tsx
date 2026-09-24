"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      {/* Value Perks Banner */}
      <div className="border-b border-slate-100 bg-slate-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Island-wide Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">Fast shipping across Sri Lanka</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">PayHere Secure</h4>
                <p className="text-xs text-slate-500 mt-0.5">Visa, Mastercard & online banking</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Authentic Quality</h4>
                <p className="text-xs text-slate-500 mt-0.5">100% premium fabric & stitching</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Easy Exchanges</h4>
                <p className="text-xs text-slate-500 mt-0.5">Hassle-free size replacement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                VELORA
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-600 mb-2"></span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Velora is a modern clothing brand tailored for everyday comfort and contemporary style in Sri Lanka.
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Colombo, Sri Lanka
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Shop Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/shop" className="hover:text-blue-600 transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=men" className="hover:text-blue-600 transition">
                  Men's Clothing
                </Link>
              </li>
              <li>
                <Link href="/shop?category=women" className="hover:text-blue-600 transition">
                  Women's Fashion
                </Link>
              </li>
              <li>
                <Link href="/shop?category=kids" className="hover:text-blue-600 transition">
                  Kids' Essentials
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/account/orders" className="hover:text-blue-600 transition">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-blue-600 transition">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-blue-600 transition">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <span className="text-slate-400">support@velora.lk</span>
              </li>
            </ul>
          </div>

          {/* Payment Gateway Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Payment Gateway
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              We process online card and banking transactions securely via PayHere, Sri Lanka's leading PCI-DSS compliant payment aggregator.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              PayHere Sandbox Verified
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Velora Clothing. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="hover:text-slate-600 transition">
              Privacy Policy
            </Link>
            <Link href="/shop" className="hover:text-slate-600 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
