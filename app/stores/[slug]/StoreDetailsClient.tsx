"use client";

import LegalDisclaimerBox from "@/components/LegalDisclaimerBox";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";

type SortMode = "newest" | "oldest" | "ending" | "reliable" | "works";

type Store = {
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

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
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

type StoreDetailsClientProps = {
  store: Store;
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
    .replace(/[ʼ’`]/g, "'")
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

function getStoreWorksPercent(store: Store) {
  const worksCount = Number(store.works_count || 0);
  const notWorksCount = Number(store.not_works_count || 0);
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

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
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
      promo.category_name,
      promo.category_slug,
      promo.source_type,
      promo.source_url,
      ...(promo.search_aliases || []),
      ...(promo.all_category_names || []),
      ...(promo.all_category_slugs || []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(query);
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
      return Number(secondPromo.works_count || 0) - Number(firstPromo.works_count || 0);
    }

    return (
      new Date(secondPromo.created_at || 0).getTime() -
      new Date(firstPromo.created_at || 0).getTime()
    );
  });
}

export default function StoreDetailsClient({ store }: StoreDetailsClientProps) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );
  const [approvedStatsMap, setApprovedStatsMap] = useState<Map<string, number>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [isLoading, setIsLoading] = useState(true);

  const storeReliability = getStoreWorksPercent(store);

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      return promoMatchesSearch(promo, searchQuery);
    });

    return sortPromos(filtered, sortMode);
  }, [promos, searchQuery, sortMode]);

  const stats = useMemo(() => {
    return {
      total: promos.length,
      active: promos.filter((promo) => {
        const daysLeft = getDaysLeft(promo.expires_at);
        return daysLeft === null || daysLeft >= 0;
      }).length,
      ending: promos.filter((promo) => {
        const daysLeft = getDaysLeft(promo.expires_at);
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
      }).length,
      expired: promos.filter((promo) => {
        const daysLeft = getDaysLeft(promo.expires_at);
        return daysLeft !== null && daysLeft < 0;
      }).length,
      found: filteredPromos.length,
    };
  }, [promos, filteredPromos]);

  async function loadStorePromos() {
    setIsLoading(true);

    const [promosResult, approvedStatsResult] = await Promise.all([
      supabase
        .from("promo_code_category_stats")
        .select(
          "id, slug, code, normalized_code, store_id, store_name, store_slug, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
        )
        .eq("status", "approved")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(1000),

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

    const approvedPromosForStats = approvedStatsResult.error
      ? []
      : ((approvedStatsResult.data || []) as ApprovedPromoForStats[]);

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    let nextProfiles: UserProfile[] = [];

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
    setProfilesMap(nextProfilesMap);
    setApprovedStatsMap(nextApprovedStatsMap);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStorePromos();
  }, [store.id]);

  function resetFilters() {
    setSearchQuery("");
    setSortMode("newest");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[420px] sm:rounded-[2.5rem]" />
          <div className="mt-5 h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:mt-8 sm:h-96 sm:rounded-[2.5rem]" />
        </section>
        <LegalDisclaimerBox
          variant="store"
          className="mx-auto mt-5 max-w-6xl px-3 sm:mt-8 sm:px-0"
        />

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

          <Link href="/stores" className="hover:text-emerald-300">
            Магазини
          </Link>

          <span>/</span>
          <span className="text-slate-300">{store.name}</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-emerald-950/20">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:p-10">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                Магазин
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <StoreLogo
                  name={store.name}
                  websiteUrl={store.website_url}
                  size="lg"
                />

                <div className="min-w-0">
                  <h1 className="break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                    {store.name}
                  </h1>

                  {store.website_url && (
                    <a
                      href={
                        store.website_url.startsWith("http")
                          ? store.website_url
                          : `https://${store.website_url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-black text-emerald-300 transition hover:text-emerald-200 sm:mt-3 sm:text-sm"
                    >
                      Відкрити сайт магазину
                    </a>
                  )}
                </div>
              </div>

              {store.description && (
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                  {store.description}
                </p>
              )}

              {store.category_names && store.category_names.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-6">
                  {store.category_names.map((categoryName) => (
                    <span
                      key={categoryName}
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-black text-slate-300 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      {categoryName}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/codes"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Всі промокоди
                </Link>

                <Link
                  href="/add"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати промокод
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {Number(store.promo_count || stats.total)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  всього кодів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-emerald-300 sm:text-4xl">
                  {Number(store.active_promo_count || stats.active)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  активних
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-yellow-300 sm:text-4xl">
                  {Number(store.works_count || 0)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  підтверджень “працює”
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {storeReliability === null ? "—" : `${storeReliability}%`}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  надійність
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_0.45fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-black text-slate-300 sm:text-sm">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Пошук по кодах, опису, категорії..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black text-slate-300 sm:text-sm">
                Сортування
              </span>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              >
                <option value="newest">Нові спочатку</option>
                <option value="oldest">Старі спочатку</option>
                <option value="ending">За терміном</option>
                <option value="reliable">Надійніші</option>
                <option value="works">Більше “працює”</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-4 sm:text-base"
              >
                Скинути
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Промокоди магазину</h2>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-400 sm:mt-2 sm:text-base sm:font-normal sm:leading-7">
                Показано: {filteredPromos.length} / {promos.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadStorePromos}
              className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:px-5 sm:py-3"
            >
              Оновити
            </button>
          </div>

          {filteredPromos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center sm:mt-6 sm:p-8">
              <div className="text-4xl sm:text-5xl">🎟️</div>

              <h3 className="mt-3 text-xl font-black sm:mt-4 sm:text-2xl">
                Промокодів не знайдено
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
                Для цього магазину ще немає схвалених промокодів або вони не
                підходять під пошук.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-1 sm:gap-5">
              {filteredPromos.map((promo) => {
                const author = promo.submitted_by
                  ? profilesMap.get(promo.submitted_by)
                  : null;
                const authorApprovedCount = promo.submitted_by
                  ? approvedStatsMap.get(promo.submitted_by) || 0
                  : 0;
                const worksPercent = getWorksPercent(promo);

                return (
                  <article
                    key={promo.id}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40 sm:rounded-[2rem] sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
                      <div className="min-w-0">
                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="break-all text-lg font-black leading-tight text-white transition hover:text-emerald-300 sm:text-4xl"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-1 text-sm font-black leading-5 text-emerald-300 sm:mt-2 sm:text-xl">
                          {promo.discount_value || "Знижка не вказана"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                          {promo.category_name && (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-slate-300 sm:px-3 sm:text-xs">
                              {promo.category_name}
                            </span>
                          )}

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-black sm:px-3 sm:text-xs ${getExpiryClass(
                              promo.expires_at
                            )}`}
                          >
                            {getExpiryLabel(promo.expires_at)}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/codes/${promo.slug || promo.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-5 sm:py-3 sm:text-sm"
                      >
                        Відкрити
                      </Link>
                    </div>

                    {promo.description && (
                      <p className="mt-3 hidden line-clamp-3 leading-7 text-slate-400 sm:block">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-3 hidden gap-4 sm:grid lg:grid-cols-[1fr_auto]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300 sm:h-12 sm:w-12">
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
                              className="truncate font-black text-emerald-300 transition hover:text-emerald-200"
                            >
                              {getUserName(author)}
                            </Link>
                          ) : (
                            <p className="truncate font-black text-slate-300">
                              {getUserName(author)}
                            </p>
                          )}

                          <div className="mt-1">
                            {promo.submitted_by ? (
                              <UserLevelBadge
                                approvedPromos={authorApprovedCount}
                                size="sm"
                              />
                            ) : (
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-black text-slate-300">
                                🐦 ПромоПтаха
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 sm:px-4 sm:py-3">
                          <p className="text-xs font-bold text-slate-500">
                            Надійність
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-200 sm:text-base">
                            {worksPercent === null ? "Немає" : `${worksPercent}%`}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 sm:px-4 sm:py-3">
                          <p className="text-xs font-bold text-slate-500">
                            Працює
                          </p>

                          <p className="mt-1 font-black text-emerald-300">
                            {Number(promo.works_count || 0)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 sm:px-4 sm:py-3">
                          <p className="text-xs font-bold text-slate-500">
                            Додано
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-200 sm:text-base">
                            {formatDate(promo.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}