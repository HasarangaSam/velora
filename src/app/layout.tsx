import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthSessionProvider from "@/components/auth/SessionProvider";
import CartSync from "@/components/shop/CartSync";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Velora",
    template: "%s | Velora",
  },
  description: "Fashion and clothing for everyday style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <CartSync />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
