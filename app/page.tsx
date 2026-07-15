"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  category_name?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
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
  active_promo_count?: number | null;
  promo_count?: number | null;
  works_count?: number | null;
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
  image_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type UserProfile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

type TopUser = UserProfile & {
  approvedPromos: number;
  actualPromos: number;
  worksVotes: number;
  storesCount: number;
};

type PublicPromoForStats = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  expires_at?: string | null;
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
  const end = new Date(date);
  const diff = end.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  return new Date(date) < new Date();
}

function getPromoLink(promo: Promo) {
  return `/codes/${promo.slug || promo.id}`;
}

function getWorksPercent(promo: Promo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

function getAuthorName(profile: UserProfile | null | undefined) {
  return profile?.display_name || profile?.username || "Користувач";
}

function getAuthorFallback(profile: UserProfile | null | undefined) {
  const name = getAuthorName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getDealUrl(deal: Deal) {
  return deal.deal_url || (deal.store_slug ? `/stores/${deal.store_slug}` : "/deals");
}

function isActualPromo(promo: PublicPromoForStats) {
  if (!promo.expires_at) return true;

  return new Date(promo.expires_at) >= new Date();
}

export default function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [storeWebsiteMap, setStoreWebsiteMap] = useState<
    Map<string, string | null>
  >(new Map());
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const activePromos = useMemo(() => {
    return promos.filter((promo) => !isExpired(promo.expires_at));
  }, [promos]);

  const totalWorksVotes = useMemo(() => {
    return promos.reduce(
      (sum, promo) => sum + Number(promo.works_count || 0),
      0
    );
  }, [promos]);

  async function loadData() {
    setIsLoading(true);
    setMessage("");

    const [promosResult, storesResult, dealsResult] = await Promise.all([
      supabase
        .from("promo_code_category_stats")
        .select(
          "id, slug, code, store_id, store_name, store_slug, category_name, discount_value, expires_at, description, created_at, works_count, not_works_count, submitted_by"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(9),

      supabase
        .from("store_category_stats")
        .select(
          "id, name, slug, description, website_url, category_names, active_promo_count, promo_count, works_count"
        )
        .eq("status", "active")
        .order("active_promo_count", { ascending: false })
        .limit(8),

      supabase
        .from("store_deal_public_stats")
        .select(
          "id, store_id, store_name, store_slug, store_website_url, category_name, title, slug, description, deal_url, image_url, starts_at, ends_at, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (promosResult.error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${promosResult.error.message}`);
    } else {
      const nextPromos = (promosResult.data || []) as unknown as Promo[];

      setPromos(nextPromos);

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

      await Promise.all([loadStoreWebsites(storeIds), loadProfiles(authorIds)]);
    }

    if (storesResult.error) {
      setStores([]);
    } else {
      setStores((storesResult.data || []) as unknown as Store[]);
    }

    if (dealsResult.error) {
      setDeals([]);
    } else {
      setDeals((dealsResult.data || []) as unknown as Deal[]);
    }

    await loadTopUsers();

    setIsLoading(false);
  }

  async function loadStoreWebsites(storeIds: string[]) {
    if (storeIds.length === 0) {
      setStoreWebsiteMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("store_category_stats")
      .select("id, website_url")
      .in("id", storeIds);

    if (error) {
      setStoreWebsiteMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as StoreWebsite[]).map((store) => [
        store.id,
        store.website_url || null,
      ])
    );

    setStoreWebsiteMap(nextMap);
  }

  async function loadProfiles(authorIds: string[]) {
    if (authorIds.length === 0) {
      setProfilesMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, created_at, updated_at")
      .in("id", authorIds);

    if (error) {
      setProfilesMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as UserProfile[]).map((profile) => [profile.id, profile])
    );

    setProfilesMap(nextMap);
  }

  async function loadTopUsers() {
    const [profilesResult, promosResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, created_at, updated_at")
        .not("username", "is", null)
        .limit(100),

      supabase
        .from("promo_code_category_stats")
        .select("id, submitted_by, store_id, expires_at, works_count")
        .eq("status", "approved")
        .not("submitted_by", "is", null)
        .limit(5000),
    ]);

    if (profilesResult.error || promosResult.error) {
      setTopUsers([]);
      return;
    }

    const profiles = (profilesResult.data || []) as UserProfile[];
    const publicPromos = (promosResult.data || []) as unknown as PublicPromoForStats[];

    const statsMap = new Map<
      string,
      {
        approvedPromos: number;
        actualPromos: number;
        worksVotes: number;
        storeIds: Set<string>;
      }
    >();

    for (const profile of profiles) {
      statsMap.set(profile.id, {
        approvedPromos: 0,
        actualPromos: 0,
        worksVotes: 0,
        storeIds: new Set<string>(),
      });
    }

    for (const promo of publicPromos) {
      if (!promo.submitted_by) continue;

      const stats = statsMap.get(promo.submitted_by);

      if (!stats) continue;

      stats.approvedPromos += 1;
      stats.worksVotes += Number(promo.works_count || 0);

      if (isActualPromo(promo)) {
        stats.actualPromos += 1;
      }

      if (promo.store_id) {
        stats.storeIds.add(promo.store_id);
      }
    }

    const usersWithStats = profiles
      .map((profile) => {
        const stats =
          statsMap.get(profile.id) ||
          {
            approvedPromos: 0,
            actualPromos: 0,
            worksVotes: 0,
            storeIds: new Set<string>(),
          };

        return {
          ...profile,
          approvedPromos: stats.approvedPromos,
          actualPromos: stats.actualPromos,
          worksVotes: stats.worksVotes,
          storesCount: stats.storeIds.size,
        };
      })
      .sort((firstUser, secondUser) => {
        if (secondUser.approvedPromos !== firstUser.approvedPromos) {
          return secondUser.approvedPromos - firstUser.approvedPromos;
        }

        return secondUser.worksVotes - firstUser.worksVotes;
      })
      .slice(0, 5);

    setTopUsers(usersWithStats);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[3rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-10 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Промокоди, акції та магазини в одному місці
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                ПромоПтаха — це спільна база промокодів. Користувачі додають
                коди, перевіряють їх голосами та допомагають іншим економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Знайти промокод
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/deals"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Акції
                </Link>

                <Link
                  href="/users"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Спільнота
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {isLoading ? "..." : promos.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  нових промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {isLoading ? "..." : activePromos.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активні
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {isLoading ? "..." : totalWorksVotes}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  голосів “працює”
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {isLoading ? "..." : topUsers.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  учасників спільноти
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 font-bold text-red-300">
            {message}
          </div>
        )}

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Нові промокоди</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Останні схвалені промокоди зі спільноти.
                </p>
              </div>

              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Всі промокоди
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : promos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">🎟️</div>
                <h3 className="mt-4 text-2xl font-black">
                  Промокодів поки немає
                </h3>
                <p className="mt-3 leading-7 text-slate-400">
                  Додай перший промокод, і після модерації він зʼявиться тут.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {promos.slice(0, 6).map((promo) => {
                  const expired = isExpired(promo.expires_at);
                  const daysLeft = getDaysLeft(promo.expires_at);
                  const worksPercent = getWorksPercent(promo);
                  const storeWebsite = promo.store_id
                    ? storeWebsiteMap.get(promo.store_id)
                    : null;
                  const authorProfile = promo.submitted_by
                    ? profilesMap.get(promo.submitted_by)
                    : null;

                  return (
                    <article
                      key={promo.id}
                      className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/50"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            expired
                              ? "border-red-400/30 bg-red-400/10 text-red-300"
                              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          {expired ? "Термін минув" : "Активний"}
                        </span>

                        {promo.category_name && (
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                            {promo.category_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-start gap-4">
                        <StoreLogo
                          name={promo.store_name || "Магазин"}
                          websiteUrl={storeWebsite}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <Link
                            href={getPromoLink(promo)}
                            className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
                          >
                            {promo.code}
                          </Link>

                          {promo.store_slug ? (
                            <Link
                              href={`/stores/${promo.store_slug}`}
                              className="mt-2 block truncate text-sm font-black text-emerald-300 transition hover:text-emerald-200"
                            >
                              {promo.store_name || "Магазин"}
                            </Link>
                          ) : (
                            <p className="mt-2 truncate text-sm font-black text-slate-500">
                              {promo.store_name || "Магазин"}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="mt-4 text-xl font-black text-emerald-300">
                        {promo.discount_value || "Знижка не вказана"}
                      </p>

                      {authorProfile ? (
                        authorProfile.username ? (
                          <Link
                            href={`/u/${authorProfile.username}`}
                            className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 transition hover:border-emerald-400/50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-400/30 bg-slate-950 text-sm font-black text-emerald-300">
                              {authorProfile.avatar_url ? (
                                <img
                                  src={authorProfile.avatar_url}
                                  alt={getAuthorName(authorProfile)}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span>{getAuthorFallback(authorProfile)}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-500">
                                Додав користувач
                              </p>
                              <p className="truncate text-sm font-black text-white">
                                {getAuthorName(authorProfile)}
                              </p>
                              <p className="truncate text-xs font-black text-emerald-300">
                                @{authorProfile.username}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs font-bold text-slate-500">
                              Додав користувач
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-300">
                              Профіль ще не має публічного нікнейму
                            </p>
                          </div>
                        )
                      ) : promo.submitted_by ? (
                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <p className="text-xs font-bold text-slate-500">
                            Додав користувач
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-300">
                            Профіль ще не налаштовано
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-400/30 bg-slate-950">
                            <img
                              src="/icons/promoptaha-bird.png"
                              alt="ПромоПтаха"
                              className="h-full w-full object-contain p-1"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-500">
                              Додав користувач
                            </p>
                            <p className="truncate text-sm font-black text-white">
                              ПромоПтаха
                            </p>
                            <p className="truncate text-xs font-black text-emerald-300">
                              службовий автор старих промокодів
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Діє до
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDate(promo.expires_at)}
                          </p>

                          {daysLeft !== null && !expired && (
                            <p className="mt-1 text-xs font-bold text-emerald-300">
                              {daysLeft} дн.
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Надійність
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {worksPercent === null
                              ? "Немає"
                              : `${worksPercent}%`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-3 pt-5">
                        <Link
                          href={getPromoLink(promo)}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Деталі
                        </Link>

                        {promo.store_slug && (
                          <Link
                            href={`/stores/${promo.store_slug}`}
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Магазин
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Топ спільноти</h2>

                  <p className="mt-2 leading-7 text-slate-400">
                    Користувачі, які найбільше допомагають базі промокодів.
                  </p>
                </div>

                <Link
                  href="/users"
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Вся спільнота
                </Link>
              </div>

              {topUsers.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-5xl">🐦</div>
                  <h3 className="mt-4 text-2xl font-black">
                    Спільнота формується
                  </h3>
                  <p className="mt-3 leading-7 text-slate-400">
                    Коли користувачі додадуть нікнейми та промокоди, вони
                    зʼявляться тут.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {topUsers.map((topUser, index) => (
                    <Link
                      key={topUser.id}
                      href={`/u/${topUser.username}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-xl font-black text-emerald-300">
                          {topUser.avatar_url ? (
                            <img
                              src={topUser.avatar_url}
                              alt={getAuthorName(topUser)}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>{getAuthorFallback(topUser)}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
                              #{index + 1}
                            </span>

                            <p className="truncate text-xl font-black text-white">
                              {getAuthorName(topUser)}
                            </p>
                          </div>

                          <p className="mt-1 truncate text-sm font-black text-emerald-300">
                            @{topUser.username}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <p className="text-lg font-black text-white">
                            {topUser.approvedPromos}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            кодів
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <p className="text-lg font-black text-emerald-300">
                            {topUser.actualPromos}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            актуальні
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <p className="text-lg font-black text-yellow-300">
                            {topUser.worksVotes}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            працює
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <p className="text-lg font-black text-white">
                            {topUser.storesCount}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            магазинів
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
                    Окремі акційні пропозиції магазинів.
                  </p>
                </div>

                <Link
                  href="/deals"
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі акції
                </Link>
              </div>

              {deals.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-5xl">🔥</div>
                  <h3 className="mt-4 text-2xl font-black">
                    Акцій поки немає
                  </h3>
                  <p className="mt-3 leading-7 text-slate-400">
                    Додай перші акції в адмінці.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {deals.slice(0, 4).map((deal) => (
                    <article
                      key={deal.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <StoreLogo
                          name={deal.store_name || "Магазин"}
                          websiteUrl={deal.store_website_url}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-xl font-black text-white">
                            {deal.title}
                          </h3>

                          <p className="mt-2 truncate text-sm font-black text-emerald-300">
                            {deal.store_name || "Магазин"}
                          </p>
                        </div>
                      </div>

                      {deal.description && (
                        <p className="mt-4 line-clamp-2 leading-7 text-slate-400">
                          {deal.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={getDealUrl(deal)}
                          target={deal.deal_url ? "_blank" : undefined}
                          rel={deal.deal_url ? "noreferrer" : undefined}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити
                        </a>

                        {deal.ends_at && (
                          <span className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300">
                            до {formatDate(deal.ends_at)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Магазини</h2>

                  <p className="mt-2 leading-7 text-slate-400">
                    Популярні магазини з промокодами.
                  </p>
                </div>

                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі магазини
                </Link>
              </div>

              {stores.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-5xl">🏪</div>
                  <h3 className="mt-4 text-2xl font-black">
                    Магазинів поки немає
                  </h3>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {stores.slice(0, 6).map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug}`}
                      className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/50"
                    >
                      <StoreLogo
                        name={store.name}
                        websiteUrl={store.website_url}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xl font-black text-white">
                          {store.name}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {Number(store.active_promo_count || 0)} активних
                          промокодів
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}