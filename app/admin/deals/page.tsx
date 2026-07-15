"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import { normalizeUrl, slugify } from "@/lib/searchAliases";

type DealStatus = "active" | "hidden" | "expired";
type SourceType = "manual" | "site" | "feed" | "partner" | "user";
type FilterStatus = "all" | DealStatus;
type SortMode = "newest" | "oldest" | "ending" | "store";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  status?: string | null;
  category_id?: string | null;
  category_names?: string[] | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

type Deal = {
  id: string;
  store_id: string;
  category_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  deal_url?: string | null;
  image_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

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
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function toDateInputValue(date: string | null | undefined) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
}

function dateInputToIso(value: string) {
  if (!value) return null;

  return new Date(`${value}T23:59:59`).toISOString();
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активна";
  if (status === "hidden") return "Прихована";
  if (status === "expired") return "Завершена";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "expired") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

function getSourceTypeLabel(sourceType: string | null | undefined) {
  if (sourceType === "manual") return "Вручну";
  if (sourceType === "site") return "Сайт магазину";
  if (sourceType === "feed") return "Фід";
  if (sourceType === "partner") return "Партнер";
  if (sourceType === "user") return "Користувач";

  return sourceType || "Невідомо";
}

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const end = new Date(date);
  const diff = end.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function makeDealSlug(title: string, storeSlug: string, fallbackId?: string) {
  const base = slugify(`${storeSlug}-${title}`);

  if (base) return base;

  return `deal-${fallbackId || Date.now()}`;
}

function getStoreById(stores: Store[], storeId: string | null | undefined) {
  if (!storeId) return null;

  return stores.find((store) => store.id === storeId) || null;
}

function getCategoryById(
  categories: Category[],
  categoryId: string | null | undefined
) {
  if (!categoryId) return null;

  return categories.find((category) => category.id === categoryId) || null;
}

function dealMatchesSearch(
  deal: Deal,
  stores: Store[],
  categories: Category[],
  search: string
) {
  const query = normalizeText(search);

  if (!query) return true;

  const store = getStoreById(stores, deal.store_id);
  const category = getCategoryById(categories, deal.category_id);

  const haystack = normalizeText(
    [
      deal.title,
      deal.slug,
      deal.description || "",
      deal.deal_url || "",
      deal.source_url || "",
      deal.status || "",
      getStatusLabel(deal.status),
      store?.name || "",
      store?.slug || "",
      category?.name || "",
      category?.slug || "",
    ].join(" ")
  );

  return haystack.includes(query);
}

