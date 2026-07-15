"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
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

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  category_names?: string[] | null;
  category_slugs?: string[] | null;
  active_promo_count?: number | null;
  promo_count?: number | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type Deal = {
  id: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  store_website_url?: string | null;
  category_name?: string | null;
  title: string;
  slug?: string | null;
  description?: string | null;
  deal_url?: string | null;
  ends_at?: string | null;
  status?: string | null;
  created_at?: string | null;
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

type TopUser = UserProfile & {
  approvedPromos: number;
  storesCount: number;
  worksCount: number;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

type PublicPromoForStats = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  works_count?: number | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return days;
}

function getExpiryLabel(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) return "Без терміну";
  if (daysLeft < 0) return "Закінчився";
  if (daysLeft === 0) return "Сьогодні";
  if (daysLeft === 1) return "Завтра";

  return `${daysLeft} дн.`;
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

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getDealHref(deal: Deal) {
  if (deal.deal_url) return deal.deal_url;
  if (deal.store_slug) return `/stores/${deal.store_slug}`;

  return "/deals";
}

function getStoreWebsiteMap(storeWebsites: StoreWebsite[]) {
  return new Map(
    storeWebsites.map((storeWebsite) => [
      storeWebsite.id,
      storeWebsite.website_url || null,
    ])
  );
}

function getTopUsers(
  profiles: UserProfile[],
  promosForStats: PublicPromoForStats[]
) {
  const statsMap = new Map<
    string,
    {
      approvedPromos: number;
      storeIds: Set<string>;
      worksCount: number;
    }
  >();

  for (const profile of profiles) {
    statsMap.set(profile.id, {
      approvedPromos: 0,
      storeIds: new Set(),
      worksCount: 0,
    });
  }

  for (const promo of promosForStats) {
    if (!promo.submitted_by) continue;

    const stats = statsMap.get(promo.submitted_by);

    if (!stats) continue;

    stats.approvedPromos += 1;
    stats.worksCount += Number(promo.works_count || 0);

    if (promo.store_id) {
      stats.storeIds.add(promo.store_id);
    }
  }

  return profiles
    .map((profile) => {
      const stats = statsMap.get(profile.id);

      return {
        ...profile,
        approvedPromos: stats?.approvedPromos || 0,
        storesCount: stats?.storeIds.size || 0,
        worksCount: stats?.worksCount || 0,
      };
    })
    .sort((firstUser, secondUser) => {
      if (secondUser.approvedPromos !== firstUser.approvedPromos) {
        return secondUser.approvedPromos - firstUser.approvedPromos;
      }

      return secondUser.worksCount - firstUser.worksCount;
    })
    .slice(0, 8);
}

export default function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [storeWebsites, setStoreWebsites] = useState<StoreWebsite[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [approvedStatsMap, setApprovedStatsMap] = useState<Map<string, number>>(
    new Map()
  );

  const [isLoading, setIsLoading] = useState(true);

  const storeWebsiteMap = useMemo(() => {
    return getStoreWebsiteMap(storeWebsites);
  }, [storeWebsites]);

  const heroStats = useMemo(() => {
    const activePromos = promos.length;
    const activeStores = stores.length;
    const activeDeals = deals.length;
    const communityMembers = topUsers.length;

    return {
      activePromos,
      activeStores,
      activeDeals,
      communityMembers,
    };
  }, [promos, stores, deals, topUsers]);

  async function loadHomePage() {
    setIsLoading(true);

    const [promosResult, storesResult, dealsResult, profilesResult, statsResult] =
      await Promise.all([
        supabase
          .from("promo_code_category_stats")
          .select(
            "id, slug, code, store_id, store_name, store_slug, category_name, category_slug, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(9),

        supabase
          .from("store_category_stats")
          .select(
            "id, name, slug, description, website_url, category_names, category_slugs, active_promo_count, promo_count, works_count, not_works_count"
          )
          .eq("status", "active")
          .order("active_promo_count", { ascending: false })
          .limit(8),

        supabase
          .from("store_deal_public_stats")
          .select(
            "id, store_id, store_name, store_slug, store_website_url, category_name, title, slug, description, deal_url, ends_at, status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("profiles")
          .select(
            "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
          )
          .not("username", "is", null)
          .limit(100),

        supabase
          .from("promo_code_category_stats")
          .select("id, submitted_by, store_id, works_count")
          .eq("status", "approved")
          .not("submitted_by", "is", null)
          .limit(5000),
      ]);

    const nextPromos = promosResult.error ? [] : ((promosResult.data || []) as Promo[]);
    const nextStores = storesResult.error ? [] : ((storesResult.data || []) as Store[]);
    const nextDeals = dealsResult.error ? [] : ((dealsResult.data || []) as Deal[]);
    const baseProfiles = profilesResult.error
      ? []
      : ((profilesResult.data || []) as UserProfile[]);
    const promosForStats = statsResult.error
      ? []
      : ((statsResult.data || []) as PublicPromoForStats[]);

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    const missingAuthorIds = authorIds.filter(
      (authorId) => !baseProfiles.some((profile) => profile.id === authorId)
    );

    let extraProfiles: UserProfile[] = [];

    if (missingAuthorIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
        )
        .in("id", missingAuthorIds);

      extraProfiles = (data || []) as UserProfile[];
    }

    const allProfilesMap = new Map<string, UserProfile>();

    for (const profile of [...baseProfiles, ...extraProfiles]) {
      allProfilesMap.set(profile.id, profile);
    }

    const approvedCountMap = new Map<string, number>();

    for (const promo of promosForStats) {
      if (!promo.submitted_by) continue;

      approvedCountMap.set(
        promo.submitted_by,
        (approvedCountMap.get(promo.submitted_by) || 0) + 1
      );
    }

    const storeIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.store_id)
          .filter((storeId): storeId is string => Boolean(storeId))
      )
    );

    let nextStoreWebsites: StoreWebsite[] = [];

    if (storeIds.length > 0) {
      const { data } = await supabase
        .from("store_category_stats")
        .select("id, website_url")
        .in("id", storeIds);

      nextStoreWebsites = (data || []) as StoreWebsite[];
    }

    setPromos(nextPromos);
    setStores(nextStores);
    setDeals(nextDeals);
    setProfilesMap(allProfilesMap);
    setApprovedStatsMap(approvedCountMap);
    setStoreWebsites(nextStoreWebsites);
    setTopUsers(getTopUsers([...allProfilesMap.values()], promosForStats));
    setIsLoading(false);
  }

  useEffect(() => {
    loadHomePage();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[520px] animate-pulse rounded-[3rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900" />
            <div className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900" />
            <div className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[3rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/30">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            <div>
              <p className="mb-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                🐦 На крилах знижок
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Промокоди, які перевіряє спільнота
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                ПромоПтаха збирає промокоди, акції та магазини в одному місці.
                Користувачі додають коди, голосують “працює / не працює” і
                допомагають іншим економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Знайти промокод
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-600 px-7 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати код
                </Link>

                <Link
                  href="/deals"
                  className="rounded-full border border-slate-600 px-7 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Акції
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {heroStats.activePromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  нових промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">
                  {heroStats.activeStores}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {heroStats.activeDeals}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  актуальних акцій
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">
                  {heroStats.communityMembers}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  учасників у топі
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Останні промокоди</h2>
                <p className="mt-2 leading-7 text-slate-400">
                  Нові схвалені коди від спільноти.
                </p>
              </div>

              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Всі промокоди
              </Link>
            </div>

            {promos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">🎟️</div>
                <h3 className="mt-4 text-2xl font-black">
                  Промокодів поки немає
                </h3>
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                {promos.map((promo) => {
                  const author = promo.submitted_by
                    ? profilesMap.get(promo.submitted_by)
                    : null;
                  const websiteUrl = promo.store_id
                    ? storeWebsiteMap.get(promo.store_id)
                    : null;
                  const worksPercent = getWorksPercent(promo);
                  const authorApprovedCount = promo.submitted_by
                    ? approvedStatsMap.get(promo.submitted_by) || 0
                    : 0;

                  return (
                    <article
                      key={promo.id}
                      className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="flex min-w-0 items-start gap-4">
                          <StoreLogo
                            name={promo.store_name || "Магазин"}
                            websiteUrl={websiteUrl}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <Link
                              href={`/codes/${promo.slug || promo.id}`}
                              className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
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

                              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                {getExpiryLabel(promo.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити
                        </Link>
                      </div>

                      {promo.description && (
                        <p className="mt-4 line-clamp-2 leading-7 text-slate-400">
                          {promo.description}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
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

                          <div>
                            {author?.username ? (
                              <Link
                                href={`/u/${author.username}`}
                                className="font-black text-emerald-300 transition hover:text-emerald-200"
                              >
                                {getUserName(author)}
                              </Link>
                            ) : (
                              <p className="font-black text-slate-300">
                                {getUserName(author)}
                              </p>
                            )}

                            <div className="mt-1">
                              <UserLevelBadge
                                approvedPromos={authorApprovedCount}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-black text-slate-300">
                          Надійність:{" "}
                          {worksPercent === null ? "немає" : `${worksPercent}%`}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Топ спільноти</h2>
                  <p className="mt-2 leading-7 text-slate-400">
                    Автори з найбільшою кількістю схвалених кодів.
                  </p>
                </div>

                <Link
                  href="/users"
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі
                </Link>
              </div>

              {topUsers.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">👥</div>
                  <p className="mt-3 font-black text-slate-300">
                    Топ поки формується
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {topUsers.map((topUser, index) => (
                    <Link
                      key={topUser.id}
                      href={
                        topUser.username
                          ? `/u/${topUser.username}`
                          : `/users`
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-black text-slate-300">
                          #{index + 1}
                        </div>

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
                          {topUser.avatar_url ? (
                            <img
                              src={topUser.avatar_url}
                              alt={getUserName(topUser)}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>{getAvatarFallback(topUser)}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {getUserName(topUser)}
                          </p>

                          <div className="mt-1">
                            <UserLevelBadge
                              approvedPromos={topUser.approvedPromos}
                              size="sm"
                            />
                          </div>

                          <p className="mt-2 text-xs font-bold text-slate-500">
                            {topUser.approvedPromos} кодів ·{" "}
                            {topUser.storesCount} магазинів
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Акції</h2>
                  <p className="mt-2 leading-7 text-slate-400">
                    Окремі пропозиції магазинів.
                  </p>
                </div>

                <Link
                  href="/deals"
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі
                </Link>
              </div>

              {deals.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">🏷️</div>
                  <p className="mt-3 font-black text-slate-300">
                    Акцій поки немає
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {deals.map((deal) => (
                    <a
                      key={deal.id}
                      href={getDealHref(deal)}
                      target={deal.deal_url ? "_blank" : undefined}
                      rel={deal.deal_url ? "noreferrer" : undefined}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/40"
                    >
                      <p className="line-clamp-2 font-black text-white">
                        {deal.title}
                      </p>

                      <p className="mt-2 text-sm font-bold text-emerald-300">
                        {deal.store_name || "Магазин"}
                      </p>

                      {deal.ends_at && (
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          До {formatDate(deal.ends_at)}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Магазини</h2>
                  <p className="mt-2 leading-7 text-slate-400">
                    Найактивніші магазини.
                  </p>
                </div>

                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі
                </Link>
              </div>

              {stores.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">🏪</div>
                  <p className="mt-3 font-black text-slate-300">
                    Магазинів поки немає
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {stores.slice(0, 5).map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/40"
                    >
                      <div className="flex items-center gap-3">
                        <StoreLogo
                          name={store.name}
                          websiteUrl={store.website_url}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {store.name}
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {Number(store.active_promo_count || 0)} активних
                            кодів
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}