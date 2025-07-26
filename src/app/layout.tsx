import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swap Garden - Cross-Chain Cryptocurrency Swaps",
  description: "Swap cryptocurrencies from any chain to any chain. Experience the most beautiful and efficient cross-chain DeFi platform. Cultivate your crypto portfolio in our digital garden.",
  keywords: "cryptocurrency, cross-chain, swap, DeFi, blockchain, bitcoin, ethereum, solana, polygon",
  authors: [{ name: "Swap Garden Team" }],
  openGraph: {
    title: "Swap Garden - Cross-Chain Cryptocurrency Swaps",
    description: "Swap cryptocurrencies from any chain to any chain. Experience the most beautiful and efficient cross-chain DeFi platform.",
    type: "website",
    images: [
      {
        url: "/hero-garden.png",
        width: 1400,
        height: 800,
        alt: "Swap Garden - Cross-chain cryptocurrency swapping platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swap Garden - Cross-Chain Cryptocurrency Swaps",
    description: "Swap cryptocurrencies from any chain to any chain. Cultivate your crypto portfolio in our digital garden.",
    images: ["/hero-garden.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
