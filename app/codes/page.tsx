"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";

type SortMode = "newest" | "oldest" | "ending" | "reliable" | "works" | "store";
type ExpiryFilter = "all" | "active" | "ending" | "expired" | "no_expiry";

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
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

type Category = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

type UserProfile = {
  id: string;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApprovedPromoForStats = {
  id: string;
  submitted_by?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);
  const difference = target.getTime() - now.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getExpiryLabel(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) return "Без терміну";
  if (daysLeft < 0) return "Закінчився";
  if (daysLeft === 0) return "Сьогодні";
  if (daysLeft === 1) return "Завтра";

  return `${daysLeft} дн.`;
}

function getExpiryClass(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) {
    return "border-slate-700 bg-slate-900 text-slate-300";
  }

  if (daysLeft < 0) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (daysLeft <= 7) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
}

function getWorksPercent(promo: Promo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

function getUserName(profile: UserProfile | null | undefined) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "ПромоПтаха"
  );
}

function getAvatarFallback(profile: UserProfile | null | undefined) {
  const name = getUserName(profile).trim();

  if (!name) return "П";

  return name.slice(0, 1).toUpperCase();
}

function getStoreWebsiteMap(storeWebsites: StoreWebsite[]) {
  return new Map(
    storeWebsites.map((storeWebsite) => [
      storeWebsite.id,
      storeWebsite.website_url || null,
    ])
  );
}

