"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoStatus = "active" | "pending" | "rejected" | string;
type StoreStatus = "active" | "pending" | "rejected" | string;
type RequestStatus = "pending" | "approved" | "rejected" | string;

type StoreJoin =
  | {
      name?: string | null;
      slug?: string | null;
    }
  | {
      name?: string | null;
      slug?: string | null;
    }[]
  | null
  | undefined;

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  status?: PromoStatus | null;
  discount_value?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  stores?: StoreJoin;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  status?: StoreStatus | null;
  created_at?: string | null;
};

type StoreRequest = {
  id: string;
  name: string;
  website_url?: string | null;
  comment?: string | null;
  status?: RequestStatus | null;
  created_at?: string | null;
};

type ReportPromoCode =
  | {
      id?: string | null;
      slug?: string | null;
      code?: string | null;
    }
  | {
      id?: string | null;
      slug?: string | null;
      code?: string | null;
    }[]
  | null
  | undefined;

type PromoReport = {
  id: string;
  promo_code_id: string;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
  promo_codes?: ReportPromoCode;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getStoreName(storeJoin: StoreJoin) {
  if (!storeJoin) return "Магазин";

  if (Array.isArray(storeJoin)) {
    return storeJoin[0]?.name || "Магазин";
  }

  return storeJoin.name || "Магазин";
}

function getStoreSlug(storeJoin: StoreJoin) {
  if (!storeJoin) return null;

  if (Array.isArray(storeJoin)) {
    return storeJoin[0]?.slug || null;
  }

  return storeJoin.slug || null;
}

function getReportPromoCode(promoCode: ReportPromoCode) {
  if (!promoCode) return null;

  if (Array.isArray(promoCode)) {
    return promoCode[0] || null;
  }

  return promoCode;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getPromoStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилений";

  return status || "Невідомо";
}

function getRequestStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "Очікує";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active" || status === "approved" || status === "resolved") {
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

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "green" | "yellow" | "red" | "orange";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "yellow"
      ? "text-yellow-300"
      : tone === "red"
      ? "text-red-300"
      : tone === "orange"
      ? "text-orange-300"
      : "text-white";

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20">
      <p className={`text-4xl font-black ${valueClass}`}>{value}</p>
      <h3 className="mt-3 text-lg font-black text-white">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </article>
  );
}

