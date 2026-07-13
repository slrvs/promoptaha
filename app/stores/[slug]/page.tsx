"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
};

type PromoCode = {
  id: string;
  code: string;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
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

  return "Джерело";
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-6xl">
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
  const [copiedCode, setCopiedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadStorePage() {
    setIsLoading(true);
    setMessage("");

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (storeError || !storeData) {
      setStore(null);
      setPromoCodes([]);
      setMessage("Магазин не знайдено");
      setIsLoading(false);
      return;
    }

    setStore(storeData as Store);

    const { data: codesData, error: codesError } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("store_slug", slug)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (codesError) {
      setPromoCodes([]);
      setMessage(`Помилка завантаження промокодів: ${codesError.message}`);
    } else {
      setPromoCodes((codesData as PromoCode[]) || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (slug) {
      loadStorePage();
    }
  }, [slug]);

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode("");
    }, 1500);
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

          <div className="flex items-center gap-3">
            <Link
              href="/stores"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Магазини
            </Link>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Усі коди
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження...
          </div>
        ) : !store ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
            {message || "Магазин не знайдено"}
          </div>
        ) : (
          <>
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Магазин
              </p>

              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">
                    {store.name}
                  </h1>

                  {store.description && (
                    <p className="mt-3 max-w-2xl text-slate-400">
                      {store.description}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-slate-500">
                    Активних промокодів:{" "}
                    <span className="font-bold text-emerald-300">
                      {promoCodes.length}
                    </span>
                  </p>
                </div>

                {store.website_url && (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Відкрити сайт
                  </a>
                )}
              </div>
            </section>

            {message && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                {message}
              </div>
            )}

            {promoCodes.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                Для цього магазину поки немає схвалених промокодів.
              </div>
            ) : (
              <section className="mt-6 grid gap-4">
                {promoCodes.map((promo) => (
                  <article
                    key={promo.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"
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
                      <p className="mt-4 text-sm text-slate-400">
                        {promo.description}
                      </p>
                    )}

                    {promo.source_url && (
                      <a
                        href={promo.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex text-sm font-bold text-emerald-300 hover:text-emerald-200"
                      >
                        Відкрити джерело →
                      </a>
                    )}
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}