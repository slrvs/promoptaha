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

type PromoStats = {
  id: string;
  store_id: string;
  expires_at?: string | null;
  status?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type StoreStats = {
  total: number;
  active: number;
  expired: number;
  verified: number;
  works: number;
  notWorks: number;
};

type SortMode = "popular" | "active" | "newest" | "name";

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

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getStoreCategoryIds(store: Store) {
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
  store: Store,
  categoryById: Map<string, Category>
) {
  return getStoreCategoryIds(store)
    .map((categoryId) => categoryById.get(categoryId)?.name)
    .filter(Boolean) as string[];
}

function makeEmptyStats(): StoreStats {
  return {
    total: 0,
    active: 0,
    expired: 0,
    verified: 0,
    works: 0,
    notWorks: 0,
  };
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promos, setPromos] = useState<PromoStats[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingStores || isLoadingCategories || isLoadingPromos;

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

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

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at"
      )
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storeError) {
      setStores([]);
      setMessage(`Не вдалося завантажити магазини: ${storeError.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    const loadedStores = (storeData || []) as unknown as Store[];
    const storeIds = loadedStores.map((store) => store.id);

    if (storeIds.length === 0) {
      setStores([]);
      setIsLoadingStores(false);
      return;
    }

    const { data: linkData, error: linkError } = await supabase
      .from("store_categories")
      .select("store_id, category_id")
      .in("store_id", storeIds);

    if (linkError) {
      setStores(loadedStores);
      setMessage(
        `Магазини завантажено, але категорії не підтягнулись: ${linkError.message}`
      );
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    const links = (linkData || []) as unknown as StoreCategoryLink[];
    const linksByStoreId = new Map<string, StoreCategoryLink[]>();

    for (const link of links) {
      const currentLinks = linksByStoreId.get(link.store_id) || [];

      linksByStoreId.set(link.store_id, [...currentLinks, link]);
    }

    const storesWithCategories = loadedStores.map((store) => ({
      ...store,
      store_categories: linksByStoreId.get(store.id) || [],
    }));

    setStores(storesWithCategories);
    setIsLoadingStores(false);
  }

  async function loadPromos() {
    setIsLoadingPromos(true);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select(
        "id, store_id, expires_at, status, works_count, not_works_count"
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

    setPromos((data || []) as unknown as PromoStats[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    loadCategories();
    loadStores();
    loadPromos();
  }, []);

  const statsByStoreId = useMemo(() => {
    const map = new Map<string, StoreStats>();

    for (const promo of promos) {
      const currentStats = map.get(promo.store_id) || makeEmptyStats();

      const works = promo.works_count || 0;
      const notWorks = promo.not_works_count || 0;
      const expired = isExpired(promo.expires_at);

      currentStats.total += 1;
      currentStats.works += works;
      currentStats.notWorks += notWorks;

      if (expired) {
        currentStats.expired += 1;
      } else {
        currentStats.active += 1;
      }

      if (works > notWorks && works > 0) {
        currentStats.verified += 1;
      }

      map.set(promo.store_id, currentStats);
    }

    return map;
  }, [promos]);

  const categoryStoreCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const store of stores) {
      const categoryIds = getStoreCategoryIds(store);

      for (const categoryId of categoryIds) {
        counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
      }
    }

    return counts;
  }, [stores]);

  const counts = useMemo(() => {
    return {
      allStores: stores.length,
      withPromos: stores.filter(
        (store) => (statsByStoreId.get(store.id)?.total || 0) > 0
      ).length,
      activePromos: promos.filter((promo) => !isExpired(promo.expires_at))
        .length,
      noCategory: stores.filter((store) => getStoreCategoryIds(store).length === 0)
        .length,
    };
  }, [stores, promos, statsByStoreId]);

  const filteredStores = useMemo(() => {
    const filtered = stores.filter((store) => {
      const categoryIds = getStoreCategoryIds(store);
      const categoryNames = getStoreCategoryNames(store, categoryById);
      const aliases = store.search_aliases || [];

      const matchesSearchQuery = matchesSearch(
        [
          store.name,
          store.slug,
          store.description || "",
          store.website_url || "",
          getHostName(store.website_url) || "",
          categoryNames.join(" "),
          aliases.join(" "),
        ],
        search
      );

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && categoryIds.length === 0) ||
        categoryIds.includes(categoryFilter);

      return matchesSearchQuery && matchesCategory;
    });

    return [...filtered].sort((firstStore, secondStore) => {
      const firstStats = statsByStoreId.get(firstStore.id) || makeEmptyStats();
      const secondStats = statsByStoreId.get(secondStore.id) || makeEmptyStats();

      if (sortMode === "active") {
        return (
          secondStats.active - firstStats.active ||
          secondStats.total - firstStats.total ||
          firstStore.name.localeCompare(secondStore.name, "uk")
        );
      }

      if (sortMode === "newest") {
        return (
          new Date(secondStore.created_at || 0).getTime() -
          new Date(firstStore.created_at || 0).getTime()
        );
      }

      if (sortMode === "name") {
        return firstStore.name.localeCompare(secondStore.name, "uk");
      }

      return (
        secondStats.total - firstStats.total ||
        secondStats.active - firstStats.active ||
        firstStore.name.localeCompare(secondStore.name, "uk")
      );
    });
  }, [stores, search, categoryFilter, sortMode, categoryById, statsByStoreId]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Магазини</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Усі магазини
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Обирай магазин і знаходь актуальні промокоди, знижки та купони.
                Один магазин може бути одразу в кількох категоріях: наприклад
                “Догляд та побут”, “Краса” або “Маркетплейси”.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Дивитись промокоди
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {formatNumber(counts.allStores)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {formatNumber(counts.withPromos)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  з промокодами
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {formatNumber(counts.activePromos)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активних кодів
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
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: KRKR, кркр, Comfy, комфі, Rozetka..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="popular">Спочатку популярні</option>
              <option value="active">Більше активних кодів</option>
              <option value="newest">Спочатку нові</option>
              <option value="name">За назвою</option>
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
              Усі · {formatNumber(stores.length)}
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
                {formatNumber(categoryStoreCounts.get(category.id) || 0)}
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
        ) : filteredStores.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🔎</div>

            <h2 className="mt-5 text-4xl font-black">
              Магазинів не знайдено
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Спробуй змінити пошук або обрати іншу категорію.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStores.map((store) => {
              const stats = statsByStoreId.get(store.id) || makeEmptyStats();
              const categoryNames = getStoreCategoryNames(store, categoryById);

              return (
                <article
                  key={store.id}
                  className="group flex min-h-[420px] flex-col rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/30"
                >
                  <div className="flex items-start gap-4">
                    <StoreLogo
                      name={store.name}
                      websiteUrl={store.website_url}
                      size="md"
                    />

                    <div className="min-w-0">
                      <h2 className="break-words text-2xl font-black text-white transition group-hover:text-emerald-300">
                        {store.name}
                      </h2>

                      <p className="mt-1 break-all text-sm font-bold text-slate-500">
                        /stores/{store.slug}
                      </p>

                      {store.website_url && (
                        <p className="mt-1 break-all text-sm font-bold text-slate-600">
                          {getHostName(store.website_url)}
                        </p>
                      )}
                    </div>
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

                  <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
                    {store.description ||
                      "Промокоди, купони та знижки для цього магазину від спільноти ПромоПтаха."}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-white">
                        {formatNumber(stats.total)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        всього
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-emerald-300">
                        {formatNumber(stats.active)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        активні
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                      <p className="text-2xl font-black text-yellow-300">
                        {formatNumber(stats.verified)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        робочі
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <p className="mb-4 text-xs font-bold text-slate-600">
                      Додано: {formatDate(store.created_at)}
                    </p>

                    <Link
                      href={`/stores/${store.slug}`}
                      className="flex w-full justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити магазин
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