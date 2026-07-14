"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import {
  aliasesToText,
  generateSearchAliases,
  getHostName,
  normalizeSearchText,
  normalizeUrl,
  parseAliases,
  slugify,
} from "@/lib/searchAliases";

type StoreStatus = "active" | "pending" | "rejected";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
};

type StoreCategoryLink = {
  store_id: string;
  category_id: string;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: StoreStatus | string | null;
  category_id?: string | null;
  search_aliases?: string[] | null;
  created_at?: string | null;
  store_categories?: StoreCategoryLink[] | null;
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
  if (status === "active") return "Активний";
  if (status === "pending") return "Очікує";
  if (status === "rejected") return "Прихований";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") {
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

function toggleId(list: string[], id: string) {
  if (list.includes(id)) {
    return list.filter((item) => item !== id);
  }

  return [...list, id];
}

function getStoreCategoryIds(store: Store) {
  const idsFromLinks =
    store.store_categories
      ?.map((link) => link.category_id)
      .filter(Boolean) || [];

  if (idsFromLinks.length > 0) {
    return Array.from(new Set(idsFromLinks));
  }

  return store.category_id ? [store.category_id] : [];
}

function getStoreCategoryNames(
  store: Store,
  categoryById: Map<string, Category>
) {
  const categoryIds = getStoreCategoryIds(store);

  return categoryIds
    .map((categoryId) => categoryById.get(categoryId)?.name)
    .filter(Boolean) as string[];
}

export default function AdminStoresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<StoreStatus>("active");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editAliases, setEditAliases] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createWebsiteUrl, setCreateWebsiteUrl] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStatus, setCreateStatus] = useState<StoreStatus>("active");
  const [createCategoryIds, setCreateCategoryIds] = useState<string[]>([]);
  const [createAliases, setCreateAliases] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isLoading = isLoadingUser || isLoadingStores || isLoadingCategories;

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadCategories() {
    setIsLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, status")
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
      setMessage(`Помилка категорій: ${error.message}`);
      setMessageType("error");
      setIsLoadingCategories(false);
      return;
    }

    setCategories((data || []) as unknown as Category[]);
    setIsLoadingCategories(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);
    setMessage("");

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at"
      )
      .order("created_at", { ascending: false });

    if (storeError) {
      setStores([]);
      setMessage(`Помилка магазинів: ${storeError.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    const loadedStores = (storeData || []) as unknown as Store[];
    const storeIds = loadedStores.map((store) => store.id);

    if (storeIds.length === 0) {
      setStores([]);
      setIsLoadingStores(false);
      return;
    }

    const { data: linkData, error: linkError } = await supabase
      .from("store_categories")
      .select("store_id, category_id")
      .in("store_id", storeIds);

    if (linkError) {
      setStores(loadedStores);
      setMessage(
        `Магазини завантажено, але категорії не підтягнулись: ${linkError.message}`
      );
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    const links = (linkData || []) as unknown as StoreCategoryLink[];
    const linksByStoreId = new Map<string, StoreCategoryLink[]>();

    for (const link of links) {
      const currentLinks = linksByStoreId.get(link.store_id) || [];

      linksByStoreId.set(link.store_id, [...currentLinks, link]);
    }

    const storesWithCategories = loadedStores.map((store) => ({
      ...store,
      store_categories: linksByStoreId.get(store.id) || [],
    }));

    setStores(storesWithCategories);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadUser();
    loadCategories();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStores();
      return;
    }

    if (!isLoadingUser) {
      setIsLoadingStores(false);
    }
  }, [isAdmin, isLoadingUser]);

  const counts = useMemo(() => {
    return {
      all: stores.length,
      active: stores.filter((store) => store.status === "active").length,
      pending: stores.filter((store) => store.status === "pending").length,
      rejected: stores.filter((store) => store.status === "rejected").length,
      noCategory: stores.filter((store) => getStoreCategoryIds(store).length === 0)
        .length,
    };
  }, [stores]);

  const filteredStores = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);

    return stores.filter((store) => {
      const aliasesText = (store.search_aliases || []).join(" ");
      const categoryNames = getStoreCategoryNames(store, categoryById);
      const categoryIds = getStoreCategoryIds(store);

      const haystack = normalizeSearchText(
        [
          store.name,
          store.slug,
          store.description || "",
          store.website_url || "",
          categoryNames.join(" "),
          aliasesText,
        ].join(" ")
      );

      const matchesSearch =
        !normalizedSearch || haystack.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || store.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && categoryIds.length === 0) ||
        categoryIds.includes(categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [stores, search, statusFilter, categoryFilter, categoryById]);

  async function getUniqueSlug(baseSlug: string, currentStoreId?: string) {
    let candidate = baseSlug || "store";
    let counter = 2;

    while (true) {
      let query = supabase.from("stores").select("id").eq("slug", candidate);

      if (currentStoreId) {
        query = query.neq("id", currentStoreId);
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

  async function syncStoreCategories(storeId: string, categoryIds: string[]) {
    const uniqueCategoryIds = Array.from(new Set(categoryIds)).filter(Boolean);

    const deleteResult = await supabase
      .from("store_categories")
      .delete()
      .eq("store_id", storeId);

    if (deleteResult.error) {
      return deleteResult.error;
    }

    if (uniqueCategoryIds.length === 0) {
      return null;
    }

    const insertResult = await supabase.from("store_categories").insert(
      uniqueCategoryIds.map((categoryId) => ({
        store_id: storeId,
        category_id: categoryId,
      }))
    );

    return insertResult.error || null;
  }

  function startEdit(store: Store) {
    setEditingStoreId(store.id);
    setEditName(store.name);
    setEditSlug(store.slug);
    setEditWebsiteUrl(store.website_url || "");
    setEditDescription(store.description || "");
    setEditStatus((store.status as StoreStatus) || "active");
    setEditCategoryIds(getStoreCategoryIds(store));
    setEditAliases(aliasesToText(store.search_aliases));
    setMessage("");
  }

  function cancelEdit() {
    setEditingStoreId(null);
    setEditName("");
    setEditSlug("");
    setEditWebsiteUrl("");
    setEditDescription("");
    setEditStatus("active");
    setEditCategoryIds([]);
    setEditAliases("");
  }

  function resetCreateForm() {
    setCreateName("");
    setCreateSlug("");
    setCreateWebsiteUrl("");
    setCreateDescription("");
    setCreateStatus("active");
    setCreateCategoryIds([]);
    setCreateAliases("");
  }

  async function createStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createName.trim()) {
      setMessage("Вкажи назву магазину.");
      setMessageType("error");
      return;
    }

    setIsCreating(true);
    setMessage("");

    const baseSlug = slugify(createSlug || createName);
    const uniqueSlug = await getUniqueSlug(baseSlug);
    const normalizedWebsiteUrl = normalizeUrl(createWebsiteUrl);
    const customAliases = parseAliases(createAliases);

    const finalAliases = generateSearchAliases({
      name: createName,
      slug: uniqueSlug,
      websiteUrl: normalizedWebsiteUrl,
      customAliases,
    });

    const { data: createdStore, error } = await supabase
      .from("stores")
      .insert({
        name: createName.trim(),
        slug: uniqueSlug,
        website_url: normalizedWebsiteUrl || null,
        description: createDescription.trim() || null,
        status: createStatus,
        category_id: createCategoryIds[0] || null,
        search_aliases: finalAliases,
      })
      .select("id")
      .single();

    if (error || !createdStore) {
      setIsCreating(false);
      setMessage(`Не вдалося створити магазин: ${error?.message || "немає id"}`);
      setMessageType("error");
      return;
    }

    const categorySyncError = await syncStoreCategories(
      createdStore.id,
      createCategoryIds
    );

    setIsCreating(false);

    if (categorySyncError) {
      setMessage(
        `Магазин створено, але категорії не збереглись: ${categorySyncError.message}`
      );
      setMessageType("error");
      loadStores();
      return;
    }

    resetCreateForm();
    setIsCreateOpen(false);
    setMessage("Магазин створено. Категорії та пошукові слова збережено.");
    setMessageType("success");
    loadStores();
  }

  async function saveStore() {
    if (!editingStoreId) return;

    if (!editName.trim()) {
      setMessage("Назва магазину не може бути порожньою.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const baseSlug = slugify(editSlug || editName);
    const uniqueSlug = await getUniqueSlug(baseSlug, editingStoreId);
    const normalizedWebsiteUrl = normalizeUrl(editWebsiteUrl);
    const customAliases = parseAliases(editAliases);

    const finalAliases = generateSearchAliases({
      name: editName,
      slug: uniqueSlug,
      websiteUrl: normalizedWebsiteUrl,
      customAliases,
    });

    const { error } = await supabase
      .from("stores")
      .update({
        name: editName.trim(),
        slug: uniqueSlug,
        website_url: normalizedWebsiteUrl || null,
        description: editDescription.trim() || null,
        status: editStatus,
        category_id: editCategoryIds[0] || null,
        search_aliases: finalAliases,
      })
      .eq("id", editingStoreId);

    if (error) {
      setIsSaving(false);
      setMessage(`Не вдалося зберегти магазин: ${error.message}`);
      setMessageType("error");
      return;
    }

    const categorySyncError = await syncStoreCategories(
      editingStoreId,
      editCategoryIds
    );

    setIsSaving(false);

    if (categorySyncError) {
      setMessage(
        `Магазин оновлено, але категорії не збереглись: ${categorySyncError.message}`
      );
      setMessageType("error");
      loadStores();
      return;
    }

    cancelEdit();
    setMessage("Магазин оновлено. Категорії та пошук перебудовано.");
    setMessageType("success");
    loadStores();
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
              Щоб керувати магазинами, потрібно увійти в акаунт адміністратора.
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
          <span className="text-slate-300">Магазини</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Магазини
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Один магазин може мати кілька категорій. Перша вибрана
                категорія буде головною для старої логіки, а всі вибрані
                категорії зберігаються окремо.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen((current) => !current)}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                {isCreateOpen ? "Закрити форму" : "Створити магазин"}
              </button>

              <button
                type="button"
                onClick={() => {
                  loadCategories();
                  loadStores();
                }}
                disabled={isLoadingStores || isLoadingCategories}
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Оновити
              </button>

              <Link
                href="/admin/categories"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Категорії
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
              onSubmit={createStore}
              className="mt-8 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Новий магазин</h2>

                  <p className="mt-2 leading-7 text-slate-400">
                    Обери одну або декілька категорій. Перший вибір буде
                    головною категорією.
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

              <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                    placeholder="KRKR"
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
                    placeholder="krkr"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Сайт
                  </label>

                  <input
                    value={createWebsiteUrl}
                    onChange={(event) => setCreateWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
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
                      setCreateStatus(event.target.value as StoreStatus)
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="active">Активний</option>
                    <option value="pending">Очікує</option>
                    <option value="rejected">Прихований</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Категорії
                </label>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  {categories.map((category) => {
                    const isSelected = createCategoryIds.includes(category.id);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setCreateCategoryIds((current) =>
                            toggleId(current, category.id)
                          )
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-400 text-slate-950"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}

                  {categories.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Категорій ще немає.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Додаткові пошукові слова
                </label>

                <input
                  value={createAliases}
                  onChange={(event) => setCreateAliases(event.target.value)}
                  placeholder="через кому"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Опис
                </label>

                <textarea
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  placeholder="Короткий опис магазину..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Створюю..." : "Створити магазин"}
              </button>
            </form>
          )}

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук магазину..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="active">Активні</option>
              <option value="pending">Очікують</option>
              <option value="rejected">Приховані</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі категорії</option>
              <option value="none">Без категорії</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-5">
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
              <p className="text-3xl font-black text-yellow-300">
                {counts.pending}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">очікують</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-red-300">
                {counts.rejected}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">приховані</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl font-black text-orange-300">
                {counts.noCategory}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                без категорії
              </p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-5xl">🏪</div>

            <h2 className="mt-4 text-3xl font-black">
              Магазинів не знайдено
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Спробуй змінити пошук, статус або категорію.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {filteredStores.map((store) => {
              const isEditing = editingStoreId === store.id;
              const aliases = store.search_aliases || [];
              const categoryNames = getStoreCategoryNames(store, categoryById);

              return (
                <article
                  key={store.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-2xl font-black">
                          Редагування магазину
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

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-300">
                            Сайт
                          </label>

                          <input
                            value={editWebsiteUrl}
                            onChange={(event) =>
                              setEditWebsiteUrl(event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          />
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
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          >
                            <option value="active">Активний</option>
                            <option value="pending">Очікує</option>
                            <option value="rejected">Прихований</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-bold text-slate-300">
                          Категорії
                        </label>

                        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                          {categories.map((category) => {
                            const isSelected = editCategoryIds.includes(
                              category.id
                            );

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() =>
                                  setEditCategoryIds((current) =>
                                    toggleId(current, category.id)
                                  )
                                }
                                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                                  isSelected
                                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                                }`}
                              >
                                {category.name}
                              </button>
                            );
                          })}

                          {categories.length === 0 && (
                            <p className="text-sm text-slate-500">
                              Категорій ще немає.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-bold text-slate-300">
                          Додаткові пошукові слова
                        </label>

                        <input
                          value={editAliases}
                          onChange={(event) => setEditAliases(event.target.value)}
                          placeholder="через кому"
                          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                        />
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
                        onClick={saveStore}
                        disabled={isSaving}
                        className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Зберігаю..." : "Зберегти"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                          <StoreLogo
                            name={store.name}
                            websiteUrl={store.website_url}
                            size="md"
                          />

                          <div className="min-w-0">
                            <h2 className="break-words text-2xl font-black text-white">
                              {store.name}
                            </h2>

                            <p className="mt-1 break-all text-sm font-bold text-slate-500">
                              /stores/{store.slug}
                            </p>

                            {store.website_url && (
                              <p className="mt-1 break-all text-sm font-bold text-slate-500">
                                {getHostName(store.website_url)}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            store.status
                          )}`}
                        >
                          {getStatusLabel(store.status)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Категорії
                          </p>

                          {categoryNames.length === 0 ? (
                            <p className="mt-2 font-black text-slate-500">
                              Без категорії
                            </p>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {categoryNames.map((categoryName) => (
                                <span
                                  key={categoryName}
                                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                                >
                                  {categoryName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Створено
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDate(store.created_at)}
                          </p>
                        </div>
                      </div>

                      {store.description && (
                        <p className="mt-5 line-clamp-3 leading-7 text-slate-400">
                          {store.description}
                        </p>
                      )}

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Пошукові слова
                        </p>

                        {aliases.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-500">
                            Не вказано.
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {aliases.slice(0, 16).map((alias) => (
                              <span
                                key={alias}
                                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300"
                              >
                                {alias}
                              </span>
                            ))}

                            {aliases.length > 16 && (
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-500">
                                +{aliases.length - 16}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(store)}
                          className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Редагувати
                        </button>

                        <Link
                          href={`/stores/${store.slug}`}
                          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Відкрити
                        </Link>
                      </div>
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