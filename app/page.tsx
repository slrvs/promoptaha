"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
};

type PromoCode = {
  id: string;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  source_type?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type StoreStats = {
  totalCodes: number;
  activeCodes: number;
  expiredCodes: number;
  verifiedCodes: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function emptyStats(): StoreStats {
  return {
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    verifiedCodes: 0,
  };
}

function getSourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Джерело";
}

function getPromoHealth(works: number, notWorks: number) {
  const total = works + notWorks;

  if (total === 0) {
    return {
      label: "Ще не перевіряли",
      className: "border-slate-700 bg-slate-800 text-slate-300",
    };
  }

  if (works >= notWorks) {
    return {
      label: "Ймовірно працює",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    label: "Є скарги",
    className: "border-red-400/30 bg-red-400/10 text-red-300",
  };
}

function PromoCard({ promo }: { promo: PromoCode }) {
  const works = promo.works_count || 0;
  const notWorks = promo.not_works_count || 0;
  const expired = isExpired(promo.expires_at);
  const health = getPromoHealth(works, notWorks);

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
            {promo.store_name || "Магазин"}
          </p>

          <h3 className="mt-4 break-all text-3xl font-black text-white">
            {promo.code}
          </h3>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${
            expired
              ? "border-red-400/30 bg-red-400/10 text-red-300"
              : promo.expires_at
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
          }`}
        >
          {expired ? "Прострочений" : promo.expires_at ? "Активний" : "Без дати"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-bold text-slate-500">Знижка / умова</p>

        <p className="mt-1 text-lg font-black text-emerald-300">
          {promo.discount_value || "Умову не вказано"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-500">Діє до</p>
          <p className="mt-1 font-black text-slate-200">
            {formatDate(promo.expires_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-500">Джерело</p>
          <p className="mt-1 font-black text-slate-200">
            {getSourceLabel(promo.source_type)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-2 text-xs font-black ${health.className}`}
        >
          {health.label}
        </span>

        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-400">
          ✅ {works}
        </span>

        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-400">
          ❌ {notWorks}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/codes/${promo.id}`}
          className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-emerald-300"
        >
          Детальніше
        </Link>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(promo.code)}
          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          Копіювати
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStores() {
    setIsLoadingStores(true);

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, description, website_url")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setStores([]);
      setErrorMessage(error.message);
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as Store[]);
    setIsLoadingStores(false);
  }

  async function loadPromos() {
    setIsLoadingPromos(true);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select(
        "id, code, store_id, store_name, store_slug, discount_value, expires_at, source_type, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      setPromos([]);
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as PromoCode[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    loadStores();
    loadPromos();
  }, []);

  const statsByStoreId = useMemo(() => {
    const result: Record<string, StoreStats> = {};

    for (const promo of promos) {
      if (!promo.store_id) continue;

      if (!result[promo.store_id]) {
        result[promo.store_id] = emptyStats();
      }

      result[promo.store_id].totalCodes += 1;

      if (isExpired(promo.expires_at)) {
        result[promo.store_id].expiredCodes += 1;
      } else {
        result[promo.store_id].activeCodes += 1;
      }

      if ((promo.works_count || 0) + (promo.not_works_count || 0) > 0) {
        result[promo.store_id].verifiedCodes += 1;
      }
    }

    return result;
  }, [promos]);

  const popularStores = useMemo(() => {
    return stores
      .map((store) => ({
        store,
        stats: statsByStoreId[store.id] || emptyStats(),
      }))
      .sort((first, second) => {
        if (second.stats.activeCodes !== first.stats.activeCodes) {
          return second.stats.activeCodes - first.stats.activeCodes;
        }

        return second.stats.totalCodes - first.stats.totalCodes;
      })
      .slice(0, 6);
  }, [stores, statsByStoreId]);

  const totalCodesCount = promos.length;

  const activeCodesCount = promos.filter(
    (promo) => !isExpired(promo.expires_at)
  ).length;

  const verifiedCodesCount = promos.filter(
    (promo) => (promo.works_count || 0) + (promo.not_works_count || 0) > 0
  ).length;

  const isLoading = isLoadingStores || isLoadingPromos;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="mb-5 inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Промокоди, які перевіряє спільнота
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl">
                ПромоПтаха збирає промокоди з YouTube, Telegram, соцмереж і
                сайтів магазинів. Додавай знайдені коди, перевіряй чужі й
                допомагай іншим економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
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

              <div className="mt-10 grid gap-4 sm:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {stores.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    магазинів
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {totalCodesCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    кодів
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {activeCodesCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    дійсних
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-slate-200">
                    {verifiedCodesCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    перевіряли
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[420px] items-center justify-center rounded-[2rem] border border-emerald-400/20 bg-slate-950 p-8">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.25),transparent_62%)]" />

              <div className="relative text-center">
                <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-[3rem] border border-emerald-400/30 bg-slate-900 shadow-2xl shadow-emerald-950/40 md:h-72 md:w-72">
                  <Image
                    src="/icons/promoptaha-bird.png"
                    alt="ПромоПтаха"
                    fill
                    sizes="288px"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
                  <p className="text-sm font-bold text-slate-500">
                    Спільна база промокодів
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    Додавай. Перевіряй. Економ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
            Помилка завантаження: {errorMessage}
          </div>
        )}

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Популярні
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Магазини з промокодами
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Магазини, де вже є активні або нещодавно додані промокоди.
              </p>
            </div>

            <Link
              href="/stores"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Усі магазини
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : popularStores.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🏪</div>

              <h2 className="mt-4 text-3xl font-black">
                Магазинів поки немає
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Додай перший магазин в адмінці або запропонуй його через заявку.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {popularStores.map(({ store, stats }) => (
                <article
                  key={store.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20"
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

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        /stores/{store.slug}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
                    {store.description ||
                      "Магазин у базі ПромоПтахи. Тут можуть з’являтися промокоди, знижки та перевірені користувачами коди."}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                      <p className="text-2xl font-black text-emerald-300">
                        {stats.totalCodes}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        кодів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                      <p className="text-2xl font-black text-yellow-300">
                        {stats.activeCodes}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        дійсних
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                      <p className="text-2xl font-black text-slate-200">
                        {stats.verifiedCodes}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        перевіряли
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/stores/${store.slug}`}
                      className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити
                    </Link>

                    <Link
                      href="/add"
                      className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Додати код
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Нові коди
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Останні промокоди
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Найсвіжіші активні промокоди, які вже доступні на сайті.
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
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : promos.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Промокодів поки немає
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Додай перший промокод — після модерації він з’явиться тут.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {promos.slice(0, 6).map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-emerald-400/20 bg-emerald-400/10 p-8 text-center shadow-2xl shadow-emerald-950/10">
          <h2 className="text-4xl font-black tracking-tight">
            Знайшов промокод?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Додай його в ПромоПтаху, вкажи магазин, джерело та термін дії.
            Після модерації код побачать інші користувачі.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/add"
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати промокод
            </Link>

            <Link
              href="/rules"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Правила
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}