"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import { getHostName, matchesSearch } from "@/lib/searchAliases";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
};

type StoreCategoryLink = {
  store_id: string;
  category_id: string;
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
  store_categories?: StoreCategoryLink[] | null;
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
};

type StoreStats = {
  total: number;
  active: number;
  expired: number;
  noDate: number;
  verified: number;
  works: number;
  notWorks: number;
};

type SortMode = "newest" | "popular" | "works" | "expires";
type StatusFilter = "all" | "valid" | "expired" | "no-date" | "verified";

type StoreDetailsClientProps = {
  slug: string;
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

function isVerified(promo: PromoCode) {
  const works = promo.works_count || 0;
  const notWorks = promo.not_works_count || 0;

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

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Джерело";
}

function makeEmptyStats(): StoreStats {
  return {
    total: 0,
    active: 0,
    expired: 0,
    noDate: 0,
    verified: 0,
    works: 0,
    notWorks: 0,
  };
}

function getStoreCategoryIds(store: Store | null) {
  if (!store) return [];

  const idsFromLinks =
    store.store_categories
      ?.map((link) => link.category_id)
      .filter(Boolean) || [];

  if (idsFromLinks.length > 0) {
    return Array.from(new Set(idsFromLinks));
  }

  return store.category_id ? [store.category_id] : [];
}

function getStoreCategoryNames(
  store: Store | null,
  categoryById: Map<string, Category>
) {
  return getStoreCategoryIds(store)
    .map((categoryId) => categoryById.get(categoryId)?.name)
    .filter(Boolean) as string[];
}

function getPromoCategoryNames(
  promo: PromoCode,
  storeCategoryNames: string[],
  categoryById: Map<string, Category>
) {
  const names = new Set<string>();

  for (const categoryName of storeCategoryNames) {
    names.add(categoryName);
  }

  if (promo.category_name) {
    names.add(promo.category_name);
  }

  if (promo.category_id) {
    const categoryName = categoryById.get(promo.category_id)?.name;

    if (categoryName) {
      names.add(categoryName);
    }
  }

  return Array.from(names);
}

export default function StoreDetailsClient({ slug }: StoreDetailsClientProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingStore || isLoadingCategories || isLoadingPromos;

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const storeCategoryNames = useMemo(() => {
    return getStoreCategoryNames(store, categoryById);
  }, [store, categoryById]);

  const stats = useMemo(() => {
    const currentStats = makeEmptyStats();

    for (const promo of promos) {
      const works = promo.works_count || 0;
      const notWorks = promo.not_works_count || 0;

      currentStats.total += 1;
      currentStats.works += works;
      currentStats.notWorks += notWorks;

      if (!promo.expires_at) {
        currentStats.noDate += 1;
      } else if (isExpired(promo.expires_at)) {
        currentStats.expired += 1;
      } else {
        currentStats.active += 1;
      }

      if (isVerified(promo)) {
        currentStats.verified += 1;
      }
    }

    return currentStats;
  }, [promos]);

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

  async function loadStoreAndPromos() {
    setIsLoadingStore(true);
    setIsLoadingPromos(true);
    setMessage("");

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at"
      )
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (storeError) {
      setStore(null);
      setPromos([]);
      setMessage(`Не вдалося завантажити магазин: ${storeError.message}`);
      setMessageType("error");
      setIsLoadingStore(false);
      setIsLoadingPromos(false);
      return;
    }

    if (!storeData) {
      setStore(null);
      setPromos([]);
      setMessage("Магазин не знайдено або він прихований.");
      setMessageType("error");
      setIsLoadingStore(false);
      setIsLoadingPromos(false);
      return;
    }

    const loadedStore = storeData as unknown as Store;

    const { data: linkData, error: linkError } = await supabase
      .from("store_categories")
      .select("store_id, category_id")
      .eq("store_id", loadedStore.id);

    if (linkError) {
      setStore({
        ...loadedStore,
        store_categories: [],
      });
      setMessage(
        `Магазин завантажено, але категорії не підтягнулись: ${linkError.message}`
      );
      setMessageType("error");
    } else {
      setStore({
        ...loadedStore,
        store_categories: (linkData || []) as unknown as StoreCategoryLink[],
      });
    }

    setIsLoadingStore(false);

    const { data: promoData, error: promoError } = await supabase
      .from("promo_code_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count"
      )
      .eq("store_id", loadedStore.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (promoError) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${promoError.message}`);
      setMessageType("error");
      setIsLoadingPromos(false);
      return;
    }

    setPromos((promoData || []) as unknown as PromoCode[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    loadCategories();
    loadStoreAndPromos();
  }, [slug]);

  const counts = useMemo(() => {
    return {
      all: promos.length,
      valid: promos.filter(
        (promo) => promo.expires_at && !isExpired(promo.expires_at)
      ).length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      noDate: promos.filter((promo) => !promo.expires_at).length,
      verified: promos.filter((promo) => isVerified(promo)).length,
    };
  }, [promos]);

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      const promoCategoryNames = getPromoCategoryNames(
        promo,
        storeCategoryNames,
        categoryById
      );

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
          promoCategoryNames.join(" "),
          (promo.search_aliases || []).join(" "),
          (promo.store_search_aliases || []).join(" "),
        ],
        search
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" &&
          Boolean(promo.expires_at) &&
          !isExpired(promo.expires_at)) ||
        (statusFilter === "expired" && isExpired(promo.expires_at)) ||
        (statusFilter === "no-date" && !promo.expires_at) ||
        (statusFilter === "verified" && isVerified(promo));

      return matchesSearchQuery && matchesStatus;
    });

    return [...filtered].sort((firstPromo, secondPromo) => {
      const firstWorks = firstPromo.works_count || 0;
      const secondWorks = secondPromo.works_count || 0;
      const firstTotalVotes =
        (firstPromo.works_count || 0) + (firstPromo.not_works_count || 0);
      const secondTotalVotes =
        (secondPromo.works_count || 0) + (secondPromo.not_works_count || 0);

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
  }, [promos, search, statusFilter, sortMode, storeCategoryNames, categoryById]);

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

  if (isLoadingStore) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[520px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="text-6xl">🏪</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Магазин не знайдено
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Можливо, магазин прихований, ще не створений або slug змінився.
            </p>

            <Link
              href="/stores"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              До магазинів
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
          <Link href="/stores" className="hover:text-emerald-300">
            Магазини
          </Link>
          <span>/</span>
          <span className="text-slate-300">{store.name}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
            <div className="flex justify-center lg:justify-start">
              <StoreLogo
                name={store.name}
                websiteUrl={store.website_url}
                size="xl"
              />
            </div>

            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазин
              </p>

              <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                {store.name}
              </h1>

              <p className="mt-3 break-all text-sm font-bold text-slate-500">
                /stores/{store.slug}
              </p>

              {store.website_url && (
                <p className="mt-2 break-all text-sm font-bold text-slate-500">
                  {getHostName(store.website_url)}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {storeCategoryNames.length === 0 ? (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-500">
                    Без категорії
                  </span>
                ) : (
                  storeCategoryNames.map((categoryName) => (
                    <span
                      key={categoryName}
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300"
                    >
                      {categoryName}
                    </span>
                  ))
                )}
              </div>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                {store.description ||
                  "Промокоди, купони та знижки для цього магазину від спільноти ПромоПтаха."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-white">
                    {formatNumber(stats.total)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    всього
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {formatNumber(stats.active + stats.noDate)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    активні
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {formatNumber(stats.verified)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    робочі
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-red-300">
                    {formatNumber(stats.expired)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    прострочені
                  </p>
                </div>
              </div>

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
                    Сайт магазину
                  </a>
                )}
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
              placeholder={`Пошук промокоду ${store.name}...`}
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
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "all"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Усі · {formatNumber(counts.all)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("valid")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "valid"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Активні · {formatNumber(counts.valid)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("no-date")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "no-date"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Без терміну · {formatNumber(counts.noDate)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("verified")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "verified"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Перевірені · {formatNumber(counts.verified)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("expired")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "expired"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Прострочені · {formatNumber(counts.expired)}
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredPromos.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🎟️</div>

            <h2 className="mt-5 text-4xl font-black">
              Промокодів не знайдено
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Для цього магазину ще немає промокодів або вони не підходять під
              обраний фільтр.
            </p>

            <Link
              href={`/add?store=${store.id}`}
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати перший промокод
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPromos.map((promo) => {
              const promoCategoryNames = getPromoCategoryNames(
                promo,
                storeCategoryNames,
                categoryById
              );

              return (
                <article
                  key={promo.id}
                  className="group flex min-h-[430px] flex-col rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {store.name}
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
                    {promoCategoryNames.length === 0 ? (
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-500">
                        Без категорії
                      </span>
                    ) : (
                      promoCategoryNames.map((categoryName) => (
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
                        {formatNumber(promo.works_count || 0)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-red-300">
                        {formatNumber(promo.not_works_count || 0)}
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