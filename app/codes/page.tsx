"use client";

import { useEffect, useMemo, useState } from "react";
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

type FilterType = "all" | "active" | "expired" | "no-date";

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

function getSourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Джерело не вказано";
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
    <article className="group rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-red-400/40 hover:shadow-red-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={
              promo.store_slug ? `/stores/${promo.store_slug}` : "/stores"
            }
            className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-red-400 hover:text-red-300"
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
        <p className="text-sm font-bold text-slate-500">Умова / знижка</p>

        <p className="mt-2 text-lg font-black text-red-300">
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
          className="flex-1 rounded-2xl bg-red-500 px-5 py-3 text-center font-black text-white transition hover:bg-red-400"
        >
          Детальніше
        </Link>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(promo.code)}
          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
        >
          Копіювати
        </button>
      </div>
    </article>
  );
}

export default function CodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPromos() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setPromos([]);
      setIsLoading(false);
      return;
    }

    setPromos((data || []) as PromoCode[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPromos();
  }, []);

  const filteredPromos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return promos.filter((promo) => {
      const matchesSearch =
        !normalizedSearch ||
        promo.code.toLowerCase().includes(normalizedSearch) ||
        (promo.store_name || "").toLowerCase().includes(normalizedSearch) ||
        (promo.discount_value || "").toLowerCase().includes(normalizedSearch) ||
        (promo.description || "").toLowerCase().includes(normalizedSearch);

      const expired = isExpired(promo.expires_at);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !expired) ||
        (filter === "expired" && expired) ||
        (filter === "no-date" && !promo.expires_at);

      return matchesSearch && matchesFilter;
    });
  }, [promos, search, filter]);

  const activeCount = promos.filter((promo) => !isExpired(promo.expires_at)).length;
  const expiredCount = promos.filter((promo) => isExpired(promo.expires_at)).length;
  const noDateCount = promos.filter((promo) => !promo.expires_at).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                Промокоди
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Актуальні промокоди
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Шукай коди за магазином, назвою, описом або умовою знижки.
                Користувачі допомагають перевіряти, що реально працює.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
            >
              Додати промокод
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: ROZETKA, знижка, доставка, код..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  filter === "all"
                    ? "bg-red-500 text-white"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
                }`}
              >
                Усі {promos.length}
              </button>

              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  filter === "active"
                    ? "bg-red-500 text-white"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
                }`}
              >
                Активні {activeCount}
              </button>

              <button
                type="button"
                onClick={() => setFilter("expired")}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  filter === "expired"
                    ? "bg-red-500 text-white"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
                }`}
              >
                Прострочені {expiredCount}
              </button>

              <button
                type="button"
                onClick={() => setFilter("no-date")}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  filter === "no-date"
                    ? "bg-red-500 text-white"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
                }`}
              >
                Без дати {noDateCount}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
              Помилка завантаження: {errorMessage}
            </div>
          )}

          {isLoading ? (
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
                Нічого не знайшли
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити пошук або фільтр. Якщо знаєш робочий промокод —
                додай його на сайт.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
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
      </section>
    </main>
  );
}