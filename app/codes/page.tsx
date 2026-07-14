"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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
  store_id?: string | null;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/[’'ʼ`]/g, "")
    .replace(/\s+/g, " ");
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/[^a-z0-9а-яіїєеґг]/gi, "");
}

function splitSearchTokens(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function isExpiringSoon(date: string | null | undefined) {
  if (!date) return false;
  if (isExpired(date)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  const diffMs = expires.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= 7;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getSourceTypeLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Джерело";
}

function getPromoStatusLabel(promo: PromoCode) {
  if (isExpired(promo.expires_at)) return "Прострочений";
  if (isExpiringSoon(promo.expires_at)) return "Скоро завершиться";
  if (promo.expires_at) return "Дійсний";

  return "Без терміну";
}

function getPromoStatusClass(promo: PromoCode) {
  if (isExpired(promo.expires_at)) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (isExpiringSoon(promo.expires_at)) {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  if (promo.expires_at) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getPromoSearchHaystack(promo: PromoCode) {
  const aliases = promo.search_aliases || [];
  const storeAliases = promo.store_search_aliases || [];

  return normalizeSearchText(
    [
      promo.code,
      promo.normalized_code || "",
      promo.store_name || "",
      promo.store_slug || "",
      promo.category_name || "",
      promo.category_slug || "",
      promo.discount_value || "",
      promo.description || "",
      promo.source_type || "",
      promo.source_url || "",
      ...aliases,
      ...storeAliases,
    ].join(" ")
  );
}

function getPromoCompactHaystack(promo: PromoCode) {
  return compactSearchText(getPromoSearchHaystack(promo));
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

function PromoCard({
  promo,
  copiedId,
  onCopyCode,
  onCopyLink,
}: {
  promo: PromoCode;
  copiedId: string;
  onCopyCode: (promo: PromoCode) => void;
  onCopyLink: (promo: PromoCode) => void;
}) {
  const promoUrl = `/codes/${promo.slug || promo.id}`;
  const works = promo.works_count || 0;
  const notWorks = promo.not_works_count || 0;
  const totalVotes = works + notWorks;
  const aliases = promo.search_aliases || [];
  const storeAliases = promo.store_search_aliases || [];

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={promoUrl}
            className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
          >
            {promo.code}
          </Link>

          {promo.store_slug ? (
            <Link
              href={`/stores/${promo.store_slug}`}
              className="mt-2 block text-sm font-bold text-slate-500 transition hover:text-emerald-300"
            >
              {promo.store_name || "Магазин"}
            </Link>
          ) : (
            <p className="mt-2 text-sm font-bold text-slate-500">
              {promo.store_name || "Магазин"}
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
            promo
          )}`}
        >
          {getPromoStatusLabel(promo)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
          {promo.category_name || "Без категорії"}
        </span>

        {totalVotes > 0 ? (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
            {totalVotes} перевірок
          </span>
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-500">
            Ще не перевіряли
          </span>
        )}

        {promo.source_type && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
            {getSourceTypeLabel(promo.source_type)}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold text-slate-500">Умова</p>
          <p className="mt-1 line-clamp-1 font-black text-emerald-300">
            {promo.discount_value || "Не вказано"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold text-slate-500">Діє до</p>
          <p className="mt-1 font-black text-slate-200">
            {formatDate(promo.expires_at)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold text-slate-500">Голоси</p>
          <p className="mt-1 font-black text-slate-200">
            ✅ {works} / ❌ {notWorks}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
        {promo.description ||
          "Промокод доданий спільнотою ПромоПтахи. Перевір його умови, термін дії та голоси користувачів."}
      </p>

      {(aliases.length > 0 || storeAliases.length > 0) && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold text-slate-500">Пошук також знаходить</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {[...aliases, ...storeAliases].slice(0, 8).map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300"
              >
                {alias}
              </span>
            ))}

            {[...aliases, ...storeAliases].length > 8 && (
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-500">
                +{[...aliases, ...storeAliases].length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onCopyCode(promo)}
          className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
        >
          {copiedId === `code-${promo.id}` ? "Скопійовано" : "Копіювати код"}
        </button>

        <Link
          href={promoUrl}
          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          Деталі
        </Link>

        <button
          type="button"
          onClick={() => onCopyLink(promo)}
          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          {copiedId === `link-${promo.id}` ? "Лінк є" : "Лінк"}
        </button>
      </div>
    </article>
  );
}

export default function CodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");

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

  async function loadPromos() {
    setIsLoadingPromos(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      setErrorMessage(error.message);
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

  async function copyCode(promo: PromoCode) {
    await navigator.clipboard.writeText(promo.code);
    setCopiedId(`code-${promo.id}`);

    setTimeout(() => {
      setCopiedId("");
    }, 1600);
  }

  async function copyLink(promo: PromoCode) {
    const url = `${window.location.origin}/codes/${promo.slug || promo.id}`;

    await navigator.clipboard.writeText(url);
    setCopiedId(`link-${promo.id}`);

    setTimeout(() => {
      setCopiedId("");
    }, 1600);
  }

  const counts = useMemo(() => {
    return {
      all: promos.length,
      valid: promos.filter((promo) => !isExpired(promo.expires_at)).length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      verified: promos.filter(
        (promo) => (promo.works_count || 0) + (promo.not_works_count || 0) > 0
      ).length,
      noCategory: promos.filter((promo) => !promo.category_id).length,
    };
  }, [promos]);

  const categoryCounts = useMemo(() => {
    const result: Record<string, number> = {};

    for (const promo of promos) {
      if (!promo.category_id) continue;

      result[promo.category_id] = (result[promo.category_id] || 0) + 1;
    }

    return result;
  }, [promos]);

  const filteredPromos = useMemo(() => {
    const searchTokens = splitSearchTokens(search);

    const filtered = promos.filter((promo) => {
      const haystack = getPromoSearchHaystack(promo);
      const compactHaystack = getPromoCompactHaystack(promo);

      const matchesSearch =
        searchTokens.length === 0 ||
        searchTokens.every((token) => {
          const compactToken = compactSearchText(token);

          return (
            haystack.includes(token) ||
            Boolean(compactToken && compactHaystack.includes(compactToken))
          );
        });

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && !promo.category_id) ||
        promo.category_id === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && !isExpired(promo.expires_at)) ||
        (statusFilter === "expired" && isExpired(promo.expires_at)) ||
        (statusFilter === "no-date" && !promo.expires_at) ||
        (statusFilter === "verified" &&
          (promo.works_count || 0) + (promo.not_works_count || 0) > 0);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered.sort((first, second) => {
      const firstVotes = (first.works_count || 0) + (first.not_works_count || 0);
      const secondVotes =
        (second.works_count || 0) + (second.not_works_count || 0);

      if (sortMode === "verified") {
        if (secondVotes !== firstVotes) {
          return secondVotes - firstVotes;
        }

        return (second.works_count || 0) - (first.works_count || 0);
      }

      if (sortMode === "works") {
        if ((second.works_count || 0) !== (first.works_count || 0)) {
          return (second.works_count || 0) - (first.works_count || 0);
        }

        return secondVotes - firstVotes;
      }

      if (sortMode === "expires") {
        const firstTime = first.expires_at
          ? new Date(first.expires_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondTime = second.expires_at
          ? new Date(second.expires_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstTime - secondTime;
      }

      if (sortMode === "store") {
        return (first.store_name || "").localeCompare(
          second.store_name || "",
          "uk"
        );
      }

      const firstTime = first.created_at
        ? new Date(first.created_at).getTime()
        : 0;

      const secondTime = second.created_at
        ? new Date(second.created_at).getTime()
        : 0;

      return secondTime - firstTime;
    });
  }, [promos, search, categoryFilter, statusFilter, sortMode]);

  const isLoading = isLoadingPromos || isLoadingCategories;

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

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                База промокодів
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Промокоди
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Шукай код за магазином, категорією, джерелом або скороченням.
                Наприклад: “Comfy”, “комфі”, “komfi”, “техніка” або “догляд”.
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
                href="/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-5">
            <StatPill label="усі" value={counts.all} />
            <StatPill label="дійсні" value={counts.valid} tone="green" />
            <StatPill label="прострочені" value={counts.expired} tone="red" />
            <StatPill label="перевіряли" value={counts.verified} tone="yellow" />
            <StatPill
              label="без категорії"
              value={counts.noCategory}
              tone="orange"
            />
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: Comfy, комфі, komfi, rozetka, розетка, догляд..."
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
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі коди</option>
              <option value="valid">Дійсні</option>
              <option value="expired">Прострочені</option>
              <option value="no-date">Без терміну</option>
              <option value="verified">Перевірені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Нові спочатку</option>
              <option value="verified">Найбільше перевірок</option>
              <option value="works">Найбільше “працює”</option>
              <option value="expires">Найшвидше завершуються</option>
              <option value="store">За магазином</option>
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
          <section className="mt-8 grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredPromos.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-5xl">🎟️</div>

            <h2 className="mt-4 text-3xl font-black">
              Промокодів не знайдено
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Спробуй інший запит, категорію або статус. Якщо маєш промокод —
              додай його в базу.
            </p>

            <Link
              href="/add"
              className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати промокод
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 xl:grid-cols-2">
            {filteredPromos.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                copiedId={copiedId}
                onCopyCode={copyCode}
                onCopyLink={copyLink}
              />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}