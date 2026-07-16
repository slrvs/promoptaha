"use client";

import { getFriendlyErrorMessage } from "@/lib/friendlyError";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import LoginRequiredBox from "@/components/LoginRequiredBox";
import {
  generateSearchAliases,
  getHostName,
  matchesSearch,
  normalizeSearchText,
  parseAliases,
} from "@/lib/searchAliases";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  category_id?: string | null;
  search_aliases?: string[] | null;
  created_at?: string | null;
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

type DuplicatePromo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id: string;
  store_name?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type SourceType =
  | "youtube"
  | "telegram"
  | "instagram"
  | "tiktok"
  | "website"
  | "other";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

const draftKey = "promoptaha-add-draft";

function normalizePromoCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function makeStoreCategoryMap(links: StoreCategoryLink[]) {
  const map = new Map<string, StoreCategoryLink[]>();

  for (const link of links) {
    const currentLinks = map.get(link.store_id) || [];

    map.set(link.store_id, [...currentLinks, link]);
  }

  return map;
}

function getStoreCategoryIds(
  store: Store | null,
  storeCategoriesByStoreId: Map<string, StoreCategoryLink[]>
) {
  if (!store) return [];

  const idsFromLinks =
    storeCategoriesByStoreId
      .get(store.id)
      ?.map((link) => link.category_id)
      .filter(Boolean) || [];

  if (idsFromLinks.length > 0) {
    return Array.from(new Set(idsFromLinks));
  }

  return store.category_id ? [store.category_id] : [];
}

function getStoreCategoryNames(
  store: Store | null,
  categoryById: Map<string, Category>,
  storeCategoriesByStoreId: Map<string, StoreCategoryLink[]>
) {
  return getStoreCategoryIds(store, storeCategoriesByStoreId)
    .map((categoryId) => categoryById.get(categoryId)?.name)
    .filter(Boolean) as string[];
}

function getSourceLabel(sourceType: SourceType) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";

  return "Інше";
}

function makePromoAliases({
  code,
  discountValue,
  description,
  sourceType,
  sourceUrl,
  store,
  category,
}: {
  code: string;
  discountValue: string;
  description: string;
  sourceType: SourceType;
  sourceUrl: string;
  store: Store | null;
  category: Category | null;
}) {
  const manualAliases = parseAliases(
    [
      code,
      normalizePromoCode(code),
      discountValue,
      description,
      sourceType,
      getSourceLabel(sourceType),
      sourceUrl,
      store?.name || "",
      store?.slug || "",
      category?.name || "",
      category?.slug || "",
    ].join(", ")
  );

  const storeAliases = store
    ? generateSearchAliases({
        name: store.name,
        slug: store.slug,
        websiteUrl: store.website_url,
        customAliases: store.search_aliases || [],
      })
    : [];

  return Array.from(new Set([...manualAliases, ...storeAliases]))
    .map((alias) => normalizeSearchText(alias))
    .filter(Boolean)
    .slice(0, 80);
}

function AddPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-[640px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
      </section>
    </main>
  );
}

