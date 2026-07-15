"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import { matchesSearch } from "@/lib/searchAliases";

type ReportStatus = "open" | "resolved" | "dismissed";
type StatusFilter = "all" | ReportStatus;
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
  store_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
  category_name?: string | null;
  category_slug?: string | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;
};

type ReportWithPromo = {
  report: PromoReport;
  promo: PromoCode | null;
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

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function getReportStatusLabel(status: string | null | undefined) {
  if (status === "open") return "Відкрито";
  if (status === "resolved") return "Вирішено";
  if (status === "dismissed") return "Відхилено";

  return status || "Невідомо";
}

function getReportStatusClass(status: string | null | undefined) {
  if (status === "resolved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "dismissed") {
    return "border-slate-700 bg-slate-950 text-slate-300";
  }

  return "border-red-400/30 bg-red-400/10 text-red-300";
}

function getPromoStatusLabel(status: string | null | undefined) {
  if (status === "approved") return "Схвалено";
  if (status === "pending") return "Очікує";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getReasonLabel(reason: string | null | undefined) {
  if (reason === "not_working") return "Не працює";
  if (reason === "expired") return "Закінчився термін";
  if (reason === "wrong_terms") return "Неправильні умови";
  if (reason === "fake") return "Фейковий код";
  if (reason === "duplicate") return "Дублікат";
  if (reason === "other") return "Інше";

  return reason || "Не вказано";
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

function getPromoUrl(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

function getReportComment(report: PromoReport) {
  return report.description || report.comment || "";
}

function getCategoryNames(promo: PromoCode | null) {
  if (!promo) return [];

  const names = toArray(promo.all_category_names);

  if (names.length > 0) {
    return names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<PromoReport[]>([]);
  const [promosById, setPromosById] = useState<Map<string, PromoCode>>(
    new Map()
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [processingReportId, setProcessingReportId] = useState<string | null>(
    null
  );
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

  async function loadReports() {
    setIsLoading(true);
    setMessage("");

    const { data: reportsData, error: reportsError } = await supabase
      .from("promo_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3000);

    if (reportsError) {
      setReports([]);
      setPromosById(new Map());
      setMessage(`Не вдалося завантажити репорти: ${reportsError.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const loadedReports = (reportsData || []) as unknown as PromoReport[];

    setReports(loadedReports);

    const promoIds = [
      ...new Set(
        loadedReports
          .map((report) => report.promo_code_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (promoIds.length === 0) {
      setPromosById(new Map());
      setIsLoading(false);
      return;
    }

    const { data: promosData, error: promosError } = await supabase
      .from("admin_promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, category_name, category_slug, all_category_names, all_category_slugs"
      )
      .in("id", promoIds);

    if (promosError) {
      setPromosById(new Map());
      setMessage(`Не вдалося завантажити промокоди: ${promosError.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const nextPromosById = new Map<string, PromoCode>();

    for (const promo of (promosData || []) as unknown as PromoCode[]) {
      nextPromosById.set(promo.id, promo);
    }

    setPromosById(nextPromosById);
    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser?.email === ADMIN_EMAIL) {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const reportsWithPromos = useMemo<ReportWithPromo[]>(() => {
    return reports.map((report) => ({
      report,
      promo: report.promo_code_id
        ? promosById.get(report.promo_code_id) || null
        : null,
    }));
  }, [reports, promosById]);

  const counts = useMemo(() => {
    return {
      all: reports.length,
      open: reports.filter((report) => report.status === "open").length,
      resolved: reports.filter((report) => report.status === "resolved").length,
      dismissed: reports.filter((report) => report.status === "dismissed")
        .length,
    };
  }, [reports]);

  const reasonCounts = useMemo(() => {
    const countsByReason = new Map<string, number>();

    for (const report of reports) {
      const reason = report.reason || "unknown";

      countsByReason.set(reason, (countsByReason.get(reason) || 0) + 1);
    }

    return countsByReason;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const filtered = reportsWithPromos.filter(({ report, promo }) => {
      const categoryNames = getCategoryNames(promo);
      const reportComment = getReportComment(report);

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      const matchesReason =
        reasonFilter === "all" || (report.reason || "unknown") === reasonFilter;

      const matchesSearchQuery = matchesSearch(
        [
          report.reason || "",
          getReasonLabel(report.reason),
          reportComment,
          report.status || "",
          promo?.code || "",
          promo?.store_name || "",
          promo?.store_slug || "",
          promo?.discount_value || "",
          promo?.description || "",
          promo?.source_type || "",
          promo?.category_name || "",
          promo?.category_slug || "",
          toArray(promo?.all_category_names).join(" "),
          toArray(promo?.all_category_slugs).join(" "),
          categoryNames.join(" "),
        ],
        search
      );

      return matchesStatus && matchesReason && matchesSearchQuery;
    });

    return [...filtered].sort((firstItem, secondItem) => {
      const firstDate = new Date(firstItem.report.created_at || 0).getTime();
      const secondDate = new Date(secondItem.report.created_at || 0).getTime();

      if (sortMode === "oldest") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });
  }, [reportsWithPromos, search, statusFilter, reasonFilter, sortMode]);

  async function updateReportStatus(report: PromoReport, nextStatus: ReportStatus) {
    setProcessingReportId(report.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_reports")
      .update({
        status: nextStatus,
      })
      .eq("id", report.id);

    if (error) {
      setMessage(`Не вдалося оновити репорт: ${error.message}`);
      setMessageType("error");
      setProcessingReportId(null);
      return;
    }

    setReports((currentReports) =>
      currentReports.map((currentReport) =>
        currentReport.id === report.id
          ? {
              ...currentReport,
              status: nextStatus,
            }
          : currentReport
      )
    );

    setMessage(`Репорт позначено як “${getReportStatusLabel(nextStatus)}”.`);
    setMessageType("success");
    setProcessingReportId(null);
  }

  async function updatePromoStatus(promo: PromoCode, nextStatus: string) {
    setProcessingPromoId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({
        status: nextStatus,
      })
      .eq("id", promo.id);

    if (error) {
      setMessage(`Не вдалося оновити промокод: ${error.message}`);
      setMessageType("error");
      setProcessingPromoId(null);
      return;
    }

    setPromosById((currentMap) => {
      const nextMap = new Map(currentMap);
      const currentPromo = nextMap.get(promo.id);

      if (currentPromo) {
        nextMap.set(promo.id, {
          ...currentPromo,
          status: nextStatus,
        });
      }

      return nextMap;
    });

    setMessage(`Статус промокоду ${promo.code} змінено.`);
    setMessageType("success");
    setProcessingPromoId(null);
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
          <Link href="/admin" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Репорти</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                Репорти
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Скарги на промокоди
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна переглядати скарги користувачів, відкривати пов’язані
                промокоди та швидко змінювати статус репорту або самого коду.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Модерація
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
                <p className="text-4xl font-black text-red-300">
                  {formatNumber(counts.open)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відкриті
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {formatNumber(counts.resolved)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  вирішені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-slate-300">
                  {formatNumber(counts.dismissed)}
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
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: код, магазин, причина, коментар..."
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
              <option value="open">Відкриті</option>
              <option value="resolved">Вирішені</option>
              <option value="dismissed">Відхилені</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(event) => setReasonFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі причини</option>
              {[...reasonCounts.entries()].map(([reason, count]) => (
                <option key={reason} value={reason}>
                  {getReasonLabel(reason)} · {count}
                </option>
              ))}
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
              onClick={() => setStatusFilter("open")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "open"
                  ? "border-red-400 bg-red-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-400 hover:text-red-300"
              }`}
            >
              Відкриті · {formatNumber(counts.open)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("resolved")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "resolved"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Вирішені · {formatNumber(counts.resolved)}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("dismissed")}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                statusFilter === "dismissed"
                  ? "border-slate-300 bg-slate-300 text-slate-950"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-300 hover:text-white"
              }`}
            >
              Відхилені · {formatNumber(counts.dismissed)}
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredReports.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🧹</div>

            <h2 className="mt-5 text-4xl font-black">Репортів не знайдено</h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Немає скарг під обраний статус, причину або пошуковий запит.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredReports.map(({ report, promo }) => {
              const reportComment = getReportComment(report);
              const categoryNames = getCategoryNames(promo);
              const isReportProcessing = processingReportId === report.id;
              const isPromoProcessing =
                promo && processingPromoId === promo.id;

              return (
                <article
                  key={report.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
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

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {formatDateTime(report.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-3xl font-black text-white">
                        {promo ? promo.code : "Промокод не знайдено"}
                      </h2>

                      <p className="mt-2 text-xl font-black text-emerald-300">
                        {promo?.store_name || "Магазин невідомий"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {promo?.status && (
                          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                            Код: {getPromoStatusLabel(promo.status)}
                          </span>
                        )}

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

                        {promo?.source_type && (
                          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                            {getSourceLabel(promo.source_type)}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                        <p className="text-sm font-bold text-slate-500">
                          Коментар користувача
                        </p>

                        <p className="mt-2 leading-7 text-slate-300">
                          {reportComment || "Коментар не вказано."}
                        </p>
                      </div>

                      {promo && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                            <p className="text-sm font-bold text-slate-500">
                              Знижка
                            </p>
                            <p className="mt-1 font-black text-slate-200">
                              {promo.discount_value || "Не вказано"}
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
                      )}
                    </div>

                    <div className="flex min-w-[260px] flex-col gap-3">
                      {promo && (
                        <>
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
                              disabled={
                                Boolean(isPromoProcessing) ||
                                promo.status === "approved"
                              }
                              className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Код працює
                            </button>

                            <button
                              type="button"
                              onClick={() => updatePromoStatus(promo, "rejected")}
                              disabled={
                                Boolean(isPromoProcessing) ||
                                promo.status === "rejected"
                              }
                              className="rounded-2xl bg-red-400 px-5 py-4 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Відхилити код
                            </button>
                          </div>
                        </>
                      )}

                      <div className="mt-2 grid gap-3 border-t border-slate-800 pt-3">
                        <button
                          type="button"
                          onClick={() => updateReportStatus(report, "resolved")}
                          disabled={
                            isReportProcessing || report.status === "resolved"
                          }
                          className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Репорт вирішено
                        </button>

                        <button
                          type="button"
                          onClick={() => updateReportStatus(report, "open")}
                          disabled={isReportProcessing || report.status === "open"}
                          className="rounded-2xl bg-red-400 px-5 py-4 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Повернути відкритим
                        </button>

                        <button
                          type="button"
                          onClick={() => updateReportStatus(report, "dismissed")}
                          disabled={
                            isReportProcessing || report.status === "dismissed"
                          }
                          className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Відхилити репорт
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