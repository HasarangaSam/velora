import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Velora database...");

  // This demo seed is intentionally a full reset. Keep the delete order aligned
  // with the schema's restrictive foreign keys.
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const databaseName = databaseUrl.pathname.replace(/^\//, "").split("?")[0];
  if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname) || databaseName !== "velora") {
    throw new Error("Refusing to reset a non-local database. Seed is restricted to localhost database 'velora'.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.verificationCode.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.couponUsage.deleteMany();
    await tx.payment.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.wishlistItem.deleteMany();
    await tx.productReview.deleteMany();
    await tx.notification.deleteMany();
    await tx.account.deleteMany();
    await tx.cart.deleteMany();
    await tx.address.deleteMany();
    await tx.order.deleteMany();
    await tx.productImage.deleteMany();
    await tx.productVariant.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.coupon.deleteMany();
    await tx.user.deleteMany();
  });
  console.log("Cleared existing local Velora records.");

  // 1. Seed Users
  const hashedPasswordAdmin = await bcrypt.hash("admin123", 12);
  const hashedPasswordCustomer = await bcrypt.hash("customer123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@velora.lk" },
    update: {
      role: "ADMIN",
      password: hashedPasswordAdmin,
    },
    create: {
      email: "admin@velora.lk",
      name: "Velora Admin",
      password: hashedPasswordAdmin,
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@velora.lk" },
    update: {
      password: hashedPasswordCustomer,
    },
    create: {
      email: "customer@velora.lk",
      name: "Kasun Perera",
      password: hashedPasswordCustomer,
      role: "USER",
    },
  });

  // Seed demo customer address
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        fullName: "Kasun Perera",
        phone: "0771234567",
        addressLine1: "No. 45, Galle Road",
        addressLine2: "Kollupitiya",
        city: "Colombo",
        district: "Colombo",
        postalCode: "00300",
        isDefault: true,
      },
    });
  }

  // 2. Seed Categories & Sub-Categories
  const menCategory = await prisma.category.upsert({
    where: { slug: "men" },
    update: { name: "Men" },
    create: { name: "Men", slug: "men" },
  });

  const womenCategory = await prisma.category.upsert({
    where: { slug: "women" },
    update: { name: "Women" },
    create: { name: "Women", slug: "women" },
  });

  const kidsCategory = await prisma.category.upsert({
    where: { slug: "kids" },
    update: { name: "Kids" },
    create: { name: "Kids", slug: "kids" },
  });

  // Men Sub-Categories
  const menTShirts = await prisma.category.upsert({
    where: { slug: "men-t-shirts" },
    update: { name: "T-Shirts", parentId: menCategory.id },
    create: { name: "T-Shirts", slug: "men-t-shirts", parentId: menCategory.id },
  });

  const menShirts = await prisma.category.upsert({
    where: { slug: "men-shirts" },
    update: { name: "Shirts", parentId: menCategory.id },
    create: { name: "Shirts", slug: "men-shirts", parentId: menCategory.id },
  });

  const menChinos = await prisma.category.upsert({
    where: { slug: "men-chinos" },
    update: { name: "Chinos & Trousers", parentId: menCategory.id },
    create: { name: "Chinos & Trousers", slug: "men-chinos", parentId: menCategory.id },
  });

  // Women Sub-Categories
  const womenDresses = await prisma.category.upsert({
    where: { slug: "women-dresses" },
    update: { name: "Frocks", parentId: womenCategory.id },
    create: { name: "Frocks", slug: "women-dresses", parentId: womenCategory.id },
  });

  const womenTops = await prisma.category.upsert({
    where: { slug: "women-tops" },
    update: { name: "Tops & Tees", parentId: womenCategory.id },
    create: { name: "Tops & Tees", slug: "women-tops", parentId: womenCategory.id },
  });

  const womenTrousers = await prisma.category.upsert({
    where: { slug: "women-trousers" },
    update: { name: "Trousers", parentId: womenCategory.id },
    create: { name: "Trousers", slug: "women-trousers", parentId: womenCategory.id },
  });

  const womenSkirts = await prisma.category.upsert({
    where: { slug: "women-skirts" },
    update: { name: "Skirts", parentId: womenCategory.id },
    create: { name: "Skirts", slug: "women-skirts", parentId: womenCategory.id },
  });

  const womenSarees = await prisma.category.upsert({
    where: { slug: "women-sarees" },
    update: { name: "Sarees", parentId: womenCategory.id },
    create: { name: "Sarees", slug: "women-sarees", parentId: womenCategory.id },
  });

  // Kids Sub-Categories
  const kidsTShirts = await prisma.category.upsert({
    where: { slug: "kids-t-shirts" },
    update: { name: "T-Shirts", parentId: kidsCategory.id },
    create: { name: "T-Shirts", slug: "kids-t-shirts", parentId: kidsCategory.id },
  });

  const kidsShorts = await prisma.category.upsert({
    where: { slug: "kids-shorts" },
    update: { name: "Shorts", parentId: kidsCategory.id },
    create: { name: "Shorts", slug: "kids-shorts", parentId: kidsCategory.id },
  });

  // 3. Seed Products
  const productsData = [
    // Men's Products
    {
      name: "Classic Oversized Cotton T-Shirt",
      slug: "classic-oversized-cotton-t-shirt",
      description: "Crafted from 100% heavyweight 240GSM combed cotton, this oversized tee delivers superior comfort and an effortless modern drape for daily tropical wear.",
      categoryId: menCategory.id,
      subCategoryId: menTShirts.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-oversized-tee-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "S", colour: "Black", price: 2990, stock: 15 },
        { size: "M", colour: "Black", price: 2990, stock: 25 },
        { size: "L", colour: "Black", price: 2990, stock: 20 },
        { size: "M", colour: "White", price: 2990, stock: 18 },
        { size: "L", colour: "White", price: 2990, stock: 12 },
        { size: "M", colour: "Blue", price: 2990, stock: 10 },
      ],
    },
    {
      name: "Relaxed Fit Linen Short Sleeve Shirt",
      slug: "relaxed-fit-linen-short-sleeve-shirt",
      description: "Breathable pure linen Cuban collar shirt designed to stay crisp and airy during hot sunny afternoons in Sri Lanka.",
      categoryId: menCategory.id,
      subCategoryId: menShirts.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-linen-shirt-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "M", colour: "White", price: 4490, stock: 12 },
        { size: "L", colour: "White", price: 4490, stock: 14 },
        { size: "M", colour: "Beige", price: 4490, stock: 8 },
        { size: "L", colour: "Beige", price: 4490, stock: 10 },
      ],
    },
    {
      name: "Everyday Stretch Chino Pants",
      slug: "everyday-stretch-chino-pants",
      description: "Smart casual tailored chinos with 2% elastane for flexible movement whether you're at the office or weekend dinner.",
      categoryId: menCategory.id,
      subCategoryId: menChinos.id,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-chino-pants-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "30", colour: "Beige", price: 4990, stock: 10 },
        { size: "32", colour: "Beige", price: 4990, stock: 15 },
        { size: "34", colour: "Beige", price: 4990, stock: 12 },
        { size: "32", colour: "Black", price: 4990, stock: 10 },
      ],
    },

    // Women's Products
    {
      name: "Breezy Tiered Linen Midi Dress",
      slug: "breezy-tiered-linen-midi-dress",
      description: "A breezy, feminine tiered silhouette cut from premium lightweight linen with delicate puff sleeves and functional side pockets.",
      categoryId: womenCategory.id,
      subCategoryId: womenDresses.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-linen-dress-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "XS", colour: "White", price: 5490, stock: 8 },
        { size: "S", colour: "White", price: 5490, stock: 14 },
        { size: "M", colour: "White", price: 5490, stock: 16 },
        { size: "S", colour: "Pink", price: 5490, stock: 10 },
        { size: "M", colour: "Pink", price: 5490, stock: 12 },
      ],
    },
    {
      name: "Minimalist Ribbed Knit Crop Top",
      slug: "minimalist-ribbed-knit-crop-top",
      description: "Soft viscose blend cropped tee with a flattering scoop neckline, designed for versatile layering and weekend pairing.",
      categoryId: womenCategory.id,
      subCategoryId: womenTops.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-ribbed-top-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "S", colour: "Black", price: 2190, stock: 20 },
        { size: "M", colour: "Black", price: 2190, stock: 20 },
        { size: "S", colour: "White", price: 2190, stock: 15 },
        { size: "M", colour: "White", price: 2190, stock: 18 },
      ],
    },
    {
      name: "High-Waist Wide Leg Trousers",
      slug: "high-waist-wide-leg-trousers",
      description: "Elegant pleated high-waisted trousers with tailored front crease and relaxed wide drape.",
      categoryId: womenCategory.id,
      subCategoryId: womenTrousers.id,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-wide-leg-trousers-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "S", colour: "Beige", price: 4790, stock: 10 },
        { size: "M", colour: "Beige", price: 4790, stock: 12 },
        { size: "L", colour: "Beige", price: 4790, stock: 8 },
      ],
    },
    {
      name: "Traditional Handwoven Pure Silk Saree",
      slug: "traditional-handwoven-pure-silk-saree",
      description: "Exquisite handwoven pure silk saree adorned with rich golden zari border and pallu, perfect for weddings and special occasions in Sri Lanka.",
      categoryId: womenCategory.id,
      subCategoryId: womenSarees.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-silk-saree-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "Free Size", colour: "Red", price: 14990, stock: 6 },
        { size: "Free Size", colour: "Green", price: 14990, stock: 5 },
        { size: "Free Size", colour: "Gold", price: 15990, stock: 4 },
      ],
    },
    {
      name: "Floral Tiered Bohemian Maxi Skirt",
      slug: "floral-tiered-bohemian-maxi-skirt",
      description: "Flowy rayon maxi skirt with an elastic smocked waistband and vibrant tropical floral motifs.",
      categoryId: womenCategory.id,
      subCategoryId: womenSkirts.id,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-maxi-skirt-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "S", colour: "Floral Blue", price: 3890, stock: 12 },
        { size: "M", colour: "Floral Blue", price: 3890, stock: 15 },
        { size: "L", colour: "Floral Blue", price: 3890, stock: 8 },
      ],
    },

    // Kids' Products
    {
      name: "Kids' Organic Cotton Graphic Tee",
      slug: "kids-organic-cotton-graphic-tee",
      description: "Super-soft combed cotton jersey tee gentle on sensitive skin with vibrant water-based playful print.",
      categoryId: kidsCategory.id,
      subCategoryId: kidsTShirts.id,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-kids-tee-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "3-4Y", colour: "Blue", price: 1890, stock: 15 },
        { size: "5-6Y", colour: "Blue", price: 1890, stock: 15 },
        { size: "7-8Y", colour: "Blue", price: 1890, stock: 12 },
        { size: "5-6Y", colour: "White", price: 1890, stock: 10 },
      ],
    },
    {
      name: "Kids' Everyday Play Chino Shorts",
      slug: "kids-everyday-play-chino-shorts",
      description: "Durable cotton twill shorts with an elastic drawstring waistband designed for all-day running and playing.",
      categoryId: kidsCategory.id,
      subCategoryId: kidsShorts.id,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=800&q=80",
          publicId: "seed-kids-shorts-1",
          isPrimary: true,
        },
      ],
      variants: [
        { size: "3-4Y", colour: "Beige", price: 2190, stock: 10 },
        { size: "5-6Y", colour: "Beige", price: 2190, stock: 12 },
        { size: "7-8Y", colour: "Beige", price: 2190, stock: 10 },
      ],
    },
  ];

  // Alternate product and detail shots make every product page/gallery useful
  // for a live demo. Keep the first image as the listing-card image.
  const galleryBySlug: Record<string, string[]> = {
    "classic-oversized-cotton-t-shirt": [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=85",
    ],
    "relaxed-fit-linen-short-sleeve-shirt": [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    ],
    "everyday-stretch-chino-pants": [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
    ],
    "breezy-tiered-linen-midi-dress": [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85",
    ],
    "minimalist-ribbed-knit-crop-top": [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=85",
    ],
    "high-waist-wide-leg-trousers": [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",
    ],
    "traditional-handwoven-pure-silk-saree": [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e3?auto=format&fit=crop&w=1200&q=85",
    ],
    "floral-tiered-bohemian-maxi-skirt": [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85",
    ],
    "kids-organic-cotton-graphic-tee": [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85&sat=-10",
    ],
    "kids-everyday-play-chino-shorts": [
      "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1200&q=85",
    ],
  };

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId,
          isFeatured: p.isFeatured,
          isActive: true,
          images: {
            create: galleryBySlug[p.slug].map((url, i) => ({
              url,
              publicId: `seed-${p.slug}-${i + 1}`,
              sortOrder: i,
              isPrimary: i === 0,
            })),
          },
          variants: {
            create: p.variants.map((v) => ({
              size: v.size,
              colour: v.colour,
              price: v.price,
              stock: v.stock,
            })),
          },
        },
      });
      console.log(`Created product: ${p.name}`);
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId,
        },
      });
      console.log(`Updated product category & subCategory: ${p.name}`);
    }
  }

  // 4. Seed Coupons
  await prisma.coupon.upsert({
    where: { code: "VELORA10" },
    update: {},
    create: {
      code: "VELORA10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumOrderValue: 2000,
      maximumDiscount: 1500,
      usageLimit: 500,
      perUserLimit: 1,
      status: "ACTIVE",
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME500" },
    update: {
      discountType: "FIXED",
      discountValue: 500,
      minimumOrderValue: 3000,
      maximumDiscount: null,
      usageLimit: null,
      perUserLimit: 1,
      status: "ACTIVE",
    },
    create: {
      code: "WELCOME500",
      discountType: "FIXED",
      discountValue: 500,
      minimumOrderValue: 3000,
      usageLimit: null,
      perUserLimit: 1,
      status: "ACTIVE",
    },
  });

  const seededProducts = await prisma.product.findMany({
    select: { slug: true, images: { select: { id: true } } },
  });
  const productsWithoutGallery = seededProducts.filter((product) => product.images.length < 3);
  if (seededProducts.length !== productsData.length || productsWithoutGallery.length > 0) {
    throw new Error(
      `Seed verification failed: ${seededProducts.length} products, ${productsWithoutGallery.length} with fewer than 3 images.`,
    );
  }

  console.log("Seeding completed successfully!");
  console.log(`Verified ${seededProducts.length} clothing products with at least 3 images each.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
