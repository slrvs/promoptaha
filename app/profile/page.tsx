"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type PromoStatus = "pending" | "approved" | "rejected";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  submitted_by?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  description?: string | null;
  category_names?: string[] | null;
};

type StoreRequest = {
  id: string;
  store_name?: string | null;
  name?: string | null;
  website_url?: string | null;
  url?: string | null;
  description?: string | null;
  comment?: string | null;
  status?: string | null;
  submitted_by?: string | null;
  created_store_id?: string | null;
  created_at?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getRequestName(request: StoreRequest) {
  return (
    request.store_name ||
    request.name ||
    request.website_url ||
    request.url ||
    "Магазин"
  );
}

function getRequestUrl(request: StoreRequest) {
  return request.website_url || request.url || "";
}

function getRequestDescription(request: StoreRequest) {
  return request.description || request.comment || "";
}

function getStoreById(stores: Store[], storeId: string | null | undefined) {
  if (!storeId) return null;

  return stores.find((store) => store.id === storeId) || null;
}

function getPromoLink(promo: PromoCode) {
  return `/codes/${promo.slug || promo.id}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const stats = useMemo(() => {
    return {
      totalPromos: promos.length,
      pendingPromos: promos.filter((promo) => promo.status === "pending")
        .length,
      approvedPromos: promos.filter((promo) => promo.status === "approved")
        .length,
      rejectedPromos: promos.filter((promo) => promo.status === "rejected")
        .length,
      totalStoreRequests: storeRequests.length,
      approvedStoreRequests: storeRequests.filter(
        (request) => request.status === "approved"
      ).length,
    };
  }, [promos, storeRequests]);

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadData(currentUser: User | null) {
    if (!currentUser) {
      setPromos([]);
      setStores([]);
      setStoreRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    const [promosResult, storesResult, storeRequestsResult] = await Promise.all([
      supabase
        .from("promo_codes")
        .select(
          "id, slug, code, store_id, discount_value, expires_at, status, source_type, source_url, description, created_at, submitted_by"
        )
        .eq("submitted_by", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(300),

      supabase
        .from("store_category_stats")
        .select("id, name, slug, website_url, description, category_names")
        .order("name", { ascending: true })
        .limit(3000),

      supabase
        .from("store_requests")
        .select(
          "id, store_name, name, website_url, url, description, comment, status, submitted_by, created_store_id, created_at"
        )
        .eq("submitted_by", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (promosResult.error) {
      setPromos([]);
      setMessage(
        `Не вдалося завантажити твої промокоди: ${promosResult.error.message}`
      );
      setMessageType("error");
    } else {
      setPromos((promosResult.data || []) as unknown as PromoCode[]);
    }

    if (storesResult.error) {
      setStores([]);
    } else {
      setStores((storesResult.data || []) as unknown as Store[]);
    }

    if (storeRequestsResult.error) {
      setStoreRequests([]);
    } else {
      setStoreRequests(
        (storeRequestsResult.data || []) as unknown as StoreRequest[]
      );
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      await loadData(currentUser);
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      loadData(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function deletePromo(promo: PromoCode) {
    if (!user) return;

    const confirmed = window.confirm(
      `Видалити промокод "${promo.code}"? Цю дію не можна скасувати.`
    );

    if (!confirmed) return;

    if (promo.status === "approved") {
      setMessage("Схвалений промокод не можна видалити з профілю.");
      setMessageType("error");
      return;
    }

    setProcessingId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promo.id)
      .eq("submitted_by", user.id);

    setProcessingId(null);

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
              У профілі можна переглядати свої промокоди, редагувати заявки на
              модерації та бачити статус запропонованих магазинів.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>

              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Дивитись промокоди
              </Link>
            </div>
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
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Мій профіль
              </p>

              <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                Привіт 👋
              </h1>

              <p className="mt-5 break-all text-lg font-bold text-slate-400">
                {user.email}
              </p>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зібрані твої промокоди, заявки магазинів і швидкі дії.
                Пізніше сюди додамо аватарку, нікнейм і посилання на соцмережі.
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
                  className="rounded-full border border-red-400/40 px-6 py-4 font-black text-red-300 transition hover:bg-red-400/10"
                >
                  Вийти
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.totalPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  моїх промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.approvedPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалено
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.pendingPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  на модерації
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.totalStoreRequests}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  заявок магазинів
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

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Мої промокоди</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Схвалені відкриваються на сайті. Промокоди на модерації або
                  відхилені можна редагувати чи видалити.
                </p>
              </div>

              <Link
                href="/add"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : promos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">🎟️</div>

                <h3 className="mt-4 text-2xl font-black">
                  Ти ще не додавав промокоди
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                  Додай перший промокод, він піде на модерацію, а після
                  схвалення зʼявиться на сайті.
                </p>

                <Link
                  href="/add"
                  className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {promos.map((promo) => {
                  const store = getStoreById(stores, promo.store_id);
                  const isEditable =
                    promo.status === "pending" || promo.status === "rejected";

                  return (
                    <article
                      key={promo.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <StoreLogo
                            name={store?.name || "Магазин"}
                            websiteUrl={store?.website_url}
                            size="sm"
                          />

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
                                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                  {store.name}
                                </span>
                              )}
                            </div>

                            <h3 className="mt-3 break-all text-3xl font-black text-white">
                              {promo.code}
                            </h3>

                            <p className="mt-2 text-sm font-bold text-slate-500">
                              Додано: {formatDateTime(promo.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {promo.description && (
                        <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                          {promo.description}
                        </p>
                      )}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Знижка
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

                      <div className="mt-5 flex flex-wrap gap-3">
                        {promo.status === "approved" && (
                          <Link
                            href={getPromoLink(promo)}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Відкрити на сайті
                          </Link>
                        )}

                        {isEditable && (
                          <Link
                            href={`/profile/promo/${promo.id}/edit`}
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Редагувати
                          </Link>
                        )}

                        {isEditable && (
                          <button
                            type="button"
                            onClick={() => deletePromo(promo)}
                            disabled={processingId === promo.id}
                            className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processingId === promo.id
                              ? "Видаляю..."
                              : "Видалити"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Мої заявки магазинів</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Якщо адмін створив магазин із твоєї заявки, тут буде кнопка
                  для переходу.
                </p>
              </div>

              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Запропонувати
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : storeRequests.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">🏪</div>

                <h3 className="mt-4 text-2xl font-black">
                  Заявок магазинів ще немає
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                  Якщо потрібного магазину немає в базі, запропонуй його.
                </p>

                <Link
                  href="/request-store"
                  className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Запропонувати магазин
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {storeRequests.map((request) => {
                  const linkedStore = getStoreById(
                    stores,
                    request.created_store_id
                  );

                  return (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {getStatusLabel(request.status)}
                            </span>

                            {linkedStore && (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                                Магазин створено
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 break-words text-2xl font-black text-white">
                            {getRequestName(request)}
                          </h3>

                          <p className="mt-1 break-all text-sm font-bold text-slate-500">
                            {getRequestUrl(request) || "URL не вказано"}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-slate-500">
                          {formatDateTime(request.created_at)}
                        </p>
                      </div>

                      {getRequestDescription(request) && (
                        <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                          {getRequestDescription(request)}
                        </p>
                      )}

                      {linkedStore && (
                        <Link
                          href={`/stores/${linkedStore.slug}`}
                          className="mt-5 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити магазин
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}