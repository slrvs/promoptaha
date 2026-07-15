"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import { getFriendlyErrorMessage } from "@/lib/friendlyError";

type AdminActivityLog = {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action_name: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  details?: Record<string, unknown> | null;
  created_at?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

function getActionLabel(actionName: string) {
  const labels: Record<string, string> = {
    approve_promo: "Схвалено промокод",
    reject_promo: "Відхилено промокод",
    send_promo_pending: "Повернуто промокод на модерацію",
    update_promo: "Оновлено промокод",
    delete_promo: "Видалено промокод",

    approve_store_request: "Схвалено заявку магазину",
    reject_store_request: "Відхилено заявку магазину",
    send_store_request_pending: "Повернуто заявку на розгляд",
    link_store_request: "Привʼязано магазин до заявки",
    update_store_request: "Оновлено заявку магазину",

    hide_comment: "Приховано коментар",
    restore_comment: "Відновлено коментар",
    update_comment: "Оновлено коментар",
    delete_comment: "Видалено коментар",
  };

  return labels[actionName] || actionName;
}

function getEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    promo_code: "Промокод",
    store_request: "Заявка магазину",
    comment: "Коментар",
  };

  return labels[entityType] || entityType;
}

function getActionClass(actionName: string) {
  if (actionName.includes("approve") || actionName.includes("restore")) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (
    actionName.includes("reject") ||
    actionName.includes("delete") ||
    actionName.includes("hide")
  ) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (actionName.includes("pending") || actionName.includes("update")) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "—";

  if (status === "approved") return "Схвалено";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилено";
  if (status === "visible") return "Видимий";
  if (status === "hidden") return "Прихований";

  return status;
}

function stringifyDetails(details: Record<string, unknown> | null | undefined) {
  if (!details || Object.keys(details).length === 0) return "";

  return JSON.stringify(details, null, 2);
}

export default function AdminActivityPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesEntity =
        entityFilter === "all" || log.entity_type === entityFilter;

      const matchesAction =
        actionFilter === "all" || log.action_name === actionFilter;

      const searchableText = [
        log.action_name,
        getActionLabel(log.action_name),
        log.entity_type,
        getEntityLabel(log.entity_type),
        log.entity_label,
        log.actor_email,
        log.old_status,
        log.new_status,
        log.entity_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesEntity && matchesAction && matchesSearch;
    });
  }, [logs, search, entityFilter, actionFilter]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action_name))).sort();
  }, [logs]);

  const totalApproveActions = useMemo(() => {
    return logs.filter((log) => log.action_name.includes("approve")).length;
  }, [logs]);

  const totalRejectActions = useMemo(() => {
    return logs.filter(
      (log) =>
        log.action_name.includes("reject") ||
        log.action_name.includes("delete") ||
        log.action_name.includes("hide")
    ).length;
  }, [logs]);

  async function loadActivityLogs() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setAuthUser(currentUser);

    const currentIsAdmin = currentUser?.email === adminEmail;

    setIsAdmin(currentIsAdmin);

    if (!currentUser || !currentIsAdmin) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select(
        "id, actor_id, actor_email, action_name, entity_type, entity_id, entity_label, old_status, new_status, details, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setLogs([]);
      setMessage(getFriendlyErrorMessage(error));
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    setLogs((data || []) as AdminActivityLog[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadActivityLogs();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setAuthUser(nextUser);
      setIsAdmin(nextUser?.email === adminEmail);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[360px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 h-96 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!authUser || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
          <div className="text-6xl">🔒</div>

          <h1 className="mt-5 text-4xl font-black">Немає доступу</h1>

          <p className="mt-4 leading-7 text-red-100">
            Журнал дій доступний тільки адміну.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
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

          <Link href="/admin" className="hover:text-emerald-300">
            Адмін
          </Link>

          <span>/</span>
          <span className="text-slate-300">Журнал дій</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-yellow-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-yellow-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Адмінський журнал
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Журнал дій адміністратора
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зберігаються нові дії адміна: схвалення й відхилення
                промокодів, робота із заявками магазинів, приховування та
                видалення коментарів.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadActivityLogs}
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Оновити журнал
                </button>

                <Link
                  href="/admin"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Модерація промокодів
                </Link>

                <Link
                  href="/admin/comments"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Коментарі
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">
                  {logs.length}
                </p>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  записів у журналі
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {totalApproveActions}
                </p>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  позитивних дій
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-red-300">
                  {totalRejectActions}
                </p>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилень / видалень
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {filteredLogs.length}
                </p>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  показано зараз
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
          <div className="grid gap-4 lg:grid-cols-[1fr_260px_260px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук за дією, обʼєктом, email, статусом..."
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі обʼєкти</option>
              <option value="promo_code">Промокоди</option>
              <option value="store_request">Заявки магазинів</option>
              <option value="comment">Коментарі</option>
            </select>

            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі дії</option>

              {uniqueActions.map((actionName) => (
                <option key={actionName} value={actionName}>
                  {getActionLabel(actionName)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {filteredLogs.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
              <div className="text-5xl">🧾</div>

              <h2 className="mt-4 text-3xl font-black">Записів поки немає</h2>

              <p className="mt-3 leading-7 text-slate-400">
                Виконай нову адмінську дію після встановлення SQL-тригерів:
                наприклад, схвали або відхили промокод.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const detailsText = stringifyDetails(log.details);

              return (
                <article
                  key={log.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 transition hover:border-emerald-400/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getActionClass(
                            log.action_name
                          )}`}
                        >
                          {getActionLabel(log.action_name)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {getEntityLabel(log.entity_type)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-2xl font-black text-white">
                        {log.entity_label || "Без назви"}
                      </h2>

                      <p className="mt-2 break-all text-sm font-bold text-slate-500">
                        ID: {log.entity_id || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-right">
                      <p className="text-xs font-bold text-slate-500">Адмін</p>

                      <p className="mt-1 break-all font-black text-slate-200">
                        {log.actor_email || "Невідомо"}
                      </p>
                    </div>
                  </div>

                  {(log.old_status || log.new_status) && (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Було
                        </p>

                        <p className="mt-1 font-black text-slate-200">
                          {getStatusLabel(log.old_status)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Стало
                        </p>

                        <p className="mt-1 font-black text-slate-200">
                          {getStatusLabel(log.new_status)}
                        </p>
                      </div>
                    </div>
                  )}

                  {detailsText && (
                    <details className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <summary className="cursor-pointer text-sm font-black text-emerald-300">
                        Технічні деталі
                      </summary>

                      <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-400">
                        {detailsText}
                      </pre>
                    </details>
                  )}
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}