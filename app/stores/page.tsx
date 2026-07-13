"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type PromoCodeStat = {
  id: string;
  store_slug?: string | null;
  status?: string | null;
};

type StoreWithCount = Store & {
  activeCodesCount: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function StoresPage() {
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadStores() {
    setIsLoading(true);
    setMessage("");

    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, name, slug, website_url, description, status, created_at")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storesError) {
      setStores([]);
      setMessage(`Помилка завантаження магазинів: ${storesError.message}`);
      setIsLoading(false);
      return;
    }

    const { data: promoData, error: promoError } = await supabase
      .from("promo_code_stats")
      .select("id, store_slug, status")
      .eq("status", "active");

    if (promoError) {
      setMessage(
        `Магазини завантажені, але кількість промокодів ні: ${promoError.message}`
      );
    }

    const codeCounts = new Map<string, number>();

    ((promoData as PromoCodeStat[]) || []).forEach((promo) => {
      if (!promo.store_slug) return;

      codeCounts.set(
        promo.store_slug,
        (codeCounts.get(promo.store_slug) || 0) + 1
      );
    });

    const storesWithCount: StoreWithCount[] = ((storesData as Store[]) || []).map(
      (store) => ({
        ...store,
        activeCodesCount: codeCounts.get(store.slug) || 0,
      })
    );

    setStores(storesWithCount);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return stores;

    return stores.filter((store) => {
      const name = store.name?.toLowerCase() || "";
      const slug = store.slug?.toLowerCase() || "";
      const description = store.description?.toLowerCase() || "";
      const website = store.website_url?.toLowerCase() || "";

      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query) ||
        website.includes(query)
      );
    });
  }, [stores, search]);

  const totalCodes = stores.reduce(
    (sum, store) => sum + store.activeCodesCount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Магазини з промокодами
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Обирай магазин і дивись активні промокоди, які вже додали
                користувачі ПромоПтахи.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Запропонувати магазин
              </Link>

              <Link
                href="/codes"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Усі промокоди
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-emerald-300">
                {stores.length}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                активних магазинів
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-emerald-300">
                {totalCodes}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                активних промокодів у магазинах
              </p>
            </div>

            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <p className="text-sm leading-6 text-yellow-300">
                Не знайшов потрібний магазин? Запропонуй його — після
                перевірки він зʼявиться в каталозі.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук магазину..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження магазинів...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              {stores.length === 0
                ? "Активних магазинів поки немає."
                : "За цим пошуком магазинів не знайдено."}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((store) => (
                <article
                  key={store.id}
                  className="flex min-h-[260px] flex-col rounded-3xl border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                        {store.activeCodesCount} активних кодів
                      </p>

                      <h2 className="mt-4 text-3xl font-black text-white">
                        {store.name}
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
                      {store.name.slice(0, 1).toUpperCase()}
                    </div>
                  </div>

                  {store.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                      {store.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Опис магазину поки не додано.
                    </p>
                  )}

                  <div className="mt-auto pt-5">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/stores/${store.slug}`}
                        className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        Відкрити магазин
                      </Link>

                      {store.website_url && (
                        <a
                          href={store.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Сайт →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}