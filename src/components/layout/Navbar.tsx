"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/cart-store";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const cartItems = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const totalCartCount = mounted
    ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              VELORA
            </span>
            <span className="h-2 w-2 rounded-full bg-blue-600 mb-2"></span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link
              href="/shop"
              className="hover:text-blue-600 transition"
            >
              All Products
            </Link>
            <Link
              href="/shop?category=men"
              className="hover:text-blue-600 transition"
            >
              Men
            </Link>
            <Link
              href="/shop?category=women"
              className="hover:text-blue-600 transition"
            >
              Women
            </Link>
            <Link
              href="/shop?category=kids"
              className="hover:text-blue-600 transition"
            >
              Kids
            </Link>
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center relative flex-1 max-w-xs"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
            <Search
              size={15}
              className="absolute left-3 text-slate-400 pointer-events-none"
            />
          </form>

          {/* Actions: Account & Cart */}
          <div className="flex items-center gap-4">
            {/* User Account / Dropdown */}
            {session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 focus:outline-none py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                    {session.user.name ? session.user.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {session.user.name?.split(" ")[0] ?? "Account"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    onClick={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {session.user.email}
                      </p>
                    </div>

                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                      >
                        <ShieldCheck size={16} />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      href="/account"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User size={16} />
                      My Account
                    </Link>

                    <Link
                      href="/account/orders"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ShoppingBag size={16} />
                      My Orders
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <LogoutButton />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-blue-600 transition"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag size={22} />
              {totalCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {totalCartCount > 99 ? "99+" : totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <Search
              size={15}
              className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
            />
          </form>

          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-slate-50"
            >
              All Products
            </Link>
            <Link
              href="/shop?category=men"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-slate-50"
            >
              Men's Fashion
            </Link>
            <Link
              href="/shop?category=women"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-slate-50"
            >
              Women's Fashion
            </Link>
            <Link
              href="/shop?category=kids"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded hover:bg-slate-50"
            >
              Kids' Collection
            </Link>
          </nav>

          {!session?.user && (
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
