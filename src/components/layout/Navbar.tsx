"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  ShoppingBag,
  Heart,
} from "lucide-react";
import ProductSearchInput from "@/components/shop/ProductSearchInput";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "";
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

  function isCollectionActive(slug: string) {
    return pathname === "/shop" &&
      (selectedCategory === slug || selectedCategory.startsWith(`${slug}-`));
  }

  const allProductsActive = pathname === "/shop" && !selectedCategory;

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
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/shop"
              aria-current={allProductsActive ? "page" : undefined}
              className={`relative py-2 transition ${allProductsActive ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950" : "text-stone-600 hover:text-stone-950"}`}
            >
              All Products
            </Link>
            <Link
              href="/shop?category=men"
              aria-current={isCollectionActive("men") ? "page" : undefined}
              className={`relative py-2 transition ${isCollectionActive("men") ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950" : "text-stone-600 hover:text-stone-950"}`}
            >
              Men
            </Link>
            <Link
              href="/shop?category=women"
              aria-current={isCollectionActive("women") ? "page" : undefined}
              className={`relative py-2 transition ${isCollectionActive("women") ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950" : "text-stone-600 hover:text-stone-950"}`}
            >
              Women
            </Link>
            <Link
              href="/shop?category=kids"
              aria-current={isCollectionActive("kids") ? "page" : undefined}
              className={`relative py-2 transition ${isCollectionActive("kids") ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950" : "text-stone-600 hover:text-stone-950"}`}
            >
              Kids
            </Link>
          </nav>

          {/* Search Bar */}
          <ProductSearchInput value={searchQuery} onChange={setSearchQuery} onSubmit={(value) => {
            if (value.trim()) router.push(`/shop?search=${encodeURIComponent(value.trim())}`);
          }} className="hidden lg:block flex-1 max-w-xs" inputClassName="rounded-full bg-slate-50 py-2 text-xs focus:border-blue-600 focus:bg-white" />

          {/* Actions: Account, Wishlist & Cart */}
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

            {/* Wishlist Button */}
            <Link
              href="/account/wishlist"
              aria-current={pathname === "/account/wishlist" ? "page" : undefined}
              aria-label="View wishlist"
              title="Wishlist"
              className={`relative p-2 transition ${pathname === "/account/wishlist" ? "text-rose-600" : "text-slate-700 hover:text-rose-600"}`}
            >
              <Heart size={21} strokeWidth={1.8} />
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-blue-600 transition"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart size={22} strokeWidth={1.8} />
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
          <ProductSearchInput value={searchQuery} onChange={setSearchQuery} onSubmit={(value) => {
            if (value.trim()) router.push(`/shop?search=${encodeURIComponent(value.trim())}`);
            setMobileMenuOpen(false);
          }} inputClassName="text-xs" />

          <nav className="flex flex-col space-y-1 text-sm font-medium">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={allProductsActive ? "page" : undefined}
              className={`rounded-lg px-3 py-2 transition ${allProductsActive ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50"}`}
            >
              All Products
            </Link>
            <Link
              href="/shop?category=men"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isCollectionActive("men") ? "page" : undefined}
              className={`rounded-lg px-3 py-2 transition ${isCollectionActive("men") ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50"}`}
            >
              Men's Fashion
            </Link>
            <Link
              href="/shop?category=women"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isCollectionActive("women") ? "page" : undefined}
              className={`rounded-lg px-3 py-2 transition ${isCollectionActive("women") ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50"}`}
            >
              Women's Fashion
            </Link>
            <Link
              href="/shop?category=kids"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isCollectionActive("kids") ? "page" : undefined}
              className={`rounded-lg px-3 py-2 transition ${isCollectionActive("kids") ? "bg-stone-100 text-stone-950" : "text-stone-600 hover:bg-stone-50"}`}
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
