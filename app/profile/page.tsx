"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type PromoStatus = "pending" | "approved" | "rejected";
type ProfileTab = "promos" | "requests";

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
  created_at?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  status?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

type StoreRequest = {
  id: string;
  store_name?: string | null;
  name?: string | null;
  title?: string | null;
  website_url?: string | null;
  url?: string | null;
  status?: string | null;
  submitted_by?: string | null;
  requested_by?: string | null;
  user_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

function getStatusLabel(status: string | null | undefined) {
  if (status === "pending") return "Очікує";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";
  if (status === "active") return "Активний";
  if (status === "open") return "Відкрито";
  if (status === "resolved") return "Вирішено";
  if (status === "dismissed") return "Відхилено";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "approved" || status === "active" || status === "resolved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "rejected" || status === "dismissed") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
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

function getStoreRequestName(request: StoreRequest) {
  return (
    request.store_name ||
    request.name ||
    request.title ||
    request.website_url ||
    request.url ||
    "Заявка магазину"
  );
}

function canEditPromo(promo: PromoCode) {
  return promo.status === "pending" || promo.status === "rejected";
}

function canDeletePromo(promo: PromoCode) {
  return promo.status === "pending" || promo.status === "rejected";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);

  const [activeTab, setActiveTab] = useState<ProfileTab>("promos");
  const [processingPromoId, setProcessingPromoId] = useState<string | null>(
    null
  );

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const storesById = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const counts = useMemo(() => {
    return {
      all: promos.length,
      pending: promos.filter((promo) => promo.status === "pending").length,
      approved: promos.filter((promo) => promo.status === "approved").length,
      rejected: promos.filter((promo) => promo.status === "rejected").length,
      requests: storeRequests.length,
    };
  }, [promos, storeRequests]);

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadProfile(currentUser: User) {
    setIsLoading(true);
    setMessage("");

    const [
      promosResult,
      storesResult,
      categoriesResult,
      storeRequestsResult,
    ] = await Promise.all([
      supabase
        .from("promo_codes")
        .select(
          "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, submitted_by, created_at"
        )
        .eq("submitted_by", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("stores")
        .select("id, name, slug, website_url, status")
        .order("name", { ascending: true })
        .limit(2000),

      supabase
        .from("categories")
        .select("id, name, slug, status")
        .order("name", { ascending: true })
        .limit(500),

      supabase
        .from("store_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (promosResult.error) {
      setMessage(`Не вдалося завантажити твої промокоди: ${promosResult.error.message}`);
      setMessageType("error");
    }

    if (storesResult.error) {
      setMessage(`Не вдалося завантажити магазини: ${storesResult.error.message}`);
      setMessageType("error");
    }

    if (categoriesResult.error) {
      setMessage(`Не вдалося завантажити категорії: ${categoriesResult.error.message}`);
      setMessageType("error");
    }

    setPromos((promosResult.data || []) as unknown as PromoCode[]);
    setStores((storesResult.data || []) as unknown as Store[]);
    setCategories((categoriesResult.data || []) as unknown as Category[]);

    const allRequests =
      (storeRequestsResult.data || []) as unknown as StoreRequest[];

    const ownRequests = allRequests.filter((request) => {
      return (
        request.submitted_by === currentUser.id ||
        request.requested_by === currentUser.id ||
        request.user_id === currentUser.id ||
        request.created_by === currentUser.id
      );
    });

    setStoreRequests(ownRequests);
    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        loadProfile(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function deletePromo(promo: PromoCode) {
    if (!canDeletePromo(promo)) {
      setMessage("Схвалений промокод не можна видалити з профілю.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Видалити промокод ${promo.code}? Цю дію не можна скасувати.`
    );

    if (!confirmed) return;

    setProcessingPromoId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promo.id);

    if (error) {
      setMessage(`Не вдалося видалити промокод: ${error.message}`);
      setMessageType("error");
      setProcessingPromoId(null);
      return;
    }

    setPromos((currentPromos) =>
      currentPromos.filter((currentPromo) => currentPromo.id !== promo.id)
    );

    setMessage("Промокод видалено.");
    setMessageType("success");
    setProcessingPromoId(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setPromos([]);
    setStoreRequests([]);
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

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🔐</div>

            <h1 className="mt-5 text-4xl font-black">Потрібно увійти</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Увійди, щоб бачити свої промокоди, заявки магазинів і статус
              модерації.
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
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Профіль</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Профіль
              </p>

              <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                Мої промокоди
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут видно всі промокоди, які ти додав: на модерації, схвалені
                та відхилені. Редагувати можна тільки ті, що очікують перевірки
                або були відхилені.
              </p>

              <p className="mt-4 break-all text-sm font-bold text-slate-500">
                {user.email}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border border-red-400/30 px-6 py-4 font-black text-red-300 transition hover:bg-red-400/10"
                >
                  Вийти
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{counts.all}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  всього
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {counts.pending}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  очікують
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {counts.approved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {counts.rejected}
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

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("promos")}
              className={`rounded-full px-5 py-3 font-black transition ${
                activeTab === "promos"
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Промокоди · {counts.all}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`rounded-full px-5 py-3 font-black transition ${
                activeTab === "requests"
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Заявки магазинів · {counts.requests}
            </button>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : activeTab === "promos" ? (
          promos.length === 0 ? (
            <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
              <div className="text-6xl">🎟️</div>

              <h2 className="mt-5 text-4xl font-black">
                Ти ще не додавав промокоди
              </h2>

              <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
                Додай перший код — після модерації він зʼявиться на сайті.
              </p>

              <Link
                href="/add"
                className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>
            </section>
          ) : (
            <section className="mt-8 grid gap-5">
              {promos.map((promo) => {
                const store = promo.store_id
                  ? storesById.get(promo.store_id)
                  : null;

                const category = promo.category_id
                  ? categoriesById.get(promo.category_id)
                  : null;

                const isProcessing = processingPromoId === promo.id;

                return (
                  <article
                    key={promo.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              promo.status
                            )}`}
                          >
                            {getStatusLabel(promo.status)}
                          </span>

                          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                            {getSourceLabel(promo.source_type)}
                          </span>

                          {category && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                              {category.name}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 break-all text-4xl font-black text-white">
                          {promo.code}
                        </h2>

                        <p className="mt-2 text-xl font-black text-emerald-300">
                          {promo.discount_value || "Знижка"}
                        </p>

                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Магазин: {store?.name || "Невідомий магазин"}
                        </p>

                        <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                          {promo.description || "Опис не вказано."}
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                              Статус
                            </p>
                            <p className="mt-1 font-black text-slate-200">
                              {getStatusLabel(promo.status)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-[260px] flex-col gap-3">
                        {promo.status === "approved" ? (
                          <Link
                            href={getPromoUrl(promo)}
                            className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Відкрити на сайті
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="rounded-2xl border border-slate-800 px-5 py-4 text-center font-black text-slate-600"
                          >
                            Ще не на сайті
                          </button>
                        )}

                        {store?.slug && (
                          <Link
                            href={`/stores/${store.slug}`}
                            className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Магазин
                          </Link>
                        )}

                        {canEditPromo(promo) && (
                          <Link
                            href={`/profile/promo/${promo.id}/edit`}
                            className="rounded-2xl border border-yellow-400/40 px-5 py-4 text-center font-black text-yellow-300 transition hover:bg-yellow-400/10"
                          >
                            Редагувати
                          </Link>
                        )}

                        {canDeletePromo(promo) && (
                          <button
                            type="button"
                            onClick={() => deletePromo(promo)}
                            disabled={isProcessing}
                            className="rounded-2xl border border-red-400/40 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Видалити
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )
        ) : storeRequests.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🏪</div>

            <h2 className="mt-5 text-4xl font-black">
              Ти ще не пропонував магазини
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Запропонуй магазин, якого немає в базі ПромоПтахи.
            </p>

            <Link
              href="/request-store"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Запропонувати магазин
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {storeRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>

                    <h2 className="mt-4 break-words text-3xl font-black text-white">
                      {getStoreRequestName(request)}
                    </h2>

                    <p className="mt-2 break-all text-sm font-bold text-slate-500">
                      {request.website_url || request.url || "URL не вказано"}
                    </p>
                  </div>

                  <p className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-400">
                    {formatDateTime(request.created_at)}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}