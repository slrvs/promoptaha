"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

  store_id: string;
  store_name?: string | null;
  store_slug?: string | null;

  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;

  all_category_ids?: string[] | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;

  discount_value?: string | null;
  expires_at?: string | null;
  source_type?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type CategoryStats = {
  category: Category;
  stores: number;
  promos: number;
  activePromos: number;
  verifiedPromos: number;
  works: number;
  notWorks: number;
};

type SourceStats = {
  source: string;
  label: string;
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

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Не вказано";
}

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

function getPromoCategoryIds(promo: PromoCode) {
  const ids = toArray(promo.all_category_ids);

  if (ids.length > 0) {
    return ids;
  }

  return promo.category_id ? [promo.category_id] : [];
}

function getStoreCategoryIds(store: Store) {
  return toArray(store.category_ids);
}

export default function StatsClient() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingStores || isLoadingPromos || isLoadingCategories;

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
        "id, name, slug, description, website_url, status, created_at, category_ids, category_names, category_slugs, promo_count, active_promo_count, expired_promo_count, verified_promo_count, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

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
        "id, slug, code, store_id, store_name, store_slug, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, discount_value, expires_at, source_type, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(5000);

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

  const totals = useMemo(() => {
    const activePromos = promos.filter((promo) => !isExpired(promo.expires_at));
    const expiredPromos = promos.filter((promo) => isExpired(promo.expires_at));
    const noDatePromos = promos.filter((promo) => !promo.expires_at);
    const verifiedPromos = promos.filter((promo) => isVerified(promo));

    const worksCount = promos.reduce((sum, promo) => {
      return sum + toNumber(promo.works_count);
    }, 0);

    const notWorksCount = promos.reduce((sum, promo) => {
      return sum + toNumber(promo.not_works_count);
    }, 0);

    const storesWithPromos = stores.filter((store) => {
      return toNumber(store.promo_count) > 0;
    });

    const totalVotes = worksCount + notWorksCount;

    return {
      stores: stores.length,
      storesWithPromos: storesWithPromos.length,
      promos: promos.length,
      activePromos: activePromos.length,
      expiredPromos: expiredPromos.length,
      noDatePromos: noDatePromos.length,
      verifiedPromos: verifiedPromos.length,
      categories: categories.length,
      worksCount,
      notWorksCount,
      totalVotes,
      trustPercent:
        totalVotes === 0 ? 0 : Math.round((worksCount / totalVotes) * 100),
    };
  }, [stores, promos, categories]);

  const categoryStats = useMemo(() => {
    const categoryById = new Map<string, Category>();

    for (const category of categories) {
      categoryById.set(category.id, category);
    }

    const statsById = new Map<string, CategoryStats>();

    for (const category of categories) {
      statsById.set(category.id, {
        category,
        stores: 0,
        promos: 0,
        activePromos: 0,
        verifiedPromos: 0,
        works: 0,
        notWorks: 0,
      });
    }

    for (const store of stores) {
      const categoryIds = getStoreCategoryIds(store);

      for (const categoryId of categoryIds) {
        const currentStats = statsById.get(categoryId);

        if (!currentStats) continue;

        currentStats.stores += 1;
      }
    }

    for (const promo of promos) {
      const categoryIds = getPromoCategoryIds(promo);

      for (const categoryId of categoryIds) {
        const currentStats = statsById.get(categoryId);

        if (!currentStats) continue;

        currentStats.promos += 1;
        currentStats.works += toNumber(promo.works_count);
        currentStats.notWorks += toNumber(promo.not_works_count);

        if (!isExpired(promo.expires_at)) {
          currentStats.activePromos += 1;
        }

        if (isVerified(promo)) {
          currentStats.verifiedPromos += 1;
        }
      }
    }

    return [...statsById.values()]
      .filter((stats) => stats.stores > 0 || stats.promos > 0)
      .sort((firstStats, secondStats) => {
        return (
          secondStats.promos - firstStats.promos ||
          secondStats.stores - firstStats.stores ||
          firstStats.category.name.localeCompare(secondStats.category.name, "uk")
        );
      });
  }, [stores, promos, categories]);

  const topStores = useMemo(() => {
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
      .slice(0, 10);
  }, [stores]);

  const topPromos = useMemo(() => {
    return [...promos]
      .sort((firstPromo, secondPromo) => {
        const firstVotes =
          toNumber(firstPromo.works_count) + toNumber(firstPromo.not_works_count);
        const secondVotes =
          toNumber(secondPromo.works_count) +
          toNumber(secondPromo.not_works_count);

        return (
          secondVotes - firstVotes ||
          toNumber(secondPromo.works_count) - toNumber(firstPromo.works_count) ||
          new Date(secondPromo.created_at || 0).getTime() -
            new Date(firstPromo.created_at || 0).getTime()
        );
      })
      .slice(0, 10);
  }, [promos]);

  const sourceStats = useMemo(() => {
    const statsBySource = new Map<string, SourceStats>();

    for (const promo of promos) {
      const source = promo.source_type || "unknown";
      const currentStats = statsBySource.get(source) || {
        source,
        label: getSourceLabel(source),
        promos: 0,
      };

      currentStats.promos += 1;
      statsBySource.set(source, currentStats);
    }

    return [...statsBySource.values()].sort((firstStats, secondStats) => {
      return (
        secondStats.promos - firstStats.promos ||
        firstStats.label.localeCompare(secondStats.label, "uk")
      );
    });
  }, [promos]);

  const latestPromos = useMemo(() => {
    return promos.slice(0, 8);
  }, [promos]);

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Статистика</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-emerald-950/20">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                Статистика
              </p>

              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Пульс ПромоПтахи
              </h1>

              <p className="mt-3 max-w-3xl text-[13px] font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                Загальна статистика промокодів, магазинів, категорій і голосів
                спільноти. Дані беруться з оптимізованих SQL view, тому
                категорії магазинів і промокодів уже підготовлені в базі.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/codes"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Перейти до промокодів
                </Link>

                <Link
                  href="/stores"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                >
                  Магазини
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {formatNumber(totals.promos)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  промокодів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-emerald-300 sm:text-4xl">
                  {formatNumber(totals.activePromos)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  активні / без терміну
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-yellow-300 sm:text-4xl">
                  {formatNumber(totals.stores)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  магазинів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-orange-300 sm:text-4xl">
                  {formatNumber(totals.totalVotes)}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  голосів
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-4 rounded-2xl border p-3 text-sm font-bold sm:mt-6 sm:p-4 sm:text-base ${
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

        <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-bold text-slate-500 sm:text-sm">Перевірені</p>
            <p className="mt-3 text-4xl font-black text-emerald-300">
              {formatNumber(totals.verifiedPromos)}
            </p>
            <p className="mt-2 hidden leading-7 text-slate-400 sm:mt-3 sm:block">
              Коди, де “працює” переважає “не працює”.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-bold text-slate-500 sm:text-sm">Довіра</p>
            <p className="mt-3 text-4xl font-black text-yellow-300">
              {totals.totalVotes === 0 ? "—" : `${totals.trustPercent}%`}
            </p>
            <p className="mt-2 hidden leading-7 text-slate-400 sm:mt-3 sm:block">
              Частка голосів “працює” серед усіх голосів.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-bold text-slate-500 sm:text-sm">З терміном</p>
            <p className="mt-3 text-4xl font-black text-red-300">
              {formatNumber(totals.expiredPromos)}
            </p>
            <p className="mt-2 hidden leading-7 text-slate-400 sm:mt-3 sm:block">
              Прострочені промокоди, які варто перевірити.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-3 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-bold text-slate-500 sm:text-sm">Категорії</p>
            <p className="mt-3 text-4xl font-black text-orange-300">
              {formatNumber(totals.categories)}
            </p>
            <p className="mt-2 hidden leading-7 text-slate-400 sm:mt-3 sm:block">
              Активні категорії магазинів і промокодів.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 sm:mt-8 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Категорії
                </p>

                <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                  Категорії за активністю
                </h2>
              </div>

              <Link
                href="/stores"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-base"
              >
                Дивитися магазини
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950 sm:h-24"
                  />
                ))}
              </div>
            ) : categoryStats.length === 0 ? (
              <div className="mt-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-center text-sm font-bold text-slate-400 sm:mt-6 sm:p-8 sm:text-base sm:font-normal">
                Статистики категорій поки немає.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {categoryStats.slice(0, 10).map((stats, index) => (
                  <div
                    key={stats.category.id}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="text-sm font-black text-emerald-300">
                          #{index + 1}
                        </p>

                        <h3 className="mt-1 text-lg font-black leading-tight text-white sm:text-2xl">
                          {stats.category.name}
                        </h3>

                        <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                          {stats.category.slug}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-300 sm:px-3 sm:text-xs">
                          {formatNumber(stats.promos)} кодів
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-slate-300 sm:px-3 sm:text-xs">
                          {formatNumber(stats.stores)} магазинів
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4 sm:gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-3">
                        <p className="text-lg font-black text-emerald-300 sm:text-xl">
                          {formatNumber(stats.activePromos)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          активні
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-3">
                        <p className="text-lg font-black text-yellow-300 sm:text-xl">
                          {formatNumber(stats.verifiedPromos)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          перевірені
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-3">
                        <p className="text-lg font-black text-emerald-300 sm:text-xl">
                          {formatNumber(stats.works)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          працює
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-3">
                        <p className="text-lg font-black text-red-300 sm:text-xl">
                          {formatNumber(stats.notWorks)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          ні
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Джерела
              </p>

              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                Звідки додають коди
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950 sm:h-20"
                  />
                ))}
              </div>
            ) : sourceStats.length === 0 ? (
              <div className="mt-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-center text-sm font-bold text-slate-400 sm:mt-6 sm:p-8 sm:text-base sm:font-normal">
                Джерел поки немає.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {sourceStats.map((stats) => {
                  const percent =
                    totals.promos === 0
                      ? 0
                      : Math.round((stats.promos / totals.promos) * 100);

                  return (
                    <div
                      key={stats.source}
                      className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-white">
                            {stats.label}
                          </h3>

                          <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                            {formatNumber(stats.promos)} промокодів
                          </p>
                        </div>

                        <p className="text-xl font-black text-emerald-300 sm:text-2xl">
                          {percent}%
                        </p>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${Math.max(percent, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                Топ магазинів
              </h2>
            </div>

            <Link
              href="/stores"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-base"
            >
              Всі магазини
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950 sm:h-24"
                />
              ))}
            </div>
          ) : topStores.length === 0 ? (
            <div className="mt-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-center text-sm font-bold text-slate-400 sm:mt-6 sm:p-8 sm:text-base sm:font-normal">
              Магазинів поки немає.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
              {topStores.map((store, index) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug}`}
                  className="grid gap-3 rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900 sm:p-5 md:grid-cols-[auto_1fr_auto] md:gap-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300 sm:h-12 sm:w-12 sm:text-lg">
                    #{index + 1}
                  </div>

                  <div>
                    <h3 className="text-lg font-black leading-tight text-white sm:text-2xl">
                      {store.name}
                    </h3>

                    <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-sm">
                      /stores/{store.slug}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-300 sm:px-3 sm:text-xs">
                      {formatNumber(toNumber(store.promo_count))} кодів
                    </span>

                    <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-black text-yellow-300 sm:px-3 sm:text-xs">
                      {formatNumber(toNumber(store.verified_promo_count))}{" "}
                      робочих
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-5 sm:mt-8 xl:grid-cols-2 xl:gap-8">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Популярне
              </p>

              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                Промокоди з голосами
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950 sm:h-24"
                  />
                ))}
              </div>
            ) : topPromos.length === 0 ? (
              <div className="mt-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-center text-sm font-bold text-slate-400 sm:mt-6 sm:p-8 sm:text-base sm:font-normal">
                Голосів поки немає.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {topPromos.map((promo) => {
                  const votes =
                    toNumber(promo.works_count) + toNumber(promo.not_works_count);

                  return (
                    <Link
                      key={promo.id}
                      href={getPromoUrl(promo)}
                      className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-500 sm:text-sm">
                            {promo.store_name || "Магазин"}
                          </p>

                          <h3 className="mt-1 break-all text-lg font-black leading-tight text-white sm:text-2xl">
                            {promo.code}
                          </h3>
                        </div>

                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-slate-300 sm:px-3 sm:text-xs">
                          {formatNumber(votes)} голосів
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-300 sm:px-3 sm:text-xs">
                          {formatNumber(toNumber(promo.works_count))} працює
                        </span>

                        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[11px] font-black text-red-300 sm:px-3 sm:text-xs">
                          {formatNumber(toNumber(promo.not_works_count))} ні
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Нове
              </p>

              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                Останні додані
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950 sm:h-24"
                  />
                ))}
              </div>
            ) : latestPromos.length === 0 ? (
              <div className="mt-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-center text-sm font-bold text-slate-400 sm:mt-6 sm:p-8 sm:text-base sm:font-normal">
                Промокодів поки немає.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
                {latestPromos.map((promo) => (
                  <Link
                    key={promo.id}
                    href={getPromoUrl(promo)}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 sm:text-sm">
                          {promo.store_name || "Магазин"}
                        </p>

                        <h3 className="mt-1 break-all text-lg font-black leading-tight text-white sm:text-2xl">
                          {promo.code}
                        </h3>
                      </div>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-slate-300 sm:px-3 sm:text-xs">
                        {formatDate(promo.created_at)}
                      </span>
                    </div>

                    <p className="mt-3 text-base font-black text-emerald-300 sm:mt-4 sm:text-lg">
                      {promo.discount_value || "Знижка"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}