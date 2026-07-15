"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type StoreDetails = {
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
  promo_count?: number | null;
  active_promo_count?: number | null;
  expired_promo_count?: number | null;
  verified_promo_count?: number | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id: string;
  store_name: string;
  store_slug: string;
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
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

type StoreDetailsClientProps = {
  store: StoreDetails;
};

type PromoFilter = "all" | "active" | "verified" | "expired";

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

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiresAt = new Date(date);
  expiresAt.setHours(0, 0, 0, 0);

  return expiresAt < today;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\s+/g, " ");
}

function promoMatchesSearch(promo: PromoCode, search: string) {
  const query = normalizeText(search);

  if (!query) return true;

  const haystack = normalizeText(
    [
      promo.code,
      promo.discount_value || "",
      promo.description || "",
      promo.source_type || "",
      promo.category_name || "",
      (promo.all_category_names || []).join(" "),
      (promo.search_aliases || []).join(" "),
    ].join(" ")
  );

  return haystack.includes(query);
}

function getPromoCategories(promo: PromoCode) {
  if (promo.all_category_names && promo.all_category_names.length > 0) {
    return promo.all_category_names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
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

function isVerified(promo: PromoCode) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);

  return worksCount > 0 && worksCount > notWorksCount;
}

function getTrustLabel(promo: PromoCode) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);

  if (worksCount === 0 && notWorksCount === 0) {
    return "Без голосів";
  }

  if (worksCount > notWorksCount) {
    return "Працює";
  }

  if (notWorksCount > worksCount) {
    return "Є скарги";
  }

  return "Голоси порівну";
}

function getTrustClass(promo: PromoCode) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);

  if (worksCount === 0 && notWorksCount === 0) {
    return "border-slate-700 bg-slate-950 text-slate-400";
  }

  if (worksCount > notWorksCount) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (notWorksCount > worksCount) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

export default function StoreDetailsClient({ store }: StoreDetailsClientProps) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PromoFilter>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const categories = store.category_names || [];

  const filteredPromos = useMemo(() => {
    return promos.filter((promo) => {
      const expired = isExpired(promo.expires_at);

      if (filter === "active" && expired) return false;
      if (filter === "expired" && !expired) return false;
      if (filter === "verified" && !isVerified(promo)) return false;

      return promoMatchesSearch(promo, search);
    });
  }, [promos, filter, search]);

  const counts = useMemo(() => {
    return {
      all: promos.length,
      active: promos.filter((promo) => !isExpired(promo.expires_at)).length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      verified: promos.filter((promo) => isVerified(promo)).length,
    };
  }, [promos]);

  async function loadPromos() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${error.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    setPromos((data || []) as unknown as PromoCode[]);
    setIsLoading(false);
  }

  async function copyCode(promo: PromoCode) {
    try {
      await navigator.clipboard.writeText(promo.code);

      setCopiedPromoId(promo.id);
      setMessage(`Промокод ${promo.code} скопійовано.`);
      setMessageType("success");

      window.setTimeout(() => {
        setCopiedPromoId(null);
      }, 1800);
    } catch {
      setMessage("Не вдалося скопіювати код. Скопіюй його вручну.");
      setMessageType("error");
    }
  }

  useEffect(() => {
    loadPromos();
  }, [store.id]);

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
          <div className="grid gap-8 p-6 lg:grid-cols-[auto_1fr] lg:p-10">
            <StoreLogo
              name={store.name}
              websiteUrl={store.website_url}
              size="xl"
            />

            <div>
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-400">
                    Без категорії
                  </span>
                ) : (
                  categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300"
                    >
                      {category}
                    </span>
                  ))
                )}

                <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
                  /stores/{store.slug}
                </span>
              </div>

              <h1 className="mt-6 break-words text-5xl font-black tracking-tight md:text-7xl">
                {store.name}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                {store.description ||
                  `Актуальні промокоди, купони та знижки для ${store.name}. Копіюй код, перевіряй термін дії та голосуй, чи промокод працює.`}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/add?store=${store.id}`}
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>

                {store.website_url && (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Перейти на сайт
                  </a>
                )}

                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Усі магазини
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-4xl font-black text-white">
              {Number(store.promo_count || counts.all)}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500">
              всього промокодів
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-4xl font-black text-emerald-300">
              {Number(store.active_promo_count || counts.active)}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500">активні</p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-4xl font-black text-yellow-300">
              {Number(store.verified_promo_count || counts.verified)}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500">перевірені</p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-4xl font-black text-red-300">
              {Number(store.expired_promo_count || counts.expired)}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500">
              термін минув
            </p>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 font-bold ${
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

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-4xl font-black">Промокоди {store.name}</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Показуються тільки схвалені промокоди. Нові коди зʼявляться тут
                після модерації.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук по кодах..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 lg:w-[360px]"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                filter === "all"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Усі · {counts.all}
            </button>

            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                filter === "active"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Активні · {counts.active}
            </button>

            <button
              type="button"
              onClick={() => setFilter("verified")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                filter === "verified"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Перевірені · {counts.verified}
            </button>

            <button
              type="button"
              onClick={() => setFilter("expired")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                filter === "expired"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Термін минув · {counts.expired}
            </button>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-6xl">🎟️</div>

              <h3 className="mt-5 text-3xl font-black">
                Промокодів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Для цього магазину поки немає промокодів під обраний фільтр.
                Можеш додати код — після модерації він зʼявиться тут.
              </p>

              <Link
                href={`/add?store=${store.id}`}
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {filteredPromos.map((promo) => {
                const expired = isExpired(promo.expires_at);
                const promoCategories = getPromoCategories(promo);

                return (
                  <article
                    key={promo.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40"
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

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getTrustClass(
                          promo
                        )}`}
                      >
                        {getTrustLabel(promo)}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                        {getSourceLabel(promo.source_type)}
                      </span>
                    </div>

                    <h3 className="mt-4 break-all text-4xl font-black text-white">
                      {promo.code}
                    </h3>

                    <p className="mt-2 text-xl font-black text-emerald-300">
                      {promo.discount_value || "Промокод на знижку"}
                    </p>

                    <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                      {promo.description ||
                        `Промокод для ${store.name}. Перевір термін дії та скопіюй код.`}
                    </p>

                    {promoCategories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {promoCategories.slice(0, 4).map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Діє до
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Додано
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDateTime(promo.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => copyCode(promo)}
                        className="rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        {copiedPromoId === promo.id
                          ? "Скопійовано"
                          : "Скопіювати"}
                      </button>

                      <Link
                        href={getPromoUrl(promo)}
                        className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Детальніше
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