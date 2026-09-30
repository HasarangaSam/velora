"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import NotificationBell from "@/components/layout/NotificationBell";
import { getCategoryDisplayName } from "@/lib/category-display";

const subscribeToNothing = () => () => {};

type NavSubCategory = {
  id?: string;
  name: string;
  slug: string;
};

type NavCategoryRecord = {
  id?: string;
  name: string;
  slug: string;
  children?: NavSubCategory[];
};

type CategoryDropdownConfig = {
  slug: string;
  name: string;
  mobileLabel: string;
  defaultSubcategories: { name: string; slug: string }[];
};

const CATEGORY_CONFIGS: CategoryDropdownConfig[] = [
  {
    slug: "men",
    name: "Men",
    mobileLabel: "Men's Fashion",
    defaultSubcategories: [
      { name: "T-Shirts", slug: "men-t-shirts" },
      { name: "Shirts", slug: "men-shirts" },
      { name: "Chinos & Trousers", slug: "men-chinos" },
    ],
  },
  {
    slug: "women",
    name: "Women",
    mobileLabel: "Women's Fashion",
    defaultSubcategories: [
      { name: "Frocks", slug: "women-dresses" },
      { name: "Tops & Tees", slug: "women-tops" },
      { name: "Trousers", slug: "women-trousers" },
      { name: "Skirts", slug: "women-skirts" },
      { name: "Sarees", slug: "women-sarees" },
    ],
  },
  {
    slug: "kids",
    name: "Kids",
    mobileLabel: "Kids' Collection",
    defaultSubcategories: [
      { name: "T-Shirts", slug: "kids-t-shirts" },
      { name: "Shorts", slug: "kids-shorts" },
    ],
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "";
  const urlSearch = searchParams.get("search") ?? "";
  const { data: session } = useSession();
  const cartItems = useCartStore((state) => state.items);
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  // Keep session-dependent markup identical until hydration completes. The
  // client session may be available before the server-rendered session is.
  const activeUser = mounted ? session?.user : undefined;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedCategories, setMobileExpandedCategories] = useState<Record<string, boolean>>({});
  const [categoriesData, setCategoriesData] = useState<NavCategoryRecord[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigationKey = `${pathname}?${searchParams.toString()}`;
  const [searchInputState, setSearchInputState] = useState({
    pathname,
    urlSearch,
    value: pathname === "/shop" ? urlSearch : "",
  });
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    // The navbar persists between App Router navigations, so explicitly close
    // transient menus when either the path or its query parameters change.
    const closeMenus = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setUserDropdownOpen(false);
      setOpenDropdown(null);
    }, 0);

    return () => window.clearTimeout(closeMenus);
  }, [navigationKey]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: NavCategoryRecord[]) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setCategoriesData(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function handleMouseEnter(slug: string) {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenDropdown(slug);
  }

  function handleMouseLeave() {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  }

  function toggleMobileCategory(slug: string) {
    setMobileExpandedCategories((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  }

  let searchQuery = searchInputState.value;
  if (searchInputState.pathname !== pathname || searchInputState.urlSearch !== urlSearch) {
    searchQuery = pathname === "/shop" ? urlSearch : "";
    setSearchInputState({ pathname, urlSearch, value: searchQuery });
  }

  function handleClearSearch() {
    setSearchInputState((current) => ({ ...current, value: "" }));
    if (pathname === "/shop" && searchParams.get("search")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      params.delete("page");
      const next = params.toString();
      router.push(`/shop${next ? `?${next}` : ""}`);
    }
  }

  useEffect(() => {
    let cancelled = false;

    if (!session?.user?.id) {
      void Promise.resolve().then(() => { if (!cancelled) setWishlistCount(0); });
      return () => { cancelled = true; };
    }

    fetch("/api/wishlist/count", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { count: 0 })
      .then((data: { count?: number }) => {
        if (!cancelled) setWishlistCount(data.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setWishlistCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    function handleWishlistCountChange(event: Event) {
      const count = (event as CustomEvent<number>).detail;
      if (typeof count === "number") setWishlistCount(count);
    }

    window.addEventListener("velora:wishlist-count", handleWishlistCountChange);
    return () => window.removeEventListener("velora:wishlist-count", handleWishlistCountChange);
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const totalCartCount = mounted
    ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  function isCollectionActive(slug: string) {
    return (
      pathname === "/shop" &&
      (selectedCategory === slug || selectedCategory.startsWith(`${slug}-`))
    );
  }

  const saleActive = pathname === "/shop" && searchParams.get("saleOnly") === "true";
  const allProductsActive = pathname === "/shop" && !selectedCategory && !saleActive;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none rounded-lg hover:bg-slate-50 transition"
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
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <Link
              href="/shop"
              aria-current={allProductsActive ? "page" : undefined}
              className={`relative py-2 transition ${
                allProductsActive
                  ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              All Products
            </Link>
            <Link
              href="/shop?saleOnly=true"
              aria-current={saleActive ? "page" : undefined}
              className={`relative py-2 font-semibold transition ${
                saleActive
                  ? "text-rose-700 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-rose-600"
                  : "text-rose-600 hover:text-rose-800"
              }`}
            >
              Sale
            </Link>

            {/* Men, Women, Kids dropdowns on hover */}
            {CATEGORY_CONFIGS.map((config) => {
              const isCategoryActive = isCollectionActive(config.slug);
              const isDropdownOpen = openDropdown === config.slug;
              const dbCategory = categoriesData.find((c) => c.slug === config.slug);
              const subcategories =
                dbCategory?.children && dbCategory.children.length > 0
                  ? dbCategory.children.map((child) => ({
                      name: getCategoryDisplayName(child),
                      slug: child.slug,
                    }))
                  : config.defaultSubcategories;

              return (
                <div
                  key={config.slug}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(config.slug)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={`/shop?category=${config.slug}`}
                    aria-current={isCategoryActive ? "page" : undefined}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    onClick={() => setOpenDropdown(null)}
                    className={`relative inline-flex items-center gap-1.5 py-2 transition group ${
                      isCategoryActive
                        ? "text-stone-950 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:bg-stone-950"
                        : "text-stone-600 hover:text-stone-950"
                    }`}
                  >
                    <span>{config.name}</span>
                    <ChevronDown
                      size={13}
                      className={`text-stone-400 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-stone-800" : "group-hover:text-stone-700"
                      }`}
                    />
                  </Link>

                  {/* Clean Category Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      onMouseEnter={() => handleMouseEnter(config.slug)}
                      onMouseLeave={handleMouseLeave}
                      className="absolute left-0 top-full pt-2 z-50 w-52 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-1.5">
                        <Link
                          href={`/shop?category=${config.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition"
                        >
                          All {config.name}
                        </Link>
                        <div className="my-1 border-t border-slate-100" />
                        {subcategories.map((sub) => {
                          const isSubActive =
                            pathname === "/shop" && selectedCategory === sub.slug;
                          return (
                            <Link
                              key={sub.slug}
                              href={`/shop?category=${sub.slug}`}
                              onClick={() => setOpenDropdown(null)}
                              className={`block rounded-lg px-3 py-2 text-xs transition ${
                                isSubActive
                                  ? "bg-blue-50 text-blue-600 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Search Bar */}
          <ProductSearchInput
            value={searchQuery}
            onChange={(value) => setSearchInputState((current) => ({ ...current, value }))}
            onSubmit={(value) => {
              if (value.trim()) router.push(`/shop?search=${encodeURIComponent(value.trim())}`);
            }}
            onClear={handleClearSearch}
            className="hidden lg:block flex-1 max-w-xs"
            inputClassName="rounded-full bg-slate-50 py-2 text-xs focus:border-blue-600 focus:bg-white"
          />

          {/* Actions: Account, Wishlist & Cart */}
          <div className="flex items-center gap-4">
            {activeUser && <NotificationBell />}
            {/* User Account / Dropdown */}
            {activeUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 focus:outline-none py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                    {activeUser.name ? activeUser.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {activeUser.name?.split(" ")[0] ?? "Account"}
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
                        {activeUser.email}
                      </p>
                    </div>

                    {activeUser.role === "ADMIN" && (
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
              aria-label={wishlistCount > 0 ? `View wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` : "View wishlist"}
              title="Wishlist"
              className={`relative p-2 transition ${pathname === "/account/wishlist" ? "text-rose-600" : "text-slate-700 hover:text-rose-600"}`}
            >
              <Heart size={21} strokeWidth={1.8} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <ProductSearchInput
            value={searchQuery}
            onChange={(value) => setSearchInputState((current) => ({ ...current, value }))}
            onSubmit={(value) => {
              if (value.trim()) router.push(`/shop?search=${encodeURIComponent(value.trim())}`);
              setMobileMenuOpen(false);
            }}
            onClear={handleClearSearch}
            onSelect={() => setMobileMenuOpen(false)}
            inputClassName="text-xs"
          />

          <nav className="flex flex-col space-y-1.5 text-sm font-medium">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={allProductsActive ? "page" : undefined}
              className={`rounded-xl px-3.5 py-2.5 transition ${
                allProductsActive ? "bg-stone-100 text-stone-950 font-semibold" : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              All Products
            </Link>
            <Link
              href="/shop?saleOnly=true"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={saleActive ? "page" : undefined}
              className={`rounded-xl px-3.5 py-2.5 font-semibold transition ${
                saleActive ? "bg-rose-50 text-rose-700" : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              Sale
            </Link>

            {/* Mobile Category Accordions for Men, Women, Kids */}
            {CATEGORY_CONFIGS.map((config) => {
              const isExpanded = mobileExpandedCategories[config.slug] ?? false;
              const isParentActive = isCollectionActive(config.slug);
              const dbCategory = categoriesData.find((c) => c.slug === config.slug);
              const subcategories =
                dbCategory?.children && dbCategory.children.length > 0
                  ? dbCategory.children.map((child) => ({
                      name: getCategoryDisplayName(child),
                      slug: child.slug,
                    }))
                  : config.defaultSubcategories;

              return (
                <div
                  key={config.slug}
                  className={`rounded-xl overflow-hidden border transition ${
                    isParentActive
                      ? "border-blue-200 bg-blue-50/20"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/shop?category=${config.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isParentActive ? "page" : undefined}
                      className={`flex-1 px-3.5 py-2.5 text-sm font-medium transition ${
                        isParentActive ? "text-blue-700 font-bold" : "text-stone-800 hover:text-stone-950"
                      }`}
                    >
                      {config.mobileLabel}
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleMobileCategory(config.slug)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle ${config.name} subcategories`}
                      className="p-2.5 mr-1 text-slate-500 hover:text-slate-900 rounded-lg focus:outline-none"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Collapsible Subcategories */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/70 bg-white px-3.5 py-2 space-y-1 animate-in fade-in duration-150">
                      <Link
                        href={`/shop?category=${config.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-2 px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-lg transition"
                      >
                        <span>View All {config.name}&apos;s Clothing</span>
                        <span>&rarr;</span>
                      </Link>

                      {subcategories.map((sub) => {
                        const isSubActive =
                          pathname === "/shop" && selectedCategory === sub.slug;
                        return (
                          <Link
                            key={sub.slug}
                            href={`/shop?category=${sub.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between py-2 px-2.5 text-xs rounded-lg transition ${
                              isSubActive
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span>{sub.name}</span>
                            {isSubActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {!activeUser && (
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
