"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type ReportStatusFilter = "pending" | "reviewed" | "dismissed" | "all";

type StoreJoin =
  | {
      name?: string | null;
      slug?: string | null;
    }
  | {
      name?: string | null;
      slug?: string | null;
    }[]
  | null;

type PromoCodeJoin =
  | {
      id?: string | null;
      code?: string | null;
      status?: string | null;
      stores?: StoreJoin;
    }
  | {
      id?: string | null;
      code?: string | null;
      status?: string | null;
      stores?: StoreJoin;
    }[]
  | null;

type PromoReport = {
  id: string;
  promo_code_id?: string | null;
  reason?: string | null;
  message?: string | null;
  status?: string | null;
  reported_by?: string | null;
  created_at?: string | null;
  promo_codes?: PromoCodeJoin;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getPromo(report: PromoReport) {
  if (Array.isArray(report.promo_codes)) {
    return report.promo_codes[0] || null;
  }

  return report.promo_codes || null;
}

function getStore(promo: ReturnType<typeof getPromo>) {
  if (!promo?.stores) return null;

  if (Array.isArray(promo.stores)) {
    return promo.stores[0] || null;
  }

  return promo.stores;
}

function getPromoCode(report: PromoReport) {
  return getPromo(report)?.code || "Промокод не знайдено";
}

function getPromoStatus(report: PromoReport) {
  return getPromo(report)?.status || "unknown";
}

function getStoreName(report: PromoReport) {
  const promo = getPromo(report);
  const store = getStore(promo);

  return store?.name || "Магазин не знайдено";
}

function getStoreSlug(report: PromoReport) {
  const promo = getPromo(report);
  const store = getStore(promo);

  return store?.slug || null;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getReportStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "Новий";
  if (status === "reviewed") return "Розглянуто";
  if (status === "dismissed") return "Відхилено";

  return status || "Невідомо";
}

function getReportStatusClass(status: string | null | undefined) {
  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "reviewed") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "dismissed") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function getPromoStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилений";

  return status || "Невідомо";
}

function getPromoStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function getReasonLabel(reason: string | null | undefined) {
  if (reason === "not_working") return "Не працює";
  if (reason === "wrong_info") return "Неправильна інформація";
  if (reason === "expired") return "Акція завершилась";
  if (reason === "suspicious") return "Сумнівне джерело";
  if (reason === "other") return "Інше";

  return reason || "Не вказано";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<PromoReport[]>([]);

  const [filter, setFilter] = useState<ReportStatusFilter>("pending");
  const [search, setSearch] = useState("");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadReports() {
    setIsLoadingReports(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_reports")
      .select(
        "id, promo_code_id, reason, message, status, reported_by, created_at, promo_codes(id, code, status, stores(name, slug))"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setReports([]);
      setMessage(`Помилка завантаження репортів: ${error.message}`);
      setMessageType("error");
      setIsLoadingReports(false);
      return;
    }

    setReports((data || []) as PromoReport[]);
    setIsLoadingReports(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoadingUser && isAdmin) {
      loadReports();
    }

    if (!isLoadingUser && !isAdmin) {
      setIsLoadingReports(false);
    }
  }, [isLoadingUser, isAdmin]);

  const filteredReports = useMemo(() => {
    const normalized = normalizeSearch(search);

    return reports.filter((report) => {
      const promoCode = getPromoCode(report);
      const storeName = getStoreName(report);

      const matchesFilter = filter === "all" || report.status === filter;

      const matchesSearch =
        !normalized ||
        promoCode.toLowerCase().includes(normalized) ||
        storeName.toLowerCase().includes(normalized) ||
        (report.reason || "").toLowerCase().includes(normalized) ||
        getReasonLabel(report.reason).toLowerCase().includes(normalized) ||
        (report.message || "").toLowerCase().includes(normalized) ||
        (report.reported_by || "").toLowerCase().includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [reports, filter, search]);

  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;

  const reviewedCount = reports.filter(
    (report) => report.status === "reviewed"
  ).length;

  const dismissedCount = reports.filter(
    (report) => report.status === "dismissed"
  ).length;

  async function updateReportStatus(reportId: string, status: string) {
    setUpdatingId(reportId);
    setMessage("");

    const { error } = await supabase
      .from("promo_reports")
      .update({
        status,
      })
      .eq("id", reportId);

    setUpdatingId(null);

    if (error) {
      setMessage(`Помилка оновлення репорту: ${error.message}`);
      setMessageType("error");
      return;
    }

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status,
            }
          : report
      )
    );

    setMessage(`Репорт оновлено: ${getReportStatusLabel(status)}.`);
    setMessageType("success");
  }

  async function rejectPromoFromReport(report: PromoReport) {
    const promo = getPromo(report);

    if (!promo?.id) {
      setMessage("Не вдалося знайти промокод для цього репорту.");
      setMessageType("error");
      return;
    }

    setUpdatingId(report.id);
    setMessage("");

    const { error: promoError } = await supabase
      .from("promo_codes")
      .update({
        status: "rejected",
      })
      .eq("id", promo.id);

    if (promoError) {
      setUpdatingId(null);
      setMessage(`Помилка відхилення промокоду: ${promoError.message}`);
      setMessageType("error");
      return;
    }

    const { error: reportError } = await supabase
      .from("promo_reports")
      .update({
        status: "reviewed",
      })
      .eq("id", report.id);

    setUpdatingId(null);

    if (reportError) {
      setMessage(
        `Промокод відхилено, але репорт не оновився: ${reportError.message}`
      );
      setMessageType("error");
      return;
    }

    setReports((currentReports) =>
      currentReports.map((item) => {
        const itemPromo = getPromo(item);

        if (item.id === report.id) {
          return {
            ...item,
            status: "reviewed",
            promo_codes: {
              ...(promo || {}),
              status: "rejected",
            },
          };
        }

        if (itemPromo?.id === promo.id) {
          return {
            ...item,
            promo_codes: {
              ...(itemPromo || {}),
              status: "rejected",
            },
          };
        }

        return item;
      })
    );

    setMessage("Промокод відхилено, репорт позначено як розглянутий.");
    setMessageType("success");
  }

  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Перевіряю доступ...
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">Потрібен вхід</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Щоб відкрити адмінку, потрібно увійти в акаунт адміністратора.
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
            <h1 className="text-4xl font-black text-red-300">
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
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Репорти промокодів
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна переглядати скарги користувачів, закривати репорти
                або відхиляти проблемні промокоди.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Промокоди
              </Link>

              <Link
                href="/admin/store-requests"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Заявки магазинів
              </Link>

              <button
                type="button"
                onClick={loadReports}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Оновити
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "pending"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-yellow-400/50"
              }`}
            >
              <p className="text-3xl font-black text-yellow-300">
                {pendingCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">нові</p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("reviewed")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "reviewed"
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-emerald-400/50"
              }`}
            >
              <p className="text-3xl font-black text-emerald-300">
                {reviewedCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                розглянуті
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("dismissed")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "dismissed"
                  ? "border-red-400 bg-red-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-red-400/50"
              }`}
            >
              <p className="text-3xl font-black text-red-300">
                {dismissedCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                відхилені
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "all"
                  ? "border-slate-400 bg-slate-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-slate-500"
              }`}
            >
              <p className="text-3xl font-black text-slate-200">
                {reports.length}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">усього</p>
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: код, магазин, причина, текст репорту..."
            className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
          />

          {message && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : messageType === "error"
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}

          {isLoadingReports ? (
            <div className="mt-8 grid gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Репортів не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити фільтр або пошуковий запит.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {filteredReports.map((report) => {
                const promo = getPromo(report);
                const promoCode = getPromoCode(report);
                const promoStatus = getPromoStatus(report);
                const storeName = getStoreName(report);
                const storeSlug = getStoreSlug(report);
                const isUpdating = updatingId === report.id;

                return (
                  <article
                    key={report.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getReportStatusClass(
                              report.status
                            )}`}
                          >
                            {getReportStatusLabel(report.status)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                              promoStatus
                            )}`}
                          >
                            Код: {getPromoStatusLabel(promoStatus)}
                          </span>

                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                            Додано: {formatDate(report.created_at)}
                          </span>
                        </div>

                        <h2 className="mt-4 break-all text-4xl font-black text-white">
                          {promoCode}
                        </h2>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Магазин
                            </p>

                            {storeSlug ? (
                              <Link
                                href={`/stores/${storeSlug}`}
                                className="mt-1 inline-flex font-black text-emerald-300 hover:text-emerald-200"
                              >
                                {storeName} →
                              </Link>
                            ) : (
                              <p className="mt-1 font-black text-slate-200">
                                {storeName}
                              </p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Причина
                            </p>

                            <p className="mt-1 font-black text-yellow-300">
                              {getReasonLabel(report.reason)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Автор репорту
                            </p>

                            <p className="mt-1 break-all font-black text-slate-200">
                              {report.reported_by || "Не вказано"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Повідомлення
                          </p>

                          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-300">
                            {report.message || "Користувач не залишив текст."}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {promo?.id && (
                            <Link
                              href={`/codes/${promo.id}`}
                              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Відкрити промокод →
                            </Link>
                          )}

                          <Link
                            href="/admin"
                            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            До модерації кодів
                          </Link>
                        </div>
                      </div>

                      <div className="flex min-w-60 flex-col gap-3">
                        {report.status !== "reviewed" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateReportStatus(report.id, "reviewed")
                            }
                            className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Позначити розглянутим
                          </button>
                        )}

                        {report.status !== "dismissed" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateReportStatus(report.id, "dismissed")
                            }
                            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Відхилити репорт
                          </button>
                        )}

                        {report.status !== "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateReportStatus(report.id, "pending")
                            }
                            className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Повернути в нові
                          </button>
                        )}

                        {promo?.id && promoStatus !== "rejected" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => rejectPromoFromReport(report)}
                            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Відхилити промокод
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}