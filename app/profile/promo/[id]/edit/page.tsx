"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import {
  generateSearchAliases,
  matchesSearch,
  normalizeSearchText,
} from "@/lib/searchAliases";

type PromoStatus = "pending" | "approved" | "rejected";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id: string;
  category_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  submitted_by?: string | null;
  search_aliases?: string[] | null;
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

type PromoDuplicate = {
  id: string;
  slug?: string | null;
  code: string;
  store_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const sourceOptions = [
  { value: "youtube", label: "YouTube" },
  { value: "telegram", label: "Telegram" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Сайт" },
  { value: "other", label: "Інше" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function toArray(value: string[] | null | undefined) {
  if (!value) return [];

  return Array.isArray(value) ? value : [];
}

function normalizePromoCode(code: string) {
  return normalizeSearchText(code).replace(/\s+/g, "");
}

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

function getCategoryIdsForStore(
  store: Store | null,
  storeCategoryLinks: StoreCategoryLink[]
) {
  if (!store) return [];

  const linkedCategoryIds = storeCategoryLinks
    .filter((link) => link.store_id === store.id)
    .map((link) => link.category_id);

  if (linkedCategoryIds.length > 0) {
    return linkedCategoryIds;
  }

  return store.category_id ? [store.category_id] : [];
}

function getCategoryNamesForStore(
  store: Store | null,
  categories: Category[],
  storeCategoryLinks: StoreCategoryLink[]
) {
  if (!store) return [];

  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  );

  return getCategoryIdsForStore(store, storeCategoryLinks)
    .map((categoryId) => categoryById.get(categoryId)?.name)
    .filter((name): name is string => Boolean(name));
}

function canEditPromo(promo: PromoCode | null) {
  if (!promo) return false;

  return promo.status === "pending" || promo.status === "rejected";
}

export default function EditProfilePromoPage() {
  const params = useParams<{ id: string }>();
  const promoId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeCategoryLinks, setStoreCategoryLinks] = useState<
    StoreCategoryLink[]
  >([]);

  const [storeSearch, setStoreSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sourceType, setSourceType] = useState("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const [duplicates, setDuplicates] = useState<PromoDuplicate[]>([]);

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const selectedStore = useMemo(() => {
    return stores.find((store) => store.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  const selectedStoreCategoryIds = useMemo(() => {
    return getCategoryIdsForStore(selectedStore, storeCategoryLinks);
  }, [selectedStore, storeCategoryLinks]);

  const selectedStoreCategoryNames = useMemo(() => {
    return getCategoryNamesForStore(
      selectedStore,
      categories,
      storeCategoryLinks
    );
  }, [selectedStore, categories, storeCategoryLinks]);

  const selectedStoreCategories = useMemo(() => {
    const categoryById = new Map(
      categories.map((category) => [category.id, category])
    );

    return selectedStoreCategoryIds
      .map((categoryId) => categoryById.get(categoryId))
      .filter((category): category is Category => Boolean(category));
  }, [categories, selectedStoreCategoryIds]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const categoryNames = getCategoryNamesForStore(
        store,
        categories,
        storeCategoryLinks
      );

      return matchesSearch(
        [
          store.name,
          store.slug,
          store.description || "",
          store.website_url || "",
          toArray(store.search_aliases).join(" "),
          categoryNames.join(" "),
        ],
        storeSearch
      );
    });
  }, [stores, categories, storeCategoryLinks, storeSearch]);

  const canSave = Boolean(
    user &&
      promo &&
      canEditPromo(promo) &&
      selectedStoreId &&
      code.trim() &&
      !isSaving &&
      !isLoading
  );

  async function checkUser() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsCheckingUser(false);

    return data.user;
  }

  async function loadData(currentUser: User) {
    setIsLoading(true);
    setMessage("");

    const [
      promoResult,
      storesResult,
      categoriesResult,
      storeCategoryLinksResult,
    ] = await Promise.all([
      supabase
        .from("promo_codes")
        .select(
          "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, submitted_by, search_aliases, created_at"
        )
        .eq("id", promoId)
        .eq("submitted_by", currentUser.id)
        .maybeSingle(),

      supabase
        .from("stores")
        .select(
          "id, name, slug, description, website_url, status, category_id, search_aliases"
        )
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(2000),

      supabase
        .from("categories")
        .select("id, name, slug, description, status")
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(500),

      supabase.from("store_categories").select("store_id, category_id"),
    ]);

    if (promoResult.error) {
      setMessage(`Не вдалося завантажити промокод: ${promoResult.error.message}`);
      setMessageType("error");
    }

    if (storesResult.error) {
      setMessage(`Не вдалося завантажити магазини: ${storesResult.error.message}`);
      setMessageType("error");
    }

    if (categoriesResult.error) {
      setMessage(
        `Не вдалося завантажити категорії: ${categoriesResult.error.message}`
      );
      setMessageType("error");
    }

    const loadedPromo = promoResult.data as unknown as PromoCode | null;

    setPromo(loadedPromo);
    setStores((storesResult.data || []) as unknown as Store[]);
    setCategories((categoriesResult.data || []) as unknown as Category[]);
    setStoreCategoryLinks(
      (storeCategoryLinksResult.data || []) as unknown as StoreCategoryLink[]
    );

    if (loadedPromo) {
      setSelectedStoreId(loadedPromo.store_id || "");
      setSelectedCategoryId(loadedPromo.category_id || "");
      setCode(loadedPromo.code || "");
      setDiscountValue(loadedPromo.discount_value || "");
      setExpiresAt(loadedPromo.expires_at || "");
      setSourceType(loadedPromo.source_type || "youtube");
      setSourceUrl(loadedPromo.source_url || "");
      setDescription(loadedPromo.description || "");
    }

    setIsLoading(false);
  }

  async function checkDuplicates(nextCode: string, nextStoreId: string) {
    const normalizedCode = normalizePromoCode(nextCode);

    if (!normalizedCode || !nextStoreId) {
      setDuplicates([]);
      return;
    }

    setIsCheckingDuplicates(true);

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, status, created_at"
      )
      .eq("store_id", nextStoreId)
      .limit(50);

    setIsCheckingDuplicates(false);

    if (error) {
      setDuplicates([]);
      return;
    }

    const foundDuplicates = ((data || []) as unknown as PromoDuplicate[]).filter(
      (existingPromo) =>
        existingPromo.id !== promoId &&
        normalizePromoCode(existingPromo.code) === normalizedCode
    );

    setDuplicates(foundDuplicates);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await checkUser();

      if (currentUser) {
        await loadData(currentUser);
      } else {
        setIsLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        loadData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [promoId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkDuplicates(code, selectedStoreId);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [code, selectedStoreId, promoId]);

  useEffect(() => {
    if (!selectedStore) {
      setSelectedCategoryId("");
      return;
    }

    if (
      selectedCategoryId &&
      selectedStoreCategoryIds.includes(selectedCategoryId)
    ) {
      return;
    }

    if (
      selectedCategoryId &&
      selectedStore.category_id === selectedCategoryId
    ) {
      return;
    }

    const firstStoreCategoryId =
      selectedStoreCategoryIds[0] || selectedStore.category_id || "";

    setSelectedCategoryId(firstStoreCategoryId);
  }, [selectedStore, selectedStoreCategoryIds, selectedCategoryId]);

  async function savePromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!promo) {
      setMessage("Промокод не знайдено.");
      setMessageType("error");
      return;
    }

    if (!canEditPromo(promo)) {
      setMessage("Схвалений промокод не можна редагувати з профілю.");
      setMessageType("error");
      return;
    }

    if (!selectedStore) {
      setMessage("Обери магазин для промокоду.");
      setMessageType("error");
      return;
    }

    if (!code.trim()) {
      setMessage("Введи промокод.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const finalCategoryId =
      selectedCategoryId ||
      selectedStoreCategoryIds[0] ||
      selectedStore.category_id ||
      null;

    const generatedAliases = generateSearchAliases({
      name: code.trim(),
      slug: normalizePromoCode(code),
      websiteUrl: sourceUrl.trim() || null,
      customAliases: [
        selectedStore.name,
        selectedStore.slug,
        discountValue,
        description,
        sourceType,
        ...selectedStoreCategoryNames,
      ],
    });

    const { error } = await supabase
      .from("promo_codes")
      .update({
        store_id: selectedStore.id,
        code: code.trim(),
        discount_value: discountValue.trim() || null,
        expires_at: expiresAt || null,
        source_type: sourceType,
        source_url: sourceUrl.trim() || null,
        description: description.trim() || null,
        category_id: finalCategoryId,
        search_aliases: generatedAliases,
      })
      .eq("id", promo.id)
      .eq("submitted_by", user.id);

    setIsSaving(false);

    if (error) {
      setMessage(`Не вдалося зберегти зміни: ${error.message}`);
      setMessageType("error");
      return;
    }

    setMessage("Промокод оновлено. Він залишиться на модерації.");
    setMessageType("success");

    setPromo((currentPromo) =>
      currentPromo
        ? {
            ...currentPromo,
            store_id: selectedStore.id,
            code: code.trim(),
            discount_value: discountValue.trim() || null,
            expires_at: expiresAt || null,
            source_type: sourceType,
            source_url: sourceUrl.trim() || null,
            description: description.trim() || null,
            category_id: finalCategoryId,
            search_aliases: generatedAliases,
          }
        : currentPromo
    );
  }

  if (isCheckingUser || isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[560px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
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
              Увійди, щоб редагувати свої промокоди.
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

  if (!promo) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="text-6xl">🎟️</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Промокод не знайдено
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Можливо, це не твій промокод або він був видалений.
            </p>

            <Link
              href="/profile"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              До профілю
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!canEditPromo(promo)) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-emerald-400/30 bg-emerald-400/10 p-8 text-center">
            <div className="text-6xl">✅</div>

            <h1 className="mt-5 text-4xl font-black text-emerald-300">
              Промокод уже схвалено
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-emerald-100">
              Схвалені промокоди не редагуються з профілю, бо вони вже
              опубліковані на сайті.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`/codes/${promo.slug || promo.id}`}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Відкрити код
              </Link>

              <Link
                href="/profile"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                До профілю
              </Link>
            </div>
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
          <Link href="/profile" className="hover:text-emerald-300">
            Профіль
          </Link>
          <span>/</span>
          <span className="text-slate-300">Редагування промокоду</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Редагування
              </p>

              <h1 className="break-all text-5xl font-black tracking-tight md:text-7xl">
                {promo.code}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${getStatusClass(
                    promo.status
                  )}`}
                >
                  {getStatusLabel(promo.status)}
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
                  Додано: {formatDateTime(promo.created_at)}
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Можеш змінити магазин, код, знижку, термін дії, джерело,
                категорію та опис. Після збереження промокод залишиться на
                модерації.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-3xl font-black">Правила</h2>

              <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
                <p>• Редагувати можна тільки коди на модерації або відхилені.</p>
                <p>• Схвалені коди вже опубліковані, тому редагуються тільки через адмінку.</p>
                <p>• Якщо код змінився — перевір дублікати перед збереженням.</p>
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
            {message}
          </div>
        )}

        <form onSubmit={savePromo} className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Магазин</h2>

            <input
              value={storeSearch}
              onChange={(event) => setStoreSearch(event.target.value)}
              placeholder="Пошук магазину..."
              className="mt-5 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            <div className="mt-5 grid max-h-[620px] gap-3 overflow-y-auto pr-1">
              {filteredStores.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center text-slate-400">
                  Магазинів не знайдено.
                </div>
              ) : (
                filteredStores.map((store) => {
                  const categoryNames = getCategoryNamesForStore(
                    store,
                    categories,
                    storeCategoryLinks
                  );

                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        setSelectedCategoryId("");
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedStoreId === store.id
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-slate-800 bg-slate-950 hover:border-emerald-400/40"
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
                              categoryNames.slice(0, 4).map((categoryName) => (
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
                })
              )}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Дані промокоду</h2>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Промокод *
                </span>

                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Наприклад: PTAHA10"
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              {isCheckingDuplicates && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-bold text-slate-400">
                  Перевіряю дублікати...
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
                  <p className="font-black text-yellow-300">
                    Знайдено схожий промокод
                  </p>

                  <div className="mt-3 grid gap-2">
                    {duplicates.map((duplicate) => (
                      <Link
                        key={duplicate.id}
                        href={`/codes/${duplicate.slug || duplicate.id}`}
                        className="rounded-xl border border-yellow-400/20 bg-slate-950/60 p-3 text-sm font-bold text-yellow-100 transition hover:border-yellow-300"
                      >
                        {duplicate.code} · {duplicate.store_name || "Магазин"} ·{" "}
                        {getStatusLabel(duplicate.status)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Знижка / вигода
                </span>

                <input
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder="Наприклад: -10%, 200 грн, безкоштовна доставка"
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Термін дії
                </span>

                <input
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Джерело
                </span>

                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                >
                  {sourceOptions.map((sourceOption) => (
                    <option key={sourceOption.value} value={sourceOption.value}>
                      {sourceOption.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
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

              <div>
                <p className="text-sm font-black text-slate-300">
                  Категорія промокоду
                </p>

                {selectedStoreCategories.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
                    У цього магазину немає категорій. Промокод можна зберегти
                    без категорії.
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStoreCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                          selectedCategoryId === category.id
                            ? "border-emerald-400 bg-emerald-400 text-slate-950"
                            : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Опис / умови
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Опиши умови використання промокоду..."
                  rows={6}
                  className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={!canSave}
                  className="rounded-2xl bg-emerald-400 px-6 py-5 text-lg font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Зберігаю..." : "Зберегти зміни"}
                </button>

                <Link
                  href="/profile"
                  className="flex justify-center rounded-2xl border border-slate-700 px-6 py-5 text-lg font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Назад у профіль
                </Link>
              </div>
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}