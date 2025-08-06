import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import HeaderBlock from "@/components/blocks/HeaderBlock";
import FooterBlock from "@/components/blocks/FooterBlock";

export const metadata = {
  title: "AI Video Idea Generator",
  description: "Generate video ideas from any topic",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen text-[#280A3E]">
        <HeaderBlock />
        <main className="flex-1">{children}</main>
        <FooterBlock />
      </body>
    </html>
  );
}
