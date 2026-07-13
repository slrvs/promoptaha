"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type StoreRequest = {
  id: string;
  name: string;
  website_url: string | null;
  description: string | null;
  status: string;
  requested_by: string | null;
  created_at: string;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null) {
  if (!date) return "Без дати";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function makeSlug(text: string) {
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
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function statusLabel(status: string) {
  if (status === "pending") return "На перевірці";
  if (status === "approved") return "Схвалено";
  if (status === "rejected") return "Відхилено";

  return status;
}

function statusClass(status: string) {
  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function StoreRequestsAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("store_requests")
      .select(`
        id,
        name,
        website_url,
        description,
        status,
        requested_by,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Помилка завантаження: ${error.message}`);
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setRequests((data as StoreRequest[]) || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPage();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadPage();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updateRequestStatus(id: string, status: string) {
    setMessage("");
    setBusyId(id);

    const { error } = await supabase
      .from("store_requests")
      .update({ status })
      .eq("id", id);

    setBusyId("");

    if (error) {
      setMessage(`Помилка оновлення: ${error.message}`);
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    if (status === "approved") {
      setMessage("Заявку магазину схвалено");
    } else if (status === "rejected") {
      setMessage("Заявку магазину відхилено");
    } else {
      setMessage("Заявку повернуто на перевірку");
    }
  }

  async function createStoreFromRequest(request: StoreRequest) {
    setMessage("");
    setBusyId(request.id);

    const slug = makeSlug(request.name);

    if (!slug) {
      setBusyId("");
      setMessage("Не вдалося створити slug для магазину. Зміни назву заявки.");
      return;
    }

    const { data: existingStore, error: existingError } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existingError) {
      setBusyId("");
      setMessage(`Помилка перевірки магазину: ${existingError.message}`);
      return;
    }

    if (existingStore) {
      setBusyId("");
      setMessage(`Магазин із slug "${slug}" вже існує.`);
      return;
    }

    const { error: insertError } = await supabase.from("stores").insert({
      name: request.name.trim(),
      slug,
      website_url: request.website_url || null,
      description: request.description || null,
      status: "active",
    });

    if (insertError) {
      setBusyId("");
      setMessage(`Помилка створення магазину: ${insertError.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("store_requests")
      .update({ status: "approved" })
      .eq("id", request.id);

    setBusyId("");

    if (updateError) {
      setMessage(
        `Магазин створено, але заявку не оновлено: ${updateError.message}`
      );
      await loadPage();
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: "approved" } : item
      )
    );

    setMessage(`Магазин "${request.name}" створено. Slug: ${slug}`);
  }

  const filters = [
    {
      value: "pending",
      label: "На перевірці",
      count: requests.filter((request) => request.status === "pending").length,
    },
    {
      value: "approved",
      label: "Схвалені",
      count: requests.filter((request) => request.status === "approved").length,
    },
    {
      value: "rejected",
      label: "Відхилені",
      count: requests.filter((request) => request.status === "rejected").length,
    },
    {
      value: "all",
      label: "Усі",
      count: requests.length,
    },
  ];

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((request) => request.status === statusFilter);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-4xl font-black tracking-tight">
                Запити магазинів
              </h1>

              <p className="mt-3 text-slate-400">
                Тут можна створювати нові магазини із заявок користувачів.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Промокоди
              </Link>

              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>

              <Link
                href="/"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Головна
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
                Щоб відкрити цю сторінку, потрібно увійти.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            </div>
          ) : !isAdmin ? (
            <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-400/10 p-5 text-red-300">
              У тебе немає доступу. Поточний акаунт:{" "}
              <span className="font-bold">{user.email}</span>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                <p>
                  Адмін: <span className="font-bold">{user.email}</span>
                </p>

                <button
                  onClick={loadPage}
                  className="rounded-full border border-emerald-400/30 px-4 py-2 font-bold transition hover:bg-emerald-400 hover:text-slate-950"
                >
                  Оновити список
                </button>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                  {message}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      statusFilter === filter.value
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    {filter.label}{" "}
                    <span className="opacity-70">({filter.count})</span>
                  </button>
                ))}
              </div>

              {filteredRequests.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                  {requests.length === 0
                    ? "Запитів магазинів поки немає."
                    : "У цьому фільтрі заявок немає."}
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {filteredRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">
                            Назва магазину
                          </p>

                          <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-300">
                            {request.name}
                          </h2>

                          <p className="mt-2 text-sm text-slate-500">
                            Майбутній slug:{" "}
                            <span className="text-slate-300">
                              {makeSlug(request.name)}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                            request.status
                          )}`}
                        >
                          {statusLabel(request.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
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

                        <div>
                          <p className="text-slate-600">Автор заявки</p>
                          <p className="text-slate-300">
                            {request.requested_by || "Невідомо"}
                          </p>
                        </div>
                      </div>

                      {request.description && (
                        <p className="mt-4 text-sm text-slate-400">
                          {request.description}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => createStoreFromRequest(request)}
                          disabled={busyId === request.id}
                          className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyId === request.id
                            ? "Створюю..."
                            : "Створити магазин"}
                        </button>

                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "approved")
                          }
                          disabled={busyId === request.id}
                          className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Тільки схвалити
                        </button>

                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "rejected")
                          }
                          disabled={busyId === request.id}
                          className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-black text-red-300 transition hover:bg-red-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Відхилити
                        </button>

                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "pending")
                          }
                          disabled={busyId === request.id}
                          className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          На перевірку
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}