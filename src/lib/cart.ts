import { prisma } from "@/lib/db/prisma";
import type { CartData, CartItemData } from "@/types/cart";

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: {
      userId,
    },
    create: {
      userId,
    },
    update: {},
  });
}

export async function getUserCart(userId: string): Promise<CartData> {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        orderBy: {
          id: "asc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              images: {
                where: {
                  isPrimary: true,
                },
                take: 1,
                orderBy: {
                  sortOrder: "asc",
                },
                select: {
                  url: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              productId: true,
              size: true,
              colour: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      itemCount: 0,
      subtotal: "0.00",
    };
  }

  const items: CartItemData[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    variantId: item.variant.id,
    productName: item.product.name,
    slug: item.product.slug,
    image: item.product.images[0]?.url ?? null,
    size: item.variant.size,
    colour: item.variant.colour,
    price: item.variant.price.toString(),
    quantity: item.quantity,
    stock: item.variant.stock,
  }));

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return {
    items,
    itemCount,
    subtotal: subtotal.toFixed(2),
  };
}
