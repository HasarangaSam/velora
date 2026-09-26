import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import AuthSessionProvider from "@/components/auth/SessionProvider";
import CartSync from "@/components/shop/CartSync";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.ttf",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Velora | Sri Lankan Fashion & Clothing",
    template: "%s | Velora",
  },
  description: "Modern, comfortable clothing designed for everyday Sri Lankan living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-white text-slate-900`}>
        <AuthSessionProvider>
          <CartSync />
          <Suspense fallback={<div aria-hidden="true" className="h-16 border-b border-slate-200 bg-white md:h-20" />}>
            <Navbar />
          </Suspense>
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
