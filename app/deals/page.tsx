"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import { normalizeUrl } from "@/lib/searchAliases";

type Deal = {
  id: string;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_website_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;
  title: string;
  slug: string;
  description?: string | null;
  deal_url?: string | null;
  image_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SortMode = "newest" | "ending" | "store";
type EndingFilter = "all" | "soon" | "noDate";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\s+/g, " ");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const end = new Date(date);
  const diff = end.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isEndingSoon(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) return false;

  return daysLeft >= 0 && daysLeft <= 7;
}

function getDealUrl(deal: Deal) {
  return normalizeUrl(deal.deal_url || deal.store_website_url || "") || "";
}

function dealMatchesSearch(deal: Deal, search: string) {
  const query = normalizeText(search);

  if (!query) return true;

  const haystack = normalizeText(
    [
      deal.title,
      deal.description || "",
      deal.store_name,
      deal.store_slug,
      deal.category_name || "",
      ...(deal.all_category_names || []),
      ...(deal.all_category_slugs || []),
    ].join(" ")
  );

  return haystack.includes(query);
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [endingFilter, setEndingFilter] = useState<EndingFilter>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const categories = useMemo(() => {
    const map = new Map<string, string>();

    deals.forEach((deal) => {
      if (deal.category_slug && deal.category_name) {
        map.set(deal.category_slug, deal.category_name);
      }

      deal.all_category_slugs?.forEach((slug, index) => {
        const name = deal.all_category_names?.[index];

        if (slug && name) {
          map.set(slug, name);
        }
      });
    });

    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }, [deals]);

  const stats = useMemo(() => {
    return {
      total: deals.length,
      endingSoon: deals.filter((deal) => isEndingSoon(deal.ends_at)).length,
      stores: new Set(deals.map((deal) => deal.store_id)).size,
      categories: categories.length,
    };
  }, [deals, categories.length]);

  const filteredDeals = useMemo(() => {
    const nextDeals = deals.filter((deal) => {
      if (!dealMatchesSearch(deal, search)) {
        return false;
      }

      if (categorySlug !== "all") {
        const slugs = [
          deal.category_slug,
          ...(deal.all_category_slugs || []),
        ].filter(Boolean);

        if (!slugs.includes(categorySlug)) {
          return false;
        }
      }

      if (endingFilter === "soon" && !isEndingSoon(deal.ends_at)) {
        return false;
      }

      if (endingFilter === "noDate" && deal.ends_at) {
        return false;
      }

      return true;
    });

    nextDeals.sort((firstDeal, secondDeal) => {
      if (sortMode === "store") {
        return firstDeal.store_name.localeCompare(secondDeal.store_name, "uk");
      }

      if (sortMode === "ending") {
        const firstDate = firstDeal.ends_at
          ? new Date(firstDeal.ends_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondDate = secondDeal.ends_at
          ? new Date(secondDeal.ends_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstDate - secondDate;
      }

      return (
        new Date(secondDeal.created_at || 0).getTime() -
        new Date(firstDeal.created_at || 0).getTime()
      );
    });

    return nextDeals;
  }, [deals, search, categorySlug, sortMode, endingFilter]);

  async function loadDeals() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_deal_public_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setDeals([]);
      setMessage(`Не вдалося завантажити акції: ${error.message}`);
    } else {
      setDeals((data || []) as unknown as Deal[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Акції</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Акції магазинів
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Знижки без промокоду
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут будуть актуальні акції магазинів, розпродажі, сезонні
                пропозиції та спецціни. Промокоди залишаються в окремому
                розділі, а тут — саме акційні пропозиції.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Промокоди
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
                <p className="text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активних акцій
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.endingSoon}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  скоро завершуються
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.stores}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.categories}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  категорій
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 font-bold text-red-300">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук акції, магазину або категорії..."
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі категорії</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={endingFilter}
              onChange={(event) =>
                setEndingFilter(event.target.value as EndingFilter)
              }
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі акції</option>
              <option value="soon">Скоро завершуються</option>
              <option value="noDate">Без дати завершення</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="ending">За датою завершення</option>
              <option value="store">За магазином</option>
            </select>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredDeals.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🛍️</div>

            <h2 className="mt-5 text-4xl font-black">Акцій поки немає</h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Ми вже підготували базу для акцій. Далі додамо адмінку для
              ручного додавання та імпорт із сайтів/джерел.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/codes"
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Дивитись промокоди
              </Link>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => {
              const daysLeft = getDaysLeft(deal.ends_at);
              const dealUrl = getDealUrl(deal);

              return (
                <article
                  key={deal.id}
                  className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20"
                >
                  {deal.image_url ? (
                    <div className="aspect-[16/9] overflow-hidden border-b border-slate-800 bg-slate-950">
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center border-b border-slate-800 bg-slate-950">
                      <StoreLogo
                        name={deal.store_name}
                        websiteUrl={deal.store_website_url}
                        size="lg"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-2">
                      {deal.category_name && (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                          {deal.category_name}
                        </span>
                      )}

                      {isEndingSoon(deal.ends_at) && (
                        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
                          Скоро завершується
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 line-clamp-3 text-2xl font-black text-white">
                      {deal.title}
                    </h2>

                    <Link
                      href={`/stores/${deal.store_slug}`}
                      className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400"
                    >
                      <StoreLogo
                        name={deal.store_name}
                        websiteUrl={deal.store_website_url}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-200">
                          {deal.store_name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          /stores/{deal.store_slug}
                        </p>
                      </div>
                    </Link>

                    {deal.description && (
                      <p className="mt-4 line-clamp-4 leading-7 text-slate-400">
                        {deal.description}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Діє до
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDate(deal.ends_at)}
                        </p>

                        {daysLeft !== null && daysLeft >= 0 && (
                          <p className="mt-1 text-sm font-bold text-slate-500">
                            Залишилось днів: {daysLeft}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      {dealUrl && (
                        <a
                          href={dealUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити акцію
                        </a>
                      )}

                      <Link
                        href={`/stores/${deal.store_slug}`}
                        className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Магазин
                      </Link>
                    </div>
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