"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

type RequestStatus = "pending" | "approved" | "rejected";

type StoreRequest = {
  id: string;
  name: string;
  website_url?: string | null;
  description?: string | null;
  status?: RequestStatus | string | null;
  requested_by?: string | null;
  created_at?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function makeSlug(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    ы: "y",
    э: "e",
    ё: "yo",
    ъ: "",
  };

  return value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return "Невідомо";
}

function statusClass(status: string | null | undefined) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function AdminStoreRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [filter, setFilter] = useState<"all" | RequestStatus>("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function loadRequests() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setRequests([]);
      setMessage("Спочатку потрібно увійти.");
      setIsLoading(false);
      return;
    }

    if (currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setRequests([]);
      setMessage("У тебе немає доступу до цієї сторінки.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("store_requests")
      .select("id, name, website_url, description, status, requested_by, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setRequests([]);
      setMessage(`Помилка завантаження заявок: ${error.message}`);
      setIsLoading(false);
      return;
    }

    setRequests((data as StoreRequest[]) || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadRequests();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadRequests();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter =
        filter === "all" ? true : request.status === filter;

      if (!matchesFilter) return false;

      if (!query) return true;

      const name = request.name?.toLowerCase() || "";
      const website = request.website_url?.toLowerCase() || "";
      const description = request.description?.toLowerCase() || "";

      return (
        name.includes(query) ||
        website.includes(query) ||
        description.includes(query)
      );
    });
  }, [requests, filter, search]);

  async function updateRequestStatus(id: string, status: RequestStatus) {
    setMessage("");

    const { error } = await supabase
      .from("store_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(`Помилка оновлення заявки: ${error.message}`);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    setMessage(`Статус заявки змінено на “${statusLabel(status)}”.`);
  }

  async function createStoreFromRequest(request: StoreRequest) {
    setMessage("");

    const rawSlug = makeSlug(request.name);
    const slug = rawSlug || `store-${Date.now()}`;

    const confirmed = window.confirm(
      `Створити магазин "${request.name}" зі slug "${slug}"?`
    );

    if (!confirmed) return;

    const { error: storeError } = await supabase.from("stores").insert({
      name: request.name.trim(),
      slug,
      website_url: request.website_url || null,
      description: request.description || null,
      status: "active",
    });

    if (storeError) {
      setMessage(`Не вдалося створити магазин: ${storeError.message}`);
      return;
    }

    const { error: requestError } = await supabase
      .from("store_requests")
      .update({ status: "approved" })
      .eq("id", request.id);

    if (requestError) {
      setMessage(
        `Магазин створено, але заявку не схвалено: ${requestError.message}`
      );
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((currentRequest) =>
        currentRequest.id === request.id
          ? { ...currentRequest, status: "approved" }
          : currentRequest
      )
    );

    setMessage(`Магазин "${request.name}" створено і заявку схвалено.`);
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
                Заявки магазинів
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Тут можна переглядати магазини, які запропонували користувачі,
                створювати їх у каталозі або відхиляти заявки.
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

              <Link
                href="/stores"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Каталог магазинів
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
              Завантаження заявок...
            </div>
          ) : !user ? (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
              <h2 className="text-2xl font-black">
                Потрібно увійти в акаунт
              </h2>

              <p className="mt-3 text-red-200">
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
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
              <h2 className="text-2xl font-black">Немає доступу</h2>

              <p className="mt-3 text-red-200">
                Твій акаунт не має прав адміністратора.
              </p>
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-slate-300">
                    {requests.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">усі заявки</p>
                </div>

                <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {pendingCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">на перевірці</p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {approvedCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">схвалено</p>
                </div>

                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
                  <p className="text-3xl font-black text-red-300">
                    {rejectedCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">відхилено</p>
                </div>
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Пошук за назвою, сайтом або описом..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as "all" | RequestStatus)
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="pending">На перевірці</option>
                    <option value="approved">Схвалені</option>
                    <option value="rejected">Відхилені</option>
                    <option value="all">Усі</option>
                  </select>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                    За цим фільтром заявок немає.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {filteredRequests.map((request) => {
                      const requestSlug = makeSlug(request.name);

                      return (
                        <article
                          key={request.id}
                          className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                                    request.status
                                  )}`}
                                >
                                  {statusLabel(request.status)}
                                </span>

                                <span className="inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-400">
                                  slug: {requestSlug || "не створено"}
                                </span>
                              </div>

                              <h2 className="mt-4 text-3xl font-black text-white">
                                {request.name}
                              </h2>

                              <p className="mt-2 text-sm text-slate-500">
                                {formatDate(request.created_at)} •{" "}
                                <span className="break-all">
                                  {request.requested_by || "користувач не вказаний"}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {request.website_url && (
                                <a
                                  href={request.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                                >
                                  Сайт
                                </a>
                              )}
                            </div>
                          </div>

                          {request.description ? (
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Коментар користувача
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-300">
                                {request.description}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-slate-600">
                              Користувач не залишив опис.
                            </p>
                          )}

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              onClick={() => createStoreFromRequest(request)}
                              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                            >
                              Створити магазин
                            </button>

                            <button
                              onClick={() =>
                                updateRequestStatus(request.id, "approved")
                              }
                              className="rounded-2xl border border-emerald-400/30 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                            >
                              Тільки схвалити
                            </button>

                            <button
                              onClick={() =>
                                updateRequestStatus(request.id, "rejected")
                              }
                              className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-400 hover:text-slate-950"
                            >
                              Відхилити
                            </button>

                            <button
                              onClick={() =>
                                updateRequestStatus(request.id, "pending")
                              }
                              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
                            >
                              На перевірку
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