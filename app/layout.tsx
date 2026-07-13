import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "ПромоПтаха — на крилах знижок",
    template: "%s | ПромоПтаха",
  },
  description:
    "Спільна база промокодів, де користувачі додають, перевіряють і знаходять актуальні знижки.",
  applicationName: "ПромоПтаха",
  keywords: [
    "промокоди",
    "знижки",
    "купони",
    "промокод",
    "магазини",
    "економія",
    "ПромоПтаха",
  ],
  authors: [{ name: "ПромоПтаха" }],
  creator: "ПромоПтаха",
  publisher: "ПромоПтаха",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ПромоПтаха — на крилах знижок",
    description:
      "Спільна база промокодів, де користувачі додають і перевіряють знижки.",
    type: "website",
    locale: "uk_UA",
    siteName: "ПромоПтаха",
  },
  twitter: {
    card: "summary",
    title: "ПромоПтаха — на крилах знижок",
    description:
      "Спільна база промокодів, де користувачі додають і перевіряють знижки.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}