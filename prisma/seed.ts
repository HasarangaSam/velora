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

  // 2. Seed Categories
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

  // 3. Seed Products
  const productsData = [
    // Men's Products
    {
      name: "Classic Oversized Cotton T-Shirt",
      slug: "classic-oversized-cotton-t-shirt",
      description: "Crafted from 100% heavyweight 240GSM combed cotton, this oversized tee delivers superior comfort and an effortless modern drape for daily tropical wear.",
      categoryId: menCategory.id,
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

    // Kids' Products
    {
      name: "Kids' Organic Cotton Graphic Tee",
      slug: "kids-organic-cotton-graphic-tee",
      description: "Super-soft combed cotton jersey tee gentle on sensitive skin with vibrant water-based playful print.",
      categoryId: kidsCategory.id,
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
          isFeatured: p.isFeatured,
          isActive: true,
          images: {
            create: p.images.map((img, i) => ({
              url: img.url,
              publicId: img.publicId,
              sortOrder: i,
              isPrimary: img.isPrimary,
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
    update: {},
    create: {
      code: "WELCOME500",
      discountType: "FIXED",
      discountValue: 500,
      minimumOrderValue: 3000,
      usageLimit: 200,
      perUserLimit: 1,
      status: "ACTIVE",
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
