"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  status: string;
};

type PromoCode = {
  id: string;
  store_name: string;
  store_slug: string;
  status: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const [storesResult, promoResult] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name, slug, website_url, status")
          .eq("status", "active")
          .order("name", { ascending: true }),

        supabase
          .from("promo_code_stats")
          .select("id, store_name, store_slug, status")
          .limit(1000),
      ]);

      if (storesResult.data) {
        setStores(storesResult.data as Store[]);
      }

      if (promoResult.data) {
        setPromoCodes(promoResult.data as PromoCode[]);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredStores = stores.filter((store) => {
    if (!normalizedSearch) return true;

    return [store.name, store.slug, store.website_url ?? ""].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    );
  });

  function getStorePromoCount(slug: string) {
    return promoCodes.filter((promo) => promo.store_slug === slug).length;
  }

  function getStoreActivePromoCount(slug: string) {
    return promoCodes.filter(
      (promo) => promo.store_slug === slug && promo.status === "active"
    ).length;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl">
              🐦
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight">ПромоПтаха</p>
              <p className="text-sm text-slate-400">На крилах знижок</p>
            </div>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Всі промокоди
            </Link>

            <Link
              href="/add"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Додати
            </Link>
          </div>
        </header>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Магазини
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Обери магазин
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Тут будуть усі магазини, для яких користувачі додали промокоди.
          </p>

          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Пошук магазину..."
            className="mt-6 min-h-12 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
          />

          <div className="mt-5 text-sm text-slate-400">
            Знайдено магазинів:{" "}
            <span className="font-bold text-emerald-300">
              {filteredStores.length}
            </span>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження магазинів...
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Нічого не знайдено.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.slug}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-emerald-400 hover:bg-slate-900/80"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                    🏪
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    active
                  </span>
                </div>

                <h2 className="text-2xl font-black">{store.name}</h2>

                {store.website_url && (
                  <p className="mt-2 truncate text-sm text-slate-400">
                    {store.website_url}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-950 p-4">
                    <p className="text-slate-500">Всього кодів</p>
                    <p className="text-xl font-black text-white">
                      {getStorePromoCount(store.slug)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-4">
                    <p className="text-slate-500">Активних</p>
                    <p className="text-xl font-black text-emerald-300">
                      {getStoreActivePromoCount(store.slug)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}