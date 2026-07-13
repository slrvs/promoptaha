"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type StoreStatus = "active" | "hidden" | "pending";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
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

function getHostName(url: string | null | undefined) {
  if (!url) return "Сайт не вказано";

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активний";
  if (status === "hidden") return "Прихований";
  if (status === "pending") return "На модерації";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "hidden") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function AdminStoresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StoreStatus>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<StoreStatus>("active");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

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

  async function loadStores() {
    setIsLoadingStores(true);
    setMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, description, website_url, status, created_at")
      .order("name", { ascending: true });

    if (error) {
      setStores([]);
      setMessage(`Помилка завантаження магазинів: ${error.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as Store[]);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoadingUser && isAdmin) {
      loadStores();
    }

    if (!isLoadingUser && !isAdmin) {
      setIsLoadingStores(false);
    }
  }, [isLoadingUser, isAdmin]);

  const filteredStores = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return stores.filter((store) => {
      const matchesStatus =
        statusFilter === "all" || store.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        store.name.toLowerCase().includes(normalizedSearch) ||
        store.slug.toLowerCase().includes(normalizedSearch) ||
        (store.website_url || "").toLowerCase().includes(normalizedSearch) ||
        (store.description || "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [stores, search, statusFilter]);

  const activeCount = stores.filter((store) => store.status === "active").length;
  const pendingCount = stores.filter((store) => store.status === "pending").length;
  const hiddenCount = stores.filter((store) => store.status === "hidden").length;

  function startEdit(store: Store) {
    setEditingId(store.id);
    setEditName(store.name || "");
    setEditSlug(store.slug || "");
    setEditWebsiteUrl(store.website_url || "");
    setEditDescription(store.description || "");
    setEditStatus((store.status as StoreStatus) || "active");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditWebsiteUrl("");
    setEditDescription("");
    setEditStatus("active");
  }

  async function saveStore(event: FormEvent<HTMLFormElement>, storeId: string) {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!editName.trim()) {
      setMessage("Назва магазину не може бути порожньою.");
      setMessageType("error");
      return;
    }

    if (!editSlug.trim()) {
      setMessage("Slug магазину не може бути порожнім.");
      setMessageType("error");
      return;
    }

    setSavingId(storeId);

    const finalWebsiteUrl = editWebsiteUrl.trim()
      ? normalizeUrl(editWebsiteUrl)
      : null;

    const { error } = await supabase
      .from("stores")
      .update({
        name: editName.trim(),
        slug: makeSlug(editSlug) || makeSlug(editName) || "store",
        website_url: finalWebsiteUrl,
        description: editDescription.trim() || null,
        status: editStatus,
      })
      .eq("id", storeId);

    setSavingId(null);

    if (error) {
      setMessage(`Помилка збереження магазину: ${error.message}`);
      setMessageType("error");
      return;
    }

    setStores((currentStores) =>
      currentStores.map((store) =>
        store.id === storeId
          ? {
              ...store,
              name: editName.trim(),
              slug: makeSlug(editSlug) || makeSlug(editName) || "store",
              website_url: finalWebsiteUrl,
              description: editDescription.trim() || null,
              status: editStatus,
            }
          : store
      )
    );

    setEditingId(null);
    setMessage("Магазин оновлено. Лого має підтягнутись по website_url.");
    setMessageType("success");
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
                Магазини
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна редагувати назву, сайт, опис і статус магазину. Лого
                підтягуватиметься автоматично з домену в полі website_url.
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
                href="/admin/store-requests"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Заявки
              </Link>

              <Link
                href="/admin/reports"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Репорти
              </Link>

              <button
                type="button"
                onClick={loadStores}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Оновити
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-3xl border p-5 text-left transition ${
                statusFilter === "all"
                  ? "border-slate-400 bg-slate-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-slate-500"
              }`}
            >
              <p className="text-3xl font-black text-slate-200">
                {stores.length}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">усього</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-3xl border p-5 text-left transition ${
                statusFilter === "active"
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-emerald-400/50"
              }`}
            >
              <p className="text-3xl font-black text-emerald-300">
                {activeCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                активні
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`rounded-3xl border p-5 text-left transition ${
                statusFilter === "pending"
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
              onClick={() => setStatusFilter("hidden")}
              className={`rounded-3xl border p-5 text-left transition ${
                statusFilter === "hidden"
                  ? "border-red-400 bg-red-400/10"
                  : "border-slate-800 bg-slate-950 hover:border-red-400/50"
              }`}
            >
              <p className="text-3xl font-black text-red-300">
                {hiddenCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                приховані
              </p>
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: назва, slug, сайт, опис..."
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

          {isLoadingStores ? (
            <div className="mt-8 grid gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🏪</div>

              <h2 className="mt-4 text-3xl font-black">
                Магазинів не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити фільтр або пошук.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {filteredStores.map((store) => {
                const isEditing = editingId === store.id;
                const isSaving = savingId === store.id;

                return (
                  <article
                    key={store.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20"
                  >
                    {!isEditing ? (
                      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                        <div className="flex gap-5">
                          <StoreLogo
                            name={store.name}
                            websiteUrl={store.website_url}
                            size="lg"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                  store.status
                                )}`}
                              >
                                {getStatusLabel(store.status)}
                              </span>

                              <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400">
                                Додано: {formatDate(store.created_at)}
                              </span>
                            </div>

                            <h2 className="mt-4 break-words text-4xl font-black text-white">
                              {store.name}
                            </h2>

                            <p className="mt-2 break-all text-sm font-bold text-slate-500">
                              /stores/{store.slug}
                            </p>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                                <p className="text-xs font-bold text-slate-500">
                                  Website URL
                                </p>

                                {store.website_url ? (
                                  <a
                                    href={store.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex break-all font-black text-emerald-300 hover:text-emerald-200"
                                  >
                                    {getHostName(store.website_url)} →
                                  </a>
                                ) : (
                                  <p className="mt-1 font-black text-red-300">
                                    Не вказано — лого не підтягнеться
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                                <p className="text-xs font-bold text-slate-500">
                                  Slug
                                </p>

                                <p className="mt-1 break-all font-black text-slate-200">
                                  {store.slug}
                                </p>
                              </div>
                            </div>

                            {store.description && (
                              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
                                {store.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex min-w-56 flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(store)}
                            className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Редагувати
                          </button>

                          {store.status === "active" && (
                            <Link
                              href={`/stores/${store.slug}`}
                              className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Відкрити
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form
                        onSubmit={(event) => saveStore(event, store.id)}
                        className="space-y-5"
                      >
                        <div className="flex flex-wrap items-start gap-5">
                          <StoreLogo
                            name={editName || store.name}
                            websiteUrl={editWebsiteUrl || store.website_url}
                            size="lg"
                          />

                          <div className="min-w-0 flex-1">
                            <h2 className="text-3xl font-black text-white">
                              Редагування магазину
                            </h2>

                            <p className="mt-2 leading-7 text-slate-400">
                              Вкажи правильний сайт магазину. Саме з нього буде
                              підтягуватись логотип.
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300">
                              Назва
                            </label>

                            <input
                              value={editName}
                              onChange={(event) => {
                                setEditName(event.target.value);

                                if (!editSlug.trim()) {
                                  setEditSlug(makeSlug(event.target.value));
                                }
                              }}
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300">
                              Slug
                            </label>

                            <input
                              value={editSlug}
                              onChange={(event) =>
                                setEditSlug(makeSlug(event.target.value))
                              }
                              placeholder="comfy"
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300">
                              Website URL
                            </label>

                            <input
                              value={editWebsiteUrl}
                              onChange={(event) =>
                                setEditWebsiteUrl(event.target.value)
                              }
                              placeholder="https://comfy.ua"
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                            />

                            <p className="mt-2 text-sm text-slate-500">
                              Можна вводити без https:// — сайт додасть
                              автоматично.
                            </p>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-300">
                              Статус
                            </label>

                            <select
                              value={editStatus}
                              onChange={(event) =>
                                setEditStatus(event.target.value as StoreStatus)
                              }
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            >
                              <option value="active">Активний</option>
                              <option value="pending">На модерації</option>
                              <option value="hidden">Прихований</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-300">
                            Опис
                          </label>

                          <textarea
                            value={editDescription}
                            onChange={(event) =>
                              setEditDescription(event.target.value)
                            }
                            rows={5}
                            placeholder="Короткий опис магазину..."
                            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Зберігаю..." : "Зберегти магазин"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Скасувати
                          </button>
                        </div>
                      </form>
                    )}
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