import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type StoreRoute = {
  slug: string;
  updated_at?: string | null;
  created_at?: string | null;
};

type PromoRoute = {
  id: string;
  slug?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type UserRoute = {
  username: string;
  updated_at?: string | null;
  created_at?: string | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function makeUrl(path: string) {
  return `${siteUrl}${path}`;
}

function getLastModified(date: string | null | undefined) {
  if (!date) return new Date();

  return new Date(date);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: makeUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: makeUrl("/codes"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: makeUrl("/deals"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: makeUrl("/stores"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: makeUrl("/users"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: makeUrl("/stats"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: makeUrl("/add"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: makeUrl("/request-store"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: makeUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: makeUrl("/rules"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: makeUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: makeUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.35,
    },
  ];

  const supabase = getSupabaseClient();

  if (!supabase) {
    return staticRoutes;
  }

  const [storesResult, promosResult, usersResult] = await Promise.all([
    supabase
      .from("store_category_stats")
      .select("slug, created_at")
      .eq("status", "active")
      .limit(5000),

    supabase
      .from("promo_code_category_stats")
      .select("id, slug, created_at")
      .eq("status", "approved")
      .limit(5000),

    supabase
      .from("profiles")
      .select("username, created_at, updated_at")
      .not("username", "is", null)
      .limit(5000),
  ]);

  const storeRoutes: MetadataRoute.Sitemap = storesResult.error
    ? []
    : ((storesResult.data || []) as StoreRoute[]).map((store) => ({
        url: makeUrl(`/stores/${store.slug}`),
        lastModified: getLastModified(store.updated_at || store.created_at),
        changeFrequency: "daily",
        priority: 0.8,
      }));

  const promoRoutes: MetadataRoute.Sitemap = promosResult.error
    ? []
    : ((promosResult.data || []) as PromoRoute[]).map((promo) => ({
        url: makeUrl(`/codes/${promo.slug || promo.id}`),
        lastModified: getLastModified(promo.updated_at || promo.created_at),
        changeFrequency: "daily",
        priority: 0.75,
      }));

  const userRoutes: MetadataRoute.Sitemap = usersResult.error
    ? []
    : ((usersResult.data || []) as UserRoute[])
        .filter((user) => Boolean(user.username))
        .map((user) => ({
          url: makeUrl(`/u/${user.username}`),
          lastModified: getLastModified(user.updated_at || user.created_at),
          changeFrequency: "daily",
          priority: 0.55,
        }));

  return [...staticRoutes, ...storeRoutes, ...promoRoutes, ...userRoutes];
}