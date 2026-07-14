import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CodeDetailsClient from "./CodeDetailsClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  description?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

async function getPromo(param: string) {
  const query = supabase
    .from("promo_code_stats")
    .select(
      "id, slug, code, store_name, store_slug, discount_value, expires_at, description"
    );

  const { data } = isUuid(param)
    ? await query.eq("id", param).maybeSingle()
    : await query.eq("slug", param).maybeSingle();

  return data as PromoCode | null;
}

function makeDescription(promo: PromoCode | null) {
  if (!promo) {
    return "Промокод у ПромоПтасі. Перевірені знижки, купони та коди від спільноти.";
  }

  if (promo.description) {
    return promo.description.slice(0, 155);
  }

  const storeName = promo.store_name || "магазину";
  const discount = promo.discount_value || "знижка";

  return `Промокод ${promo.code} для ${storeName}: ${discount}. Перевірка, термін дії та голоси користувачів у ПромоПтасі.`;
}

function makePromoJsonLd(promo: PromoCode) {
  const pageUrl = `${siteUrl}/codes/${promo.slug || promo.id}`;
  const expired = isExpired(promo.expires_at);

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: `Промокод ${promo.code} для ${promo.store_name || "магазину"}`,
    description: makeDescription(promo),
    url: pageUrl,
    category: "Промокод",
    availability: expired
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",
    validThrough: promo.expires_at || undefined,
    seller: {
      "@type": "Organization",
      name: promo.store_name || "Магазин",
      url: promo.store_slug ? `${siteUrl}/stores/${promo.store_slug}` : siteUrl,
    },
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const promo = await getPromo(id);

  const title = promo
    ? `Промокод ${promo.code} для ${promo.store_name || "магазину"}`
    : "Промокод не знайдено";

  const description = makeDescription(promo);
  const canonicalSlug = promo?.slug || promo?.id || id;
  const pageUrl = `${siteUrl}/codes/${canonicalSlug}`;

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
          alt: promo ? `Промокод ${promo.code}` : "ПромоПтаха",
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

export default async function CodeDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const promo = await getPromo(id);

  if (promo?.slug && isUuid(id)) {
    redirect(`/codes/${promo.slug}`);
  }

  return (
    <>
      {promo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(makePromoJsonLd(promo)),
          }}
        />
      )}

      <CodeDetailsClient codeParam={id} />
    </>
  );
}