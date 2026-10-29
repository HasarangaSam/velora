import { auth } from "@/auth";
import { getUserCart } from "@/lib/cart";
import CartPageClient from "@/components/shop/CartPageClient";

export const metadata = {
  title: "Shopping Cart",
};

export default async function CartPage() {
  const session = await auth();
  const initialCart = session?.user?.id ? await getUserCart(session.user.id) : null;

  return <CartPageClient initialCart={initialCart} />;
}
