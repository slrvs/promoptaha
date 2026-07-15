"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type ReportStatus = "open" | "resolved" | "dismissed";
type PromoStatus = "pending" | "approved" | "rejected";
type FilterStatus = "all" | ReportStatus;
type SortMode = "newest" | "oldest";

type PromoReport = {
  id: string;
  promo_code_id?: string | null;
  reported_by?: string | null;
  reason?: string | null;
  description?: string | null;
  comment?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  all_category_names?: string[] | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

function getReportStatusLabel(status: string | null | undefined) {
  if (status === "open") return "Відкрита";
  if (status === "resolved") return "Вирішена";
  if (status === "dismissed") return "Відхилена";

  return status || "Невідомо";
}

function getReportStatusClass(status: string | null | undefined) {
  if (status === "resolved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "dismissed") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getPromoStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "Очікує";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getPromoStatusClass(status: string | null | undefined) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getReasonLabel(reason: string | null | undefined) {
  if (reason === "not_working") return "Не працює";
  if (reason === "expired") return "Закінчився термін";
  if (reason === "wrong_store") return "Не той магазин";
  if (reason === "bad_source") return "Погане джерело";
  if (reason === "spam") return "Спам";
  if (reason === "other") return "Інше";

  return reason || "Не вказано";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\s+/g, " ");
}

function getReportText(report: PromoReport) {
  return report.description || report.comment || "";
}

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

function getPromoCategories(promo: PromoCode | undefined) {
  if (!promo) return [];

  if (promo.all_category_names && promo.all_category_names.length > 0) {
    return promo.all_category_names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

function reportMatchesSearch(
  report: PromoReport,
  promo: PromoCode | undefined,
  search: string
) {
  const query = normalizeText(search);

  if (!query) return true;

  const haystack = normalizeText(
    [
      report.id,
      report.reason || "",
      report.status || "",
      getReasonLabel(report.reason),
      getReportText(report),
      report.reported_by || "",
      promo?.code || "",
      promo?.store_name || "",
      promo?.store_slug || "",
      promo?.discount_value || "",
      promo?.description || "",
      promo?.status || "",
      getPromoStatusLabel(promo?.status),
      getPromoCategories(promo).join(" "),
    ].join(" ")
  );

  return haystack.includes(query);
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<PromoReport[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === adminEmail;

  const promosById = useMemo(() => {
    return new Map(promos.map((promo) => [promo.id, promo]));
  }, [promos]);

  const counts = useMemo(() => {
    return {
      all: reports.length,
      open: reports.filter((report) => report.status === "open").length,
      resolved: reports.filter((report) => report.status === "resolved")
        .length,
      dismissed: reports.filter((report) => report.status === "dismissed")
        .length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const nextReports = reports.filter((report) => {
      const promo = report.promo_code_id
        ? promosById.get(report.promo_code_id)
        : undefined;

      if (filterStatus !== "all" && report.status !== filterStatus) {
        return false;
      }

      return reportMatchesSearch(report, promo, search);
    });

    nextReports.sort((firstReport, secondReport) => {
      const firstDate = new Date(firstReport.created_at || 0).getTime();
      const secondDate = new Date(secondReport.created_at || 0).getTime();

      if (sortMode === "oldest") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });

    return nextReports;
  }, [reports, promosById, filterStatus, sortMode, search]);

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadReports() {
    setIsLoading(true);
    setMessage("");

    const [reportsResult, promosResult] = await Promise.all([
      supabase
        .from("promo_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("admin_promo_code_category_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
    ]);

    if (reportsResult.error) {
      setMessage(
        `Не вдалося завантажити скарги: ${reportsResult.error.message}`
      );
      setMessageType("error");
      setReports([]);
    } else {
      setReports((reportsResult.data || []) as unknown as PromoReport[]);
    }

    if (promosResult.error) {
      setMessage(
        `Не вдалося завантажити промокоди для скарг: ${promosResult.error.message}`
      );
      setMessageType("error");
      setPromos([]);
    } else {
      setPromos((promosResult.data || []) as unknown as PromoCode[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser?.email === adminEmail) {
        await loadReports();
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user?.email === adminEmail) {
        loadReports();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function updateReportStatus(
    report: PromoReport,
    nextStatus: ReportStatus
  ) {
    setProcessingId(report.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_reports")
      .update({ status: nextStatus })
      .eq("id", report.id);

    if (error) {
      setMessage(`Не вдалося оновити скаргу: ${error.message}`);
      setMessageType("error");
      setProcessingId(null);
      return;
    }

    setReports((currentReports) =>
      currentReports.map((currentReport) =>
        currentReport.id === report.id
          ? { ...currentReport, status: nextStatus }
          : currentReport
      )
    );

    setMessage("Статус скарги оновлено.");
    setMessageType("success");
    setProcessingId(null);
  }

  async function updatePromoStatus(promo: PromoCode, nextStatus: PromoStatus) {
    const confirmed = window.confirm(
      `Змінити статус промокоду ${promo.code} на "${getPromoStatusLabel(
        nextStatus
      )}"?`
    );

    if (!confirmed) return;

    setProcessingId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({ status: nextStatus })
      .eq("id", promo.id);

    if (error) {
      setMessage(`Не вдалося оновити промокод: ${error.message}`);
      setMessageType("error");
      setProcessingId(null);
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.map((currentPromo) =>
        currentPromo.id === promo.id
          ? { ...currentPromo, status: nextStatus }
          : currentPromo
      )
    );

    setMessage("Статус промокоду оновлено.");
    setMessageType("success");
    setProcessingId(null);
  }

  if (isCheckingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[520px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🔐</div>

            <h1 className="mt-5 text-4xl font-black">Потрібно увійти</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Адмін-розділ доступний тільки після входу.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Увійти
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="text-6xl">⛔</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Немає доступу
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору ПромоПтахи.
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
          <Link href="/admin" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Скарги</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                Admin · Reports
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Скарги на промокоди
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна перевіряти скарги користувачів, змінювати статус
                скарги та швидко відхиляти або повертати промокоди на повторну
                перевірку.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Модерація промокодів
                </Link>

                <Link
                  href="/admin/stats"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Аналітика
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{counts.all}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">всього</p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {counts.open}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відкриті
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {counts.resolved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  вирішені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {counts.dismissed}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилені
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 font-bold ${
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

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: код, магазин, причина, коментар..."
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as FilterStatus)
              }
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="open">Відкриті</option>
              <option value="resolved">Вирішені</option>
              <option value="dismissed">Відхилені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
            </select>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredReports.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🕊️</div>

            <h2 className="mt-5 text-4xl font-black">Скарг не знайдено</h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Під поточні фільтри немає жодної скарги.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredReports.map((report) => {
              const promo = report.promo_code_id
                ? promosById.get(report.promo_code_id)
                : undefined;

              const isProcessing =
                processingId === report.id || processingId === promo?.id;

              return (
                <article
                  key={report.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getReportStatusClass(
                            report.status
                          )}`}
                        >
                          {getReportStatusLabel(report.status)}
                        </span>

                        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                          {getReasonLabel(report.reason)}
                        </span>

                        {promo && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                              promo.status
                            )}`}
                          >
                            Промокод: {getPromoStatusLabel(promo.status)}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 break-all text-4xl font-black text-white">
                        {promo?.code || "Промокод не знайдено"}
                      </h2>

                      <p className="mt-2 text-xl font-black text-emerald-300">
                        {promo?.store_name || "Магазин невідомий"}
                      </p>

                      <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                        {getReportText(report) ||
                          "Користувач не залишив додатковий коментар."}
                      </p>

                      {promo?.description && (
                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Опис промокоду
                          </p>
                          <p className="mt-2 leading-7 text-slate-300">
                            {promo.description}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Скарга створена
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(report.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            ID скаржника
                          </p>
                          <p className="mt-1 break-all font-black text-slate-200">
                            {report.reported_by || "Невідомо"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Голоси
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            ✅ {Number(promo?.works_count || 0)} / ❌{" "}
                            {Number(promo?.not_works_count || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {promo?.status === "approved" && (
                        <Link
                          href={getPromoUrl(promo)}
                          className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити на сайті
                        </Link>
                      )}

                      {promo?.store_slug && (
                        <Link
                          href={`/stores/${promo.store_slug}`}
                          className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Сторінка магазину
                        </Link>
                      )}

                      {promo?.source_url && (
                        <a
                          href={promo.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Джерело
                        </a>
                      )}

                      <div className="my-2 h-px bg-slate-800" />

                      {report.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => updateReportStatus(report, "resolved")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-emerald-400/40 px-5 py-4 font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Позначити вирішеною
                        </button>
                      )}

                      {report.status !== "dismissed" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateReportStatus(report, "dismissed")
                          }
                          disabled={isProcessing}
                          className="rounded-2xl border border-red-400/40 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Відхилити скаргу
                        </button>
                      )}

                      {report.status !== "open" && (
                        <button
                          type="button"
                          onClick={() => updateReportStatus(report, "open")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-yellow-400/40 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Повернути у відкриті
                        </button>
                      )}

                      {promo && (
                        <>
                          <div className="my-2 h-px bg-slate-800" />

                          {promo.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() =>
                                updatePromoStatus(promo, "approved")
                              }
                              disabled={isProcessing}
                              className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Схвалити промокод
                            </button>
                          )}

                          {promo.status !== "pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                updatePromoStatus(promo, "pending")
                              }
                              disabled={isProcessing}
                              className="rounded-2xl border border-yellow-400/40 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              На повторну перевірку
                            </button>
                          )}

                          {promo.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() =>
                                updatePromoStatus(promo, "rejected")
                              }
                              disabled={isProcessing}
                              className="rounded-2xl border border-red-400/40 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Відхилити промокод
                            </button>
                          )}
                        </>
                      )}
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