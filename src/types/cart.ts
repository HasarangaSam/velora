export type CartItemData = {
  id?: string;
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  image: string | null;
  size: string;
  colour: string;
  price: string;
  quantity: number;
  stock: number;
};

export type CartData = {
  items: CartItemData[];
  itemCount: number;
  subtotal: string;
};
