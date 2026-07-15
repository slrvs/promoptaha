"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type Category = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
  created_at?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
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
  status?: string | null;
  source_type?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type StoreRequest = {
  id: string;
  store_name?: string | null;
  name?: string | null;
  title?: string | null;
  website_url?: string | null;
  url?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type PromoReport = {
  id: string;
  promo_code_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type CategoryStats = {
  name: string;
  slug: string;
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
  count: number;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

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
  if (!date) return "Невідомо";

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

function getStatusLabel(status: string | null | undefined) {
  if (status === "approved") return "Схвалено";
  if (status === "pending") return "Очікує";
  if (status === "rejected") return "Відхилено";
  if (status === "active") return "Активний";
  if (status === "open") return "Відкрито";
  if (status === "resolved") return "Вирішено";
  if (status === "dismissed") return "Відхилено";

  return status || "Невідомо";
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

function getStoreCategoryNames(store: Store) {
  return toArray(store.category_names);
}

function getStoreRequestName(request: StoreRequest) {
  return (
    request.store_name ||
    request.name ||
    request.title ||
    request.website_url ||
    request.url ||
    "Заявка магазину"
  );
}

export default function AdminStatsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [reports, setReports] = useState<PromoReport[]>([]);

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadDashboard() {
    setIsLoading(true);
    setMessage("");

    const [
      categoriesResult,
      storesResult,
      promosResult,
      storeRequestsResult,
      reportsResult,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, status, created_at")
        .order("name", { ascending: true }),

      supabase
        .from("store_category_stats")
        .select(
          "id, name, slug, status, created_at, category_ids, category_names, category_slugs, promo_count, active_promo_count, expired_promo_count, verified_promo_count, works_count, not_works_count"
        )
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("admin_promo_code_category_stats")
        .select(
          "id, slug, code, store_id, store_name, store_slug, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, status, source_type, expires_at, created_at, works_count, not_works_count"
        )
        .order("created_at", { ascending: false })
        .limit(10000),

      supabase
        .from("store_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("promo_reports")
        .select("id, promo_code_id, reason, status, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (categoriesResult.error) {
      setMessage(
        `Не вдалося завантажити категорії: ${categoriesResult.error.message}`
      );
      setMessageType("error");
    }

    if (storesResult.error) {
      setMessage(`Не вдалося завантажити магазини: ${storesResult.error.message}`);
      setMessageType("error");
    }

    if (promosResult.error) {
      setMessage(`Не вдалося завантажити промокоди: ${promosResult.error.message}`);
      setMessageType("error");
    }

    if (storeRequestsResult.error) {
      setMessage(
        `Не вдалося завантажити заявки магазинів: ${storeRequestsResult.error.message}`
      );
      setMessageType("error");
    }

    if (reportsResult.error) {
      setMessage(`Не вдалося завантажити репорти: ${reportsResult.error.message}`);
      setMessageType("error");
    }

    setCategories((categoriesResult.data || []) as unknown as Category[]);
    setStores((storesResult.data || []) as unknown as Store[]);
    setPromos((promosResult.data || []) as unknown as PromoCode[]);
    setStoreRequests(
      (storeRequestsResult.data || []) as unknown as StoreRequest[]
    );
    setReports((reportsResult.data || []) as unknown as PromoReport[]);

    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser?.email === ADMIN_EMAIL) {
        await loadDashboard();
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const totals = useMemo(() => {
    const approvedPromos = promos.filter((promo) => promo.status === "approved");
    const pendingPromos = promos.filter((promo) => promo.status === "pending");
    const rejectedPromos = promos.filter((promo) => promo.status === "rejected");

    const activePromos = approvedPromos.filter(
      (promo) => !isExpired(promo.expires_at)
    );

    const expiredPromos = approvedPromos.filter((promo) =>
      isExpired(promo.expires_at)
    );

    const verifiedPromos = approvedPromos.filter((promo) => isVerified(promo));

    const worksCount = approvedPromos.reduce((sum, promo) => {
      return sum + toNumber(promo.works_count);
    }, 0);

    const notWorksCount = approvedPromos.reduce((sum, promo) => {
      return sum + toNumber(promo.not_works_count);
    }, 0);

    const totalVotes = worksCount + notWorksCount;

    const activeCategories = categories.filter(
      (category) => category.status === "active"
    );

    const pendingStoreRequests = storeRequests.filter(
      (request) => request.status === "pending"
    );

    const openReports = reports.filter((report) => report.status === "open");

    return {
      stores: stores.length,
      storesWithPromos: stores.filter((store) => toNumber(store.promo_count) > 0)
        .length,
      categories: categories.length,
      activeCategories: activeCategories.length,
      promos: promos.length,
      approvedPromos: approvedPromos.length,
      pendingPromos: pendingPromos.length,
      rejectedPromos: rejectedPromos.length,
      activePromos: activePromos.length,
      expiredPromos: expiredPromos.length,
      verifiedPromos: verifiedPromos.length,
      worksCount,
      notWorksCount,
      totalVotes,
      trustPercent:
        totalVotes === 0 ? 0 : Math.round((worksCount / totalVotes) * 100),
      storeRequests: storeRequests.length,
      pendingStoreRequests: pendingStoreRequests.length,
      reports: reports.length,
      openReports: openReports.length,
    };
  }, [stores, promos, categories, storeRequests, reports]);

  const categoryStats = useMemo(() => {
    const statsByCategoryId = new Map<string, CategoryStats>();

    for (const category of categories) {
      statsByCategoryId.set(category.id, {
        name: category.name,
        slug: category.slug,
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
        const stats = statsByCategoryId.get(categoryId);

        if (!stats) continue;

        stats.stores += 1;
      }
    }

    for (const promo of promos) {
      const categoryIds = getPromoCategoryIds(promo);

      for (const categoryId of categoryIds) {
        const stats = statsByCategoryId.get(categoryId);

        if (!stats) continue;

        stats.promos += 1;
        stats.works += toNumber(promo.works_count);
        stats.notWorks += toNumber(promo.not_works_count);

        if (!isExpired(promo.expires_at)) {
          stats.activePromos += 1;
        }

        if (isVerified(promo)) {
          stats.verifiedPromos += 1;
        }
      }
    }

    return [...statsByCategoryId.values()]
      .filter((stats) => stats.stores > 0 || stats.promos > 0)
      .sort((firstStats, secondStats) => {
        return (
          secondStats.promos - firstStats.promos ||
          secondStats.stores - firstStats.stores ||
          firstStats.name.localeCompare(secondStats.name, "uk")
        );
      });
  }, [categories, stores, promos]);

  const sourceStats = useMemo(() => {
    const statsBySource = new Map<string, SourceStats>();

    for (const promo of promos) {
      const source = promo.source_type || "unknown";
      const currentStats = statsBySource.get(source) || {
        source,
        label: getSourceLabel(source),
        count: 0,
      };

      currentStats.count += 1;

      statsBySource.set(source, currentStats);
    }

    return [...statsBySource.values()].sort((firstStats, secondStats) => {
      return (
        secondStats.count - firstStats.count ||
        firstStats.label.localeCompare(secondStats.label, "uk")
      );
    });
  }, [promos]);

  const topStores = useMemo(() => {
    return [...stores]
      .sort((firstStore, secondStore) => {
        return (
          toNumber(secondStore.promo_count) - toNumber(firstStore.promo_count) ||
          toNumber(secondStore.works_count) - toNumber(firstStore.works_count) ||
          firstStore.name.localeCompare(secondStore.name, "uk")
        );
      })
      .slice(0, 10);
  }, [stores]);

  const latestPromos = useMemo(() => {
    return promos.slice(0, 10);
  }, [promos]);

  const latestStoreRequests = useMemo(() => {
    return storeRequests.slice(0, 8);
  }, [storeRequests]);

  const latestReports = useMemo(() => {
    return reports.slice(0, 8);
  }, [reports]);

  if (isCheckingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[420px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="text-6xl">🔒</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Немає доступу
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              На головну
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Аналітика</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмін-аналітика
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Панель статистики
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Огляд магазинів, промокодів, категорій, голосів, заявок і
                репортів. Магазини та промокоди читаються з нових SQL view.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Модерація
                </Link>

                <Link
                  href="/admin/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Магазини
                </Link>

                <Link
                  href="/admin/categories"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Категорії
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
                  активні
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
                <p className="text-4xl font-black text-red-300">
                  {formatNumber(totals.openReports)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відкритих репортів
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

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">
              Очікують модерації
            </p>
            <p className="mt-3 text-4xl font-black text-yellow-300">
              {formatNumber(totals.pendingPromos)}
            </p>
            <p className="mt-3 leading-7 text-slate-400">
              Промокоди зі статусом pending.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Заявки магазинів</p>
            <p className="mt-3 text-4xl font-black text-orange-300">
              {formatNumber(totals.pendingStoreRequests)}
            </p>
            <p className="mt-3 leading-7 text-slate-400">
              Нові заявки, які треба переглянути.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Довіра</p>
            <p className="mt-3 text-4xl font-black text-emerald-300">
              {totals.totalVotes === 0 ? "—" : `${totals.trustPercent}%`}
            </p>
            <p className="mt-3 leading-7 text-slate-400">
              Частка голосів “працює”.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Голосів</p>
            <p className="mt-3 text-4xl font-black text-white">
              {formatNumber(totals.totalVotes)}
            </p>
            <p className="mt-3 leading-7 text-slate-400">
              Усі голоси користувачів.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <h2 className="text-4xl font-black tracking-tight">
              Категорії за активністю
            </h2>

            {isLoading ? (
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : categoryStats.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                Даних по категоріях поки немає.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {categoryStats.slice(0, 10).map((stats, index) => (
                  <div
                    key={stats.slug}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-emerald-300">
                          #{index + 1}
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-white">
                          {stats.name}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {stats.slug}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                          {formatNumber(stats.promos)} кодів
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                          {formatNumber(stats.stores)} магазинів
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <h2 className="text-4xl font-black tracking-tight">
              Джерела промокодів
            </h2>

            {isLoading ? (
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : sourceStats.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                Джерел поки немає.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {sourceStats.map((stats) => {
                  const percent =
                    totals.promos === 0
                      ? 0
                      : Math.round((stats.count / totals.promos) * 100);

                  return (
                    <div
                      key={stats.source}
                      className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-white">
                            {stats.label}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {formatNumber(stats.count)} промокодів
                          </p>
                        </div>

                        <p className="text-2xl font-black text-emerald-300">
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight">
                Топ магазинів
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Магазини з найбільшою кількістю промокодів.
              </p>
            </div>

            <Link
              href="/admin/stores"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Керувати магазинами
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : topStores.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Магазинів поки немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {topStores.map((store, index) => {
                const categoryNames = getStoreCategoryNames(store);

                return (
                  <Link
                    key={store.id}
                    href={`/stores/${store.slug}`}
                    className="grid gap-4 rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900 md:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-lg font-black text-emerald-300">
                      #{index + 1}
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white">
                        {store.name}
                      </h3>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {categoryNames.length > 0
                          ? categoryNames.join(", ")
                          : "Без категорії"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                        {formatNumber(toNumber(store.promo_count))} кодів
                      </span>

                      <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
                        {formatNumber(toNumber(store.verified_promo_count))}{" "}
                        робочих
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-3">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <h2 className="text-3xl font-black">Останні заявки</h2>

            <div className="mt-6 grid gap-4">
              {latestStoreRequests.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  Заявок поки немає.
                </div>
              ) : (
                latestStoreRequests.map((request) => (
                  <Link
                    key={request.id}
                    href="/admin/store-requests"
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <h3 className="break-words text-xl font-black text-white">
                      {getStoreRequestName(request)}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {getStatusLabel(request.status)}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <h2 className="text-3xl font-black">Останні репорти</h2>

            <div className="mt-6 grid gap-4">
              {latestReports.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  Репортів поки немає.
                </div>
              ) : (
                latestReports.map((report) => (
                  <Link
                    key={report.id}
                    href="/admin/reports"
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-red-400/40 hover:bg-slate-900"
                  >
                    <h3 className="text-xl font-black text-white">
                      {report.reason || "Репорт"}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                        {getStatusLabel(report.status)}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <h2 className="text-3xl font-black">Останні промокоди</h2>

            <div className="mt-6 grid gap-4">
              {latestPromos.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  Промокодів поки немає.
                </div>
              ) : (
                latestPromos.map((promo) => (
                  <Link
                    key={promo.id}
                    href={`/codes/${promo.slug || promo.id}`}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900"
                  >
                    <p className="text-sm font-bold text-slate-500">
                      {promo.store_name || "Магазин"}
                    </p>

                    <h3 className="mt-1 break-all text-xl font-black text-white">
                      {promo.code}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {getStatusLabel(promo.status)}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {formatDate(promo.created_at)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}