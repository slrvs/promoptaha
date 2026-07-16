import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type StoreRoute = {
  slug?: string | null;
  created_at?: string | null;
};

type PromoRoute = {
  id: string;
  slug?: string | null;
  created_at?: string | null;
};

type UserRoute = {
  username?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getUrl(path: string) {
  return `${siteUrl}${path}`;
}

function getDate(date: string | null | undefined) {
  if (!date) return new Date();

  return new Date(date);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getUrl("/codes"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: getUrl("/deals"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: getUrl("/stores"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: getUrl("/users"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: getUrl("/levels"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: getUrl("/guest"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: getUrl("/stats"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: getUrl("/request-store"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: getUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getUrl("/rules"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: getUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: getUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    const [storesResult, promosResult, usersResult] = await Promise.all([
      supabase
        .from("store_category_stats")
        .select("slug, created_at")
        .eq("status", "active")
        .not("slug", "is", null)
        .limit(2000),

      supabase
        .from("promo_code_category_stats")
        .select("id, slug, created_at")
        .eq("status", "approved")
        .limit(5000),

      supabase
        .from("profiles")
        .select("username, created_at, updated_at")
        .not("username", "is", null)
        .limit(2000),
    ]);

    const storeRoutes: MetadataRoute.Sitemap = storesResult.error
      ? []
      : ((storesResult.data || []) as StoreRoute[])
          .filter((store) => Boolean(store.slug))
          .map((store) => ({
            url: getUrl(`/stores/${store.slug}`),
            lastModified: getDate(store.created_at),
            changeFrequency: "weekly" as const,
            priority: 0.75,
          }));

    const promoRoutes: MetadataRoute.Sitemap = promosResult.error
      ? []
      : ((promosResult.data || []) as PromoRoute[])
          .filter((promo) => Boolean(promo.slug || promo.id))
          .map((promo) => ({
            url: getUrl(`/codes/${promo.slug || promo.id}`),
            lastModified: getDate(promo.created_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }));

    const userRoutes: MetadataRoute.Sitemap = usersResult.error
      ? []
      : ((usersResult.data || []) as UserRoute[])
          .filter((profile) => Boolean(profile.username))
          .map((profile) => ({
            url: getUrl(`/u/${profile.username}`),
            lastModified: getDate(profile.updated_at || profile.created_at),
            changeFrequency: "weekly" as const,
            priority: 0.55,
          }));

    return [...staticRoutes, ...storeRoutes, ...promoRoutes, ...userRoutes];
  } catch {
    return staticRoutes;
  }
}