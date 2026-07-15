import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CodeDetailsClient from "./CodeDetailsClient";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_search_aliases?: string[] | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  all_category_ids?: string[] | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;
  search_aliases?: string[] | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function decodePromoId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getPromoTitle(promo: PromoCode) {
  const storeName = promo.store_name || "магазину";
  const discount = promo.discount_value ? ` — ${promo.discount_value}` : "";

  return `${promo.code}${discount} для ${storeName}`;
}

function getPromoDescription(promo: PromoCode) {
  const storeName = promo.store_name || "магазину";
  const description = promo.description?.trim();

  if (description) {
    return description;
  }

  return `Промокод ${promo.code} для ${storeName}. Перевіряй актуальність, голосуй чи код працює, і допомагай іншим користувачам ПромоПтахи.`;
}

async function getPromoByIdOrSlug(rawId: string) {
  const decodedId = decodePromoId(rawId);
  const searchById = isUuid(decodedId);

  const { data, error } = await supabase
    .from("promo_code_category_stats")
    .select("*")
    .eq(searchById ? "id" : "slug", decodedId)
    .maybeSingle();

  if (error || !data) {
    return {
      promo: null,
      wasOpenedByUuid: searchById,
    };
  }

  return {
    promo: data as unknown as PromoCode,
    wasOpenedByUuid: searchById,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { promo } = await getPromoByIdOrSlug(id);

  if (!promo) {
    return {
      title: "Промокод не знайдено",
      description:
        "Промокод не знайдено, ще на модерації, прихований або посилання змінилося.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = getPromoTitle(promo);
  const description = getPromoDescription(promo);
  const canonicalSlug = promo.slug || promo.id;
  const canonicalUrl = `${getSiteUrl()}/codes/${canonicalSlug}`;

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

export default async function PromoCodePage({ params }: PageProps) {
  const { id } = await params;
  const { promo, wasOpenedByUuid } = await getPromoByIdOrSlug(id);

  if (!promo) {
    notFound();
  }

  if (wasOpenedByUuid && promo.slug) {
    redirect(`/codes/${promo.slug}`);
  }

  const canonicalSlug = promo.slug || promo.id;
  const canonicalUrl = `${getSiteUrl()}/codes/${canonicalSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: getPromoTitle(promo),
    description: getPromoDescription(promo),
    url: canonicalUrl,
    availability:
      promo.expires_at && new Date(promo.expires_at) < new Date()
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    validThrough: promo.expires_at || undefined,
    seller: {
      "@type": "Organization",
      name: promo.store_name,
      url: `${getSiteUrl()}/stores/${promo.store_slug}`,
    },
    category:
      promo.all_category_names && promo.all_category_names.length > 0
        ? promo.all_category_names.join(", ")
        : promo.category_name || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <CodeDetailsClient promo={promo} />
    </>
  );
}