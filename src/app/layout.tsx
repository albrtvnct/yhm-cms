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
  title: "Yesh CMS — Church Management System",
  description:
    "Kelola jemaat, keuangan, pelayanan, dan kegiatan gereja Anda dalam satu platform yang terintegrasi. Solusi manajemen gereja terbaik untuk gereja modern.",
  keywords: [
    "church management system",
    "manajemen gereja",
    "sistem gereja",
    "CMS gereja",
    "jemaat",
    "pelayanan gereja",
  ],
  openGraph: {
    title: "Yesh CMS — Church Management System",
    description:
      "Kelola jemaat, keuangan, pelayanan, dan kegiatan gereja Anda dalam satu platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
