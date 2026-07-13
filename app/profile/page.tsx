"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  code: string;
  discount_value: string | null;
  expires_at: string | null;
  status: string;
  source_type: string | null;
  source_url: string | null;
  description: string | null;
  created_at: string;
  stores: {
    name: string;
    slug: string;
  } | null;
};

type StoreRequest = {
  id: string;
  name: string;
  website_url: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null | undefined) {
  if (!date) return "Без дати";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function promoStatusLabel(status: string) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На перевірці";
  if (status === "expired") return "Закінчився";
  if (status === "rejected") return "Відхилено";

  return status;
}

function requestStatusLabel(status: string) {
  if (status === "pending") return "На перевірці";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status;
}

function statusClass(status: string) {
  if (status === "active" || status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "expired") {
    return "border-slate-600 bg-slate-800 text-slate-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
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

    const { data: promoData, error: promoError } = await supabase
      .from("promo_codes")
      .select(`
        id,
        code,
        discount_value,
        expires_at,
        status,
        source_type,
        source_url,
        description,
        created_at,
        stores (
          name,
          slug
        )
      `)
      .eq("created_by", currentUser.id)
      .order("created_at", { ascending: false });

    if (promoError) {
      setMessage(`Помилка завантаження промокодів: ${promoError.message}`);
      setPromoCodes([]);
    } else {
      setPromoCodes((promoData as PromoCode[]) || []);
    }

    const { data: requestData, error: requestError } = await supabase
      .from("store_requests")
      .select(`
        id,
        name,
        website_url,
        description,
        status,
        created_at
      `)
      .eq("requested_by", currentUser.id)
      .order("created_at", { ascending: false });

    if (requestError) {
      setMessage(
        `Помилка завантаження заявок магазинів: ${requestError.message}`
      );
      setStoreRequests([]);
    } else {
      setStoreRequests((requestData as StoreRequest[]) || []);
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

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Профіль
              </p>

              <h1 className="text-4xl font-black tracking-tight">
                Мій кабінет
              </h1>

              <p className="mt-3 text-slate-400">
                Тут видно твої промокоди та заявки на додавання магазинів.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/add"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Додати промокод
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Запропонувати магазин
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Завантаження...
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300">
                Щоб бачити профіль, потрібно увійти в акаунт.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                Ти увійшов як: <span className="font-bold">{user.email}</span>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {message}
                </div>
              )}

              <section className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight">
                    Мої промокоди
                  </h2>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400">
                    {promoCodes.length}
                  </span>
                </div>

                {promoCodes.length === 0 ? (
                  <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                    Ти ще не додавав промокоди.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4">
                    {promoCodes.map((promo) => (
                      <article
                        key={promo.id}
                        className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-500">
                              {promo.stores?.name || "Магазин"}
                            </p>

                            <p className="mt-1 text-2xl font-black tracking-tight text-emerald-300">
                              {promo.code}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                              promo.status
                            )}`}
                          >
                            {promoStatusLabel(promo.status)}
                          </span>
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
                            <p className="text-slate-600">Додано</p>
                            <p className="text-slate-300">
                              {formatDate(promo.created_at)}
                            </p>
                          </div>
                        </div>

                        {promo.description && (
                          <p className="mt-4 text-sm text-slate-400">
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
                            Відкрити джерело →
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight">
                    Мої заявки магазинів
                  </h2>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400">
                    {storeRequests.length}
                  </span>
                </div>

                {storeRequests.length === 0 ? (
                  <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                    Ти ще не пропонував магазини.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4">
                    {storeRequests.map((request) => (
                      <article
                        key={request.id}
                        className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-500">
                              Запит магазину
                            </p>

                            <p className="mt-1 text-2xl font-black tracking-tight text-emerald-300">
                              {request.name}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                              request.status
                            )}`}
                          >
                            {requestStatusLabel(request.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                          <div>
                            <p className="text-slate-600">Сайт</p>
                            {request.website_url ? (
                              <a
                                href={request.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-emerald-300 hover:text-emerald-200"
                              >
                                Відкрити →
                              </a>
                            ) : (
                              <p className="text-slate-300">Не вказано</p>
                            )}
                          </div>

                          <div>
                            <p className="text-slate-600">Додано</p>
                            <p className="text-slate-300">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>

                        {request.description && (
                          <p className="mt-4 text-sm text-slate-400">
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