function promoMatchesSearch(promo: Promo, searchQuery: string) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableText = normalizeText(
    [
      promo.code,
      promo.normalized_code,
      promo.discount_value,
      promo.description,
      promo.store_name,
      promo.store_slug,
      promo.category_name,
      promo.category_slug,
      promo.source_type,
      promo.source_url,
      ...(promo.search_aliases || []),
      ...(promo.store_search_aliases || []),
      ...(promo.all_category_names || []),
      ...(promo.all_category_slugs || []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(query);
}

function promoMatchesCategory(promo: Promo, categorySlug: string) {
  if (categorySlug === "all") return true;

  if (promo.category_slug === categorySlug) return true;

  return Boolean(promo.all_category_slugs?.includes(categorySlug));
}

function promoMatchesExpiry(promo: Promo, expiryFilter: ExpiryFilter) {
  if (expiryFilter === "all") return true;

  const daysLeft = getDaysLeft(promo.expires_at);

  if (expiryFilter === "no_expiry") return daysLeft === null;
  if (expiryFilter === "expired") return daysLeft !== null && daysLeft < 0;

  if (expiryFilter === "ending") {
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  }

  if (expiryFilter === "active") {
    return daysLeft === null || daysLeft >= 0;
  }

  return true;
}

function sortPromos(promos: Promo[], sortMode: SortMode) {
  return [...promos].sort((firstPromo, secondPromo) => {
    if (sortMode === "oldest") {
      return (
        new Date(firstPromo.created_at || 0).getTime() -
        new Date(secondPromo.created_at || 0).getTime()
      );
    }

    if (sortMode === "ending") {
      const firstDays = getDaysLeft(firstPromo.expires_at);
      const secondDays = getDaysLeft(secondPromo.expires_at);

      if (firstDays === null && secondDays === null) return 0;
      if (firstDays === null) return 1;
      if (secondDays === null) return -1;

      return firstDays - secondDays;
    }

    if (sortMode === "reliable") {
      return (
        Number(getWorksPercent(secondPromo) || 0) -
        Number(getWorksPercent(firstPromo) || 0)
      );
    }

    if (sortMode === "works") {
      return (
        Number(secondPromo.works_count || 0) -
        Number(firstPromo.works_count || 0)
      );
    }

    if (sortMode === "store") {
      return (firstPromo.store_name || "").localeCompare(
        secondPromo.store_name || ""
      );
    }

    return (
      new Date(secondPromo.created_at || 0).getTime() -
      new Date(firstPromo.created_at || 0).getTime()
    );
  });
}

function MobilePromoTile({
  promo,
  websiteUrl,
}: {
  promo: Promo;
  websiteUrl?: string | null;
}) {
  return (
    <Link
      href={`/codes/${promo.slug || promo.id}`}
      className="group flex min-h-[190px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <div className="flex items-start justify-between gap-2">
        <StoreLogo
          name={promo.store_name || "Магазин"}
          websiteUrl={websiteUrl}
          size="sm"
        />

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-black ${getExpiryClass(
            promo.expires_at
          )}`}
        >
          {getExpiryLabel(promo.expires_at)}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p
          className="truncate text-lg font-black leading-tight text-white transition group-hover:text-emerald-300"
          title={promo.code}
        >
          {promo.code}
        </p>

        <p className="mt-1 truncate text-base font-black text-emerald-300">
          {promo.discount_value || "Знижка"}
        </p>

        <p className="mt-3 truncate text-xs font-black text-slate-400">
          {promo.store_name || "Магазин"}
        </p>

        {promo.category_name && (
          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
            {promo.category_name}
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <span className="inline-flex w-full justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition group-hover:bg-emerald-300">
          Відкрити
        </span>
      </div>
    </Link>
  );
}

function DesktopPromoCard({
  promo,
  websiteUrl,
  author,
  authorApprovedCount,
}: {
  promo: Promo;
  websiteUrl?: string | null;
  author?: UserProfile | null;
  authorApprovedCount: number;
}) {
  const worksPercent = getWorksPercent(promo);

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40">
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <StoreLogo
            name={promo.store_name || "Магазин"}
            websiteUrl={websiteUrl}
            size="sm"
          />

          <div className="min-w-0">
            <Link
              href={`/codes/${promo.slug || promo.id}`}
              className="block truncate text-4xl font-black text-white transition hover:text-emerald-300"
              title={promo.code}
            >
              {promo.code}
            </Link>

            <p className="mt-2 text-xl font-black text-emerald-300">
              {promo.discount_value || "Знижка не вказана"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {promo.store_slug ? (
                <Link
                  href={`/stores/${promo.store_slug}`}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  {promo.store_name || "Магазин"}
                </Link>
              ) : (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                  {promo.store_name || "Магазин"}
                </span>
              )}

              {promo.category_name && (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                  {promo.category_name}
                </span>
              )}

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${getExpiryClass(
                  promo.expires_at
                )}`}
              >
                {getExpiryLabel(promo.expires_at)}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/codes/${promo.slug || promo.id}`}
          className="shrink-0 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
        >
          Відкрити
        </Link>
      </div>

      {promo.description && (
        <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
          {promo.description}
        </p>
      )}

      <div className="mt-5 grid gap-4 border-t border-slate-800 pt-5 lg:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={getUserName(author)}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{getAvatarFallback(author)}</span>
            )}
          </div>

          <div className="min-w-0">
            {author?.username ? (
              <Link
                href={`/u/${author.username}`}
                className="block truncate font-black text-emerald-300 transition hover:text-emerald-200"
              >
                {getUserName(author)}
              </Link>
            ) : (
              <p className="truncate font-black text-slate-300">
                {getUserName(author)}
              </p>
            )}

            <div className="mt-1">
              <UserLevelBadge approvedPromos={authorApprovedCount} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">Надійність</p>
            <p className="mt-1 font-black text-slate-200">
              {worksPercent === null ? "Немає" : `${worksPercent}%`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">Працює</p>
            <p className="mt-1 font-black text-emerald-300">
              {Number(promo.works_count || 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">Додано</p>
            <p className="mt-1 font-black text-slate-200">
              {formatDate(promo.created_at)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CodesPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeWebsites, setStoreWebsites] = useState<StoreWebsite[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );
  const [approvedStatsMap, setApprovedStatsMap] = useState<Map<string, number>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("active");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isLoading, setIsLoading] = useState(true);

  const storeWebsiteMap = useMemo(() => {
    return getStoreWebsiteMap(storeWebsites);
  }, [storeWebsites]);

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      return (
        promoMatchesSearch(promo, searchQuery) &&
        promoMatchesCategory(promo, selectedCategorySlug) &&
        promoMatchesExpiry(promo, expiryFilter)
      );
    });

    return sortPromos(filtered, sortMode);
  }, [promos, searchQuery, selectedCategorySlug, expiryFilter, sortMode]);

  const stats = useMemo(() => {
    return {
      total: promos.length,
      active: promos.filter((promo) => promoMatchesExpiry(promo, "active"))
        .length,
      ending: promos.filter((promo) => promoMatchesExpiry(promo, "ending"))
        .length,
      expired: promos.filter((promo) => promoMatchesExpiry(promo, "expired"))
        .length,
      found: filteredPromos.length,
    };
  }, [promos, filteredPromos]);

  async function loadCodesPage() {
    setIsLoading(true);

    const [promosResult, categoriesResult, approvedStatsResult] =
      await Promise.all([
        supabase
          .from("promo_code_category_stats")
          .select(
            "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("categories")
          .select("id, name, slug, status")
          .eq("status", "active")
          .order("name", { ascending: true })
          .limit(300),

        supabase
          .from("promo_code_category_stats")
          .select("id, submitted_by")
          .eq("status", "approved")
          .not("submitted_by", "is", null)
          .limit(5000),
      ]);

    const nextPromos = promosResult.error
      ? []
      : ((promosResult.data || []) as Promo[]);
    const nextCategories = categoriesResult.error
      ? []
      : ((categoriesResult.data || []) as Category[]);
    const approvedPromosForStats = approvedStatsResult.error
      ? []
      : ((approvedStatsResult.data || []) as ApprovedPromoForStats[]);

    const storeIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.store_id)
          .filter((storeId): storeId is string => Boolean(storeId))
      )
    );

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    let nextStoreWebsites: StoreWebsite[] = [];
    let nextProfiles: UserProfile[] = [];

    if (storeIds.length > 0) {
      const { data } = await supabase
        .from("store_category_stats")
        .select("id, website_url")
        .in("id", storeIds);

      nextStoreWebsites = (data || []) as StoreWebsite[];
    }

    if (authorIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
        )
        .in("id", authorIds);

      nextProfiles = (data || []) as UserProfile[];
    }

    const nextProfilesMap = new Map(
      nextProfiles.map((profile) => [profile.id, profile])
    );

    const nextApprovedStatsMap = new Map<string, number>();

    for (const promo of approvedPromosForStats) {
      if (!promo.submitted_by) continue;

      nextApprovedStatsMap.set(
        promo.submitted_by,
        (nextApprovedStatsMap.get(promo.submitted_by) || 0) + 1
      );
    }

    setPromos(nextPromos);
    setCategories(nextCategories);
    setStoreWebsites(nextStoreWebsites);
    setProfilesMap(nextProfilesMap);
    setApprovedStatsMap(nextApprovedStatsMap);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCodesPage();
  }, []);

  function resetFilters() {
    setSearchQuery("");
    setSelectedCategorySlug("all");
    setExpiryFilter("active");
    setSortMode("newest");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[360px] animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[420px] sm:rounded-[2.5rem]" />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-2 md:gap-5">
            <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
            <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
            <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
            <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Промокоди</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20 sm:rounded-[2.5rem]">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:text-sm">
                База промокодів
              </p>

              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Перевірені промокоди
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                Шукай коди за магазином, категорією, джерелом або описом.
                На телефоні сторінка показує коди компактними плитками.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
                <Link
                  href="/add"
                  className="inline-flex justify-center rounded-full bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати код
                </Link>

                <Link
                  href="/stores"
                  className="inline-flex justify-center rounded-full border border-slate-700 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Магазини
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-white sm:text-4xl">
                  {stats.total}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  всього
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-emerald-300 sm:text-4xl">
                  {stats.active}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  активні
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-yellow-300 sm:text-4xl">
                  {stats.ending}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  скоро кінець
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-white sm:text-4xl">
                  {stats.found}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  знайдено
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto] lg:gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rozetka, техніка, -10%..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 lg:contents">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Категорія
                </span>

                <select
                  value={selectedCategorySlug}
                  onChange={(event) =>
                    setSelectedCategorySlug(event.target.value)
                  }
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                >
                  <option value="all">Всі</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Термін
                </span>

                <select
                  value={expiryFilter}
                  onChange={(event) =>
                    setExpiryFilter(event.target.value as ExpiryFilter)
                  }
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                >
                  <option value="all">Всі</option>
                  <option value="active">Активні</option>
                  <option value="ending">Скоро кінець</option>
                  <option value="no_expiry">Без терміну</option>
                  <option value="expired">Завершені</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:contents">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Сортування
                </span>

                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                >
                  <option value="newest">Нові</option>
                  <option value="oldest">Старі</option>
                  <option value="ending">За терміном</option>
                  <option value="reliable">Надійні</option>
                  <option value="works">Працює</option>
                  <option value="store">Магазин</option>
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-4 sm:text-base"
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">
                Список промокодів
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-400 sm:mt-2 sm:text-base sm:font-normal">
                Показано: {filteredPromos.length} / {promos.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadCodesPage}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
            >
              Оновити
            </button>
          </div>

          {filteredPromos.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center sm:p-8">
              <div className="text-4xl sm:text-5xl">🎟️</div>

              <h3 className="mt-4 text-xl font-black sm:text-2xl">
                Промокодів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-slate-400 sm:text-base sm:font-normal sm:leading-7">
                Спробуй змінити пошук, категорію або фільтр терміну.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {filteredPromos.map((promo) => {
                  const websiteUrl = promo.store_id
                    ? storeWebsiteMap.get(promo.store_id)
                    : null;

                  return (
                    <MobilePromoTile
                      key={promo.id}
                      promo={promo}
                      websiteUrl={websiteUrl}
                    />
                  );
                })}
              </div>

              <div className="hidden gap-5 sm:grid">
                {filteredPromos.map((promo) => {
                  const author = promo.submitted_by
                    ? profilesMap.get(promo.submitted_by)
                    : null;
                  const authorApprovedCount = promo.submitted_by
                    ? approvedStatsMap.get(promo.submitted_by) || 0
                    : 0;
                  const websiteUrl = promo.store_id
                    ? storeWebsiteMap.get(promo.store_id)
                    : null;

                  return (
                    <DesktopPromoCard
                      key={promo.id}
                      promo={promo}
                      websiteUrl={websiteUrl}
                      author={author}
                      authorApprovedCount={authorApprovedCount}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}