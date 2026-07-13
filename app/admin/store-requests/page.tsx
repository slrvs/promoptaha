"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

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

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getRequestName(request: StoreRequest) {
  return request.store_name || request.name || "Без назви";
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

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

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function getHostName(url: string | null | undefined) {
  if (!url) return null;

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function getUniqueSlug(baseSlug: string) {
  const cleanBaseSlug = baseSlug || "store";

  let slug = cleanBaseSlug;
  let counter = 2;

  while (true) {
    const { data, error } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }

    slug = `${cleanBaseSlug}-${counter}`;
    counter += 1;
  }
}

export default function AdminStoreRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<StoreRequest[]>([]);

  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadRequests() {
    setIsLoadingRequests(true);
    setMessage("");

    const { data, error } = await supabase
      .from("store_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setRequests([]);
      setMessage(`Помилка завантаження заявок: ${error.message}`);
      setMessageType("error");
      setIsLoadingRequests(false);
      return;
    }

    setRequests((data || []) as StoreRequest[]);
    setIsLoadingRequests(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoadingUser && isAdmin) {
      loadRequests();
    }

    if (!isLoadingUser && !isAdmin) {
      setIsLoadingRequests(false);
    }
  }, [isLoadingUser, isAdmin]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const requestName = getRequestName(request);

      const matchesFilter = filter === "all" || request.status === filter;

      const matchesSearch =
        !normalizedSearch ||
        requestName.toLowerCase().includes(normalizedSearch) ||
        (request.website_url || "").toLowerCase().includes(normalizedSearch) ||
        (request.description || "").toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [requests, filter, search]);

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  async function updateRequestStatus(requestId: string, status: string) {
    setUpdatingId(requestId);
    setMessage("");

    const { error } = await supabase
      .from("store_requests")
      .update({
        status,
      })
      .eq("id", requestId);

    setUpdatingId(null);

    if (error) {
      setMessage(`Помилка оновлення заявки: ${error.message}`);
      setMessageType("error");
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
            }
          : request
      )
    );

    setMessage(`Заявку оновлено: ${getStatusLabel(status)}.`);
    setMessageType("success");
  }

  async function createStoreFromRequest(request: StoreRequest) {
    const requestName = getRequestName(request);

    if (!requestName || requestName === "Без назви") {
      setMessage("Не можна створити магазин без назви.");
      setMessageType("error");
      return;
    }

    setUpdatingId(request.id);
    setMessage("");

    try {
      const slug = await getUniqueSlug(makeSlug(requestName));

      const { error: insertError } = await supabase.from("stores").insert({
        name: requestName,
        slug,
        description: request.description || null,
        website_url: request.website_url || null,
        status: "active",
      });

      if (insertError) {
        setMessage(`Помилка створення магазину: ${insertError.message}`);
        setMessageType("error");
        setUpdatingId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from("store_requests")
        .update({
          status: "approved",
        })
        .eq("id", request.id);

      if (updateError) {
        setMessage(
          `Магазин створено, але статус заявки не оновився: ${updateError.message}`
        );
        setMessageType("error");
        setUpdatingId(null);
        return;
      }

      setRequests((currentRequests) =>
        currentRequests.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: "approved",
              }
            : item
        )
      );

      setMessage(`Магазин “${requestName}” створено зі slug: ${slug}`);
      setMessageType("success");
      setUpdatingId(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Помилка створення магазину: ${error.message}`
          : "Помилка створення магазину."
      );
      setMessageType("error");
      setUpdatingId(null);
    }
  }

  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-400">
            Перевіряю доступ...
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
              Щоб відкрити адмінку, потрібно увійти в акаунт адміністратора.
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
            <h1 className="text-4xl font-black text-red-300">
              Немає доступу
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору.
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
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Заявки магазинів
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна перевіряти запропоновані магазини, створювати їх у
                каталозі або відхиляти заявки.
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
                href="/admin/reports"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Репорти
              </Link>

              <button
                type="button"
                onClick={loadRequests}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Оновити
              </button>
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
              onClick={() => setFilter("approved")}
              className={`rounded-3xl border p-5 text-left transition ${
                filter === "approved"
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-emerald-400/50"
              }`}
            >
              <p className="text-3xl font-black text-emerald-300">
                {approvedCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                схвалені
              </p>
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
                {requests.length}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">усього</p>
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: назва магазину, сайт, опис..."
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

          {isLoadingRequests ? (
            <div className="mt-8 grid gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Заявок не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити фільтр або пошуковий запит.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {filteredRequests.map((request) => {
                const requestName = getRequestName(request);
                const isUpdating = updatingId === request.id;
                const suggestedSlug = makeSlug(requestName);

                return (
                  <article
                    key={request.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              request.status
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>

                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                            Додано: {formatDate(request.created_at)}
                          </span>
                        </div>

                        <h2 className="mt-4 break-words text-4xl font-black text-white">
                          {requestName}
                        </h2>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Майбутній slug
                            </p>

                            <p className="mt-1 break-all font-black text-emerald-300">
                              {suggestedSlug || "store"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              Сайт
                            </p>

                            {request.website_url ? (
                              <a
                                href={request.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex break-all font-black text-emerald-300 hover:text-emerald-200"
                              >
                                {getHostName(request.website_url)} →
                              </a>
                            ) : (
                              <p className="mt-1 font-black text-slate-200">
                                Не вказано
                              </p>
                            )}
                          </div>
                        </div>

                        {request.description && (
                          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
                            {request.description}
                          </p>
                        )}
                      </div>

                      <div className="flex min-w-56 flex-col gap-3">
                        {request.status !== "approved" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => createStoreFromRequest(request)}
                            className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Створити магазин
                          </button>
                        )}

                        {request.status !== "rejected" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateRequestStatus(request.id, "rejected")
                            }
                            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Відхилити
                          </button>
                        )}

                        {request.status !== "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateRequestStatus(request.id, "pending")
                            }
                            className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            На модерацію
                          </button>
                        )}

                        {request.status === "approved" && (
                          <Link
                            href={`/stores/${suggestedSlug}`}
                            className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Перевірити магазин
                          </Link>
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