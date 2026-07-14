import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type StoreSitemapItem = {
  slug: string;
  created_at?: string | null;
};

type PromoSitemapItem = {
  id: string;
  slug?: string | null;
  created_at?: string | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

const fallbackDate = new Date("2026-01-01");

function makeDate(date: string | null | undefined) {
  if (!date) return fallbackDate;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallbackDate;
  }

  return parsedDate;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: fallbackDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/codes`,
      lastModified: fallbackDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/stores`,
      lastModified: fallbackDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: fallbackDate,
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/add`,
      lastModified: fallbackDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/request-store`,
      lastModified: fallbackDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: fallbackDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: fallbackDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/rules`,
      lastModified: fallbackDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: fallbackDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const { data: stores } = await supabase
    .from("stores")
    .select("slug, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: promos } = await supabase
    .from("promo_code_stats")
    .select("id, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const storePages: MetadataRoute.Sitemap = (
    (stores || []) as StoreSitemapItem[]
  )
    .filter((store) => Boolean(store.slug))
    .map((store) => ({
      url: `${siteUrl}/stores/${store.slug}`,
      lastModified: makeDate(store.created_at),
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  const promoPages: MetadataRoute.Sitemap = (
    (promos || []) as PromoSitemapItem[]
  )
    .filter((promo) => Boolean(promo.slug || promo.id))
    .map((promo) => ({
      url: `${siteUrl}/codes/${promo.slug || promo.id}`,
      lastModified: makeDate(promo.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticPages, ...storePages, ...promoPages];
}