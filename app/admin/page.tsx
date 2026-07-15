"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import { matchesSearch } from "@/lib/searchAliases";

type PromoStatus = "pending" | "approved" | "rejected";
type StatusFilter = "all" | PromoStatus;
type SortMode = "newest" | "oldest" | "works" | "reports";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;

  store_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  store_search_aliases?: string[] | null;

  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;

  all_category_ids?: string[] | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;

  search_aliases?: string[] | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toArray(value: string[] | null | undefined) {
  if (!value) return [];

  return Array.isArray(value) ? value : [];
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function isVerified(promo: PromoCode) {
  const works = toNumber(promo.works_count);
  const notWorks = toNumber(promo.not_works_count);

  return works > 0 && works > notWorks;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Не вказано";
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "Очікує";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

function getPromoCategoryNames(promo: PromoCode) {
  const names = toArray(promo.all_category_names);

  if (names.length > 0) {
    return names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPromoId, setProcessingPromoId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadPromos() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count"
      )
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${error.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    setPromos((data || []) as unknown as PromoCode[]);
    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser?.email === ADMIN_EMAIL) {
        await loadPromos();
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const counts = useMemo(() => {
    return {
      all: promos.length,
      pending: promos.filter((promo) => promo.status === "pending").length,
      approved: promos.filter((promo) => promo.status === "approved").length,
      rejected: promos.filter((promo) => promo.status === "rejected").length,
      expired: promos.filter((promo) => isExpired(promo.expires_at)).length,
      verified: promos.filter((promo) => isVerified(promo)).length,
    };
  }, [promos]);

  const filteredPromos = useMemo(() => {
    const filtered = promos.filter((promo) => {
      const categoryNames = getPromoCategoryNames(promo);

      const matchesStatus =
        statusFilter === "all" || promo.status === statusFilter;

      const matchesSearchQuery = matchesSearch(
        [
          promo.code,
          promo.normalized_code || "",
          promo.store_name || "",
          promo.store_slug || "",
          promo.discount_value || "",
          promo.description || "",
          promo.source_type || "",
          promo.category_name || "",
          promo.category_slug || "",
          toArray(promo.all_category_names).join(" "),
          toArray(promo.all_category_slugs).join(" "),
          categoryNames.join(" "),
          toArray(promo.search_aliases).join(" "),
          toArray(promo.store_search_aliases).join(" "),
        ],
        search
      );

      return matchesStatus && matchesSearchQuery;
    });

    return [...filtered].sort((firstPromo, secondPromo) => {
      if (sortMode === "oldest") {
        return (
          new Date(firstPromo.created_at || 0).getTime() -
          new Date(secondPromo.created_at || 0).getTime()
        );
      }

      if (sortMode === "works") {
        return (
          toNumber(secondPromo.works_count) - toNumber(firstPromo.works_count) ||
          new Date(secondPromo.created_at || 0).getTime() -
            new Date(firstPromo.created_at || 0).getTime()
        );
      }

      if (sortMode === "reports") {
        return (
          toNumber(secondPromo.not_works_count) -
            toNumber(firstPromo.not_works_count) ||
          new Date(secondPromo.created_at || 0).getTime() -
            new Date(firstPromo.created_at || 0).getTime()
        );
      }

      return (
        new Date(secondPromo.created_at || 0).getTime() -
        new Date(firstPromo.created_at || 0).getTime()
      );
    });
  }, [promos, search, statusFilter, sortMode]);

  async function updatePromoStatus(promo: PromoCode, nextStatus: PromoStatus) {
    setProcessingPromoId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({
        status: nextStatus,
      })
      .eq("id", promo.id);

    if (error) {
      setMessage(`Не вдалося оновити статус: ${error.message}`);
      setMessageType("error");
      setProcessingPromoId(null);
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.map((currentPromo) =>
        currentPromo.id === promo.id
          ? {
              ...currentPromo,
              status: nextStatus,
            }
          : currentPromo
      )
    );

    setMessage(`Статус промокоду ${promo.code} змінено на “${getStatusLabel(nextStatus)}”.`);
    setMessageType("success");
    setProcessingPromoId(null);

    await loadPromos();
  }

  if (isCheckingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[420px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="text-6xl">🔒</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Немає доступу
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              На головну
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/admin/stats" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Модерація промокодів</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Модерація
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Промокоди
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна схвалювати, відхиляти або повертати промокоди на
                повторну перевірку. Дані читаються через{" "}
                <span className="font-black text-emerald-300">
                  promo_code_category_stats
                </span>
                .
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/stats"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Аналітика
                </Link>

                <Link
                  href="/admin/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Магазини
                </Link>

                <Link
                  href="/admin/reports"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Репорти
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {formatNumber(counts.pending)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  очікують
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {formatNumber(counts.approved)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {formatNumber(counts.rejected)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {formatNumber(counts.all)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  всього
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : messageType === "error"
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: код, магазин, категорія, опис..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="pending">Очікують</option>
              <option value="approved">Схвалені</option>
              <option value="rejected">Відхилені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
              <option value="works">Більше “працює”</option>
              <option value="reports">Більше “не працює”</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "all"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Усі · {formatNumber(counts.all)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "pending"
                  ? "border-yellow-400 bg-yellow-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-yellow-400 hover:text-yellow-300"
              }`}
            >
              Очікують · {formatNumber(counts.pending)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("approved")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "approved"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Схвалені · {formatNumber(counts.approved)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "rejected"
                  ? "border-red-400 bg-red-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
              }`}
            >
              Відхилені · {formatNumber(counts.rejected)}
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredPromos.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🎟️</div>

            <h2 className="mt-5 text-4xl font-black">
              Промокодів не знайдено
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Немає промокодів під обраний статус або пошуковий запит.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredPromos.map((promo) => {
              const categoryNames = getPromoCategoryNames(promo);
              const isProcessing = processingPromoId === promo.id;

              return (
                <article
                  key={promo.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-start gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            promo.status
                          )}`}
                        >
                          {getStatusLabel(promo.status)}
                        </span>

                        {isExpired(promo.expires_at) && (
                          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                            Прострочений
                          </span>
                        )}

                        {isVerified(promo) && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                            Перевірений
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 break-all text-4xl font-black text-white">
                        {promo.code}
                      </h2>

                      <p className="mt-2 text-xl font-black text-emerald-300">
                        {promo.discount_value || "Знижка"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {promo.store_name || "Магазин"}
                        </span>

                        {categoryNames.length === 0 ? (
                          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-500">
                            Без категорії
                          </span>
                        ) : (
                          categoryNames.map((categoryName) => (
                            <span
                              key={categoryName}
                              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                            >
                              {categoryName}
                            </span>
                          ))
                        )}

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {getSourceLabel(promo.source_type)}
                        </span>
                      </div>

                      <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                        {promo.description || "Опис не вказано."}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Додано
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(promo.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Термін
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDate(promo.expires_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Працює
                          </p>
                          <p className="mt-1 text-2xl font-black text-emerald-300">
                            {formatNumber(toNumber(promo.works_count))}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Не працює
                          </p>
                          <p className="mt-1 text-2xl font-black text-red-300">
                            {formatNumber(toNumber(promo.not_works_count))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-[260px] flex-col gap-3">
                      <Link
                        href={getPromoUrl(promo)}
                        className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Сторінка коду
                      </Link>

                      {promo.store_slug && (
                        <Link
                          href={`/stores/${promo.store_slug}`}
                          className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Магазин
                        </Link>
                      )}

                      {promo.source_url && (
                        <a
                          href={promo.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Джерело
                        </a>
                      )}

                      <div className="mt-2 grid gap-3">
                        <button
                          type="button"
                          onClick={() => updatePromoStatus(promo, "approved")}
                          disabled={isProcessing || promo.status === "approved"}
                          className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Схвалити
                        </button>

                        <button
                          type="button"
                          onClick={() => updatePromoStatus(promo, "pending")}
                          disabled={isProcessing || promo.status === "pending"}
                          className="rounded-2xl bg-yellow-400 px-5 py-4 font-black text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          На перевірку
                        </button>

                        <button
                          type="button"
                          onClick={() => updatePromoStatus(promo, "rejected")}
                          disabled={isProcessing || promo.status === "rejected"}
                          className="rounded-2xl bg-red-400 px-5 py-4 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Відхилити
                        </button>
                      </div>
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