function AddPromoContent() {
  const searchParams = useSearchParams();
  const preselectedStoreId = searchParams.get("store") || "";

  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeCategoryLinks, setStoreCategoryLinks] = useState<
    StoreCategoryLink[]
  >([]);

  const [storeSearch, setStoreSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState(preselectedStoreId);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const [duplicates, setDuplicates] = useState<DuplicatePromo[]>([]);
  const [createdPromoId, setCreatedPromoId] = useState("");
  const [createdPromoSlug, setCreatedPromoSlug] = useState<string | null>(null);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const selectedStore = useMemo(() => {
    return stores.find((store) => store.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const storeCategoriesByStoreId = useMemo(() => {
    return makeStoreCategoryMap(storeCategoryLinks);
  }, [storeCategoryLinks]);

  const selectedStoreCategoryIds = useMemo(() => {
    return getStoreCategoryIds(selectedStore, storeCategoriesByStoreId);
  }, [selectedStore, storeCategoriesByStoreId]);

  const selectedStoreCategoryNames = useMemo(() => {
    return getStoreCategoryNames(
      selectedStore,
      categoryById,
      storeCategoriesByStoreId
    );
  }, [selectedStore, categoryById, storeCategoriesByStoreId]);

  const selectedCategory = useMemo(() => {
    return categoryById.get(selectedCategoryId) || null;
  }, [categoryById, selectedCategoryId]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const categoryNames = getStoreCategoryNames(
        store,
        categoryById,
        storeCategoriesByStoreId
      );

      return matchesSearch(
        [
          store.name,
          store.slug,
          store.description || "",
          store.website_url || "",
          getHostName(store.website_url) || "",
          categoryNames.join(" "),
          (store.search_aliases || []).join(" "),
        ],
        storeSearch
      );
    });
  }, [stores, storeSearch, categoryById, storeCategoriesByStoreId]);

  const canSubmit =
    Boolean(user) &&
    Boolean(selectedStoreId) &&
    Boolean(code.trim()) &&
    Boolean(discountValue.trim()) &&
    !isSubmitting;

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
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
      setMessage(
        `Не вдалося завантажити категорії: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      setIsLoadingCategories(false);
      return;
    }

    setCategories((data || []) as unknown as Category[]);
    setIsLoadingCategories(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, website_url, status, category_id, search_aliases, created_at"
      )
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storeError) {
      setStores([]);
      setStoreCategoryLinks([]);
      setMessage(
        `Не вдалося завантажити магазини: ${getFriendlyErrorMessage(
          storeError
        )}`
      );
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    const loadedStores = (storeData || []) as unknown as Store[];
    const storeIds = loadedStores.map((store) => store.id);

    setStores(loadedStores);

    if (storeIds.length === 0) {
      setStoreCategoryLinks([]);
      setIsLoadingStores(false);
      return;
    }

    const { data: linkData, error: linkError } = await supabase
      .from("store_categories")
      .select("store_id, category_id")
      .in("store_id", storeIds);

    if (linkError) {
      setStoreCategoryLinks([]);
      setMessage(
        `Магазини завантажено, але категорії магазинів не підтягнулись: ${getFriendlyErrorMessage(
          linkError
        )}`
      );
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    setStoreCategoryLinks((linkData || []) as unknown as StoreCategoryLink[]);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadUser();
    loadCategories();
    loadStores();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoadingUser(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedStoreId && preselectedStoreId) {
      setSelectedStoreId(preselectedStoreId);
    }
  }, [preselectedStoreId, selectedStoreId]);

  useEffect(() => {
    if (!selectedStore) return;

    if (selectedStoreCategoryIds.length === 0) {
      setSelectedCategoryId("");
      return;
    }

    if (
      !selectedCategoryId ||
      !selectedStoreCategoryIds.includes(selectedCategoryId)
    ) {
      setSelectedCategoryId(selectedStoreCategoryIds[0]);
    }
  }, [selectedStore, selectedStoreCategoryIds, selectedCategoryId]);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);

    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as {
        selectedStoreId?: string;
        selectedCategoryId?: string;
        code?: string;
        discountValue?: string;
        expiresAt?: string;
        sourceType?: SourceType;
        sourceUrl?: string;
        description?: string;
      };

      if (!preselectedStoreId && draft.selectedStoreId) {
        setSelectedStoreId(draft.selectedStoreId);
      }

      setSelectedCategoryId(draft.selectedCategoryId || "");
      setCode(draft.code || "");
      setDiscountValue(draft.discountValue || "");
      setExpiresAt(draft.expiresAt || "");
      setSourceType(draft.sourceType || "youtube");
      setSourceUrl(draft.sourceUrl || "");
      setDescription(draft.description || "");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [preselectedStoreId]);

  useEffect(() => {
    const draft = {
      selectedStoreId,
      selectedCategoryId,
      code,
      discountValue,
      expiresAt,
      sourceType,
      sourceUrl,
      description,
    };

    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    selectedStoreId,
    selectedCategoryId,
    code,
    discountValue,
    expiresAt,
    sourceType,
    sourceUrl,
    description,
  ]);

  useEffect(() => {
    async function checkDuplicates() {
      const normalizedCode = normalizePromoCode(code);

      if (!selectedStoreId || normalizedCode.length < 2) {
        setDuplicates([]);
        return;
      }

      setIsCheckingDuplicates(true);

      const { data, error } = await supabase
        .from("promo_code_stats")
        .select("id, slug, code, store_id, store_name, status, created_at")
        .eq("store_id", selectedStoreId)
        .eq("normalized_code", normalizedCode)
        .limit(5);

      setIsCheckingDuplicates(false);

      if (error) {
        setDuplicates([]);
        return;
      }

      setDuplicates((data || []) as unknown as DuplicatePromo[]);
    }

    const timeoutId = window.setTimeout(checkDuplicates, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [code, selectedStoreId]);

  function resetForm() {
    setSelectedStoreId("");
    setSelectedCategoryId("");
    setStoreSearch("");
    setCode("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceType("youtube");
    setSourceUrl("");
    setDescription("");
    setDuplicates([]);
    window.localStorage.removeItem(draftKey);
  }

  async function submitPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Щоб додати промокод, увійди в акаунт.");
      setMessageType("info");
      return;
    }

    if (!selectedStore) {
      setMessage("Обери магазин для промокоду.");
      setMessageType("error");
      return;
    }

    if (!code.trim()) {
      setMessage("Вкажи сам промокод.");
      setMessageType("error");
      return;
    }

    if (!discountValue.trim()) {
      setMessage("Вкажи знижку або вигоду, наприклад: -10%, доставка 0 грн.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const finalCategoryId =
      selectedCategoryId ||
      selectedStoreCategoryIds[0] ||
      selectedStore.category_id ||
      null;

    const finalCategory = finalCategoryId
      ? categoryById.get(finalCategoryId) || null
      : null;

    const finalAliases = makePromoAliases({
      code,
      discountValue,
      description,
      sourceType,
      sourceUrl,
      store: selectedStore,
      category: finalCategory,
    });

    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        code: code.trim(),
        normalized_code: normalizePromoCode(code),
        store_id: selectedStore.id,
        discount_value: discountValue.trim(),
        expires_at: expiresAt || null,
        source_type: sourceType,
        source_url: sourceUrl.trim() || null,
        description: description.trim() || null,
        status: "pending",
        submitted_by: user.id,
        category_id: finalCategoryId,
        search_aliases: finalAliases,
      })
      .select("id, slug")
      .single();

    setIsSubmitting(false);

    if (error) {
      setMessage(
        `Не вдалося додати промокод: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    setCreatedPromoId(data.id);
    setCreatedPromoSlug(data.slug || null);
    setMessage(
      "Промокод додано й відправлено на модерацію. Після схвалення він зʼявиться на сайті."
    );
    setMessageType("success");
    resetForm();
  }

  if (isLoadingUser) {
    return <AddPageSkeleton />;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link href="/" className="hover:text-emerald-300">
              Головна
            </Link>
            <span>/</span>
            <span className="text-slate-300">Додати промокод</span>
          </div>

          <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
            <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              Додавання промокоду
            </p>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
              Додати промокод можуть авторизовані користувачі
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
              Увійди в акаунт, щоб додати промокод, прикріпити його до свого
              профілю, відправити на модерацію та прокачувати рівень автора.
            </p>

            <div className="mt-8">
              <LoginRequiredBox
                title="Щоб додати промокод, увійди в акаунт"
                description="Після входу ми повернемо тебе на цю сторінку, і ти зможеш одразу заповнити форму додавання промокоду."
                nextPath="/add"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Дивитись промокоди
              </Link>

              <Link
                href="/guest"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Гостьовий режим
              </Link>
            </div>
          </section>
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
          <span className="text-slate-300">Додати промокод</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Додавання
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Додати промокод
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Додай код, джерело, термін дії та магазин. Якщо магазин має
                кілька категорій, обери основну категорію для цього промокоду.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Усі промокоди
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Немає магазину?
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">Правила</h2>

              <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-400">
                <p>
                  Додавай тільки реальні промокоди з відкритих джерел:
                  YouTube, Telegram, Instagram, TikTok або сайту магазину.
                </p>

                <p>
                  Не додавай персональні, одноразові або чужі приватні коди.
                  Після додавання промокод піде на модерацію.
                </p>

                <p className="font-bold text-emerald-300">
                  Категорії магазину підтягнуться автоматично.
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : messageType === "error"
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            <div>{message}</div>

            {messageType === "success" && createdPromoId && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  До профілю
                </Link>

                <Link
                  href={`/codes/${createdPromoSlug || createdPromoId}`}
                  className="rounded-full border border-emerald-400/30 px-5 py-3 font-black text-emerald-300 transition hover:bg-emerald-400/10"
                >
                  Відкрити код
                </Link>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={submitPromo}
          className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-5 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">1. Магазин</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Обери магазин, до якого належить промокод.
                </p>
              </div>

              {isLoadingStores && (
                <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-400">
                  Завантаження...
                </span>
              )}
            </div>

            <input
              value={storeSearch}
              onChange={(event) => setStoreSearch(event.target.value)}
              placeholder="Пошук магазину: KRKR, кркр, Comfy..."
              className="mt-5 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <div className="mt-5 max-h-[520px] overflow-y-auto pr-1">
              {filteredStores.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">
                  <p className="font-bold text-slate-300">
                    Магазин не знайдено
                  </p>

                  <Link
                    href="/request-store"
                    className="mt-4 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Запропонувати магазин
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredStores.map((store) => {
                    const isSelected = selectedStoreId === store.id;
                    const categoryNames = getStoreCategoryNames(
                      store,
                      categoryById,
                      storeCategoriesByStoreId
                    );

                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setSelectedStoreId(store.id);
                          setStoreSearch(store.name);
                        }}
                        className={`rounded-[1.5rem] border p-4 text-left transition ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-400/10"
                            : "border-slate-800 bg-slate-950 hover:border-emerald-400/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <StoreLogo
                            name={store.name}
                            websiteUrl={store.website_url}
                            size="sm"
                          />

                          <div className="min-w-0">
                            <p className="break-words text-lg font-black text-white">
                              {store.name}
                            </p>

                            <p className="mt-1 break-all text-xs font-bold text-slate-500">
                              /stores/{store.slug}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {categoryNames.length === 0 ? (
                                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-500">
                                  Без категорії
                                </span>
                              ) : (
                                categoryNames
                                  .slice(0, 4)
                                  .map((categoryName) => (
                                    <span
                                      key={categoryName}
                                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                                    >
                                      {categoryName}
                                    </span>
                                  ))
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-5 lg:p-7">
            <h2 className="text-3xl font-black">2. Дані промокоду</h2>

            {selectedStore && (
              <div className="mt-5 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-5">
                <div className="flex items-start gap-4">
                  <StoreLogo
                    name={selectedStore.name}
                    websiteUrl={selectedStore.website_url}
                    size="md"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-300">
                      Обраний магазин
                    </p>

                    <p className="mt-1 break-words text-2xl font-black text-white">
                      {selectedStore.name}
                    </p>

                    <p className="mt-1 break-all text-sm font-bold text-slate-500">
                      /stores/{selectedStore.slug}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-bold text-slate-300">
                    Категорія промокоду
                  </p>

                  {selectedStoreCategoryIds.length === 0 ? (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
                      У магазину ще немає категорій. Промокод буде без
                      категорії, поки адміністратор не додасть категорію.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedStoreCategoryIds.map((categoryId) => {
                        const category = categoryById.get(categoryId);
                        const isSelected = selectedCategoryId === categoryId;

                        if (!category) return null;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-400 text-slate-950"
                                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Промокод
                </label>

                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="SALE10"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />

                {isCheckingDuplicates && (
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Перевіряю дублікати...
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Знижка / вигода
                </label>

                <input
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder="-10%, доставка 0 грн, 200 грн бонус"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Термін дії
                </label>

                <input
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                />

                <p className="mt-2 text-xs font-bold text-slate-600">
                  Можна лишити порожнім, якщо термін невідомий.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Джерело
                </label>

                <select
                  value={sourceType}
                  onChange={(event) =>
                    setSourceType(event.target.value as SourceType)
                  }
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                >
                  <option value="youtube">YouTube</option>
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="website">Сайт</option>
                  <option value="other">Інше</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Посилання на джерело
              </label>

              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Опис / умови
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Наприклад: діє для першого замовлення, від 500 грн, тільки в застосунку..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </div>

            {duplicates.length > 0 && (
              <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-100">
                <p className="font-black text-yellow-300">
                  Схожий промокод уже є
                </p>

                <div className="mt-3 grid gap-2">
                  {duplicates.map((duplicate) => (
                    <Link
                      key={duplicate.id}
                      href={`/codes/${duplicate.slug || duplicate.id}`}
                      className="rounded-xl border border-yellow-400/20 bg-slate-950/50 px-4 py-3 text-sm font-bold transition hover:border-yellow-300"
                    >
                      {duplicate.code} · {duplicate.store_name || "Магазин"} ·{" "}
                      {formatDate(duplicate.created_at)}
                    </Link>
                  ))}
                </div>

                <p className="mt-3 text-sm leading-6">
                  Якщо це точно інший код або нові умови — можна додати.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Відправляю..." : "Додати на модерацію"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Очистити
              </button>
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}

export default function AddPromoPage() {
  return (
    <Suspense fallback={<AddPageSkeleton />}>
      <AddPromoContent />
    </Suspense>
  );
}