"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PromoVote from "@/components/PromoVote";
import PromoReportButton from "@/components/PromoReportButton";

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

export default function PromoCodePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-4xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження промокоду...
            </div>
          </section>
        </main>
      }
    >
      <PromoCodePageContent />
    </Suspense>
  );
}

function PromoCodePageContent() {
  const params = useParams<{ id: string }>();
  const promoId = params.id;

  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadPromo() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("id", promoId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      setPromo(null);
      setMessage("Промокод не знайдено або він ще не схвалений.");
      setIsLoading(false);
      return;
    }

    setPromo(data as PromoCode);
    setIsLoading(false);
  }

  useEffect(() => {
    if (promoId) {
      loadPromo();
    }
  }, [promoId]);

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode("");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-4xl">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження...
          </div>
        ) : !promo ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
            {message || "Промокод не знайдено."}

            <div className="mt-5">
              <Link
                href="/codes"
                className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                До всіх промокодів
              </Link>
            </div>
          </div>
        ) : (
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                  Промокод
                </p>

                <h1 className="text-5xl font-black tracking-tight text-emerald-300">
                  {promo.code}
                </h1>

                <p className="mt-3 text-slate-400">
                  {promo.store_name || "Магазин"}{" "}
                  {promo.discount_value && `• ${promo.discount_value}`}
                </p>
              </div>

              <button
                onClick={() => copyCode(promo.code)}
                className="rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                {copiedCode === promo.code ? "Скопійовано" : "Скопіювати код"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-600">Магазин</p>

                {promo.store_slug ? (
                  <Link
                    href={`/stores/${promo.store_slug}`}
                    className="mt-1 inline-flex font-bold text-emerald-300 hover:text-emerald-200"
                  >
                    {promo.store_name || "Відкрити магазин"} →
                  </Link>
                ) : (
                  <p className="mt-1 text-slate-300">
                    {promo.store_name || "Не вказано"}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-600">Діє до</p>
                <p className="mt-1 text-slate-300">
                  {formatDate(promo.expires_at)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-600">Джерело</p>
                <p className="mt-1 text-slate-300">
                  {sourceLabel(promo.source_type)}
                </p>
              </div>
            </div>

            {promo.description && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-600">Коментар</p>
                <p className="mt-2 text-slate-300">{promo.description}</p>
              </div>
            )}

            {promo.source_url && (
              <a
                href={promo.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Відкрити джерело →
              </a>
            )}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="mb-3 text-sm font-bold text-slate-300">
                Чи працює цей промокод?
              </p>

              <PromoVote
                promoId={promo.id}
                initialWorksCount={promo.works_count}
                initialNotWorksCount={promo.not_works_count}
              />
            </div>

            <PromoReportButton promoId={promo.id} />

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Усі промокоди
              </Link>

              {promo.store_slug && (
                <Link
                  href={`/stores/${promo.store_slug}`}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Інші коди магазину
                </Link>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}