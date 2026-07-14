"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { matchesSearch } from "@/lib/searchAliases";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
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
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type SortMode = "newest" | "popular" | "works" | "expires";
type StatusFilter = "all" | "valid" | "expired" | "no-date" | "verified";

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

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
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

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Джерело";
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

export default function CodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingPromos || isLoadingCategories;

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

  async function loadPromos() {
    setIsLoadingPromos(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count"
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
    loadPromos();
  }, []);

  const categoryPromoCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const promo of promos) {
      const categoryIds = getPromoCategoryIds(promo);

      for (const categoryId of categoryIds) {
        counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
      }
    }

    return counts;
  }, [promos]);

  const counts = useMemo(() => {
    return {
      all: promos.length,
      valid: promos.filter(
        (promo) => promo.expires_at && !isExpired(promo.expires_at)
      ).length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      noDate: promos.filter((promo) => !promo.expires_at).length,
      verified: promos.filter((promo) => isVerified(promo)).length,
      noCategory: promos.filter(
        (promo) => getPromoCategoryIds(promo).length === 0
      ).length,
    };
  }, [promos]);

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      const categoryIds = getPromoCategoryIds(promo);
      const categoryNames = getPromoCategoryNames(promo);

      const matchesSearchQuery = matchesSearch(
        [
          promo.code,
          promo.normalized_code || "",
          promo.store_name || "",
          promo.store_slug || "",
          promo.discount_value || "",
          promo.description || "",
          promo.source_type || "",
          promo.category_name || "",
          promo.category_slug || "",
          toArray(promo.all_category_names).join(" "),
          toArray(promo.all_category_slugs).join(" "),
          categoryNames.join(" "),
          (promo.search_aliases || []).join(" "),
          (promo.store_search_aliases || []).join(" "),
        ],
        search
      );

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && categoryIds.length === 0) ||
        categoryIds.includes(categoryFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" &&
          Boolean(promo.expires_at) &&
          !isExpired(promo.expires_at)) ||
        (statusFilter === "expired" && isExpired(promo.expires_at)) ||
        (statusFilter === "no-date" && !promo.expires_at) ||
        (statusFilter === "verified" && isVerified(promo));

      return matchesSearchQuery && matchesCategory && matchesStatus;
    });

    return [...filtered].sort((firstPromo, secondPromo) => {
      const firstWorks = toNumber(firstPromo.works_count);
      const secondWorks = toNumber(secondPromo.works_count);
      const firstTotalVotes =
        toNumber(firstPromo.works_count) + toNumber(firstPromo.not_works_count);
      const secondTotalVotes =
        toNumber(secondPromo.works_count) +
        toNumber(secondPromo.not_works_count);

      if (sortMode === "popular") {
        return (
          secondTotalVotes - firstTotalVotes ||
          secondWorks - firstWorks ||
          new Date(secondPromo.created_at || 0).getTime() -
            new Date(firstPromo.created_at || 0).getTime()
        );
      }

      if (sortMode === "works") {
        return (
          secondWorks - firstWorks ||
          secondTotalVotes - firstTotalVotes ||
          new Date(secondPromo.created_at || 0).getTime() -
            new Date(firstPromo.created_at || 0).getTime()
        );
      }

      if (sortMode === "expires") {
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
  }, [promos, search, categoryFilter, statusFilter, sortMode]);

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
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Промокоди</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Промокоди
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Усі промокоди
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Шукай промокоди за магазином, категорією, назвою або джерелом.
                Тепер сторінка працює через SQL view, тому всі категорії
                магазину вже приходять готовим масивом.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
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
                  {formatNumber(counts.all)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {formatNumber(counts.valid + counts.noDate)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активні / без терміну
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {formatNumber(counts.verified)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  перевірені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-orange-300">
                  {formatNumber(categories.length)}
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

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: KRKR, кркр, Comfy, комфі, їжа, догляд..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="valid">Активні</option>
              <option value="no-date">Без терміну</option>
              <option value="verified">Перевірені</option>
              <option value="expired">Прострочені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="popular">Популярні</option>
              <option value="works">Більше “працює”</option>
              <option value="expires">Скоро завершуються</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                categoryFilter === "all"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Усі · {formatNumber(counts.all)}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter("none")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                categoryFilter === "none"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Без категорії · {formatNumber(counts.noCategory)}
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  categoryFilter === category.id
                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                {category.name} ·{" "}
                {formatNumber(categoryPromoCounts.get(category.id) || 0)}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredPromos.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🔎</div>

            <h2 className="mt-5 text-4xl font-black">
              Промокодів не знайдено
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Спробуй змінити пошук, статус або категорію.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPromos.map((promo) => {
              const categoryNames = getPromoCategoryNames(promo);

              return (
                <article
                  key={promo.id}
                  className="group flex min-h-[430px] flex-col rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/30"
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

                      <h2 className="mt-2 break-all text-3xl font-black text-white transition group-hover:text-emerald-300">
                        {promo.code}
                      </h2>
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
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-500">
                        Без категорії
                      </span>
                    ) : (
                      categoryNames.map((categoryName) => (
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

                  <p className="mt-3 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
                    {promo.description ||
                      "Промокод додано спільнотою ПромоПтаха. Перевір працездатність і умови використання на сторінці коду."}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-emerald-300">
                        {formatNumber(toNumber(promo.works_count))}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-red-300">
                        {formatNumber(toNumber(promo.not_works_count))}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        ні
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-sm font-black text-slate-200">
                        {formatDate(promo.expires_at)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        термін
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Джерело
                    </p>

                    <p className="mt-1 font-black text-slate-200">
                      {getSourceLabel(promo.source_type)}
                    </p>
                  </div>

                  <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => copyCode(promo)}
                      className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      {copiedCodeId === promo.id ? "Скопійовано" : "Копіювати"}
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
          </section>
        )}
      </section>
    </main>
  );
}