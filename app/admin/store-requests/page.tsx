"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import {
  generateSearchAliases,
  getHostName,
  normalizeUrl,
  slugify,
} from "@/lib/searchAliases";

type StoreRequestStatus = "pending" | "approved" | "rejected";
type FilterStatus = "all" | StoreRequestStatus;
type SortMode = "newest" | "oldest";

type StoreRequest = {
  id: string;
  store_name?: string | null;
  name?: string | null;
  title?: string | null;
  website_url?: string | null;
  url?: string | null;
  description?: string | null;
  comment?: string | null;
  status?: string | null;
  submitted_by?: string | null;
  requested_by?: string | null;
  user_id?: string | null;
  created_by?: string | null;
  created_store_id?: string | null;
  created_at?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  category_id?: string | null;
  search_aliases?: string[] | null;
};

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

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/\s+/g, " ");
}

function getRequestName(request: StoreRequest) {
  return (
    request.store_name ||
    request.name ||
    request.title ||
    request.website_url ||
    request.url ||
    "Заявка магазину"
  );
}

function getRequestUrl(request: StoreRequest) {
  return request.website_url || request.url || "";
}

function getRequestDescription(request: StoreRequest) {
  return request.description || request.comment || "";
}

function getRequestUserId(request: StoreRequest) {
  return (
    request.submitted_by ||
    request.requested_by ||
    request.user_id ||
    request.created_by ||
    ""
  );
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

function getRequestHost(request: StoreRequest) {
  const url = getRequestUrl(request);

  if (!url) return "";

  const normalized = normalizeUrl(url);

  return getHostName(normalized || url) || "";
}

function getLinkedStoreForRequest(request: StoreRequest, stores: Store[]) {
  if (!request.created_store_id) return null;

  return stores.find((store) => store.id === request.created_store_id) || null;
}

function getExistingStoreForRequest(request: StoreRequest, stores: Store[]) {
  const linkedStore = getLinkedStoreForRequest(request, stores);

  if (linkedStore) return linkedStore;

  const requestName = normalizeText(getRequestName(request));
  const requestSlug = slugify(getRequestName(request));
  const requestHost = getRequestHost(request);

  return (
    stores.find((store) => {
      const storeName = normalizeText(store.name);
      const storeSlug = normalizeText(store.slug);
      const storeHost = getStoreHost(store);

      if (requestName && storeName === requestName) return true;
      if (requestSlug && storeSlug === normalizeText(requestSlug)) return true;
      if (requestHost && storeHost && requestHost === storeHost) return true;

      return false;
    }) || null
  );
}

function requestMatchesSearch(request: StoreRequest, search: string) {
  const query = normalizeText(search);

  if (!query) return true;

  const haystack = normalizeText(
    [
      request.id,
      getRequestName(request),
      getRequestUrl(request),
      getRequestDescription(request),
      getRequestUserId(request),
      request.created_store_id || "",
      request.status || "",
      getStatusLabel(request.status),
    ].join(" ")
  );

  return haystack.includes(query);
}

function makeUniqueSlug(baseSlug: string, stores: Store[], requestId: string) {
  const safeBaseSlug = baseSlug || `store-${requestId.slice(0, 8)}`;
  const normalizedExistingSlugs = new Set(
    stores.map((store) => normalizeText(store.slug))
  );

  if (!normalizedExistingSlugs.has(normalizeText(safeBaseSlug))) {
    return safeBaseSlug;
  }

  return `${safeBaseSlug}-${requestId.slice(0, 8)}`;
}

export default function AdminStoreRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeCategoryLinks, setStoreCategoryLinks] = useState<
    StoreCategoryLink[]
  >([]);

  const [selectedRequest, setSelectedRequest] =
    useState<StoreRequest | null>(null);

  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeWebsiteUrl, setStoreWebsiteUrl] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const createStoreFormRef = useRef<HTMLFormElement | null>(null);

  const isAdmin = user?.email === adminEmail;

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((request) => request.status === "pending")
        .length,
      approved: requests.filter((request) => request.status === "approved")
        .length,
      rejected: requests.filter((request) => request.status === "rejected")
        .length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const nextRequests = requests.filter((request) => {
      if (filterStatus !== "all" && request.status !== filterStatus) {
        return false;
      }

      return requestMatchesSearch(request, search);
    });

    nextRequests.sort((firstRequest, secondRequest) => {
      const firstDate = new Date(firstRequest.created_at || 0).getTime();
      const secondDate = new Date(secondRequest.created_at || 0).getTime();

      if (sortMode === "oldest") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });

    return nextRequests;
  }, [requests, filterStatus, sortMode, search]);

  const selectedRequestExistingStore = useMemo(() => {
    if (!selectedRequest) return null;

    return getExistingStoreForRequest(selectedRequest, stores);
  }, [selectedRequest, stores]);

  const selectedCategoryNames = useMemo(() => {
    return selectedCategoryIds
      .map((categoryId) => categoriesById.get(categoryId)?.name)
      .filter((name): name is string => Boolean(name));
  }, [selectedCategoryIds, categoriesById]);

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

    const [
      requestsResult,
      storesResult,
      categoriesResult,
      storeCategoriesResult,
    ] = await Promise.all([
      supabase
        .from("store_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("stores")
        .select(
          "id, name, slug, description, website_url, status, category_id, search_aliases"
        )
        .order("name", { ascending: true })
        .limit(3000),

      supabase
        .from("categories")
        .select("id, name, slug, description, status")
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(500),

      supabase.from("store_categories").select("store_id, category_id"),
    ]);

    if (requestsResult.error) {
      setRequests([]);
      setMessage(
        `Не вдалося завантажити заявки магазинів: ${requestsResult.error.message}`
      );
      setMessageType("error");
    } else {
      setRequests((requestsResult.data || []) as unknown as StoreRequest[]);
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

    if (storeCategoriesResult.error) {
      setStoreCategoryLinks([]);
    } else {
      setStoreCategoryLinks(
        (storeCategoriesResult.data || []) as unknown as StoreCategoryLink[]
      );
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

  function startCreateStoreFromRequest(request: StoreRequest) {
    const requestName = getRequestName(request);
    const requestUrl = getRequestUrl(request);
    const normalizedUrl = normalizeUrl(requestUrl) || requestUrl;
    const host = getHostName(normalizedUrl) || "";
    const baseSlug = slugify(requestName || host || "store");
    const uniqueSlug = makeUniqueSlug(baseSlug, stores, request.id);

    setSelectedRequest(request);
    setStoreName(requestName === "Заявка магазину" ? "" : requestName);
    setStoreSlug(uniqueSlug);
    setStoreWebsiteUrl(normalizedUrl || "");
    setStoreDescription(getRequestDescription(request));
    setSelectedCategoryIds([]);
    setMessage("");

    window.setTimeout(() => {
      createStoreFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((currentCategoryIds) => {
      if (currentCategoryIds.includes(categoryId)) {
        return currentCategoryIds.filter(
          (currentCategoryId) => currentCategoryId !== categoryId
        );
      }

      return [...currentCategoryIds, categoryId];
    });
  }

  async function updateRequestStatus(
    request: StoreRequest,
    nextStatus: StoreRequestStatus
  ) {
    setProcessingId(request.id);
    setMessage("");

    const { error } = await supabase
      .from("store_requests")
      .update({ status: nextStatus })
      .eq("id", request.id);

    if (error) {
      setMessage(`Не вдалося оновити заявку: ${error.message}`);
      setMessageType("error");
      setProcessingId(null);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((currentRequest) =>
        currentRequest.id === request.id
          ? { ...currentRequest, status: nextStatus }
          : currentRequest
      )
    );

    setMessage("Статус заявки оновлено.");
    setMessageType("success");
    setProcessingId(null);
  }

  async function syncStoreCategories(storeId: string, categoryIds: string[]) {
    await supabase.from("store_categories").delete().eq("store_id", storeId);

    if (categoryIds.length === 0) return;

    const rows = categoryIds.map((categoryId) => ({
      store_id: storeId,
      category_id: categoryId,
    }));

    await supabase.from("store_categories").insert(rows);
  }

  async function createStoreFromRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequest) {
      setMessage("Спочатку обери заявку.");
      setMessageType("error");
      return;
    }

    if (!storeName.trim()) {
      setMessage("Вкажи назву магазину.");
      setMessageType("error");
      return;
    }

    setProcessingId(selectedRequest.id);
    setMessage("");

    const normalizedWebsiteUrl = normalizeUrl(storeWebsiteUrl.trim()) || null;
    const baseSlug = slugify(storeSlug || storeName);
    const finalSlug = makeUniqueSlug(baseSlug, stores, selectedRequest.id);

    const generatedAliases = generateSearchAliases({
      name: storeName.trim(),
      slug: finalSlug,
      websiteUrl: normalizedWebsiteUrl,
      customAliases: [
        getRequestName(selectedRequest),
        getRequestUrl(selectedRequest),
        getRequestDescription(selectedRequest),
        storeDescription,
        ...selectedCategoryNames,
      ],
    });

    const { data: createdStore, error: insertError } = await supabase
      .from("stores")
      .insert({
        name: storeName.trim(),
        slug: finalSlug,
        description: storeDescription.trim() || null,
        website_url: normalizedWebsiteUrl,
        status: "active",
        category_id: selectedCategoryIds[0] || null,
        search_aliases: generatedAliases,
      })
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases"
      )
      .single();

    if (insertError || !createdStore) {
      setMessage(`Не вдалося створити магазин: ${insertError?.message}`);
      setMessageType("error");
      setProcessingId(null);
      return;
    }

    await syncStoreCategories(createdStore.id, selectedCategoryIds);

    const { error: requestUpdateError } = await supabase
      .from("store_requests")
      .update({
        status: "approved",
        created_store_id: createdStore.id,
      })
      .eq("id", selectedRequest.id);

    if (requestUpdateError) {
      setMessage(
        `Магазин створено, але статус заявки не оновився: ${requestUpdateError.message}`
      );
      setMessageType("error");
      setProcessingId(null);
      return;
    }

    const nextCreatedStore = createdStore as unknown as Store;

    setStores((currentStores) => [...currentStores, nextCreatedStore]);

    setStoreCategoryLinks((currentLinks) => [
      ...currentLinks,
      ...selectedCategoryIds.map((categoryId) => ({
        store_id: nextCreatedStore.id,
        category_id: categoryId,
      })),
    ]);

    setRequests((currentRequests) =>
      currentRequests.map((currentRequest) =>
        currentRequest.id === selectedRequest.id
          ? {
              ...currentRequest,
              status: "approved",
              created_store_id: nextCreatedStore.id,
            }
          : currentRequest
      )
    );

    setSelectedRequest(null);
    setStoreName("");
    setStoreSlug("");
    setStoreWebsiteUrl("");
    setStoreDescription("");
    setSelectedCategoryIds([]);

    setMessage("Магазин створено, заявку схвалено і привʼязано до магазину.");
    setMessageType("success");
    setProcessingId(null);
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
          <span className="text-slate-300">Заявки магазинів</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Admin · Store requests
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Заявки магазинів
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна переглядати запропоновані магазини, створювати їх у
                базі, призначати категорії та привʼязувати схвалену заявку до
                створеного магазину.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/stores"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Керування магазинами
                </Link>

                <Link
                  href="/admin/categories"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Категорії
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{counts.all}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">всього</p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {counts.pending}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  очікують
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {counts.approved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалені
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {counts.rejected}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилені
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

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук: назва, сайт, опис, користувач..."
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
              <option value="pending">Очікують</option>
              <option value="approved">Схвалені</option>
              <option value="rejected">Відхилені</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
            </select>
          </div>
        </section>

        {selectedRequest && (
          <form
            ref={createStoreFormRef}
            onSubmit={createStoreFromRequest}
            className="mt-8 scroll-mt-24 rounded-[2.5rem] border border-emerald-400/30 bg-emerald-400/10 p-6"
          >
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="inline-flex rounded-full border border-emerald-400/30 bg-slate-950 px-4 py-2 text-sm font-black text-emerald-300">
                  Створення магазину з заявки
                </p>

                <h2 className="mt-4 break-words text-4xl font-black text-white">
                  {getRequestName(selectedRequest)}
                </h2>

                {selectedRequestExistingStore && (
                  <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-100">
                    <p className="font-black text-yellow-300">
                      Схожий або вже створений магазин є в базі
                    </p>

                    <p className="mt-2">
                      {selectedRequestExistingStore.name} · /stores/
                      {selectedRequestExistingStore.slug}
                    </p>

                    <Link
                      href={`/stores/${selectedRequestExistingStore.slug}`}
                      className="mt-3 inline-flex font-black text-yellow-300 underline underline-offset-4"
                    >
                      Відкрити магазин
                    </Link>
                  </div>
                )}

                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-200">
                      Назва магазину *
                    </span>

                    <input
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-200">
                      Slug *
                    </span>

                    <input
                      value={storeSlug}
                      onChange={(event) =>
                        setStoreSlug(slugify(event.target.value))
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-200">
                      Сайт
                    </span>

                    <input
                      value={storeWebsiteUrl}
                      onChange={(event) =>
                        setStoreWebsiteUrl(event.target.value)
                      }
                      placeholder="https://..."
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-200">
                      Опис
                    </span>

                    <textarea
                      value={storeDescription}
                      onChange={(event) =>
                        setStoreDescription(event.target.value)
                      }
                      rows={5}
                      className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Категорії</h3>

                <p className="mt-2 leading-7 text-slate-300">
                  Можна вибрати кілька категорій. Перша категорія також
                  запишеться в старе поле category_id для сумісності.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {categories.length === 0 ? (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-400">
                      Активних категорій немає.
                    </div>
                  ) : (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                          selectedCategoryIds.includes(category.id)
                            ? "border-emerald-400 bg-emerald-400 text-slate-950"
                            : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <p className="text-sm font-bold text-slate-500">
                    Оригінальна заявка
                  </p>

                  <p className="mt-3 break-words text-lg font-black text-white">
                    {getRequestName(selectedRequest)}
                  </p>

                  <p className="mt-2 break-all text-sm font-bold text-slate-400">
                    {getRequestUrl(selectedRequest) || "URL не вказано"}
                  </p>

                  <p className="mt-4 leading-7 text-slate-400">
                    {getRequestDescription(selectedRequest) ||
                      "Опис не вказано."}
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={processingId === selectedRequest.id}
                    className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processingId === selectedRequest.id
                      ? "Створюю..."
                      : "Створити магазин"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <section className="mt-8 grid gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
              />
            ))}
          </section>
        ) : filteredRequests.length === 0 ? (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-6xl">🏪</div>

            <h2 className="mt-5 text-4xl font-black">Заявок не знайдено</h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Під поточні фільтри немає заявок магазинів.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredRequests.map((request) => {
              const existingStore = getExistingStoreForRequest(request, stores);
              const linkedStore = getLinkedStoreForRequest(request, stores);
              const isProcessing = processingId === request.id;

              return (
                <article
                  key={request.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>

                        {linkedStore && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                            Привʼязано до магазину
                          </span>
                        )}

                        {!linkedStore && existingStore && (
                          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
                            Схожий магазин уже існує
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-start gap-4">
                        <StoreLogo
                          name={getRequestName(request)}
                          websiteUrl={getRequestUrl(request)}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <h2 className="break-words text-4xl font-black text-white">
                            {getRequestName(request)}
                          </h2>

                          <p className="mt-2 break-all text-sm font-bold text-slate-500">
                            {getRequestUrl(request) || "URL не вказано"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                        {getRequestDescription(request) || "Опис не вказано."}
                      </p>

                      {existingStore && (
                        <div
                          className={`mt-5 rounded-2xl border p-4 ${
                            linkedStore
                              ? "border-emerald-400/30 bg-emerald-400/10"
                              : "border-yellow-400/30 bg-yellow-400/10"
                          }`}
                        >
                          <p
                            className={`font-black ${
                              linkedStore
                                ? "text-emerald-300"
                                : "text-yellow-300"
                            }`}
                          >
                            {linkedStore
                              ? "Створений магазин"
                              : "Знайдено можливий дубль"}
                          </p>

                          <p
                            className={`mt-2 ${
                              linkedStore
                                ? "text-emerald-100"
                                : "text-yellow-100"
                            }`}
                          >
                            {existingStore.name} · /stores/{existingStore.slug}
                          </p>

                          <Link
                            href={`/stores/${existingStore.slug}`}
                            className={`mt-3 inline-flex font-black underline underline-offset-4 ${
                              linkedStore
                                ? "text-emerald-300"
                                : "text-yellow-300"
                            }`}
                          >
                            Відкрити магазин
                          </Link>
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Створено
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDateTime(request.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Користувач
                          </p>
                          <p className="mt-1 break-all font-black text-slate-200">
                            {getRequestUserId(request) || "Невідомо"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Host
                          </p>
                          <p className="mt-1 break-all font-black text-slate-200">
                            {getRequestHost(request) || "Немає"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {!linkedStore && (
                        <button
                          type="button"
                          onClick={() => startCreateStoreFromRequest(request)}
                          disabled={isProcessing}
                          className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Створити магазин
                        </button>
                      )}

                      {linkedStore && (
                        <Link
                          href={`/stores/${linkedStore.slug}`}
                          className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити створений магазин
                        </Link>
                      )}

                      {getRequestUrl(request) && (
                        <a
                          href={normalizeUrl(getRequestUrl(request)) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Відкрити сайт
                        </a>
                      )}

                      {!linkedStore && existingStore && (
                        <Link
                          href={`/stores/${existingStore.slug}`}
                          className="rounded-2xl border border-yellow-400/40 px-5 py-4 text-center font-black text-yellow-300 transition hover:bg-yellow-400/10"
                        >
                          Відкрити дубль
                        </Link>
                      )}

                      <div className="my-2 h-px bg-slate-800" />

                      {request.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRequestStatus(request, "approved")
                          }
                          disabled={isProcessing}
                          className="rounded-2xl border border-emerald-400/40 px-5 py-4 font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Позначити схваленою
                        </button>
                      )}

                      {request.status !== "pending" && (
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request, "pending")}
                          disabled={isProcessing}
                          className="rounded-2xl border border-yellow-400/40 px-5 py-4 font-black text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Повернути в очікування
                        </button>
                      )}

                      {request.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRequestStatus(request, "rejected")
                          }
                          disabled={isProcessing}
                          className="rounded-2xl border border-red-400/40 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Відхилити заявку
                        </button>
                      )}
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