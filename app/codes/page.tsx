"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

export default function CodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  async function loadPromoCodes() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setPromoCodes(data as PromoCode[]);
    }

    setIsLoading(false);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode(null);
    }, 1500);
  }

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredPromoCodes = promoCodes.filter((promo) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        promo.code,
        promo.store_name,
        promo.store_slug,
        promo.description ?? "",
        promo.discount_value ?? "",
        sourceLabel(promo.source_type),
        statusLabel(promo.status),
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

    const matchesStatus =
      statusFilter === "all" || promo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

          <Link
            href="/add"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Додати промокод
          </Link>
        </header>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Всі промокоди
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Шукай знижку швидко
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Тут зібрані всі промокоди з бази. Можна шукати за кодом, магазином,
            джерелом або статусом.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Наприклад KRKR, LEVY15, YouTube..."
              className="min-h-12 rounded-2xl border border-slate-800 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-12 rounded-2xl border border-slate-800 bg-slate-950 px-4 text-white outline-none focus:border-emerald-400"
            >
              <option value="all">Всі статуси</option>
              <option value="active">Активні</option>
              <option value="pending">Очікують перевірки</option>
              <option value="needs_review">Потребують перевірки</option>
              <option value="expired">Прострочені</option>
            </select>
          </div>

          <div className="mt-5 text-sm text-slate-400">
            Знайдено:{" "}
            <span className="font-bold text-emerald-300">
              {filteredPromoCodes.length}
            </span>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження промокодів...
          </div>
        ) : filteredPromoCodes.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Нічого не знайдено. Спробуй інший запит.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromoCodes.map((promo) => (
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
                      {promo.store_name} · {sourceLabel(promo.source_type)}
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
                      {promo.success_rate ? `${promo.success_rate}%` : "Новий"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Діє до</p>
                    <p className="font-bold">{formatDate(promo.expires_at)}</p>
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
      </section>
    </main>
  );
}