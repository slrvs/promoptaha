"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  created_at?: string | null;
};

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
          <p className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
            {promo.store_name || "Магазин"}
          </p>

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

export default function StoreDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-7xl">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження магазину...
            </div>
          </section>
        </main>
      }
    >
      <StoreDetailsContent />
    </Suspense>
  );
}

function StoreDetailsContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [store, setStore] = useState<Store | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [search, setSearch] = useState("");

  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStore() {
    setIsLoadingStore(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, description, website_url, status, created_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !data) {
      setStore(null);
      setErrorMessage("Магазин не знайдено або він ще не активний.");
      setIsLoadingStore(false);
      return;
    }

    setStore(data as Store);
    setIsLoadingStore(false);
  }

  async function loadPromos() {
    setIsLoadingPromos(true);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("store_slug", slug)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      setPromos([]);
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as PromoCode[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    if (slug) {
      loadStore();
      loadPromos();
    }
  }, [slug]);

  const filteredPromos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return promos;
    }

    return promos.filter((promo) => {
      return (
        promo.code.toLowerCase().includes(normalizedSearch) ||
        (promo.discount_value || "").toLowerCase().includes(normalizedSearch) ||
        (promo.description || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [promos, search]);

  const activePromosCount = promos.filter(
    (promo) => !isExpired(promo.expires_at)
  ).length;

  const expiredPromosCount = promos.filter((promo) =>
    isExpired(promo.expires_at)
  ).length;

  const verifiedPromosCount = promos.filter(
    (promo) => (promo.works_count || 0) + (promo.not_works_count || 0) > 0
  ).length;

  if (isLoadingStore) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[420px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-[2rem] border border-red-400/30 bg-slate-950">
              <Image
                src="/icons/promoptaha-red-bird.png"
                alt="ПромоПтаха"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-4xl font-black">Магазин не знайдено</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-200">
              {errorMessage ||
                "Можливо, магазин ще на модерації або посилання неправильне."}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/stores"
                className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
              >
                До магазинів
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-red-400/30 px-6 py-4 font-black text-red-200 transition hover:bg-red-400/10"
              >
                Запропонувати магазин
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-red-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/stores" className="hover:text-red-300">
            Магазини
          </Link>
          <span>/</span>
          <span className="text-slate-300">{store.name}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-red-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_0.7fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="mb-5 inline-flex w-fit rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                Магазин
              </p>

              <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                {store.name}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl">
                {store.description ||
                  "Сторінка магазину з промокодами, знижками та кодами, які перевіряє спільнота ПромоПтахи."}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {store.website_url && (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
                  >
                    Сайт магазину
                  </a>
                )}

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Всі магазини
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-red-300">
                    {promos.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    промокодів
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
                    {verifiedPromosCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    перевіряли
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center rounded-[2rem] border border-red-400/20 bg-slate-950 p-8">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_60%)]" />

              <div className="relative text-center">
                <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-[3rem] border border-red-400/30 bg-slate-900 shadow-2xl shadow-red-950/40 md:h-64 md:w-64">
                  <Image
                    src="/icons/promoptaha-red-bird.png"
                    alt="ПромоПтаха"
                    fill
                    sizes="256px"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
                  <p className="text-sm font-bold text-slate-500">
                    Промокоди магазину
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {store.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                Коди магазину
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Промокоди {store.name}
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Шукай серед промокодів цього магазину за кодом, описом або
                умовою знижки.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400"
            >
              Додати код
            </Link>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Пошук по ${store.name}: код, знижка, доставка...`}
            className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400"
          />

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
                Промокодів не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Для цього магазину ще немає активних кодів або нічого не
                знайдено за пошуком. Якщо маєш робочий промокод — додай його.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href="/add"
                  className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Запропонувати магазин
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPromos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          )}
        </section>

        {expiredPromosCount > 0 && (
          <section className="mt-8 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h2 className="text-2xl font-black text-yellow-300">
              Є прострочені коди
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              У цього магазину є {expiredPromosCount} промокодів, у яких
              завершився термін дії. Якщо маєш новий робочий код — додай його,
              щоб оновити базу.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}