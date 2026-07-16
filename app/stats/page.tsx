import type { Metadata } from "next";
import StatsClient from "./StatsClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const title =
  "Статистика ПромоПтахи — магазини, промокоди та перевірки";

const description =
  "Відкрита статистика ПромоПтахи: кількість магазинів, активних промокодів, перевірок користувачів і найактивніші магазини.";

const pageUrl = `${siteUrl}/stats`;

const statsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: pageUrl,
  isPartOf: {
    "@type": "WebSite",
    name: "ПромоПтаха",
    url: siteUrl,
  },
  about: {
    "@type": "Thing",
    name: "Статистика промокодів і магазинів",
  },
};

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    siteName: "ПромоПтаха",
    locale: "uk_UA",
    images: [
      {
        url: "/icons/promoptaha-bird.png",
        width: 512,
        height: 512,
        alt: "Статистика ПромоПтахи",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icons/promoptaha-bird.png"],
  },
};

export default function StatsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(statsJsonLd),
        }}
      />

      <StatsClient />
    </>
  );
}