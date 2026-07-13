"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  code: string;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
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
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  };
}

function PromoCard({ promo }: { promo: PromoCode }) {
  const works = promo.works_count || 0;
  const notWorks = promo.not_works_count || 0;
  const expired = isExpired(promo.expires_at);
  const health = getPromoHealth(works, notWorks);

  return (
    <article className="group rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={promo.store_slug ? `/stores/${promo.store_slug}` : "/stores"}
            className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            {promo.store_name || "Магазин"}
          </Link>

          <h2 className="mt-4 break-all text-3xl font-black tracking-tight text-white">
            {promo.code}
          </h2>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${
            expired
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : promo.expires_at
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
          }`}
        >
          {expired ? "Прострочений" : promo.expires_at ? "Активний" : "Без дати"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-bold text-slate-500">Умова / знижка</p>

        <p className="mt-2 text-lg font-black text-emerald-300">
          {promo.discount_value || "Умову не вказано"}
        </p>
      </div>

      {promo.description && (
        <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
          {promo.description}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-500">Діє до</p>
          <p className="mt-1 font-black text-slate-200">
            {formatDate(promo.expires_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-500">Перевірка</p>
          <p className="mt-1 font-black text-slate-200">
            ✅ {works} / ❌ {notWorks}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <span
          className={`inline-flex rounded-full border px-3 py-2 text-xs font-black ${health.className}`}
        >
          {health.label}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/codes/${promo.id}`}
          className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center font-black text-white transition hover:bg-emerald-400"
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
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPromos() {
    setIsLoadingPromos(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(9);

    if (error) {
      setErrorMessage(error.message);
      setPromos([]);
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as PromoCode[]);
    setIsLoadingPromos(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);

    const { data } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(12);

    setStores((data || []) as Store[]);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadPromos();
    loadStores();
  }, []);

  const filteredPromos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return promos;
    }

    return promos.filter((promo) => {
      return (
        promo.code.toLowerCase().includes(normalizedSearch) ||
        (promo.store_name || "").toLowerCase().includes(normalizedSearch) ||
        (promo.discount_value || "").toLowerCase().includes(normalizedSearch) ||
        (promo.description || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [promos, search]);

  const activePromosCount = promos.filter(
    (promo) => !isExpired(promo.expires_at)
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="mb-5 inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                ПромоПтаха
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl">
                Спільна база промокодів, де користувачі додають знайдені
                знижки, перевіряють актуальність кодів і допомагають іншим
                економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-white transition hover:bg-emerald-400"
                >
                  Дивитись промокоди
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {promos.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    останніх кодів
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {activePromosCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    активних
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {stores.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    магазинів
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[420px] items-center justify-center rounded-[2rem] border border-emerald-400/20 bg-slate-950 p-8">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_60%)]" />

              <div className="relative">
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

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 text-center">
                  <p className="text-sm font-bold text-slate-500">
                    Швидкий пошук знижок
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    Знайшов → додав → перевірили
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Свіжі коди
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Останні промокоди
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Найновіші активні промокоди з бази. Шукай за кодом, магазином
                або умовою знижки.
              </p>
            </div>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Всі промокоди
            </Link>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: магазин, код, доставка, знижка..."
            className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
          />

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300">
              Помилка завантаження: {errorMessage}
            </div>
          )}

          {isLoadingPromos ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Поки нічого не знайшли
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити пошук або додай перший робочий промокод.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-white transition hover:bg-emerald-400"
              >
                Додати промокод
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPromos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <div className="text-4xl">🎟️</div>
            <h3 className="mt-4 text-2xl font-black">Додавай коди</h3>
            <p className="mt-3 leading-7 text-slate-400">
              Знайшов промокод у блогера, соцмережах або на сайті магазину —
              додай його на перевірку.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <div className="text-4xl">✅</div>
            <h3 className="mt-4 text-2xl font-black">Перевіряй</h3>
            <p className="mt-3 leading-7 text-slate-400">
              Голосуй, чи код працює. Так інші користувачі швидше знайдуть
              актуальні знижки.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <div className="text-4xl">💸</div>
            <h3 className="mt-4 text-2xl font-black">Економ</h3>
            <p className="mt-3 leading-7 text-slate-400">
              Збираємо промокоди в одному місці, щоб не шукати їх по всьому
              інтернету.
            </p>
          </div>
        </section>

        {!isLoadingStores && stores.length > 0 && (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Магазини
                </p>

                <h2 className="text-4xl font-black tracking-tight">
                  Популярні магазини
                </h2>
              </div>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Всі магазини
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug}`}
                  className="rounded-full border border-slate-800 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  {store.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
