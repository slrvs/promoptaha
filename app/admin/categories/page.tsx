"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";
import { slugify } from "@/lib/searchAliases";

type CategoryStatus = "active" | "hidden";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
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

function formatDate(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активна";
  if (status === "hidden") return "Прихована";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "hidden") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function AdminCategoriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStatus, setCreateStatus] = useState<CategoryStatus>("active");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<CategoryStatus>("active");

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadCategories() {
    setIsLoadingCategories(true);
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setCategories([]);
      setMessage(`Не вдалося завантажити категорії: ${error.message}`);
      setMessageType("error");
      setIsLoadingCategories(false);
      return;
    }

    setCategories((data || []) as unknown as Category[]);
    setIsLoadingCategories(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadCategories();
      return;
    }

    if (!isLoadingUser) {
      setIsLoadingCategories(false);
    }
  }, [isAdmin, isLoadingUser]);

  const counts = useMemo(() => {
    return {
      all: categories.length,
      active: categories.filter((category) => category.status === "active")
        .length,
      hidden: categories.filter((category) => category.status === "hidden")
        .length,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const haystack = [
        category.name,
        category.slug,
        category.description || "",
        category.status || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || haystack.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  async function getUniqueSlug(baseSlug: string, currentCategoryId?: string) {
    let candidate = baseSlug || "category";
    let counter = 2;

    while (true) {
      let query = supabase.from("categories").select("id").eq("slug", candidate);

      if (currentCategoryId) {
        query = query.neq("id", currentCategoryId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        return candidate;
      }

      if (!data || data.length === 0) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  function resetCreateForm() {
    setCreateName("");
    setCreateSlug("");
    setCreateDescription("");
    setCreateStatus("active");
  }

  function startEdit(category: Category) {
    setEditingCategoryId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditDescription(category.description || "");
    setEditStatus((category.status as CategoryStatus) || "active");
    setMessage("");
  }

  function cancelEdit() {
    setEditingCategoryId(null);
    setEditName("");
    setEditSlug("");
    setEditDescription("");
    setEditStatus("active");
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createName.trim()) {
      setMessage("Вкажи назву категорії.");
      setMessageType("error");
      return;
    }

    setIsCreating(true);
    setMessage("");

    const baseSlug = slugify(createSlug || createName);
    const uniqueSlug = await getUniqueSlug(baseSlug);

    const { error } = await supabase.from("categories").insert({
      name: createName.trim(),
      slug: uniqueSlug,
      description: createDescription.trim() || null,
      status: createStatus,
    });

    setIsCreating(false);

    if (error) {
      setMessage(`Не вдалося створити категорію: ${error.message}`);
      setMessageType("error");
      return;
    }

    resetCreateForm();
    setIsCreateOpen(false);
    setMessage("Категорію створено.");
    setMessageType("success");
    loadCategories();
  }

  async function saveCategory() {
    if (!editingCategoryId) return;

    if (!editName.trim()) {
      setMessage("Назва категорії не може бути порожньою.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const baseSlug = slugify(editSlug || editName);
    const uniqueSlug = await getUniqueSlug(baseSlug, editingCategoryId);

    const { error } = await supabase
      .from("categories")
      .update({
        name: editName.trim(),
        slug: uniqueSlug,
        description: editDescription.trim() || null,
        status: editStatus,
      })
      .eq("id", editingCategoryId);

    setIsSaving(false);

    if (error) {
      setMessage(`Не вдалося зберегти категорію: ${error.message}`);
      setMessageType("error");
      return;
    }

    cancelEdit();
    setMessage("Категорію оновлено.");
    setMessageType("success");
    loadCategories();
  }

  if (isLoadingUser) {
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
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">Потрібен вхід</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Щоб керувати категоріями, потрібно увійти в акаунт адміністратора.
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
            <h1 className="text-4xl font-black text-red-300">Доступ закрито</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору ПромоПтахи.
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
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Категорії</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Категорії
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Керуй категоріями для магазинів і промокодів: техніка, догляд,
                послуги, їжа, маркетплейси та інші розділи.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen((current) => !current)}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                {isCreateOpen ? "Закрити форму" : "Створити категорію"}
              </button>

              <button
                type="button"
                onClick={loadCategories}
                disabled={isLoadingCategories}
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Оновити
              </button>

              <Link
                href="/admin/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </div>

          {message && (
            <div
              className={`mt-8 rounded-2xl border p-4 ${
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

          {isCreateOpen && (
            <form
              onSubmit={createCategory}
              className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Нова категорія</h2>

                  <p className="mt-2 leading-7 text-slate-400">
                    Наприклад: “Догляд та побут”, “Техніка”, “Їжа та доставка”.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetCreateForm();
                    setIsCreateOpen(false);
                  }}
                  className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Скасувати
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Назва
                  </label>

                  <input
                    value={createName}
                    onChange={(event) => {
                      const nextName = event.target.value;

                      setCreateName(nextName);

                      if (!createSlug.trim()) {
                        setCreateSlug(slugify(nextName));
                      }
                    }}
                    placeholder="Догляд та побут"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Slug
                  </label>

                  <input
                    value={createSlug}
                    onChange={(event) => setCreateSlug(slugify(event.target.value))}
                    placeholder="care-home"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Статус
                  </label>

                  <select
                    value={createStatus}
                    onChange={(event) =>
                      setCreateStatus(event.target.value as CategoryStatus)
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="active">Активна</option>
                    <option value="hidden">Прихована</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Опис
                </label>

                <textarea
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  placeholder="Короткий опис категорії..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Створюю..." : "Створити категорію"}
              </button>
            </form>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-white">{counts.all}</p>
              <p className="mt-2 text-sm font-bold text-slate-500">усі</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-emerald-300">
                {counts.active}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">активні</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-red-300">
                {counts.hidden}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">приховані</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук категорії..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="active">Активні</option>
              <option value="hidden">Приховані</option>
            </select>
          </div>
        </section>

        {isLoadingCategories ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredCategories.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-5xl">🏷️</div>

            <h2 className="mt-4 text-3xl font-black">
              Категорій не знайдено
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Спробуй змінити пошук або створи нову категорію.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {filteredCategories.map((category) => {
              const isEditing = editingCategoryId === category.id;

              return (
                <article
                  key={category.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-2xl font-black">
                          Редагування категорії
                        </h2>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-red-400 hover:text-red-300"
                        >
                          Скасувати
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-300">
                            Назва
                          </label>

                          <input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-300">
                            Slug
                          </label>

                          <input
                            value={editSlug}
                            onChange={(event) =>
                              setEditSlug(slugify(event.target.value))
                            }
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-bold text-slate-300">
                            Статус
                          </label>

                          <select
                            value={editStatus}
                            onChange={(event) =>
                              setEditStatus(event.target.value as CategoryStatus)
                            }
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          >
                            <option value="active">Активна</option>
                            <option value="hidden">Прихована</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-bold text-slate-300">
                          Опис
                        </label>

                        <textarea
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={saveCategory}
                        disabled={isSaving}
                        className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Зберігаю..." : "Зберегти"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="break-words text-2xl font-black text-white">
                            {category.name}
                          </h2>

                          <p className="mt-1 break-all text-sm font-bold text-slate-500">
                            {category.slug}
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-600">
                            {formatDate(category.created_at)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            category.status
                          )}`}
                        >
                          {getStatusLabel(category.status)}
                        </span>
                      </div>

                      <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
                        {category.description ||
                          "Опис категорії ще не додано."}
                      </p>

                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        Редагувати
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}