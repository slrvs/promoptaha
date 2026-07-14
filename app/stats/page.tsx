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
  created_at?: string | null;
};

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type StoreStats = {
  totalCodes: number;
  activeCodes: number;
  expiredCodes: number;
  verifiedCodes: number;
  worksCount: number;
  notWorksCount: number;
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

function emptyStoreStats(): StoreStats {
  return {
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    verifiedCodes: 0,
    worksCount: 0,
    notWorksCount: 0,
  };
}

function StatCard({
  value,
  label,
  hint,
  tone = "default",
}: {
  value: number;
  label: string;
  hint: string;
  tone?: "default" | "green" | "yellow" | "red" | "orange";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "yellow"
      ? "text-yellow-300"
      : tone === "red"
      ? "text-red-300"
      : tone === "orange"
      ? "text-orange-300"
      : "text-white";

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20">
      <p className={`text-4xl font-black ${valueClass}`}>{value}</p>
      <h2 className="mt-3 text-lg font-black text-white">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </article>
  );
}

function PromoRow({ promo }: { promo: PromoCode }) {
  const promoUrl = `/codes/${promo.slug || promo.id}`;
  const expired = isExpired(promo.expires_at);
  const works = promo.works_count || 0;
  const notWorks = promo.not_works_count || 0;

  return (
    <article className="rounded-[1.5rem] border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={promoUrl}
            className="break-all text-xl font-black text-white transition hover:text-emerald-300"
          >
            {promo.code}
          </Link>

          {promo.store_slug ? (
            <Link
              href={`/stores/${promo.store_slug}`}
              className="mt-1 block text-sm font-bold text-slate-500 transition hover:text-emerald-300"
            >
              {promo.store_name || "Магазин"}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-bold text-slate-500">
              {promo.store_name || "Магазин"}
            </p>
          )}
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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
          <p className="text-xs font-bold text-slate-500">Умова</p>
          <p className="mt-1 line-clamp-1 font-black text-emerald-300">
            {promo.discount_value || "Не вказано"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
          <p className="text-xs font-bold text-slate-500">Діє до</p>
          <p className="mt-1 font-black text-slate-200">
            {formatDate(promo.expires_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
          <p className="text-xs font-bold text-slate-500">Перевірка</p>
          <p className="mt-1 font-black text-slate-200">
            ✅ {works} / ❌ {notWorks}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PublicStatsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStores() {
    setIsLoadingStores(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, description, website_url, created_at")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(500);

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
        "id, slug, code, store_id, store_name, store_slug, discount_value, expires_at, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

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
        result[promo.store_id] = emptyStoreStats();
      }

      const stats = result[promo.store_id];

      stats.totalCodes += 1;
      stats.worksCount += promo.works_count || 0;
      stats.notWorksCount += promo.not_works_count || 0;

      if (isExpired(promo.expires_at)) {
        stats.expiredCodes += 1;
      } else {
        stats.activeCodes += 1;
      }

      if ((promo.works_count || 0) + (promo.not_works_count || 0) > 0) {
        stats.verifiedCodes += 1;
      }
    }

    return result;
  }, [promos]);

  const activePromosCount = promos.filter(
    (promo) => !isExpired(promo.expires_at)
  ).length;

  const expiredPromosCount = promos.filter((promo) =>
    isExpired(promo.expires_at)
  ).length;

  const verifiedPromosCount = promos.filter(
    (promo) => (promo.works_count || 0) + (promo.not_works_count || 0) > 0
  ).length;

  const worksCount = promos.reduce(
    (total, promo) => total + (promo.works_count || 0),
    0
  );

  const notWorksCount = promos.reduce(
    (total, promo) => total + (promo.not_works_count || 0),
    0
  );

  const topStores = useMemo(() => {
    return stores
      .map((store) => ({
        store,
        stats: statsByStoreId[store.id] || emptyStoreStats(),
      }))
      .sort((first, second) => {
        if (second.stats.activeCodes !== first.stats.activeCodes) {
          return second.stats.activeCodes - first.stats.activeCodes;
        }

        if (second.stats.totalCodes !== first.stats.totalCodes) {
          return second.stats.totalCodes - first.stats.totalCodes;
        }

        return second.stats.verifiedCodes - first.stats.verifiedCodes;
      })
      .slice(0, 10);
  }, [stores, statsByStoreId]);

  const latestPromos = promos.slice(0, 8);
  const isLoading = isLoadingStores || isLoadingPromos;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Статистика</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Статистика сайту
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Пульс ПромоПтахи
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Відкрита статистика бази: магазини, активні промокоди, перевірки
                користувачів і найактивніші магазини.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  loadStores();
                  loadPromos();
                }}
                disabled={isLoading}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Оновлюю..." : "Оновити"}
              </button>

              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Промокоди
              </Link>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
              Помилка: {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                value={stores.length}
                label="Магазинів"
                hint="Активні магазини, які доступні користувачам."
                tone="green"
              />

              <StatCard
                value={promos.length}
                label="Промокодів"
                hint="Активні промокоди у відкритій базі."
                tone="yellow"
              />

              <StatCard
                value={activePromosCount}
                label="Дійсних"
                hint="Коди без простроченої дати завершення."
                tone="green"
              />

              <StatCard
                value={verifiedPromosCount}
                label="Перевіряли"
                hint="Коди, які вже отримали голоси користувачів."
              />

              <StatCard
                value={expiredPromosCount}
                label="Прострочених"
                hint="Коди з датою завершення в минулому."
                tone="red"
              />

              <StatCard
                value={worksCount}
                label="Голосів “працює”"
                hint="Скільки разів користувачі підтвердили коди."
                tone="green"
              />

              <StatCard
                value={notWorksCount}
                label="Голосів “не працює”"
                hint="Скільки разів користувачі поскаржились на код."
                tone="orange"
              />

              <StatCard
                value={topStores.length}
                label="Активних топів"
                hint="Магазини, які мають хоча б один запис у рейтингу."
              />
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Рейтинг
                </p>

                <h2 className="text-4xl font-black tracking-tight">
                  Топ магазинів
                </h2>

                <p className="mt-3 leading-7 text-slate-400">
                  Магазини з найбільшою кількістю активних промокодів.
                </p>
              </div>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Всі магазини
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                  />
                ))
              ) : topStores.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  Магазинів поки немає.
                </div>
              ) : (
                topStores.map(({ store, stats }, index) => (
                  <article
                    key={store.id}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-sm font-black text-slate-400">
                        #{index + 1}
                      </div>

                      <StoreLogo
                        name={store.name}
                        websiteUrl={store.website_url}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/stores/${store.slug}`}
                          className="break-words text-lg font-black text-white transition hover:text-emerald-300"
                        >
                          {store.name}
                        </Link>

                        <p className="mt-1 text-sm text-slate-500">
                          {stats.activeCodes} дійсних / {stats.totalCodes} усього
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="text-xl font-black text-emerald-300">
                          {stats.verifiedCodes}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          перевіряли
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Останні
                </p>

                <h2 className="text-4xl font-black tracking-tight">
                  Свіжі промокоди
                </h2>

                <p className="mt-3 leading-7 text-slate-400">
                  Останні коди, які вже доступні у відкритій базі.
                </p>
              </div>

              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Всі коди
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-950"
                  />
                ))
              ) : latestPromos.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
                  Промокодів поки немає.
                </div>
              ) : (
                latestPromos.map((promo) => (
                  <PromoRow key={promo.id} promo={promo} />
                ))
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}