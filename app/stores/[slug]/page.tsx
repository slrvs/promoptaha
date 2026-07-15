import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import StoreDetailsClient from "./StoreDetailsClient";

type StoreDetails = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  category_id?: string | null;
  search_aliases?: string[] | null;
  created_at?: string | null;
  category_ids?: string[] | null;
  category_names?: string[] | null;
  category_slugs?: string[] | null;
  promo_count?: number | null;
  active_promo_count?: number | null;
  expired_promo_count?: number | null;
  verified_promo_count?: number | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getCategoryText(store: StoreDetails) {
  const categories = store.category_names || [];

  if (categories.length === 0) {
    return "магазин";
  }

  if (categories.length === 1) {
    return categories[0];
  }

  return categories.join(", ");
}

function getStoreTitle(store: StoreDetails) {
  return `${store.name} — промокоди, знижки та купони`;
}

function getStoreDescription(store: StoreDetails) {
  const description = store.description?.trim();
  const activePromoCount = Number(store.active_promo_count || 0);
  const categoryText = getCategoryText(store);

  if (description) {
    return description;
  }

  if (activePromoCount > 0) {
    return `Актуальні промокоди для ${store.name}. Категорії: ${categoryText}. Перевіряй знижки, копіюй коди та голосуй, чи вони працюють.`;
  }

  return `${store.name} на ПромоПтасі. Категорії: ${categoryText}. Тут зʼявлятимуться актуальні промокоди, купони та знижки для цього магазину.`;
}

async function getStoreBySlug(rawSlug: string) {
  const slug = decodeSlug(rawSlug);

  const { data, error } = await supabase
    .from("store_category_stats")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as StoreDetails;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return {
      title: "Магазин не знайдено",
      description:
        "Магазин не знайдено, приховано або посилання змінилося.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = getStoreTitle(store);
  const description = getStoreDescription(store);
  const canonicalUrl = `${getSiteUrl()}/stores/${store.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "ПромоПтаха",
      locale: "uk_UA",
      images: [
        {
          url: "/icons/promoptaha-bird.png",
          width: 512,
          height: 512,
          alt: "ПромоПтаха",
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
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const canonicalUrl = `${getSiteUrl()}/stores/${store.slug}`;
  const categories = store.category_names || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: getStoreDescription(store),
    url: canonicalUrl,
    sameAs: store.website_url || undefined,
    category: categories.length > 0 ? categories.join(", ") : undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Промокоди ${store.name}`,
      numberOfItems: Number(store.active_promo_count || 0),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <StoreDetailsClient store={store} />
    </>
  );
}