"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PromoVote from "@/components/PromoVote";

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

export default function CodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadPromoCodes() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Помилка завантаження: ${error.message}`);
      setPromoCodes([]);
      setIsLoading(false);
      return;
    }

    setPromoCodes((data as PromoCode[]) || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const filteredPromoCodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return promoCodes;

    return promoCodes.filter((promo) => {
      const code = promo.code?.toLowerCase() || "";
      const store = promo.store_name?.toLowerCase() || "";
      const discount = promo.discount_value?.toLowerCase() || "";
      const description = promo.description?.toLowerCase() || "";

      return (
        code.includes(query) ||
        store.includes(query) ||
        discount.includes(query) ||
        description.includes(query)
      );
    });
  }, [promoCodes, search]);

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
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Усі промокоди
              </p>

              <h1 className="text-4xl font-black tracking-tight">
                Активні промокоди
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Тут показуються тільки схвалені промокоди, які вже пройшли
                перевірку.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати промокод
            </Link>
          </div>

          <div className="mt-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук за кодом, магазином або описом..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження промокодів...
            </div>
          ) : filteredPromoCodes.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              {promoCodes.length === 0
                ? "Активних промокодів поки немає."
                : "За цим пошуком нічого не знайдено."}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredPromoCodes.map((promo) => (
                <article
                  key={promo.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">
                        {promo.store_slug ? (
                          <Link
                            href={`/stores/${promo.store_slug}`}
                            className="hover:text-emerald-300"
                          >
                            {promo.store_name || "Магазин"}
                          </Link>
                        ) : (
                          promo.store_name || "Магазин"
                        )}
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

                  <PromoVote
                    promoId={promo.id}
                    initialWorksCount={promo.works_count}
                    initialNotWorksCount={promo.not_works_count}
                  />

                  <Link
                    href={`/codes/${promo.id}`}
                    className="mt-4 inline-flex rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Детальніше
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}