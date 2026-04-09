import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dhan Kamao - Bitcoin in India",
  description: "Your gateway to Bitcoin in India. Track prices in INR, manage your portfolio, and trade securely.",
  keywords: ["Bitcoin", "BTC", "India", "Crypto Wallet", "INR", "Bitcoin Price"],
  authors: [{ name: "Dhan Kamao" }],
  applicationName: "Dhan Kamao",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dhan Kamao",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Dhan Kamao",
    description: "Bitcoin Wallet for India - Track, Trade & Earn",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111111",
  colorScheme: "dark",
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
          <PwaInstallPrompt />
        </Providers>
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
