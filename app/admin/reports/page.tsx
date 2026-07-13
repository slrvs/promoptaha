"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

type ReportStatus = "pending" | "resolved" | "rejected";

type PromoReport = {
  id: string;
  promo_code_id: string | null;
  reason: string | null;
  message: string | null;
  status: ReportStatus | string | null;
  reported_by: string | null;
  created_at: string | null;
  promo?: PromoInfo | null;
};

type PromoInfo = {
  id: string;
  code: string | null;
  status: string | null;
  discount_value: string | null;
  store_name: string | null;
  store_slug: string | null;
};

type RawReport = {
  id: string;
  promo_code_id: string | null;
  reason: string | null;
  message: string | null;
  status: ReportStatus | string | null;
  reported_by: string | null;
  created_at: string | null;
};

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

type RawPromo = {
  id: string;
  code: string | null;
  status: string | null;
  discount_value: string | null;
  stores?: StoreJoin;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getStoreName(store: StoreJoin) {
  if (!store) return null;

  if (Array.isArray(store)) {
    return store[0]?.name || null;
  }

  return store.name || null;
}

function getStoreSlug(store: StoreJoin) {
  if (!store) return null;

  if (Array.isArray(store)) {
    return store[0]?.slug || null;
  }

  return store.slug || null;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без дати";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function reasonLabel(reason: string | null | undefined) {
  if (reason === "not_working") return "Промокод не працює";
  if (reason === "expired") return "Промокод закінчився";
  if (reason === "wrong_description") return "Неправильний опис";
  if (reason === "suspicious") return "Підозрілий промокод";
  if (reason === "other") return "Інше";

  return "Не вказано";
}

function statusLabel(status: string | null | undefined) {
  if (status === "pending") return "На перевірці";
  if (status === "resolved") return "Опрацьовано";
  if (status === "rejected") return "Відхилено";

  return "Невідомо";
}

function statusClass(status: string | null | undefined) {
  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "resolved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<PromoReport[]>([]);
  const [filter, setFilter] = useState<"all" | ReportStatus>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadReports() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setReports([]);
      setMessage("Спочатку потрібно увійти.");
      setIsLoading(false);
      return;
    }

    if (currentUser.email !== ADMIN_EMAIL) {
      setReports([]);
      setMessage("У тебе немає доступу до цієї сторінки.");
      setIsLoading(false);
      return;
    }

    const { data: reportsData, error: reportsError } = await supabase
      .from("promo_reports")
      .select("id, promo_code_id, reason, message, status, reported_by, created_at")
      .order("created_at", { ascending: false });

    if (reportsError) {
      setReports([]);
      setMessage(`Помилка завантаження репортів: ${reportsError.message}`);
      setIsLoading(false);
      return;
    }

    const rawReports = (reportsData as RawReport[]) || [];
    const promoIds = Array.from(
      new Set(
        rawReports
          .map((report) => report.promo_code_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let promoMap = new Map<string, PromoInfo>();

    if (promoIds.length > 0) {
      const { data: promosData, error: promosError } = await supabase
        .from("promo_codes")
        .select("id, code, status, discount_value, stores(name, slug)")
        .in("id", promoIds);

      if (promosError) {
        setMessage(`Репорти завантажені, але промокоди ні: ${promosError.message}`);
      } else {
        const rawPromos = (promosData as RawPromo[]) || [];

        promoMap = new Map(
          rawPromos.map((promo) => [
            promo.id,
            {
              id: promo.id,
              code: promo.code,
              status: promo.status,
              discount_value: promo.discount_value,
              store_name: getStoreName(promo.stores || null),
              store_slug: getStoreSlug(promo.stores || null),
            },
          ])
        );
      }
    }

    const mergedReports: PromoReport[] = rawReports.map((report) => ({
      ...report,
      promo: report.promo_code_id
        ? promoMap.get(report.promo_code_id) || null
        : null,
    }));

    setReports(mergedReports);
    setIsLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;

    return reports.filter((report) => report.status === filter);
  }, [reports, filter]);

  const pendingCount = reports.filter((report) => report.status === "pending").length;
  const resolvedCount = reports.filter((report) => report.status === "resolved").length;
  const rejectedCount = reports.filter((report) => report.status === "rejected").length;

  async function updateReportStatus(id: string, status: ReportStatus) {
    setMessage("");

    const { error } = await supabase
      .from("promo_reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(`Помилка оновлення: ${error.message}`);
      return;
    }

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === id ? { ...report, status } : report
      )
    );

    setMessage("Статус репорту оновлено.");
  }

  async function markPromoExpired(report: PromoReport) {
    if (!report.promo_code_id) {
      setMessage("У цього репорту немає привʼязаного промокоду.");
      return;
    }

    const confirmed = window.confirm(
      "Позначити промокод як завершений і закрити репорт?"
    );

    if (!confirmed) return;

    setMessage("");

    const { error: promoError } = await supabase
      .from("promo_codes")
      .update({ status: "expired" })
      .eq("id", report.promo_code_id);

    if (promoError) {
      setMessage(`Не вдалося оновити промокод: ${promoError.message}`);
      return;
    }

    const { error: reportError } = await supabase
      .from("promo_reports")
      .update({ status: "resolved" })
      .eq("id", report.id);

    if (reportError) {
      setMessage(`Промокод оновлено, але репорт не закрито: ${reportError.message}`);
      return;
    }

    setReports((currentReports) =>
      currentReports.map((currentReport) =>
        currentReport.id === report.id
          ? {
              ...currentReport,
              status: "resolved",
              promo: currentReport.promo
                ? { ...currentReport.promo, status: "expired" }
                : currentReport.promo,
            }
          : currentReport
      )
    );

    setMessage("Промокод позначено як завершений, репорт закрито.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
                Адмінка
              </p>

              <h1 className="text-4xl font-black tracking-tight">
                Репорти промокодів
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Тут зібрані повідомлення від користувачів про проблемні,
                прострочені або підозрілі промокоди.
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
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                filter === "pending"
                  ? "border-yellow-400 bg-yellow-400 text-slate-950"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:border-yellow-400 hover:text-yellow-300"
              }`}
            >
              На перевірці ({pendingCount})
            </button>

            <button
              onClick={() => setFilter("resolved")}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                filter === "resolved"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Опрацьовані ({resolvedCount})
            </button>

            <button
              onClick={() => setFilter("rejected")}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                filter === "rejected"
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
              }`}
            >
              Відхилені ({rejectedCount})
            </button>

            <button
              onClick={() => setFilter("all")}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                filter === "all"
                  ? "border-slate-300 bg-slate-300 text-slate-950"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-300 hover:text-white"
              }`}
            >
              Усі ({reports.length})
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження репортів...
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-300">
              Спочатку потрібно увійти.

              <div className="mt-5">
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Увійти
                </Link>
              </div>
            </div>
          ) : !isAdmin ? (
            <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-300">
              У тебе немає доступу до цієї сторінки.
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              За цим фільтром репортів немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                            report.status
                          )}`}
                        >
                          {statusLabel(report.status)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">
                          {reasonLabel(report.reason)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {report.promo?.code || "Промокод не знайдено"}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {report.promo?.store_name || "Магазин не знайдено"} •{" "}
                        {formatDate(report.created_at)}
                      </p>

                      {report.promo?.discount_value && (
                        <p className="mt-2 text-sm text-slate-400">
                          Знижка: {report.promo.discount_value}
                        </p>
                      )}

                      {report.promo?.status && (
                        <p className="mt-2 text-sm text-slate-400">
                          Статус промокоду:{" "}
                          <span className="font-bold text-slate-200">
                            {report.promo.status}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {report.promo_code_id && report.promo?.status === "active" && (
                        <Link
                          href={`/codes/${report.promo_code_id}`}
                          className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Відкрити код
                        </Link>
                      )}

                      {report.promo?.store_slug && (
                        <Link
                          href={`/stores/${report.promo.store_slug}`}
                          className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Магазин
                        </Link>
                      )}
                    </div>
                  </div>

                  {report.message ? (
                    <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Коментар користувача
                      </p>
                      <p className="mt-2 text-slate-300">{report.message}</p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-slate-600">
                      Користувач не залишив коментар.
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => updateReportStatus(report.id, "resolved")}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                    >
                      Закрити
                    </button>

                    <button
                      onClick={() => updateReportStatus(report.id, "rejected")}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                    >
                      Відхилити
                    </button>

                    <button
                      onClick={() => updateReportStatus(report.id, "pending")}
                      className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
                    >
                      На перевірку
                    </button>

                    <button
                      onClick={() => markPromoExpired(report)}
                      className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-orange-400 hover:text-orange-300"
                    >
                      Позначити код завершеним
                    </button>
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
