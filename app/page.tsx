"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import { getHostName } from "@/lib/searchAliases";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
};

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

  promo_count?: number | string | null;
  active_promo_count?: number | string | null;
  expired_promo_count?: number | string | null;
  verified_promo_count?: number | string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;

  store_id: string;
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
  description?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type CategoryStats = {
  stores: number;
  promos: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toArray(value: string[] | null | undefined) {
  if (!value) return [];

  return Array.isArray(value) ? value : [];
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function isVerified(promo: PromoCode) {
  const works = toNumber(promo.works_count);
  const notWorks = toNumber(promo.not_works_count);

  return works > 0 && works > notWorks;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

function getStatusLabel(promo: PromoCode) {
  if (!promo.expires_at) return "Без терміну";
  if (isExpired(promo.expires_at)) return "Прострочений";
  if (isVerified(promo)) return "Перевірений";

  return "Активний";
}

function getStatusClass(promo: PromoCode) {
  if (!promo.expires_at) {
    return "border-slate-700 bg-slate-950 text-slate-300";
  }

  if (isExpired(promo.expires_at)) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (isVerified(promo)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function makeEmptyCategoryStats(): CategoryStats {
  return {
    stores: 0,
    promos: 0,
  };
}

function getStoreCategoryIds(store: Store) {
  return toArray(store.category_ids);
}

function getStoreCategoryNames(store: Store) {
  return toArray(store.category_names);
}

function getPromoCategoryIds(promo: PromoCode) {
  const ids = toArray(promo.all_category_ids);

  if (ids.length > 0) {
    return ids;
  }

  return promo.category_id ? [promo.category_id] : [];
}

function getPromoCategoryNames(promo: PromoCode) {
  const names = toArray(promo.all_category_names);

  if (names.length > 0) {
    return names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingStores || isLoadingCategories || isLoadingPromos;

  async function loadCategories() {
    setIsLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
      setMessage(`Не вдалося завантажити категорії: ${error.message}`);
      setMessageType("error");
      setIsLoadingCategories(false);
      return;
    }

    setCategories((data || []) as unknown as Category[]);
    setIsLoadingCategories(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_category_stats")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at, category_ids, category_names, category_slugs, promo_count, active_promo_count, expired_promo_count, verified_promo_count, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setStores([]);
      setMessage(`Не вдалося завантажити магазини: ${error.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as unknown as Store[]);
    setIsLoadingStores(false);
  }

  async function loadPromos() {
    setIsLoadingPromos(true);

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, description, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${error.message}`);
      setMessageType("error");
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as unknown as PromoCode[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    loadCategories();
    loadStores();
    loadPromos();
  }, []);

  const categoryStatsById = useMemo(() => {
    const map = new Map<string, CategoryStats>();

    for (const store of stores) {
      const categoryIds = getStoreCategoryIds(store);

      for (const categoryId of categoryIds) {
        const currentStats = map.get(categoryId) || makeEmptyCategoryStats();

        currentStats.stores += 1;

        map.set(categoryId, currentStats);
      }
    }

    for (const promo of promos) {
      const categoryIds = getPromoCategoryIds(promo);

      for (const categoryId of categoryIds) {
        const currentStats = map.get(categoryId) || makeEmptyCategoryStats();

        currentStats.promos += 1;

        map.set(categoryId, currentStats);
      }
    }

    return map;
  }, [stores, promos]);

  const totals = useMemo(() => {
    const activePromos = promos.filter((promo) => !isExpired(promo.expires_at));
    const verifiedPromos = promos.filter((promo) => isVerified(promo));
    const storesWithPromos = stores.filter(
      (store) => toNumber(store.promo_count) > 0
    );

    return {
      stores: stores.length,
      promos: promos.length,
      activePromos: activePromos.length,
      verifiedPromos: verifiedPromos.length,
      storesWithPromos: storesWithPromos.length,
      categories: categories.length,
    };
  }, [stores, promos, categories]);

  const popularStores = useMemo(() => {
    return [...stores]
      .sort((firstStore, secondStore) => {
        return (
          toNumber(secondStore.promo_count) - toNumber(firstStore.promo_count) ||
          toNumber(secondStore.active_promo_count) -
            toNumber(firstStore.active_promo_count) ||
          toNumber(secondStore.works_count) - toNumber(firstStore.works_count) ||
          firstStore.name.localeCompare(secondStore.name, "uk")
        );
      })
      .slice(0, 6);
  }, [stores]);

  const latestPromos = useMemo(() => {
    return promos.slice(0, 9);
  }, [promos]);

  const topCategories = useMemo(() => {
    return [...categories]
      .sort((firstCategory, secondCategory) => {
        const firstStats =
          categoryStatsById.get(firstCategory.id) || makeEmptyCategoryStats();
        const secondStats =
          categoryStatsById.get(secondCategory.id) || makeEmptyCategoryStats();

        return (
          secondStats.promos - firstStats.promos ||
          secondStats.stores - firstStats.stores ||
          firstCategory.name.localeCompare(secondCategory.name, "uk")
        );
      })
      .slice(0, 10);
  }, [categories, categoryStatsById]);

  async function copyCode(promo: PromoCode) {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedCodeId(promo.id);

      window.setTimeout(() => {
        setCopiedCodeId(null);
      }, 1500);
    } catch {
      setMessage("Не вдалося скопіювати код. Скопіюй вручну.");
      setMessageType("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-10 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Промокоди, які перевіряє спільнота
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                ПромоПтаха збирає промокоди з YouTube, Telegram, Instagram,
                TikTok і сайтів магазинів. Додавай коди, голосуй “працює / не
                працює” і знаходь знижки швидше.
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
                  Додати код
                </Link>

                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Магазини
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {formatNumber(totals.promos)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {formatNumber(totals.activePromos)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активні / без терміну
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {formatNumber(totals.stores)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-orange-300">
                  {formatNumber(totals.categories)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  категорій
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : messageType === "error"
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Категорії
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Знижки по категоріях
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Магазин може бути одразу в кількох категоріях, а промокоди
                підтягуються через готову SQL view.
              </p>
            </div>

            <Link
              href="/stores"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Всі магазини
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : topCategories.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Категорій поки немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {topCategories.map((category) => {
                const categoryStats =
                  categoryStatsById.get(category.id) || makeEmptyCategoryStats();

                return (
                  <Link
                    key={category.id}
                    href="/stores"
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <h3 className="line-clamp-2 text-xl font-black text-white">
                      {category.name}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {category.slug}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                        {formatNumber(categoryStats.stores)} магазинів
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {formatNumber(categoryStats.promos)} кодів
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Популярні магазини
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Магазини з найбільшою кількістю промокодів і перевірок.
              </p>
            </div>

            <Link
              href="/stores"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Всі магазини
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : popularStores.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Магазинів поки немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {popularStores.map((store) => {
                const categoryNames = getStoreCategoryNames(store);

                return (
                  <article
                    key={store.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <div className="flex items-start gap-4">
                      <StoreLogo
                        name={store.name}
                        websiteUrl={store.website_url}
                        size="md"
                      />

                      <div className="min-w-0">
                        <h3 className="break-words text-2xl font-black text-white">
                          {store.name}
                        </h3>

                        <p className="mt-1 break-all text-sm font-bold text-slate-500">
                          /stores/{store.slug}
                        </p>

                        {store.website_url && (
                          <p className="mt-1 break-all text-sm font-bold text-slate-600">
                            {getHostName(store.website_url)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {categoryNames.length === 0 ? (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-500">
                          Без категорії
                        </span>
                      ) : (
                        categoryNames.slice(0, 4).map((categoryName) => (
                          <span
                            key={categoryName}
                            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                          >
                            {categoryName}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-2xl font-black text-white">
                          {formatNumber(toNumber(store.promo_count))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          всього
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-2xl font-black text-emerald-300">
                          {formatNumber(toNumber(store.active_promo_count))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          активні
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-2xl font-black text-yellow-300">
                          {formatNumber(toNumber(store.verified_promo_count))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          робочі
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/stores/${store.slug}`}
                      className="mt-5 flex w-full justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити магазин
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Нове
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Останні промокоди
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Свіжі коди, які додали користувачі ПромоПтахи.
              </p>
            </div>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Всі промокоди
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : latestPromos.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Промокодів поки немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latestPromos.map((promo) => {
                const categoryNames = getPromoCategoryNames(promo);

                return (
                  <article
                    key={promo.id}
                    className="group flex min-h-[360px] flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-500">
                          {promo.store_slug ? (
                            <Link
                              href={`/stores/${promo.store_slug}`}
                              className="transition hover:text-emerald-300"
                            >
                              {promo.store_name || "Магазин"}
                            </Link>
                          ) : (
                            promo.store_name || "Магазин"
                          )}
                        </p>

                        <h3 className="mt-2 break-all text-3xl font-black text-white transition group-hover:text-emerald-300">
                          {promo.code}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                          promo
                        )}`}
                      >
                        {getStatusLabel(promo)}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {categoryNames.length === 0 ? (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-500">
                          Без категорії
                        </span>
                      ) : (
                        categoryNames.slice(0, 4).map((categoryName) => (
                          <span
                            key={categoryName}
                            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                          >
                            {categoryName}
                          </span>
                        ))
                      )}
                    </div>

                    <p className="mt-5 text-xl font-black text-emerald-300">
                      {promo.discount_value || "Знижка"}
                    </p>

                    <p className="mt-3 line-clamp-3 min-h-[72px] leading-6 text-slate-400">
                      {promo.description ||
                        "Промокод додано спільнотою. Перевір деталі, термін дії та голоси користувачів."}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-2xl font-black text-emerald-300">
                          {formatNumber(toNumber(promo.works_count))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          працює
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-2xl font-black text-red-300">
                          {formatNumber(toNumber(promo.not_works_count))}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          ні
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-sm font-black text-slate-200">
                          {formatDate(promo.expires_at)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          термін
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => copyCode(promo)}
                        className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        {copiedCodeId === promo.id
                          ? "Скопійовано"
                          : "Копіювати"}
                      </button>

                      <Link
                        href={getPromoUrl(promo)}
                        className="flex justify-center rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
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