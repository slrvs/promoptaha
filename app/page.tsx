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

export default function HomePage() {
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
      .order("created_at", { ascending: false })
      .limit(12);

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
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                На крилах знижок 🐦
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
                Промокоди, які знаходять люди, а перевіряє спільнота.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                ПромоПтаха збирає промокоди з YouTube, Telegram, TikTok,
                Instagram, сайтів магазинів та інших джерел. Додавай код,
                перевіряй чужі та допомагай іншим економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Дивитись промокоди
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Статистика
              </p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-3xl font-black text-emerald-300">
                    {promoCodes.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    активних промокодів на головній
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-2xl font-black text-emerald-300">
                      👍 {totalWorks}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      підтверджень
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                    <p className="text-2xl font-black text-red-300">
                      👎 {totalNotWorks}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      скарг на роботу
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                  <p className="text-sm text-yellow-300">
                    Чим більше голосів і репортів, тим чистішою стає база
                    промокодів.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-2xl">🔎</p>
            <h2 className="mt-3 text-xl font-black">Знайшов код</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Побачив промокод у блогера, Telegram або на сайті магазину —
              додай його в базу.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-2xl">✅</p>
            <h2 className="mt-3 text-xl font-black">Перевірив</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Натисни “Працює” або “Не працює”, щоб інші бачили актуальність
              промокоду.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-2xl">🐦</p>
            <h2 className="mt-3 text-xl font-black">Допоміг іншим</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Чим більше людей додає і перевіряє коди, тим кориснішою стає
              ПромоПтаха.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Свіжі коди
              </p>

              <h2 className="text-3xl font-black tracking-tight">
                Останні активні промокоди
              </h2>

              <p className="mt-2 text-slate-400">
                Швидкий список останніх схвалених кодів.
              </p>
            </div>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Усі промокоди →
            </Link>
          </div>

          <div className="mt-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук на головній: магазин, код, опис..."
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
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
      </section>
    </main>
  );
}