export default function AdminStatsPage() {
  const [user, setUser] = useState<User | null>(null);

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [reports, setReports] = useState<PromoReport[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadData() {
    setIsLoadingData(true);
    setErrorMessage("");

    const [
      promoResponse,
      storeResponse,
      storeRequestResponse,
      reportResponse,
    ] = await Promise.all([
      supabase
        .from("promo_codes")
        .select(
          "id, slug, code, status, discount_value, expires_at, created_at, stores(name, slug)"
        )
        .order("created_at", { ascending: false })
        .limit(500),

      supabase
        .from("stores")
        .select("id, name, slug, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),

      supabase
        .from("store_requests")
        .select("id, name, website_url, comment, status, created_at")
        .order("created_at", { ascending: false })
        .limit(300),

      supabase
        .from("promo_reports")
        .select(
          "id, promo_code_id, reason, status, created_at, promo_codes(id, slug, code)"
        )
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    if (promoResponse.error) {
      setErrorMessage(`Промокоди: ${promoResponse.error.message}`);
    }

    if (storeResponse.error) {
      setErrorMessage(`Магазини: ${storeResponse.error.message}`);
    }

    if (storeRequestResponse.error) {
      setErrorMessage(`Заявки магазинів: ${storeRequestResponse.error.message}`);
    }

    if (reportResponse.error) {
      setErrorMessage(`Скарги: ${reportResponse.error.message}`);
    }

    setPromos((promoResponse.data || []) as PromoCode[]);
    setStores((storeResponse.data || []) as Store[]);
    setStoreRequests((storeRequestResponse.data || []) as StoreRequest[]);
    setReports((reportResponse.data || []) as PromoReport[]);

    setIsLoadingData(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const promoStats = useMemo(() => {
    return {
      total: promos.length,
      active: promos.filter((promo) => promo.status === "active").length,
      pending: promos.filter((promo) => promo.status === "pending").length,
      rejected: promos.filter((promo) => promo.status === "rejected").length,
    };
  }, [promos]);

  const storeStats = useMemo(() => {
    return {
      total: stores.length,
      active: stores.filter((store) => store.status === "active").length,
      pending: stores.filter((store) => store.status === "pending").length,
      rejected: stores.filter((store) => store.status === "rejected").length,
    };
  }, [stores]);

  const requestStats = useMemo(() => {
    return {
      total: storeRequests.length,
      pending: storeRequests.filter((request) => request.status === "pending")
        .length,
      approved: storeRequests.filter((request) => request.status === "approved")
        .length,
      rejected: storeRequests.filter((request) => request.status === "rejected")
        .length,
    };
  }, [storeRequests]);

  const reportStats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.status === "pending").length,
      resolved: reports.filter((report) => report.status === "resolved").length,
    };
  }, [reports]);

  const latestPendingPromos = promos
    .filter((promo) => promo.status === "pending")
    .slice(0, 6);

  const latestReports = reports.slice(0, 6);
  const latestStoreRequests = storeRequests.slice(0, 6);

  if (isLoadingUser) {
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
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">Потрібен вхід</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Щоб відкрити адмін-аналітику, потрібно увійти в акаунт
              адміністратора.
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
            <h1 className="text-4xl font-black text-red-300">Доступ закрито</h1>

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
          <span className="text-slate-300">Аналітика</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмін-аналітика
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Стан ПромоПтахи
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Швидкий огляд промокодів, магазинів, заявок і скарг. Дані
                показуються тільки для адміна.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={isLoadingData}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingData ? "Оновлюю..." : "Оновити"}
              </button>

              <Link
                href="/admin"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Модерація
              </Link>

              <Link
                href="/admin/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
              Помилка: {errorMessage}
            </div>
          )}

          {isLoadingData ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : (
            <>
              <section className="mt-8">
                <h2 className="text-3xl font-black">Промокоди</h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Усього кодів"
                    value={promoStats.total}
                    hint="Усі промокоди в базі."
                  />

                  <StatCard
                    label="Активні"
                    value={promoStats.active}
                    hint="Видимі користувачам."
                    tone="green"
                  />

                  <StatCard
                    label="На модерації"
                    value={promoStats.pending}
                    hint="Чекають рішення адміна."
                    tone="yellow"
                  />

                  <StatCard
                    label="Відхилені"
                    value={promoStats.rejected}
                    hint="Не показуються в публічній базі."
                    tone="red"
                  />
                </div>
              </section>

              <section className="mt-10">
                <h2 className="text-3xl font-black">Магазини та заявки</h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Магазинів"
                    value={storeStats.total}
                    hint="Усі магазини в базі."
                  />

                  <StatCard
                    label="Активні магазини"
                    value={storeStats.active}
                    hint="Видимі на сайті."
                    tone="green"
                  />

                  <StatCard
                    label="Заявки очікують"
                    value={requestStats.pending}
                    hint="Потрібно розглянути."
                    tone="yellow"
                  />

                  <StatCard
                    label="Скарги"
                    value={reportStats.total}
                    hint="Усі репорти на промокоди."
                    tone="orange"
                  />
                </div>
              </section>

              <section className="mt-10 grid gap-6 xl:grid-cols-3">
                <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-black">
                      Очікують модерації
                    </h2>

                    <Link
                      href="/admin"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Відкрити
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {latestPendingPromos.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
                        Немає промокодів на модерації.
                      </div>
                    ) : (
                      latestPendingPromos.map((promo) => {
                        const storeSlug = getStoreSlug(promo.stores);
                        const promoUrl = promo.slug
                          ? `/codes/${promo.slug}`
                          : `/codes/${promo.id}`;

                        return (
                          <div
                            key={promo.id}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="break-all text-xl font-black text-white">
                                  {promo.code}
                                </p>

                                {storeSlug ? (
                                  <Link
                                    href={`/stores/${storeSlug}`}
                                    className="mt-1 inline-flex text-sm font-bold text-slate-500 transition hover:text-emerald-300"
                                  >
                                    {getStoreName(promo.stores)}
                                  </Link>
                                ) : (
                                  <p className="mt-1 text-sm font-bold text-slate-500">
                                    {getStoreName(promo.stores)}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                  promo.status
                                )}`}
                              >
                                {getPromoStatusLabel(promo.status)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                href="/admin"
                                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                              >
                                Модерувати
                              </Link>

                              <Link
                                href={promoUrl}
                                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                              >
                                Відкрити
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-black">Останні скарги</h2>

                    <Link
                      href="/admin/reports"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Відкрити
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {latestReports.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
                        Скарг поки немає.
                      </div>
                    ) : (
                      latestReports.map((report) => {
                        const reportPromo = getReportPromoCode(
                          report.promo_codes
                        );

                        const promoUrl = reportPromo?.slug
                          ? `/codes/${reportPromo.slug}`
                          : reportPromo?.id
                          ? `/codes/${reportPromo.id}`
                          : "/admin/reports";

                        return (
                          <div
                            key={report.id}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="break-all text-lg font-black text-white">
                                  {reportPromo?.code || "Промокод"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDate(report.created_at)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                  report.status
                                )}`}
                              >
                                {report.status || "Новий"}
                              </span>
                            </div>

                            {report.reason && (
                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                                {report.reason}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                href="/admin/reports"
                                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                              >
                                Репорти
                              </Link>

                              <Link
                                href={promoUrl}
                                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                              >
                                Код
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-black">Заявки магазинів</h2>

                    <Link
                      href="/admin/store-requests"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Відкрити
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {latestStoreRequests.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
                        Заявок магазинів поки немає.
                      </div>
                    ) : (
                      latestStoreRequests.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="break-words text-lg font-black text-white">
                                {request.name}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {formatDate(request.created_at)}
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {getRequestStatusLabel(request.status)}
                            </span>
                          </div>

                          {request.website_url && (
                            <p className="mt-3 break-all text-sm font-bold text-slate-500">
                              {request.website_url}
                            </p>
                          )}

                          {request.comment && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                              {request.comment}
                            </p>
                          )}

                          <div className="mt-3">
                            <Link
                              href="/admin/store-requests"
                              className="inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                            >
                              Переглянути
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>

              <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <h2 className="text-2xl font-black">Швидкі переходи</h2>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Link
                    href="/admin"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Модерація кодів
                  </Link>

                  <Link
                    href="/admin/stores"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Магазини
                  </Link>

                  <Link
                    href="/admin/store-requests"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Заявки
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Репорти
                  </Link>

                  <Link
                    href="/add"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Додати код
                  </Link>
                </div>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}