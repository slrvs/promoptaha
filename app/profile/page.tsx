"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoStatus = "pending" | "active" | "rejected" | "expired";

type StoreRequestStatus = "pending" | "approved" | "rejected";

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

type StoreRequest = {
  id: string;
  name: string;
  website_url?: string | null;
  description?: string | null;
  status?: StoreRequestStatus | string | null;
  requested_by?: string | null;
  created_at?: string | null;
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

function promoStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "На перевірці";
  if (status === "active") return "Активний";
  if (status === "rejected") return "Відхилено";
  if (status === "expired") return "Завершений";

  return "Невідомо";
}

function requestStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "На перевірці";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return "Невідомо";
}

function statusClass(status: string | null | undefined) {
  if (status === "active" || status === "approved") {
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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [promoFilter, setPromoFilter] = useState<
    "all" | "pending" | "active" | "rejected" | "expired"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setPromoCodes([]);
      setStoreRequests([]);
      setIsLoading(false);
      return;
    }

    const { data: promosData, error: promosError } = await supabase
      .from("promo_codes")
      .select(
        "id, code, store_id, discount_value, expires_at, status, source_type, source_url, description, created_by, created_at, stores(name, slug)"
      )
      .eq("created_by", currentUser.id)
      .order("created_at", { ascending: false });

    if (promosError) {
      setPromoCodes([]);
      setMessage(`Помилка завантаження промокодів: ${promosError.message}`);
    } else {
      setPromoCodes((promosData as PromoCode[]) || []);
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from("store_requests")
      .select(
        "id, name, website_url, description, status, requested_by, created_at"
      )
      .eq("requested_by", currentUser.id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      setStoreRequests([]);
      setMessage(`Помилка завантаження заявок: ${requestsError.message}`);
    } else {
      setStoreRequests((requestsData as StoreRequest[]) || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const filteredPromoCodes = useMemo(() => {
    if (promoFilter === "all") return promoCodes;

    return promoCodes.filter((promo) => promo.status === promoFilter);
  }, [promoCodes, promoFilter]);

  const pendingPromos = promoCodes.filter(
    (promo) => promo.status === "pending"
  ).length;

  const activePromos = promoCodes.filter(
    (promo) => promo.status === "active"
  ).length;

  const rejectedPromos = promoCodes.filter(
    (promo) => promo.status === "rejected"
  ).length;

  const expiredPromos = promoCodes.filter(
    (promo) => promo.status === "expired"
  ).length;

  const pendingRequests = storeRequests.filter(
    (request) => request.status === "pending"
  ).length;

  async function signOut() {
    await supabase.auth.signOut();

    setUser(null);
    setPromoCodes([]);
    setStoreRequests([]);
    setMessage("Ти вийшов з акаунта.");
  }

  async function deletePendingPromo(id: string) {
    const confirmed = window.confirm(
      "Точно видалити цей промокод? Це не можна буде скасувати."
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      setMessage(`Помилка видалення: ${error.message}`);
      return;
    }

    setPromoCodes((current) => current.filter((promo) => promo.id !== id));
    setMessage("Промокод видалено.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Профіль
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Кабінет користувача
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Тут зібрані твої промокоди, заявки магазинів і статуси
                перевірки.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/add"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Запропонувати магазин
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
              Завантаження профілю...
            </div>
          ) : !user ? (
            <div className="mt-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-300">
              <h2 className="text-2xl font-black">
                Потрібно увійти в акаунт
              </h2>

              <p className="mt-3 text-emerald-200">
                Профіль доступний тільки зареєстрованим користувачам.
              </p>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Увійти або зареєструватись
                </Link>
              </div>
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                  <h2 className="text-2xl font-black">Акаунт</h2>

                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="mt-1 break-all font-bold text-emerald-300">
                      {user.email}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <Link
                      href="/add"
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                    >
                      Додати новий промокод
                    </Link>

                    <Link
                      href="/request-store"
                      className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
                    >
                      Запропонувати магазин
                    </Link>

                    <button
                      onClick={signOut}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                    >
                      Вийти з акаунта
                    </button>
                  </div>
                </aside>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-3xl font-black text-emerald-300">
                      {promoCodes.length}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      всього промокодів
                    </p>
                  </div>

                  <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                    <p className="text-3xl font-black text-yellow-300">
                      {pendingPromos}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      на перевірці
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                    <p className="text-3xl font-black text-emerald-300">
                      {activePromos}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">активних</p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-3xl font-black text-slate-300">
                      {storeRequests.length}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      заявок магазинів
                    </p>
                  </div>
                </section>
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                      Мої промокоди
                    </p>

                    <h2 className="text-3xl font-black tracking-tight">
                      Додані тобою коди
                    </h2>

                    <p className="mt-2 text-slate-400">
                      Pending-промокоди можна редагувати або видалити до
                      модерації.
                    </p>
                  </div>

                  <Link
                    href="/add"
                    className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Додати код
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-5">
                  <button
                    onClick={() => setPromoFilter("all")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      promoFilter === "all"
                        ? "border-slate-300 bg-slate-300 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-300 hover:text-white"
                    }`}
                  >
                    Усі ({promoCodes.length})
                  </button>

                  <button
                    onClick={() => setPromoFilter("pending")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      promoFilter === "pending"
                        ? "border-yellow-400 bg-yellow-400 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-yellow-400 hover:text-yellow-300"
                    }`}
                  >
                    На перевірці ({pendingPromos})
                  </button>

                  <button
                    onClick={() => setPromoFilter("active")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      promoFilter === "active"
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    Активні ({activePromos})
                  </button>

                  <button
                    onClick={() => setPromoFilter("rejected")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      promoFilter === "rejected"
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    Відхилені ({rejectedPromos})
                  </button>

                  <button
                    onClick={() => setPromoFilter("expired")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      promoFilter === "expired"
                        ? "border-orange-400 bg-orange-400 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-orange-400 hover:text-orange-300"
                    }`}
                  >
                    Завершені ({expiredPromos})
                  </button>
                </div>

                {filteredPromoCodes.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                    {promoCodes.length === 0
                      ? "Ти ще не додавав промокоди."
                      : "За цим фільтром промокодів немає."}
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                                  promo.status
                                )}`}
                              >
                                {promoStatusLabel(promo.status)}
                              </span>

                              <h3 className="mt-4 text-3xl font-black text-emerald-300">
                                {promo.code}
                              </h3>

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

                            {promo.status === "active" && (
                              <Link
                                href={`/codes/${promo.id}`}
                                className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                              >
                                Відкрити
                              </Link>
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
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
                              <p className="text-slate-600">Джерело</p>
                              <p className="text-slate-300">
                                {sourceLabel(promo.source_type)}
                              </p>
                            </div>
                          </div>

                          {promo.description && (
                            <p className="mt-4 text-sm leading-6 text-slate-400">
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
                              Джерело →
                            </a>
                          )}

                          {promo.status === "pending" && (
                            <div className="mt-5 flex flex-wrap gap-3">
                              <Link
                                href={`/profile/promo/${promo.id}/edit`}
                                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                              >
                                Редагувати
                              </Link>

                              <button
                                onClick={() => deletePendingPromo(promo.id)}
                                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                              >
                                Видалити
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="mb-3 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
                      Мої заявки магазинів
                    </p>

                    <h2 className="text-3xl font-black tracking-tight">
                      Запропоновані магазини
                    </h2>

                    <p className="mt-2 text-slate-400">
                      Тут видно, які магазини ти пропонував додати.
                    </p>
                  </div>

                  <div className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300">
                    На перевірці: {pendingRequests}
                  </div>
                </div>

                {storeRequests.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                    Ти ще не пропонував магазини.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {storeRequests.map((request) => (
                      <article
                        key={request.id}
                        className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                                request.status
                              )}`}
                            >
                              {requestStatusLabel(request.status)}
                            </span>

                            <h3 className="mt-4 text-2xl font-black text-white">
                              {request.name}
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                              {formatDate(request.created_at)}
                            </p>
                          </div>

                          {request.website_url && (
                            <a
                              href={request.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Сайт →
                            </a>
                          )}
                        </div>

                        {request.description && (
                          <p className="mt-4 text-sm leading-6 text-slate-400">
                            {request.description}
                          </p>
                        )}
                      </article>
                    ))}
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
