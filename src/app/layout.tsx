import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BitPay Wallet - Bitcoin in India",
  description: "Your gateway to Bitcoin in India. Track prices in INR, manage your portfolio, and trade securely.",
  keywords: ["Bitcoin", "BTC", "India", "Crypto Wallet", "INR", "Bitcoin Price"],
  authors: [{ name: "BitPay Wallet" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>₿</text></svg>",
  },
  openGraph: {
    title: "BitPay Wallet",
    description: "Bitcoin Wallet for India - Track, Trade & Earn",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
