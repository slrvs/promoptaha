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

type SortMode = "popular" | "active" | "newest" | "name";

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
  return toArray(store.category_ids);
}

function getStoreCategoryNames(store: Store) {
  return toArray(store.category_names);
}

function MobileStoreTile({ store }: { store: Store }) {
  const categoryNames = getStoreCategoryNames(store);
  const activePromoCount = toNumber(store.active_promo_count);
  const totalPromoCount = toNumber(store.promo_count);

  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex min-h-[175px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <div className="flex items-start justify-between gap-2">
        <StoreLogo name={store.name} websiteUrl={store.website_url} size="sm" />

        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-300">
          {activePromoCount} кодів
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p className="truncate text-base font-black text-white transition group-hover:text-emerald-300">
          {store.name}
        </p>

        {store.website_url && (
          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
            {getHostName(store.website_url)}
          </p>
        )}

        <p className="mt-3 text-xs font-bold text-slate-400">
          Всього: {formatNumber(totalPromoCount)}
        </p>

        <p className="mt-1 truncate text-[11px] font-black text-emerald-300">
          {categoryNames[0] || "Без категорії"}
        </p>
      </div>

      <div className="mt-auto pt-4">
        <span className="inline-flex w-full justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition group-hover:bg-emerald-300">
          Відкрити
        </span>
      </div>
    </Link>
  );
}

function DesktopStoreCard({ store }: { store: Store }) {
  const categoryNames = getStoreCategoryNames(store);

  return (
    <article className="group flex min-h-[420px] flex-col rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/30">
      <div className="flex items-start gap-4">
        <StoreLogo name={store.name} websiteUrl={store.website_url} size="md" />

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
            {formatNumber(toNumber(store.promo_count))}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">всього</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {formatNumber(toNumber(store.active_promo_count))}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">активні</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
          <p className="text-2xl font-black text-yellow-300">
            {formatNumber(toNumber(store.verified_promo_count))}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">робочі</p>
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
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isLoading = isLoadingStores || isLoadingCategories;

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

    const { data, error } = await supabase
      .from("store_category_stats")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at, category_ids, category_names, category_slugs, promo_count, active_promo_count, expired_promo_count, verified_promo_count, works_count, not_works_count"
      )
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setStores([]);
      setMessage(`Не вдалося завантажити магазини: ${error.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as unknown as Store[]);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadCategories();
    loadStores();
  }, []);

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
      withPromos: stores.filter((store) => toNumber(store.promo_count) > 0)
        .length,
      activePromos: stores.reduce(
        (sum, store) => sum + toNumber(store.active_promo_count),
        0
      ),
      noCategory: stores.filter((store) => getStoreCategoryIds(store).length === 0)
        .length,
    };
  }, [stores]);

  const filteredStores = useMemo(() => {
    const filtered = stores.filter((store) => {
      const categoryIds = getStoreCategoryIds(store);
      const categoryNames = getStoreCategoryNames(store);
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
      if (sortMode === "active") {
        return (
          toNumber(secondStore.active_promo_count) -
            toNumber(firstStore.active_promo_count) ||
          toNumber(secondStore.promo_count) - toNumber(firstStore.promo_count) ||
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
        toNumber(secondStore.promo_count) - toNumber(firstStore.promo_count) ||
        toNumber(secondStore.active_promo_count) -
          toNumber(firstStore.active_promo_count) ||
        toNumber(secondStore.works_count) - toNumber(firstStore.works_count) ||
        firstStore.name.localeCompare(secondStore.name, "uk")
      );
    });
  }, [stores, search, categoryFilter, sortMode]);

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Магазини</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20 sm:rounded-[2.5rem]">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:text-sm">
                Магазини
              </p>

              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Усі магазини
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:font-normal sm:leading-8">
                Обирай магазин і знаходь актуальні промокоди, знижки та купони.
                На телефоні магазини показані компактними плитками.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
                <Link
                  href="/codes"
                  className="inline-flex justify-center rounded-full bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Промокоди
                </Link>

                <Link
                  href="/request-store"
                  className="inline-flex justify-center rounded-full border border-slate-700 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати магазин
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-white sm:text-4xl">
                  {formatNumber(counts.allStores)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  магазинів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-emerald-300 sm:text-4xl">
                  {formatNumber(counts.withPromos)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  з кодами
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-yellow-300 sm:text-4xl">
                  {formatNumber(counts.activePromos)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  активних кодів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-orange-300 sm:text-4xl">
                  {formatNumber(categories.length)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  категорій
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm font-bold sm:mt-6 sm:text-base ${
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

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:gap-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: KRKR, Comfy, Rozetka..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
            />

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
            >
              <option value="popular">Популярні</option>
              <option value="active">Більше активних кодів</option>
              <option value="newest">Нові</option>
              <option value="name">За назвою</option>
            </select>
          </div>

          <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition sm:text-sm ${
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
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition sm:text-sm ${
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
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition sm:text-sm ${
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
          <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-96 sm:rounded-[2rem]"
              />
            ))}
          </section>
        ) : filteredStores.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 text-center sm:mt-8 sm:rounded-[2.5rem] sm:p-8">
            <div className="text-5xl sm:text-6xl">🔎</div>

            <h2 className="mt-5 text-2xl font-black sm:text-4xl">
              Магазинів не знайдено
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-6 text-slate-400 sm:text-base sm:font-normal sm:leading-7">
              Спробуй змінити пошук або обрати іншу категорію.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
              {filteredStores.map((store) => (
                <MobileStoreTile key={store.id} store={store} />
              ))}
            </section>

            <section className="mt-8 hidden gap-5 sm:grid md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((store) => (
                <DesktopStoreCard key={store.id} store={store} />
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}