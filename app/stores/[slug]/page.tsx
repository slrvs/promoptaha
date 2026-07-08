"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  code: string;
  description: string | null;
  discount_value: string | null;
  expires_at: string | null;
  status: string;
  source_type: string | null;
  store_name: string;
  store_slug: string;
  works_count: number;
  not_works_count: number;
  total_votes: number;
  success_rate: number | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function sourceLabel(source: string | null) {
  const labels: Record<string, string> = {
    youtube: "YouTube",
    telegram: "Telegram",
    tiktok: "TikTok",
    instagram: "Instagram",
    email: "Email",
    store_site: "Сайт магазину",
    other: "Інше",
  };

  if (!source) return "Невідомо";
  return labels[source] ?? source;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Очікує перевірки",
    active: "Активний",
    needs_review: "Потребує перевірки",
    expired: "Прострочений",
    rejected: "Відхилений",
    duplicate: "Дублікат",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "active") {
    return "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300";
  }

  if (status === "needs_review") {
    return "rounded-full bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300";
  }

  if (status === "expired") {
    return "rounded-full bg-red-400/10 px-3 py-1 text-xs text-red-300";
  }

  return "rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300";
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode(null);
    }, 1500);
  }

  useEffect(() => {
    async function loadStorePage() {
      if (!slug) return;

      setIsLoading(true);

      const [storeResult, promoResult] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name, slug, website_url, status")
          .eq("slug", slug)
          .maybeSingle(),

        supabase
          .from("promo_code_stats")
          .select("*")
          .eq("store_slug", slug)
          .order("created_at", { ascending: false }),
      ]);

      setStore((storeResult.data as Store) || null);
      setPromoCodes((promoResult.data as PromoCode[]) || []);
      setIsLoading(false);
    }

    loadStorePage();
  }, [slug]);

  const activeCodesCount = promoCodes.filter(
    (promo) => promo.status === "active"
  ).length;

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
              href="/stores"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Магазини
            </Link>

            <Link
              href="/add"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Додати
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження магазину...
          </div>
        ) : !store ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Магазин не знайдено.
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Магазин
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                {store.name}
              </h1>

              {store.website_url && (
                <a
                  href={store.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-emerald-300 hover:text-emerald-200"
                >
                  Перейти на сайт магазину →
                </a>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">Всього промокодів</p>
                  <p className="mt-1 text-3xl font-black">{promoCodes.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">Активних</p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">
                    {activeCodesCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-500">Статус магазину</p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">
                    {store.status}
                  </p>
                </div>
              </div>
            </section>

            {promoCodes.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                Для цього магазину ще немає промокодів.
              </div>
            ) : (
              <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {promoCodes.map((promo) => (
                  <article
                    key={promo.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-black tracking-wide">
                          {promo.code}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {sourceLabel(promo.source_type)}
                        </p>
                      </div>

                      <span className={statusClass(promo.status)}>
                        {statusLabel(promo.status)}
                      </span>
                    </div>

                    {promo.description && (
                      <p className="mt-4 text-sm leading-6 text-slate-300">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Працює</p>
                        <p className="font-bold text-emerald-300">
                          {promo.success_rate
                            ? `${promo.success_rate}%`
                            : "Новий"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Діє до</p>
                        <p className="font-bold">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Голоси</p>
                        <p className="font-bold">
                          {promo.works_count} 👍 / {promo.not_works_count} 👎
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => copyCode(promo.code)}
                      className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
                    >
                      {copiedCode === promo.code
                        ? "Скопійовано!"
                        : "Скопіювати промокод"}
                    </button>
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