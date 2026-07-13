"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PromoVote from "@/components/PromoVote";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type PromoCode = {
  id: string;
  code: string;
  normalized_code?: string | null;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_by?: string | null;
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

function formatDate(date: string | null | undefined) {
  if (!date) return "Без строку";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function sourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Не вказано";
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-7xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження магазину...
            </div>
          </section>
        </main>
      }
    >
      <StorePageContent />
    </Suspense>
  );
}

function StorePageContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [store, setStore] = useState<Store | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadStoreAndPromos() {
    setIsLoading(true);
    setMessage("");

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug, website_url, description, status, created_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (storeError || !storeData) {
      setStore(null);
      setPromoCodes([]);
      setMessage("Магазин не знайдено або він ще не активний.");
      setIsLoading(false);
      return;
    }

    const { data: promoData, error: promoError } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("store_slug", slug)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (promoError) {
      setStore(storeData as Store);
      setPromoCodes([]);
      setMessage(`Магазин знайдено, але промокоди не завантажились: ${promoError.message}`);
      setIsLoading(false);
      return;
    }

    setStore(storeData as Store);
    setPromoCodes((promoData as PromoCode[]) || []);
    setIsLoading(false);
  }

  useEffect(() => {
    if (slug) {
      loadStoreAndPromos();
    }
  }, [slug]);

  const filteredPromoCodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return promoCodes;

    return promoCodes.filter((promo) => {
      const code = promo.code?.toLowerCase() || "";
      const discount = promo.discount_value?.toLowerCase() || "";
      const description = promo.description?.toLowerCase() || "";
      const source = promo.source_type?.toLowerCase() || "";

      return (
        code.includes(query) ||
        discount.includes(query) ||
        description.includes(query) ||
        source.includes(query)
      );
    });
  }, [promoCodes, search]);

  const totalWorks = promoCodes.reduce(
    (sum, promo) => sum + (promo.works_count || 0),
    0
  );

  const totalNotWorks = promoCodes.reduce(
    (sum, promo) => sum + (promo.not_works_count || 0),
    0
  );

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode("");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження магазину...
          </div>
        ) : !store ? (
          <section className="rounded-[2rem] border border-red-400/30 bg-red-400/10 p-6 text-red-300">
            <h1 className="text-3xl font-black">Магазин не знайдено</h1>

            <p className="mt-3 text-red-200">
              {message || "Такого магазину немає або він ще не активний."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/stores"
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                До магазинів
              </Link>

              <Link
                href="/request-store"
                className="rounded-2xl border border-red-300/30 px-5 py-3 font-black text-red-100 transition hover:border-red-100"
              >
                Запропонувати магазин
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                    Магазин
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400 text-3xl font-black text-slate-950">
                      {store.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <h1 className="text-5xl font-black tracking-tight">
                        {store.name}
                      </h1>

                      <p className="mt-2 text-slate-500">/{store.slug}</p>
                    </div>
                  </div>

                  {store.description ? (
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                      {store.description}
                    </p>
                  ) : (
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-500">
                      Опис магазину поки не додано.
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/stores"
                      className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Усі магазини
                    </Link>

                    <Link
                      href="/codes"
                      className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Усі промокоди
                    </Link>

                    {store.website_url && (
                      <a
                        href={store.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        Сайт магазину →
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[440px]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-3xl font-black text-emerald-300">
                      {promoCodes.length}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      активних кодів
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                    <p className="text-3xl font-black text-emerald-300">
                      👍 {totalWorks}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      підтверджень
                    </p>
                  </div>

                  <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
                    <p className="text-3xl font-black text-red-300">
                      👎 {totalNotWorks}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      проблем
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                    Промокоди магазину
                  </p>

                  <h2 className="text-3xl font-black tracking-tight">
                    Активні коди {store.name}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    Копіюй код, перевіряй роботу і залишай голос.
                  </p>
                </div>

                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати код
                </Link>
              </div>

              <div className="mt-6">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Пошук промокоду ${store.name}...`}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                  {message}
                </div>
              )}

              {filteredPromoCodes.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                  {promoCodes.length === 0
                    ? "У цього магазину поки немає активних промокодів."
                    : "За цим пошуком промокодів не знайдено."}
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {filteredPromoCodes.map((promo) => (
                    <article
                      key={promo.id}
                      className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">
                            {store.name}
                          </p>

                          <p className="mt-1 text-3xl font-black tracking-tight text-emerald-300">
                            {promo.code}
                          </p>

                          {promo.discount_value && (
                            <p className="mt-2 text-slate-300">
                              Знижка: {promo.discount_value}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => copyCode(promo.code)}
                          className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          {copiedCode === promo.code
                            ? "Скопійовано"
                            : "Скопіювати"}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                        <div>
                          <p className="text-slate-600">Діє до</p>
                          <p className="text-slate-300">
                            {formatDate(promo.expires_at)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600">Джерело</p>
                          <p className="text-slate-300">
                            {sourceLabel(promo.source_type)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600">Перевірки</p>
                          <p className="text-slate-300">
                            👍 {promo.works_count ?? 0} / 👎{" "}
                            {promo.not_works_count ?? 0}
                          </p>
                        </div>
                      </div>

                      {promo.description && (
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                          {promo.description}
                        </p>
                      )}

                      <PromoVote
                        promoId={promo.id}
                        initialWorksCount={promo.works_count}
                        initialNotWorksCount={promo.not_works_count}
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/codes/${promo.id}`}
                          className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Детальніше
                        </Link>

                        {promo.source_url && (
                          <a
                            href={promo.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Джерело →
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}