"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type StatusFilter = "pending" | "active" | "rejected" | "all";

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
  normalized_code?: string | null;
  store_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  stores?: StoreJoin;
};

type StoreRequest = {
  id: string;
  name?: string | null;
  store_name?: string | null;
  website_url?: string | null;
  description?: string | null;
  status?: string | null;
  requested_by?: string | null;
  created_at?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getStoreName(promo: PromoCode) {
  if (Array.isArray(promo.stores)) {
    return promo.stores[0]?.name || "Магазин";
  }

  return promo.stores?.name || "Магазин";
}

function getStoreSlug(promo: PromoCode) {
  if (Array.isArray(promo.stores)) {
    return promo.stores[0]?.slug || null;
  }

  return promo.stores?.slug || null;
}

function getRequestName(request: StoreRequest) {
  return request.store_name || request.name || "Без назви";
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getSourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Не вказано";
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Схвалено";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилено";
  if (status === "approved") return "Схвалено";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active" || status === "approved") {
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

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function canEditPromo(status: string | null | undefined) {
  return status === "pending" || status === "rejected";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);

  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadPromos(currentUserId: string) {
    setIsLoadingPromos(true);
    setMessage("");

    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, code, normalized_code, store_id, discount_value, expires_at, status, source_type, source_url, description, created_by, created_at, stores(name, slug)"
      )
      .eq("created_by", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setPromos([]);
      setMessage(`Помилка завантаження промокодів: ${error.message}`);
      setMessageType("error");
      setIsLoadingPromos(false);
      return;
    }

    setPromos((data || []) as PromoCode[]);
    setIsLoadingPromos(false);
  }

  async function loadStoreRequests(currentUserId: string) {
    setIsLoadingRequests(true);

    const { data, error } = await supabase
      .from("store_requests")
      .select("*")
      .eq("requested_by", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setStoreRequests([]);
      setIsLoadingRequests(false);
      return;
    }

    setStoreRequests((data || []) as StoreRequest[]);
    setIsLoadingRequests(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoadingUser && user) {
      loadPromos(user.id);
      loadStoreRequests(user.id);
    }

    if (!isLoadingUser && !user) {
      setIsLoadingPromos(false);
      setIsLoadingRequests(false);
    }
  }, [isLoadingUser, user]);

  const filteredPromos = useMemo(() => {
    const normalized = normalizeSearch(search);

    return promos.filter((promo) => {
      const storeName = getStoreName(promo);

      const matchesFilter = filter === "all" || promo.status === filter;

      const matchesSearch =
        !normalized ||
        promo.code.toLowerCase().includes(normalized) ||
        (promo.normalized_code || "").toLowerCase().includes(normalized) ||
        storeName.toLowerCase().includes(normalized) ||
        (promo.discount_value || "").toLowerCase().includes(normalized) ||
        (promo.description || "").toLowerCase().includes(normalized) ||
        (promo.source_url || "").toLowerCase().includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [promos, filter, search]);

  const pendingCount = promos.filter((promo) => promo.status === "pending").length;
  const activeCount = promos.filter((promo) => promo.status === "active").length;
  const rejectedCount = promos.filter(
    (promo) => promo.status === "rejected"
  ).length;

  async function deletePromo(promo: PromoCode) {
    if (!canEditPromo(promo.status)) {
      setMessage("Можна видаляти тільки коди на модерації або відхилені.");
      setMessageType("error");
      return;
    }

    const isConfirmed = window.confirm(
      `Видалити промокод ${promo.code}? Цю дію не можна скасувати.`
    );

    if (!isConfirmed) return;

    setDeletingId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promo.id);

    setDeletingId(null);

    if (error) {
      setMessage(`Помилка видалення: ${error.message}`);
      setMessageType("error");
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.filter((item) => item.id !== promo.id)
    );

    setMessage("Промокод видалено.");
    setMessageType("success");
  }

  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Завантаження профілю...
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
              Щоб відкрити профіль, потрібно увійти в акаунт.
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

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Профіль
              </p>

              <h1 className="break-words text-5xl font-black tracking-tight">
                Мої промокоди
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зібрані твої додані промокоди та заявки магазинів. Коди на
                модерації або відхилені можна редагувати.
              </p>

              <p className="mt-3 break-all text-sm font-bold text-slate-500">
                {user.email}
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
              <p className="mt-2 text-sm font-bold text-slate-500">
                на модерації
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "active"
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-emerald-400/50"
              }`}
            >
              <p className="text-3xl font-black text-emerald-300">
                {activeCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">схвалені</p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "rejected"
                  ? "border-red-400 bg-red-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-red-400/50"
              }`}
            >
              <p className="text-3xl font-black text-red-300">
                {rejectedCount}
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
                {promos.length}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">усього</p>
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: код, магазин, опис, джерело..."
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

          {isLoadingPromos ? (
            <div className="mt-8 grid gap-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Промокодів не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити фільтр або додай новий промокод.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {filteredPromos.map((promo) => {
                const storeName = getStoreName(promo);
                const storeSlug = getStoreSlug(promo);
                const isDeleting = deletingId === promo.id;
                const editable = canEditPromo(promo.status);

                return (
                  <article
                    key={promo.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              promo.status
                            )}`}
                          >
                            {getStatusLabel(promo.status)}
                          </span>

                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                            {getSourceLabel(promo.source_type)}
                          </span>

                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                            Додано: {formatDateTime(promo.created_at)}
                          </span>
                        </div>

                        <h2 className="mt-4 break-all text-4xl font-black text-white">
                          {promo.code}
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
                              Знижка / умова
                            </p>

                            <p className="mt-1 font-black text-slate-200">
                              {promo.discount_value || "Не вказано"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Діє до
                            </p>

                            <p className="mt-1 font-black text-slate-200">
                              {formatDate(promo.expires_at)}
                            </p>
                          </div>
                        </div>

                        {promo.description && (
                          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
                            {promo.description}
                          </p>
                        )}

                        {promo.source_url && (
                          <a
                            href={promo.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Відкрити джерело →
                          </a>
                        )}
                      </div>

                      <div className="flex min-w-56 flex-col gap-3">
                        {promo.status === "active" && (
                          <Link
                            href={`/codes/${promo.id}`}
                            className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Відкрити
                          </Link>
                        )}

                        {editable && (
                          <Link
                            href={`/profile/promo/${promo.id}/edit`}
                            className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Редагувати
                          </Link>
                        )}

                        {editable && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => deletePromo(promo)}
                            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? "Видаляю..." : "Видалити"}
                          </button>
                        )}

                        {!editable && promo.status !== "active" && (
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm leading-6 text-slate-500">
                            Для цього статусу редагування недоступне.
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Мої заявки магазинів
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Тут видно магазини, які ти пропонував додати в каталог.
              </p>
            </div>

            <Link
              href="/request-store"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Запропонувати магазин
            </Link>
          </div>

          {isLoadingRequests ? (
            <div className="mt-8 h-44 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950" />
          ) : storeRequests.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🏪</div>

              <h2 className="mt-4 text-3xl font-black">
                Заявок магазинів ще немає
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Якщо потрібного магазину немає в каталозі — запропонуй його.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {storeRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                >
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>

                  <h3 className="mt-4 break-words text-2xl font-black text-white">
                    {getRequestName(request)}
                  </h3>

                  {request.website_url && (
                    <a
                      href={request.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex break-all text-sm font-bold text-emerald-300 hover:text-emerald-200"
                    >
                      {request.website_url} →
                    </a>
                  )}

                  {request.description && (
                    <p className="mt-4 line-clamp-4 leading-7 text-slate-400">
                      {request.description}
                    </p>
                  )}

                  <p className="mt-5 text-sm font-bold text-slate-500">
                    Додано: {formatDateTime(request.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}