"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

type PromoStatus = "pending" | "active" | "rejected" | "expired";

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

type PromoCode = {
  id: string;
  code: string;
  store_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: PromoStatus | string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at?: string | null;
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
  }).format(new Date(date));
}

function statusLabel(status: string | null | undefined) {
  if (status === "pending") return "На перевірці";
  if (status === "active") return "Активний";
  if (status === "rejected") return "Відхилено";
  if (status === "expired") return "Завершений";

  return "Невідомо";
}

function statusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "expired") {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [filter, setFilter] = useState<"all" | PromoStatus>("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function loadAdminData() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setPromoCodes([]);
      setMessage("Спочатку потрібно увійти.");
      setIsLoading(false);
      return;
    }

    if (currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setPromoCodes([]);
      setMessage("У тебе немає доступу до адмінки.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, code, store_id, discount_value, expires_at, status, source_type, source_url, description, created_by, created_at, stores(name, slug)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setPromoCodes([]);
      setMessage(`Помилка завантаження промокодів: ${error.message}`);
      setIsLoading(false);
      return;
    }

    setPromoCodes((data as PromoCode[]) || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAdminData();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAdminData();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const pendingCount = promoCodes.filter(
    (promo) => promo.status === "pending"
  ).length;

  const activeCount = promoCodes.filter(
    (promo) => promo.status === "active"
  ).length;

  const rejectedCount = promoCodes.filter(
    (promo) => promo.status === "rejected"
  ).length;

  const expiredCount = promoCodes.filter(
    (promo) => promo.status === "expired"
  ).length;

  const filteredPromoCodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promoCodes.filter((promo) => {
      const matchesFilter = filter === "all" ? true : promo.status === filter;

      if (!matchesFilter) return false;

      if (!query) return true;

      const storeName = getStoreName(promo.stores || null)?.toLowerCase() || "";
      const code = promo.code?.toLowerCase() || "";
      const discount = promo.discount_value?.toLowerCase() || "";
      const description = promo.description?.toLowerCase() || "";
      const source = promo.source_type?.toLowerCase() || "";

      return (
        code.includes(query) ||
        storeName.includes(query) ||
        discount.includes(query) ||
        description.includes(query) ||
        source.includes(query)
      );
    });
  }, [promoCodes, filter, search]);

  async function updatePromoStatus(id: string, status: PromoStatus) {
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(`Помилка оновлення: ${error.message}`);
      return;
    }

    setPromoCodes((currentPromos) =>
      currentPromos.map((promo) =>
        promo.id === id ? { ...promo, status } : promo
      )
    );

    setMessage(`Статус промокоду змінено на “${statusLabel(status)}”.`);
  }

  async function deletePromo(id: string) {
    const confirmed = window.confirm(
      "Точно видалити цей промокод? Це не можна буде скасувати."
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase.from("promo_codes").delete().eq("id", id);

    if (error) {
      setMessage(`Помилка видалення: ${error.message}`);
      return;
    }

    setPromoCodes((currentPromos) =>
      currentPromos.filter((promo) => promo.id !== id)
    );

    setMessage("Промокод видалено.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Модерація промокодів
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Тут можна схвалювати нові промокоди, відхиляти неправильні,
                завершувати прострочені та повертати коди на перевірку.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/reports"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Репорти
              </Link>

              <Link
                href="/admin/store-requests"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Заявки магазинів
              </Link>

              <Link
                href="/codes"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Публічні коди
              </Link>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження адмінки...
            </div>
          ) : !user ? (
            <div className="mt-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-300">
              <h2 className="text-2xl font-black">
                Потрібно увійти в акаунт
              </h2>

              <p className="mt-3 text-emerald-200">
                Адмінка доступна тільки після входу.
              </p>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Увійти
                </Link>
              </div>
            </div>
          ) : !isAdmin ? (
            <div className="mt-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-300">
              <h2 className="text-2xl font-black">Немає доступу</h2>

              <p className="mt-3 text-emerald-200">
                Твій акаунт не має прав адміністратора.
              </p>
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-slate-300">
                    {promoCodes.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">усі коди</p>
                </div>

                <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {pendingCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">на перевірці</p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {activeCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">активні</p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {rejectedCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">відхилені</p>
                </div>

                <div className="rounded-3xl border border-orange-400/20 bg-orange-400/10 p-5">
                  <p className="text-3xl font-black text-orange-300">
                    {expiredCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">завершені</p>
                </div>
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Пошук за кодом, магазином, описом або джерелом..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as "all" | PromoStatus)
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="pending">На перевірці</option>
                    <option value="active">Активні</option>
                    <option value="rejected">Відхилені</option>
                    <option value="expired">Завершені</option>
                    <option value="all">Усі</option>
                  </select>
                </div>

                {filteredPromoCodes.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                    За цим фільтром промокодів немає.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {filteredPromoCodes.map((promo) => {
                      const storeName = getStoreName(promo.stores || null);
                      const storeSlug = getStoreSlug(promo.stores || null);

                      return (
                        <article
                          key={promo.id}
                          className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                                    promo.status
                                  )}`}
                                >
                                  {statusLabel(promo.status)}
                                </span>

                                <span className="inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-400">
                                  {sourceLabel(promo.source_type)}
                                </span>
                              </div>

                              <h2 className="mt-4 text-3xl font-black text-emerald-300">
                                {promo.code}
                              </h2>

                              <p className="mt-2 text-sm text-slate-500">
                                {storeSlug ? (
                                  <Link
                                    href={`/stores/${storeSlug}`}
                                    className="hover:text-emerald-300"
                                  >
                                    {storeName || "Магазин"}
                                  </Link>
                                ) : (
                                  storeName || "Магазин"
                                )}
                                {" • "}
                                {formatDate(promo.created_at)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {promo.status === "active" && (
                                <Link
                                  href={`/codes/${promo.id}`}
                                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                                >
                                  Відкрити
                                </Link>
                              )}

                              {promo.source_url && (
                                <a
                                  href={promo.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                                >
                                  Джерело
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-4">
                            <div>
                              <p className="text-slate-600">Знижка</p>
                              <p className="text-slate-300">
                                {promo.discount_value || "Не вказано"}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-600">Діє до</p>
                              <p className="text-slate-300">
                                {formatDate(promo.expires_at)}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-600">ID користувача</p>
                              <p className="break-all text-slate-300">
                                {promo.created_by || "Не вказано"}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-600">ID магазину</p>
                              <p className="break-all text-slate-300">
                                {promo.store_id || "Не вказано"}
                              </p>
                            </div>
                          </div>

                          {promo.description && (
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Опис / коментар
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-300">
                                {promo.description}
                              </p>
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              onClick={() =>
                                updatePromoStatus(promo.id, "active")
                              }
                              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                            >
                              Схвалити
                            </button>

                            <button
                              onClick={() =>
                                updatePromoStatus(promo.id, "rejected")
                              }
                              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                            >
                              Відхилити
                            </button>

                            <button
                              onClick={() =>
                                updatePromoStatus(promo.id, "expired")
                              }
                              className="rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-black text-orange-300 transition hover:bg-orange-400 hover:text-slate-950"
                            >
                              Завершити
                            </button>

                            <button
                              onClick={() =>
                                updatePromoStatus(promo.id, "pending")
                              }
                              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
                            >
                              На перевірку
                            </button>

                            <button
                              onClick={() => deletePromo(promo.id)}
                              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Видалити
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
