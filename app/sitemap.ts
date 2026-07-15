import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type StoreSitemapRow = {
  slug: string;
  created_at?: string | null;
};

type PromoSitemapRow = {
  id: string;
  slug?: string | null;
  created_at?: string | null;
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

function getSafeDate(date: string | null | undefined) {
  if (!date) return new Date();

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
}

function makeUrl(path: string) {
  const siteUrl = getSiteUrl();

  if (path === "/") {
    return siteUrl;
  }

  return `${siteUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: makeUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: makeUrl("/codes"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: makeUrl("/stores"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: makeUrl("/stats"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: makeUrl("/add"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: makeUrl("/request-store"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: makeUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: makeUrl("/rules"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: makeUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: makeUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const [storesResult, promosResult] = await Promise.all([
    supabase
      .from("store_category_stats")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),

    supabase
      .from("promo_code_category_stats")
      .select("id, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const stores = (storesResult.data || []) as unknown as StoreSitemapRow[];
  const promos = (promosResult.data || []) as unknown as PromoSitemapRow[];

  const storeRoutes: MetadataRoute.Sitemap = stores
    .filter((store) => Boolean(store.slug))
    .map((store) => ({
      url: makeUrl(`/stores/${store.slug}`),
      lastModified: getSafeDate(store.created_at),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const promoRoutes: MetadataRoute.Sitemap = promos
    .filter((promo) => Boolean(promo.slug || promo.id))
    .map((promo) => ({
      url: makeUrl(`/codes/${promo.slug || promo.id}`),
      lastModified: getSafeDate(promo.created_at),
      changeFrequency: "daily",
      priority: 0.7,
    }));

  return [...staticRoutes, ...storeRoutes, ...promoRoutes];
}