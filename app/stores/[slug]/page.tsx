import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import StoreDetailsClient from "./StoreDetailsClient";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Store = {
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

async function getStore(slug: string) {
  const { data } = await supabase
    .from("stores")
    .select("name, slug, description, website_url")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  return data as Store | null;
}

function makeDescription(store: Store | null) {
  if (!store) {
    return "Сторінка магазину в ПромоПтасі. Перевірені промокоди, знижки та купони від спільноти.";
  }

  if (store.description) {
    return store.description.slice(0, 155);
  }

  return `Промокоди ${store.name}: актуальні знижки, купони, умови використання та перевірка від спільноти ПромоПтаха.`;
}

function makeStoreJsonLd(store: Store) {
  const pageUrl = `${siteUrl}/stores/${store.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: makeDescription(store),
    url: pageUrl,
    sameAs: store.website_url ? [store.website_url] : undefined,
    image: `${siteUrl}/icons/promoptaha-bird.png`,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);

  const title = store
    ? `Промокоди ${store.name} — знижки та купони`
    : "Магазин не знайдено";

  const description = makeDescription(store);
  const pageUrl = `${siteUrl}/stores/${store?.slug || slug}`;

  return {
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
          alt: store ? `Промокоди ${store.name}` : "ПромоПтаха",
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

export default async function StoreDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore(slug);

  return (
    <>
      {store && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(makeStoreJsonLd(store)),
          }}
        />
      )}

      <StoreDetailsClient slug={slug} />
    </>
  );
}