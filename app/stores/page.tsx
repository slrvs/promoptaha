"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
};

type CategoryJoin =
  | {
      id?: string | null;
      name?: string | null;
      slug?: string | null;
    }
  | {
      id?: string | null;
      name?: string | null;
      slug?: string | null;
    }[]
  | null
  | undefined;

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
  categories?: CategoryJoin;
};

type PromoCode = {
  id: string;
  store_id?: string | null;
  expires_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
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

function emptyStats(): StoreStats {
  return {
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    verifiedCodes: 0,
    worksCount: 0,
    notWorksCount: 0,
  };
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/[’'ʼ`]/g, "")
    .replace(/\s+/g, " ");
}

function splitSearchTokens(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function getCategory(categoryJoin: CategoryJoin) {
  if (!categoryJoin) return null;

  if (Array.isArray(categoryJoin)) {
    return categoryJoin[0] || null;
  }

  return categoryJoin;
}

function getCategoryNameFromJoin(categoryJoin: CategoryJoin) {
  const category = getCategory(categoryJoin);

  return category?.name || "Без категорії";
}

function getCategorySlugFromJoin(categoryJoin: CategoryJoin) {
  const category = getCategory(categoryJoin);

  return category?.slug || null;
}

function getHostName(url: string | null | undefined) {
  if (!url) return null;

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    return new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getStoreSearchHaystack(store: Store) {
  const categoryName = getCategoryNameFromJoin(store.categories);
  const categorySlug = getCategorySlugFromJoin(store.categories);
  const aliases = store.search_aliases || [];
  const host = getHostName(store.website_url);

  return normalizeSearchText(
    [
      store.name,
      store.slug,
      store.description || "",
      store.website_url || "",
      host || "",
      categoryName,
      categorySlug || "",
      ...aliases,
    ].join(" ")
  );
}

function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
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
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
      <p className={`text-3xl font-black ${valueClass}`}>{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function StoreCard({ store, stats }: { store: Store; stats: StoreStats }) {
  const aliases = store.search_aliases || [];
  const categoryName = getCategoryNameFromJoin(store.categories);

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20">
      <div className="flex items-start gap-4">
        <StoreLogo name={store.name} websiteUrl={store.website_url} size="md" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/stores/${store.slug}`}
            className="break-words text-2xl font-black text-white transition hover:text-emerald-300"
          >
            {store.name}
          </Link>

          <p className="mt-1 break-all text-sm font-bold text-slate-500">
            /stores/{store.slug}
          </p>

          {store.website_url && (
            <p className="mt-1 break-all text-sm font-bold text-slate-500">
              {getHostName(store.website_url)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
          {categoryName}
        </span>

        {stats.activeCodes > 0 ? (
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
            Є активні коди
          </span>
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
            Кодів поки немає
          </span>
        )}
      </div>

      <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
        {store.description ||
          "Магазин у базі ПромоПтахи. Тут можуть з’являтися промокоди, знижки та перевірені користувачами коди."}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {stats.totalCodes}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">кодів</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <p className="text-2xl font-black text-yellow-300">
            {stats.activeCodes}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">дійсних</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <p className="text-2xl font-black text-slate-200">
            {stats.verifiedCodes}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">перевіряли</p>
        </div>
      </div>

      {aliases.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold text-slate-500">Пошукові слова</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {aliases.slice(0, 6).map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300"
              >
                {alias}
              </span>
            ))}

            {aliases.length > 6 && (
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-500">
                +{aliases.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

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
  );
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("popular");

  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadCategories() {
    setIsLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
      setIsLoadingCategories(false);
      return;
    }

    setCategories((data || []) as unknown as Category[]);
    setIsLoadingCategories(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at, categories(id, name, slug)"
      )
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setStores([]);
      setErrorMessage(error.message);
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as unknown as Store[]);
    setIsLoadingStores(false);
  }

  async function loadPromos() {
    setIsLoadingPromos(true);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select(
        "id, store_id, expires_at, works_count, not_works_count, category_id, category_name, category_slug"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as unknown as PromoCode[]);
    setIsLoadingPromos(false);
  }

  useEffect(() => {
    loadCategories();
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

  const counts = useMemo(() => {
    return {
      all: stores.length,
      withCodes: stores.filter(
        (store) => (statsByStoreId[store.id]?.totalCodes || 0) > 0
      ).length,
      withActiveCodes: stores.filter(
        (store) => (statsByStoreId[store.id]?.activeCodes || 0) > 0
      ).length,
      noCategory: stores.filter((store) => !store.category_id).length,
    };
  }, [stores, statsByStoreId]);

  const categoryCounts = useMemo(() => {
    const result: Record<string, number> = {};

    for (const store of stores) {
      if (!store.category_id) continue;

      result[store.category_id] = (result[store.category_id] || 0) + 1;
    }

    return result;
  }, [stores]);

  const filteredStores = useMemo(() => {
    const searchTokens = splitSearchTokens(search);

    const filtered = stores.filter((store) => {
      const haystack = getStoreSearchHaystack(store);

      const matchesSearch =
        searchTokens.length === 0 ||
        searchTokens.every((token) => haystack.includes(token));

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && !store.category_id) ||
        store.category_id === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return filtered.sort((first, second) => {
      const firstStats = statsByStoreId[first.id] || emptyStats();
      const secondStats = statsByStoreId[second.id] || emptyStats();

      if (sortMode === "name") {
        return first.name.localeCompare(second.name, "uk");
      }

      if (sortMode === "newest") {
        const firstTime = first.created_at
          ? new Date(first.created_at).getTime()
          : 0;
        const secondTime = second.created_at
          ? new Date(second.created_at).getTime()
          : 0;

        return secondTime - firstTime;
      }

      if (sortMode === "active") {
        if (secondStats.activeCodes !== firstStats.activeCodes) {
          return secondStats.activeCodes - firstStats.activeCodes;
        }

        return secondStats.totalCodes - firstStats.totalCodes;
      }

      if (secondStats.totalCodes !== firstStats.totalCodes) {
        return secondStats.totalCodes - firstStats.totalCodes;
      }

      if (secondStats.activeCodes !== firstStats.activeCodes) {
        return secondStats.activeCodes - firstStats.activeCodes;
      }

      return first.name.localeCompare(second.name, "uk");
    });
  }, [stores, search, categoryFilter, sortMode, statsByStoreId]);

  const isLoading = isLoadingStores || isLoadingPromos || isLoadingCategories;

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

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Каталог магазинів
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Магазини
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Шукай магазин за назвою, категорією або скороченням. Наприклад:
                можна написати “Comfy”, “комфі”, “komfi” або “comfy.ua”.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/add"
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати код
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Запропонувати магазин
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <StatPill label="усі" value={counts.all} />
            <StatPill label="з кодами" value={counts.withCodes} tone="yellow" />
            <StatPill
              label="з дійсними"
              value={counts.withActiveCodes}
              tone="green"
            />
            <StatPill
              label="без категорії"
              value={counts.noCategory}
              tone="orange"
            />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: Comfy, комфі, komfi, rozetka, розетка, техніка..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі категорії</option>
              <option value="none">Без категорії</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {categoryCounts[category.id]
                    ? ` (${categoryCounts[category.id]})`
                    : ""}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="popular">Популярні</option>
              <option value="active">Найбільше дійсних кодів</option>
              <option value="name">За назвою</option>
              <option value="newest">Нові магазини</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                categoryFilter === "all"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Усі {counts.all}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter("none")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                categoryFilter === "none"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Без категорії {counts.noCategory}
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  categoryFilter === category.id
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                {category.name} {categoryCounts[category.id] || 0}
              </button>
            ))}
          </div>
        </section>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
            Помилка завантаження: {errorMessage}
          </div>
        )}

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
            <div className="text-5xl">🏪</div>

            <h2 className="mt-4 text-3xl font-black">
              Магазинів не знайдено
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Спробуй інший запит або категорію. Якщо магазину ще немає —
              запропонуй його.
            </p>

            <Link
              href="/request-store"
              className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Запропонувати магазин
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                stats={statsByStoreId[store.id] || emptyStats()}
              />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}