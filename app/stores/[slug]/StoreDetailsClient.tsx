"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  category_id?: string | null;
  category_names?: string[] | null;
  category_slugs?: string[] | null;
  search_aliases?: string[] | null;
  promo_count?: number | null;
  active_promo_count?: number | null;
  expired_promo_count?: number | null;
  verified_promo_count?: number | null;
  works_count?: number | null;
  not_works_count?: number | null;
  created_at?: string | null;
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
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type StoreDetailsClientProps = {
  store: Store;
};

type SortMode = "newest" | "oldest" | "popular" | "ending";
type StatusFilter = "all" | "active" | "expired";

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

function promoMatchesSearch(promo: Promo, searchQuery: string) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableParts = [
    promo.code,
    promo.normalized_code,
    promo.category_name,
    promo.discount_value,
    promo.description,
    ...(promo.search_aliases || []),
    ...(promo.all_category_names || []),
  ];

  const searchableText = normalizeText(
    searchableParts.filter(Boolean).join(" ")
  );

  return searchableText.includes(query);
}

function promoMatchesStatus(promo: Promo, statusFilter: StatusFilter) {
  if (statusFilter === "all") return true;

  const expired = isExpired(promo.expires_at);

  if (statusFilter === "active") return !expired;
  if (statusFilter === "expired") return expired;

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

    if (sortMode === "popular") {
      return (
        Number(secondPromo.works_count || 0) -
        Number(firstPromo.works_count || 0)
      );
    }

    if (sortMode === "ending") {
      const firstTime = firstPromo.expires_at
        ? new Date(firstPromo.expires_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      const secondTime = secondPromo.expires_at
        ? new Date(secondPromo.expires_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      return firstTime - secondTime;
    }

    return (
      new Date(secondPromo.created_at || 0).getTime() -
      new Date(firstPromo.created_at || 0).getTime()
    );
  });
}

function getStoreWebsiteUrl(store: Store) {
  if (!store.website_url) return null;

  if (store.website_url.startsWith("http")) {
    return store.website_url;
  }

  return `https://${store.website_url}`;
}

