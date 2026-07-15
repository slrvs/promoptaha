"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import { getHostName, normalizeUrl } from "@/lib/searchAliases";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\s+/g, " ");
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

function getStoreHost(store: Store) {
  if (!store.website_url) return "";

  const normalized = normalizeUrl(store.website_url);

  return getHostName(normalized || store.website_url) || "";
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

function getLinkedStore(request: StoreRequest, stores: Store[]) {
  if (!request.created_store_id) return null;

  return stores.find((store) => store.id === request.created_store_id) || null;
}

function findSimilarStores(
  stores: Store[],
  storeName: string,
  websiteUrl: string
) {
  const normalizedStoreName = normalizeText(storeName);
  const normalizedWebsiteUrl = normalizeUrl(websiteUrl);
  const host = normalizedWebsiteUrl ? getHostName(normalizedWebsiteUrl) : "";

  if (!normalizedStoreName && !host) {
    return [];
  }

  return stores.filter((store) => {
    const existingName = normalizeText(store.name);
    const existingSlug = normalizeText(store.slug);
    const existingHost = getStoreHost(store);

    if (normalizedStoreName && existingName === normalizedStoreName) {
      return true;
    }

    if (normalizedStoreName && existingSlug === normalizedStoreName) {
      return true;
    }

    if (host && existingHost && host === existingHost) {
      return true;
    }

    return false;
  });
}

export default function RequestStorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [myRequests, setMyRequests] = useState<StoreRequest[]>([]);

  const [storeName, setStoreName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const similarStores = useMemo(() => {
    return findSimilarStores(stores, storeName, websiteUrl);
  }, [stores, storeName, websiteUrl]);

  const canSubmit = Boolean(
    user && storeName.trim() && !isSubmitting && !isLoading
  );

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadData(currentUser: User | null) {
    setIsLoading(true);
    setMessage("");

    const storesResult = await supabase
      .from("store_category_stats")
      .select("id, name, slug, description, website_url, status, category_names")
      .order("name", { ascending: true })
      .limit(3000);

    if (storesResult.error) {
      setStores([]);
      setMessage(
        `Не вдалося завантажити магазини: ${storesResult.error.message}`
      );
      setMessageType("error");
    } else {
      setStores((storesResult.data || []) as unknown as Store[]);
    }

    if (currentUser) {
      const requestsResult = await supabase
        .from("store_requests")
        .select(
          "id, store_name, name, website_url, url, description, comment, status, submitted_by, created_store_id, created_at"
        )
        .eq("submitted_by", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (requestsResult.error) {
        setMyRequests([]);
      } else {
        setMyRequests((requestsResult.data || []) as unknown as StoreRequest[]);
      }
    } else {
      setMyRequests([]);
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

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Щоб запропонувати магазин, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!storeName.trim()) {
      setMessage("Вкажи назву магазину.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const finalStoreName = storeName.trim();
    const normalizedWebsiteUrl = normalizeUrl(websiteUrl.trim()) || null;
    const finalDescription = description.trim() || null;

    const { data, error } = await supabase
      .from("store_requests")
      .insert({
        store_name: finalStoreName,
        name: finalStoreName,
        website_url: normalizedWebsiteUrl,
        url: normalizedWebsiteUrl,
        description: finalDescription,
        comment: finalDescription,
        status: "pending",
        submitted_by: user.id,
      })
      .select(
        "id, store_name, name, website_url, url, description, comment, status, submitted_by, created_store_id, created_at"
      )
      .single();

    setIsSubmitting(false);

    if (error) {
      setMessage(`Не вдалося відправити заявку: ${error.message}`);
      setMessageType("error");
      return;
    }

    setMyRequests((currentRequests) => [
      data as unknown as StoreRequest,
      ...currentRequests,
    ]);

    setStoreName("");
    setWebsiteUrl("");
    setDescription("");

    setMessage(
      "Заявку відправлено. Адмін перевірить магазин і додасть його в базу."
    );
    setMessageType("success");
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

            <h1 className="mt-5 text-4xl font-black">
              Увійди, щоб запропонувати магазин
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Заявки магазинів привʼязуються до акаунта, щоб ти міг бачити
              їхній статус у профілі.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Переглянути магазини
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
          <Link href="/stores" className="hover:text-emerald-300">
            Магазини
          </Link>
          <span>/</span>
          <span className="text-slate-300">Запропонувати магазин</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Запропонувати магазин
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Немає магазину?
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Відправ заявку, якщо потрібного магазину ще немає в базі.
                Після перевірки адмін додасть його, і до нього можна буде
                привʼязувати промокоди.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Перевірити магазини
                </Link>

                <Link
                  href="/profile"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Мій профіль
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-3xl font-black">Як це працює</h2>

              <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
                <p>1. Ти вказуєш назву магазину та сайт.</p>
                <p>2. Адмін перевіряє, чи магазину ще немає в базі.</p>
                <p>
                  3. Після схвалення магазин зʼявляється на сторінці магазинів.
                </p>
                <p>4. Далі можна додавати промокоди на модерацію.</p>
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

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
          <form
            onSubmit={submitRequest}
            className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6"
          >
            <h2 className="text-3xl font-black">Дані магазину</h2>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Назва магазину *
                </span>

                <input
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  placeholder="Наприклад: Rozetka, Comfy, KRKR..."
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Сайт магазину
                </span>

                <input
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Коментар
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  placeholder="Напиши, чому варто додати цей магазин, або де ти бачив промокод."
                  className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              {similarStores.length > 0 && (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5">
                  <p className="font-black text-yellow-300">
                    Можливо, цей магазин уже є
                  </p>

                  <div className="mt-4 grid gap-3">
                    {similarStores.slice(0, 5).map((store) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.slug}`}
                        className="rounded-2xl border border-yellow-400/20 bg-slate-950/70 p-4 transition hover:border-yellow-300"
                      >
                        <div className="flex items-center gap-4">
                          <StoreLogo
                            name={store.name}
                            websiteUrl={store.website_url}
                            size="sm"
                          />

                          <div>
                            <p className="font-black text-yellow-100">
                              {store.name}
                            </p>

                            <p className="mt-1 break-all text-sm font-bold text-yellow-200/70">
                              /stores/{store.slug}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-emerald-400 px-6 py-5 text-lg font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Відправляю..." : "Відправити заявку"}
              </button>
            </div>
          </form>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Мої заявки</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Тут видно останні заявки, які ти відправив з цього акаунта.
            </p>

            {isLoading ? (
              <div className="mt-6 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-950"
                  />
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                <div className="text-5xl">🏪</div>

                <p className="mt-4 font-black text-slate-300">
                  Ти ще не відправляв заявки
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {myRequests.map((request) => {
                  const linkedStore = getLinkedStore(request, stores);

                  return (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {getStatusLabel(request.status)}
                            </span>

                            {linkedStore && (
                              <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                                Магазин створено
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 break-words text-xl font-black text-white">
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
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                          {getRequestDescription(request)}
                        </p>
                      )}

                      {linkedStore && (
                        <Link
                          href={`/stores/${linkedStore.slug}`}
                          className="mt-4 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
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