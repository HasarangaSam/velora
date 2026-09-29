import CartPageClient from "@/components/shop/CartPageClient";

export const metadata = {
  title: "Shopping Cart",
};

// The cart page itself is intentionally thin because the interactive logic lives in the
// client component that handles item updates, totals, and checkout actions.
export default function CartPage() {
  return <CartPageClient />;
}