export default function StoreDetailsClient({ store }: StoreDetailsClientProps) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isLoading, setIsLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      return (
        promoMatchesSearch(promo, searchQuery) &&
        promoMatchesStatus(promo, statusFilter)
      );
    });

    return sortPromos(filtered, sortMode);
  }, [promos, searchQuery, statusFilter, sortMode]);

  const stats = useMemo(() => {
    return {
      total: promos.length,
      active: promos.filter((promo) => !isExpired(promo.expires_at)).length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      verified: promos.filter(
        (promo) =>
          Number(promo.works_count || 0) + Number(promo.not_works_count || 0) >
          0
      ).length,
      works: promos.reduce(
        (sum, promo) => sum + Number(promo.works_count || 0),
        0
      ),
    };
  }, [promos]);

  const categoryNames = useMemo(() => {
    return Array.from(new Set((store.category_names || []).filter(Boolean)));
  }, [store.category_names]);

  async function loadPromos() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, category_id, category_name, category_slug, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
      )
      .eq("store_id", store.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${error.message}`);
      setIsLoading(false);
      return;
    }

    const nextPromos = (data || []) as unknown as Promo[];

    setPromos(nextPromos);

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    await loadProfiles(authorIds);

    setIsLoading(false);
  }

  async function loadProfiles(authorIds: string[]) {
    if (authorIds.length === 0) {
      setProfilesMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
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

  useEffect(() => {
    loadPromos();
  }, [store.id]);

  async function copyCode(promo: Promo) {
    setCopyingId(promo.id);

    try {
      await navigator.clipboard.writeText(promo.code);
      setMessage(`Промокод ${promo.code} скопійовано.`);
    } catch {
      setMessage("Не вдалося скопіювати промокод.");
    }

    window.setTimeout(() => {
      setCopyingId(null);
    }, 600);
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSortMode("newest");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
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

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                  Магазин
                </span>

                {categoryNames.map((categoryName) => (
                  <span
                    key={categoryName}
                    className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300"
                  >
                    {categoryName}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <StoreLogo
                  name={store.name}
                  websiteUrl={store.website_url}
                  size="lg"
                />

                <div className="min-w-0">
                  <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                    {store.name}
                  </h1>

                  {store.website_url && (
                    <a
                      href={getStoreWebsiteUrl(store) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex break-all text-sm font-black text-emerald-300 transition hover:text-emerald-200"
                    >
                      {store.website_url}
                    </a>
                  )}
                </div>
              </div>

              {store.description && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  {store.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/codes"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі промокоди
                </Link>

                {store.website_url && (
                  <a
                    href={getStoreWebsiteUrl(store) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Перейти на сайт
                  </a>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.active}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активні
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.verified}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  з голосами
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{stats.works}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  голосів “працює”
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 font-bold text-emerald-300">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Промокод, опис, категорія..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Статус</span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі</option>
                <option value="active">Активні</option>
                <option value="expired">Завершені</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Сортування
              </span>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="newest">Нові спочатку</option>
                <option value="oldest">Старі спочатку</option>
                <option value="popular">Популярні</option>
                <option value="ending">Скоро завершуються</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Скинути
              </button>
            </div>
          </div>

          <p className="mt-5 text-sm font-bold text-slate-500">
            Знайдено:{" "}
            <span className="font-black text-slate-300">
              {filteredPromos.length}
            </span>
          </p>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
                />
              ))}
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-10 text-center">
              <div className="text-6xl">🐦</div>

              <h2 className="mt-5 text-3xl font-black">
                Пташка нічого не знайшла
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Для цього магазину поки немає промокодів за вибраними фільтрами.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Скинути фільтри
                </button>

                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPromos.map((promo) => {
                const expired = isExpired(promo.expires_at);
                const daysLeft = getDaysLeft(promo.expires_at);
                const worksPercent = getWorksPercent(promo);
                const authorProfile = promo.submitted_by
                  ? profilesMap.get(promo.submitted_by)
                  : null;

                return (
                  <article
                    key={promo.id}
                    className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 transition hover:border-emerald-400/50"
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
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {promo.category_name}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-start gap-4">
                      <StoreLogo
                        name={store.name}
                        websiteUrl={store.website_url}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <Link
                          href={getPromoLink(promo)}
                          className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-2 truncate text-sm font-black text-emerald-300">
                          {store.name}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xl font-black text-emerald-300">
                      {promo.discount_value || "Знижка не вказана"}
                    </p>

                    {promo.description && (
                      <p className="mt-3 line-clamp-3 leading-7 text-slate-400">
                        {promo.description}
                      </p>
                    )}

                    {authorProfile ? (
                      authorProfile.username ? (
                        <Link
                          href={`/u/${authorProfile.username}`}
                          className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/50"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
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
                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                          <p className="text-xs font-bold text-slate-500">
                            Додав користувач
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-300">
                            Профіль ще не має публічного нікнейму
                          </p>
                        </div>
                      )
                    ) : promo.submitted_by ? (
                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Додав користувач
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-300">
                          Профіль ще не налаштовано
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-400/30 bg-slate-900">
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
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
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

                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Надійність
                        </p>

                        <p className="mt-1 font-black text-slate-200">
                          {worksPercent === null ? "Немає" : `${worksPercent}%`}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          👍 {Number(promo.works_count || 0)} / 👎{" "}
                          {Number(promo.not_works_count || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      <button
                        type="button"
                        onClick={() => copyCode(promo)}
                        disabled={copyingId === promo.id}
                        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {copyingId === promo.id ? "Скопійовано" : "Копіювати"}
                      </button>

                      <Link
                        href={getPromoLink(promo)}
                        className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Деталі
                      </Link>
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