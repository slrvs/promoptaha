"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type PromoStatus = "pending" | "approved" | "rejected";
type StatusFilter = "all" | PromoStatus;

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  category_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  submitted_by?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type UserProfile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, " ");
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
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "На модерації";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-950 text-slate-300";
}

function getAuthorName(profile: UserProfile | null | undefined) {
  return profile?.display_name || profile?.username || profile?.email || "Автор не вказаний";
}

function getAuthorFallback(profile: UserProfile | null | undefined) {
  const name = getAuthorName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function promoMatchesSearch(
  promo: PromoCode,
  query: string,
  store: Store | null | undefined,
  category: Category | null | undefined,
  author: UserProfile | null | undefined
) {
  const search = normalizeText(query);

  if (!search) return true;

  const searchableText = normalizeText(
    [
      promo.code,
      promo.discount_value,
      promo.description,
      promo.source_type,
      promo.source_url,
      promo.status,
      promo.rejection_reason,
      store?.name,
      store?.slug,
      category?.name,
      category?.slug,
      author?.username,
      author?.display_name,
      author?.email,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(search);
}

function promoMatchesStatus(promo: PromoCode, statusFilter: StatusFilter) {
  if (statusFilter === "all") return true;

  return promo.status === statusFilter;
}

export default function AdminPromoModerationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [updatingPromoId, setUpdatingPromoId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === adminEmail;

  const storesMap = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const filteredPromos = useMemo(() => {
    return promos.filter((promo) => {
      const store = promo.store_id ? storesMap.get(promo.store_id) : null;
      const category = promo.category_id
        ? categoriesMap.get(promo.category_id)
        : null;
      const author = promo.submitted_by
        ? profilesMap.get(promo.submitted_by)
        : null;

      return (
        promoMatchesSearch(promo, searchQuery, store, category, author) &&
        promoMatchesStatus(promo, statusFilter)
      );
    });
  }, [
    promos,
    searchQuery,
    statusFilter,
    storesMap,
    categoriesMap,
    profilesMap,
  ]);

  const stats = useMemo(() => {
    return {
      total: promos.length,
      pending: promos.filter((promo) => promo.status === "pending").length,
      approved: promos.filter((promo) => promo.status === "approved").length,
      rejected: promos.filter((promo) => promo.status === "rejected").length,
      withReason: promos.filter((promo) => promo.rejection_reason?.trim())
        .length,
    };
  }, [promos]);

  async function loadAdminPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    setUser(userData.user);

    if (!userData.user || userData.user.email !== adminEmail) {
      setIsLoading(false);
      return;
    }

    await Promise.all([loadPromos(), loadStores(), loadCategories()]);

    setIsLoading(false);
  }

  async function loadPromos() {
    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, submitted_by, rejection_reason, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      setMessage(`Не вдалося завантажити промокоди: ${error.message}`);
      setMessageType("error");
      return;
    }

    const nextPromos = (data || []) as PromoCode[];

    setPromos(nextPromos);

    const nextReasons: Record<string, string> = {};

    for (const promo of nextPromos) {
      nextReasons[promo.id] = promo.rejection_reason || "";
    }

    setRejectionReasons(nextReasons);

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    await loadProfiles(authorIds);
  }

  async function loadStores() {
    const { data, error } = await supabase
      .from("store_category_stats")
      .select("id, name, slug, website_url")
      .order("name", { ascending: true })
      .limit(1000);

    if (error) {
      setStores([]);
      return;
    }

    setStores((data || []) as Store[]);
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .limit(300);

    if (error) {
      setCategories([]);
      return;
    }

    setCategories((data || []) as Category[]);
  }

  async function loadProfiles(authorIds: string[]) {
    if (authorIds.length === 0) {
      setProfilesMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, email")
      .in("id", authorIds);

    if (error) {
      setProfilesMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as UserProfile[]).map((profile) => [profile.id, profile])
    );

    setProfilesMap(nextMap);
  }

  useEffect(() => {
    loadAdminPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function updatePromoStatus(promo: PromoCode, nextStatus: PromoStatus) {
    setUpdatingPromoId(promo.id);
    setMessage("");

    const finalReason = (rejectionReasons[promo.id] || "").trim();

    if (nextStatus === "rejected" && finalReason.length < 3) {
      setUpdatingPromoId(null);
      setMessage("Для відхилення вкажи причину хоча б 3 символи.");
      setMessageType("error");
      return;
    }

    const payload =
      nextStatus === "rejected"
        ? {
            status: nextStatus,
            rejection_reason: finalReason,
          }
        : {
            status: nextStatus,
            rejection_reason: null,
          };

    const { error } = await supabase
      .from("promo_codes")
      .update(payload)
      .eq("id", promo.id);

    setUpdatingPromoId(null);

    if (error) {
      setMessage(`Не вдалося оновити промокод: ${error.message}`);
      setMessageType("error");
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.map((currentPromo) =>
        currentPromo.id === promo.id
          ? {
              ...currentPromo,
              status: nextStatus,
              rejection_reason:
                nextStatus === "rejected" ? finalReason : null,
            }
          : currentPromo
      )
    );

    setRejectionReasons((currentReasons) => ({
      ...currentReasons,
      [promo.id]: nextStatus === "rejected" ? finalReason : "",
    }));

    setMessage(
      nextStatus === "approved"
        ? "Промокод схвалено."
        : nextStatus === "rejected"
          ? "Промокод відхилено з причиною."
          : "Промокод повернуто на модерацію."
    );
    setMessageType("success");
  }

  async function deletePromo(promo: PromoCode) {
    const confirmed = window.confirm(
      `Видалити промокод ${promo.code}? Цю дію не можна скасувати.`
    );

    if (!confirmed) return;

    setDeletingPromoId(promo.id);
    setMessage("");

    const { error } = await supabase.from("promo_codes").delete().eq("id", promo.id);

    setDeletingPromoId(null);

    if (error) {
      setMessage(`Не вдалося видалити промокод: ${error.message}`);
      setMessageType("error");
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.filter((currentPromo) => currentPromo.id !== promo.id)
    );

    setMessage("Промокод видалено.");
    setMessageType("success");
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("pending");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[380px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 h-96 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-4xl font-black">Потрібен вхід</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Щоб відкрити модерацію промокодів, потрібно увійти.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Увійти
          </Link>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
          <div className="text-6xl">⛔</div>

          <h1 className="mt-5 text-4xl font-black">Немає доступу</h1>

          <p className="mt-4 leading-7 text-red-200">
            Ця сторінка доступна тільки адміністратору.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-red-400/40 px-6 py-4 font-black text-red-200 transition hover:bg-red-400/10"
          >
            На головну
          </Link>
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
          <span className="text-slate-300">Адмінка</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Панель адміністратора
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Модерація промокодів
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна схвалювати промокоди, відхиляти їх із причиною або
                повертати на повторну перевірку.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/comments"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Коментарі
                </Link>

                <Link
                  href="/admin/reports"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Репорти
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
                <p className="text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  всього
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.pending}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  на модерації
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.approved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалено
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {stats.rejected}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилено
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

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Код, магазин, автор, причина, опис..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Статус</span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі</option>
                <option value="pending">На модерації</option>
                <option value="approved">Схвалені</option>
                <option value="rejected">Відхилені</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Скинути
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Показано: {filteredPromos.length} / {promos.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadPromos}
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Оновити
            </button>
          </div>

          {filteredPromos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🎟️</div>

              <h3 className="mt-4 text-2xl font-black">
                Промокодів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Зміни пошук або фільтр статусу.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              {filteredPromos.map((promo) => {
                const store = promo.store_id
                  ? storesMap.get(promo.store_id)
                  : null;
                const category = promo.category_id
                  ? categoriesMap.get(promo.category_id)
                  : null;
                const author = promo.submitted_by
                  ? profilesMap.get(promo.submitted_by)
                  : null;

                return (
                  <article
                    key={promo.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              promo.status
                            )}`}
                          >
                            {getStatusLabel(promo.status)}
                          </span>

                          {store && (
                            <Link
                              href={`/stores/${store.slug}`}
                              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              {store.name}
                            </Link>
                          )}

                          {category && (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                              {category.name}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 break-all text-4xl font-black text-white">
                          {promo.code}
                        </h3>

                        <p className="mt-3 text-xl font-black text-emerald-300">
                          {promo.discount_value || "Знижка не вказана"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {promo.status === "approved" && (
                          <Link
                            href={`/codes/${promo.slug || promo.id}`}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Відкрити
                          </Link>
                        )}

                        {promo.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => updatePromoStatus(promo, "approved")}
                            disabled={updatingPromoId === promo.id}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingPromoId === promo.id
                              ? "Оновлюю..."
                              : "Схвалити"}
                          </button>
                        )}

                        {promo.status !== "pending" && (
                          <button
                            type="button"
                            onClick={() => updatePromoStatus(promo, "pending")}
                            disabled={updatingPromoId === promo.id}
                            className="rounded-full border border-yellow-300/40 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            На модерацію
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deletePromo(promo)}
                          disabled={deletingPromoId === promo.id}
                          className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingPromoId === promo.id
                            ? "Видаляю..."
                            : "Видалити"}
                        </button>
                      </div>
                    </div>

                    {promo.description && (
                      <p className="mt-4 leading-7 text-slate-400">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Автор
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-400/30 bg-slate-950 text-sm font-black text-emerald-300">
                            {author?.avatar_url ? (
                              <img
                                src={author.avatar_url}
                                alt={getAuthorName(author)}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span>{getAuthorFallback(author)}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            {author?.username ? (
                              <Link
                                href={`/u/${author.username}`}
                                className="truncate font-black text-emerald-300 transition hover:text-emerald-200"
                              >
                                {getAuthorName(author)}
                              </Link>
                            ) : (
                              <p className="truncate font-black text-slate-200">
                                {getAuthorName(author)}
                              </p>
                            )}

                            {author?.email && (
                              <p className="truncate text-xs font-bold text-slate-500">
                                {author.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Діє до
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Джерело
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {promo.source_type || "Не вказано"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Додано
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDateTime(promo.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-black text-red-200">
                          Причина відхилення
                        </span>

                        <textarea
                          value={rejectionReasons[promo.id] || ""}
                          onChange={(event) =>
                            setRejectionReasons((currentReasons) => ({
                              ...currentReasons,
                              [promo.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Наприклад: неправильне джерело, код не працює, не вказані умови..."
                          className="resize-none rounded-2xl border border-red-400/20 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400"
                        />
                      </label>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => updatePromoStatus(promo, "rejected")}
                          disabled={updatingPromoId === promo.id}
                          className="rounded-full bg-red-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingPromoId === promo.id
                            ? "Оновлюю..."
                            : "Відхилити з причиною"}
                        </button>

                        {promo.rejection_reason && (
                          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-black text-red-300">
                            Причина вже збережена
                          </span>
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