export default function AdminDealsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [storeId, setStoreId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [dealUrl, setDealUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [status, setStatus] = useState<DealStatus>("active");
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [sourceUrl, setSourceUrl] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === adminEmail;

  const activeStores = useMemo(() => {
    return stores
      .filter((store) => store.status === "active" || !store.status)
      .sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }, [stores]);

  const activeCategories = useMemo(() => {
    return categories
      .filter((category) => category.status === "active" || !category.status)
      .sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }, [categories]);

  const stats = useMemo(() => {
    return {
      total: deals.length,
      active: deals.filter((deal) => deal.status === "active").length,
      hidden: deals.filter((deal) => deal.status === "hidden").length,
      expired: deals.filter((deal) => deal.status === "expired").length,
      stores: new Set(deals.map((deal) => deal.store_id)).size,
    };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    const nextDeals = deals.filter((deal) => {
      if (filterStatus !== "all" && deal.status !== filterStatus) {
        return false;
      }

      return dealMatchesSearch(deal, stores, categories, search);
    });

    nextDeals.sort((firstDeal, secondDeal) => {
      const firstStore = getStoreById(stores, firstDeal.store_id);
      const secondStore = getStoreById(stores, secondDeal.store_id);

      if (sortMode === "store") {
        return (firstStore?.name || "").localeCompare(
          secondStore?.name || "",
          "uk"
        );
      }

      if (sortMode === "ending") {
        const firstDate = firstDeal.ends_at
          ? new Date(firstDeal.ends_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondDate = secondDeal.ends_at
          ? new Date(secondDeal.ends_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstDate - secondDate;
      }

      const firstCreatedAt = new Date(firstDeal.created_at || 0).getTime();
      const secondCreatedAt = new Date(secondDeal.created_at || 0).getTime();

      if (sortMode === "oldest") {
        return firstCreatedAt - secondCreatedAt;
      }

      return secondCreatedAt - firstCreatedAt;
    });

    return nextDeals;
  }, [deals, stores, categories, search, filterStatus, sortMode]);

  const selectedStore = useMemo(() => {
    return getStoreById(stores, storeId);
  }, [stores, storeId]);

  const selectedCategory = useMemo(() => {
    return getCategoryById(categories, categoryId);
  }, [categories, categoryId]);

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadData() {
    setIsLoading(true);
    setMessage("");

    const [dealsResult, storesResult, categoriesResult] = await Promise.all([
      supabase
        .from("store_deals")
        .select(
          "id, store_id, category_id, title, slug, description, deal_url, image_url, starts_at, ends_at, status, source_type, source_url, created_by, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("store_category_stats")
        .select("id, name, slug, website_url, status, category_id, category_names")
        .order("name", { ascending: true })
        .limit(3000),

      supabase
        .from("categories")
        .select("id, name, slug, status")
        .order("name", { ascending: true })
        .limit(500),
    ]);

    if (dealsResult.error) {
      setDeals([]);
      setMessage(`Не вдалося завантажити акції: ${dealsResult.error.message}`);
      setMessageType("error");
    } else {
      setDeals((dealsResult.data || []) as unknown as Deal[]);
    }

    if (storesResult.error) {
      setStores([]);
      setMessage(
        `Не вдалося завантажити магазини: ${storesResult.error.message}`
      );
      setMessageType("error");
    } else {
      setStores((storesResult.data || []) as unknown as Store[]);
    }

    if (categoriesResult.error) {
      setCategories([]);
      setMessage(
        `Не вдалося завантажити категорії: ${categoriesResult.error.message}`
      );
      setMessageType("error");
    } else {
      setCategories((categoriesResult.data || []) as unknown as Category[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser?.email === adminEmail) {
        await loadData();
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user?.email === adminEmail) {
        loadData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (editingDeal) return;

    if (!title.trim() || !selectedStore) {
      setSlug("");
      return;
    }

    setSlug(makeDealSlug(title, selectedStore.slug));
  }, [title, selectedStore, editingDeal]);

  function resetForm() {
    setEditingDeal(null);
    setStoreId("");
    setCategoryId("");
    setTitle("");
    setSlug("");
    setDescription("");
    setDealUrl("");
    setImageUrl("");
    setStartsAt("");
    setEndsAt("");
    setStatus("active");
    setSourceType("manual");
    setSourceUrl("");
  }

  function startEditDeal(deal: Deal) {
    setEditingDeal(deal);
    setStoreId(deal.store_id || "");
    setCategoryId(deal.category_id || "");
    setTitle(deal.title || "");
    setSlug(deal.slug || "");
    setDescription(deal.description || "");
    setDealUrl(deal.deal_url || "");
    setImageUrl(deal.image_url || "");
    setStartsAt(toDateInputValue(deal.starts_at));
    setEndsAt(toDateInputValue(deal.ends_at));
    setStatus((deal.status as DealStatus) || "active");
    setSourceType((deal.source_type as SourceType) || "manual");
    setSourceUrl(deal.source_url || "");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!storeId) {
      setMessage("Обери магазин.");
      setMessageType("error");
      return;
    }

    if (!title.trim()) {
      setMessage("Вкажи назву акції.");
      setMessageType("error");
      return;
    }

    const store = getStoreById(stores, storeId);

    if (!store) {
      setMessage("Магазин не знайдено.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const finalSlug = slugify(slug || makeDealSlug(title, store.slug));
    const finalDealUrl = normalizeUrl(dealUrl.trim()) || null;
    const finalImageUrl = normalizeUrl(imageUrl.trim()) || null;
    const finalSourceUrl = normalizeUrl(sourceUrl.trim()) || null;

    const payload = {
      store_id: storeId,
      category_id: categoryId || store.category_id || null,
      title: title.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      deal_url: finalDealUrl,
      image_url: finalImageUrl,
      starts_at: dateInputToIso(startsAt),
      ends_at: dateInputToIso(endsAt),
      status,
      source_type: sourceType,
      source_url: finalSourceUrl,
      created_by: user.id,
    };

    if (editingDeal) {
      const { data, error } = await supabase
        .from("store_deals")
        .update(payload)
        .eq("id", editingDeal.id)
        .select(
          "id, store_id, category_id, title, slug, description, deal_url, image_url, starts_at, ends_at, status, source_type, source_url, created_by, created_at, updated_at"
        )
        .single();

      setIsSaving(false);

      if (error) {
        setMessage(`Не вдалося оновити акцію: ${error.message}`);
        setMessageType("error");
        return;
      }

      setDeals((currentDeals) =>
        currentDeals.map((currentDeal) =>
          currentDeal.id === editingDeal.id
            ? (data as unknown as Deal)
            : currentDeal
        )
      );

      resetForm();
      setMessage("Акцію оновлено.");
      setMessageType("success");
      return;
    }

    const { data, error } = await supabase
      .from("store_deals")
      .insert(payload)
      .select(
        "id, store_id, category_id, title, slug, description, deal_url, image_url, starts_at, ends_at, status, source_type, source_url, created_by, created_at, updated_at"
      )
      .single();

    setIsSaving(false);

    if (error) {
      setMessage(`Не вдалося створити акцію: ${error.message}`);
      setMessageType("error");
      return;
    }

    setDeals((currentDeals) => [data as unknown as Deal, ...currentDeals]);
    resetForm();
    setMessage("Акцію створено.");
    setMessageType("success");
  }

  async function updateDealStatus(deal: Deal, nextStatus: DealStatus) {
    setProcessingId(deal.id);
    setMessage("");

    const { data, error } = await supabase
      .from("store_deals")
      .update({ status: nextStatus })
      .eq("id", deal.id)
      .select(
        "id, store_id, category_id, title, slug, description, deal_url, image_url, starts_at, ends_at, status, source_type, source_url, created_by, created_at, updated_at"
      )
      .single();

    setProcessingId(null);

    if (error) {
      setMessage(`Не вдалося змінити статус: ${error.message}`);
      setMessageType("error");
      return;
    }

    setDeals((currentDeals) =>
      currentDeals.map((currentDeal) =>
        currentDeal.id === deal.id ? (data as unknown as Deal) : currentDeal
      )
    );

    setMessage("Статус акції оновлено.");
    setMessageType("success");
  }

  async function deleteDeal(deal: Deal) {
    const confirmed = window.confirm(
      `Видалити акцію "${deal.title}"? Цю дію не можна скасувати.`
    );

    if (!confirmed) return;

    setProcessingId(deal.id);
    setMessage("");

    const { error } = await supabase
      .from("store_deals")
      .delete()
      .eq("id", deal.id);

    setProcessingId(null);

    if (error) {
      setMessage(`Не вдалося видалити акцію: ${error.message}`);
      setMessageType("error");
      return;
    }

    setDeals((currentDeals) =>
      currentDeals.filter((currentDeal) => currentDeal.id !== deal.id)
    );

    if (editingDeal?.id === deal.id) {
      resetForm();
    }

    setMessage("Акцію видалено.");
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

            <h1 className="mt-5 text-4xl font-black">Потрібно увійти</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Адмін-розділ доступний тільки після входу.
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
            <div className="text-6xl">⛔</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Немає доступу
            </h1>

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
          <span className="text-slate-300">Акції</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Admin · Deals
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Акції магазинів
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна вручну додавати акції, розпродажі та спецпропозиції
                магазинів. Активні акції автоматично показуються на сторінці
                /deals.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/deals"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Відкрити акції
                </Link>

                <Link
                  href="/admin/stores"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Магазини
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">всього</p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.active}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активні
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.expired}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  завершені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.stores}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
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

        <form
          onSubmit={saveDeal}
          className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">
                {editingDeal ? "Редагувати акцію" : "Додати акцію"}
              </h2>

              <p className="mt-2 leading-7 text-slate-400">
                Заповни дані акції. Якщо дату завершення не вказати, акція буде
                активною без обмеження часу.
              </p>
            </div>

            {editingDeal && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Скасувати редагування
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Магазин *
              </span>

              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="">Обрати магазин</option>
                {activeStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Категорія
              </span>

              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="">Автоматично з магазину</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 xl:col-span-2">
              <span className="text-sm font-black text-slate-300">
                Назва акції *
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Наприклад: Знижки до -40% на техніку"
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2 xl:col-span-2">
              <span className="text-sm font-black text-slate-300">Slug</span>

              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="slug-aktsii"
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2 xl:col-span-2">
              <span className="text-sm font-black text-slate-300">Опис</span>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="Коротко опиши умови акції."
                className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Посилання на акцію
              </span>

              <input
                value={dealUrl}
                onChange={(event) => setDealUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Посилання на картинку
              </span>

              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Початок акції
              </span>

              <input
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Завершення акції
              </span>

              <input
                type="date"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Статус</span>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as DealStatus)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="active">Активна</option>
                <option value="hidden">Прихована</option>
                <option value="expired">Завершена</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Джерело
              </span>

              <select
                value={sourceType}
                onChange={(event) =>
                  setSourceType(event.target.value as SourceType)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="manual">Вручну</option>
                <option value="site">Сайт магазину</option>
                <option value="feed">Фід</option>
                <option value="partner">Партнер</option>
                <option value="user">Користувач</option>
              </select>
            </label>

            <label className="grid gap-2 xl:col-span-2">
              <span className="text-sm font-black text-slate-300">
                Посилання на джерело
              </span>

              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>
          </div>

          {(selectedStore || selectedCategory) && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-bold text-slate-500">Попередній вибір</p>

              <div className="mt-4 flex flex-wrap gap-3">
                {selectedStore && (
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                    <StoreLogo
                      name={selectedStore.name}
                      websiteUrl={selectedStore.website_url}
                      size="sm"
                    />

                    <div>
                      <p className="font-black text-slate-200">
                        {selectedStore.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        /stores/{selectedStore.slug}
                      </p>
                    </div>
                  </div>
                )}

                {selectedCategory && (
                  <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                    {selectedCategory.name}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Зберігаю..."
                : editingDeal
                  ? "Зберегти зміни"
                  : "Створити акцію"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Очистити форму
            </button>
          </div>
        </form>

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: назва, магазин, категорія, посилання..."
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value as FilterStatus)
              }
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="all">Усі статуси</option>
              <option value="active">Активні</option>
              <option value="hidden">Приховані</option>
              <option value="expired">Завершені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
              <option value="ending">За датою завершення</option>
              <option value="store">За магазином</option>
            </select>
          </div>
        </section>

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredDeals.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🛍️</div>

            <h2 className="mt-5 text-4xl font-black">Акцій не знайдено</h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Додай першу акцію через форму вище або зміни фільтри.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredDeals.map((deal) => {
              const store = getStoreById(stores, deal.store_id);
              const category = getCategoryById(categories, deal.category_id);
              const daysLeft = getDaysLeft(deal.ends_at);
              const isProcessing = processingId === deal.id;

              return (
                <article
                  key={deal.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            deal.status
                          )}`}
                        >
                          {getStatusLabel(deal.status)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-slate-300">
                          {getSourceTypeLabel(deal.source_type)}
                        </span>

                        {category && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                            {category.name}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-start gap-4">
                        <StoreLogo
                          name={store?.name || "Магазин"}
                          websiteUrl={store?.website_url}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <h2 className="break-words text-3xl font-black text-white">
                            {deal.title}
                          </h2>

                          <p className="mt-2 break-all text-sm font-bold text-slate-500">
                            {store?.name || "Магазин не знайдено"} · {deal.slug}
                          </p>
                        </div>
                      </div>

                      {deal.description && (
                        <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                          {deal.description}
                        </p>
                      )}

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Початок
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(deal.starts_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Завершення
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(deal.ends_at)}
                          </p>

                          {daysLeft !== null && daysLeft >= 0 && (
                            <p className="mt-1 text-sm font-bold text-slate-500">
                              Залишилось днів: {daysLeft}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Оновлено
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(deal.updated_at)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {store && (
                          <Link
                            href={`/stores/${store.slug}`}
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Магазин
                          </Link>
                        )}

                        {deal.deal_url && (
                          <a
                            href={normalizeUrl(deal.deal_url) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Відкрити акцію
                          </a>
                        )}

                        {deal.source_url && (
                          <a
                            href={normalizeUrl(deal.source_url) || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Джерело
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => startEditDeal(deal)}
                        disabled={isProcessing}
                        className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Редагувати
                      </button>

                      {deal.status !== "active" && (
                        <button
                          type="button"
                          onClick={() => updateDealStatus(deal, "active")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-emerald-400/40 px-5 py-4 font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Зробити активною
                        </button>
                      )}

                      {deal.status !== "hidden" && (
                        <button
                          type="button"
                          onClick={() => updateDealStatus(deal, "hidden")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Приховати
                        </button>
                      )}

                      {deal.status !== "expired" && (
                        <button
                          type="button"
                          onClick={() => updateDealStatus(deal, "expired")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-yellow-400/40 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Завершити
                        </button>
                      )}

                      <div className="my-2 h-px bg-slate-800" />

                      <button
                        type="button"
                        onClick={() => deleteDeal(deal)}
                        disabled={isProcessing}
                        className="rounded-2xl border border-red-400/40 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}