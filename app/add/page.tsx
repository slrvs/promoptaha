"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  description?: string | null;
};

type ExistingPromo = {
  id: string;
  code: string;
  status: string;
  created_at?: string | null;
};

type DraftData = {
  code: string;
  storeId: string;
  discountValue: string;
  expiresAt: string;
  sourceType: string;
  sourceUrl: string;
  description: string;
};

const DRAFT_KEY = "promoptaha_add_promo_draft";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function friendlyError(errorMessage: string) {
  if (errorMessage.includes("duplicate")) {
    return "Такий промокод для цього магазину вже існує.";
  }

  if (errorMessage.includes("row-level security")) {
    return "Помилка доступу Supabase. Перевір, чи ти увійшов в акаунт.";
  }

  return errorMessage;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилений";

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

function getHostName(url: string | null | undefined) {
  if (!url) return null;

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getDraft(): DraftData | null {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(DRAFT_KEY);

    if (!rawDraft) return null;

    return JSON.parse(rawDraft) as DraftData;
  } catch {
    return null;
  }
}

function saveDraft(draft: DraftData) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(DRAFT_KEY);
}

export default function AddPromoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const [code, setCode] = useState("");
  const [storeId, setStoreId] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sourceType, setSourceType] = useState("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const [existingPromo, setExistingPromo] = useState<ExistingPromo | null>(
    null
  );
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const selectedStore = useMemo(() => {
    return stores.find((store) => store.id === storeId) || null;
  }, [stores, storeId]);

  const filteredStores = useMemo(() => {
    const normalizedSearch = storeSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return stores;
    }

    return stores.filter((store) => {
      return (
        store.name.toLowerCase().includes(normalizedSearch) ||
        store.slug.toLowerCase().includes(normalizedSearch) ||
        (store.website_url || "").toLowerCase().includes(normalizedSearch) ||
        (store.description || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [stores, storeSearch]);

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, website_url, description")
      .eq("status", "active")
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
    loadStores();

    const draft = getDraft();

    if (draft) {
      setCode(draft.code || "");
      setStoreId(draft.storeId || "");
      setDiscountValue(draft.discountValue || "");
      setExpiresAt(draft.expiresAt || "");
      setSourceType(draft.sourceType || "youtube");
      setSourceUrl(draft.sourceUrl || "");
      setDescription(draft.description || "");
    }
  }, []);

  useEffect(() => {
    const draft: DraftData = {
      code,
      storeId,
      discountValue,
      expiresAt,
      sourceType,
      sourceUrl,
      description,
    };

    saveDraft(draft);
  }, [
    code,
    storeId,
    discountValue,
    expiresAt,
    sourceType,
    sourceUrl,
    description,
  ]);

  useEffect(() => {
    const normalizedCode = normalizeCode(code);

    setExistingPromo(null);

    if (!normalizedCode || !storeId || normalizedCode.length < 2) {
      setIsCheckingDuplicate(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsCheckingDuplicate(true);

      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, code, status, created_at")
        .eq("store_id", storeId)
        .eq("normalized_code", normalizedCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingPromo(data as ExistingPromo);
      } else {
        setExistingPromo(null);
      }

      setIsCheckingDuplicate(false);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [code, storeId]);

  async function submitPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!user) {
      setMessage("Щоб додати промокод, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!code.trim()) {
      setMessage("Вкажи промокод.");
      setMessageType("error");
      return;
    }

    if (!storeId || !selectedStore) {
      setMessage("Обери магазин.");
      setMessageType("error");
      return;
    }

    if (existingPromo && existingPromo.status !== "rejected") {
      setMessage(
        "Такий промокод для цього магазину вже існує. Зміни код або магазин."
      );
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    const normalizedCode = normalizeCode(code);

    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim(),
      normalized_code: normalizedCode,
      store_id: storeId,
      discount_value: discountValue.trim() || null,
      expires_at: expiresAt || null,
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
      description: description.trim() || null,
      status: "pending",
      created_by: user.id,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(`Помилка додавання: ${friendlyError(error.message)}`);
      setMessageType("error");
      return;
    }

    setCode("");
    setStoreId("");
    setStoreSearch("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceType("youtube");
    setSourceUrl("");
    setDescription("");
    setExistingPromo(null);
    clearDraft();

    setMessage("Промокод додано і відправлено на модерацію 🐦");
    setMessageType("success");
  }

  if (isLoadingUser || isLoadingStores) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-6xl">
          <div className="h-[620px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
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
              Щоб додати промокод, потрібно увійти в акаунт. Так ми зможемо
              показувати твої коди в профілі.
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

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Додати промокод</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Новий промокод
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Додати промокод
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Обери магазин, вкажи код, умову знижки, джерело та термін дії.
                Після додавання код піде на модерацію.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Немає магазину?
              </Link>

              <Link
                href="/profile"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Мої коди
              </Link>
            </div>
          </div>

          {stores.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-yellow-400/30 bg-yellow-400/10 p-6">
              <h2 className="text-2xl font-black text-yellow-300">
                Немає активних магазинів
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                Щоб додати промокод, потрібен хоча б один активний магазин.
                Створи магазин в адмінці або запропонуй його через заявку.
              </p>

              <Link
                href="/request-store"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Запропонувати магазин
              </Link>
            </div>
          ) : (
            <form onSubmit={submitPromo} className="mt-8 space-y-6">
              <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Магазин</h2>

                    <p className="mt-2 leading-7 text-slate-400">
                      Обери магазин зі списку. Лого підтягнеться автоматично з
                      сайту магазину.
                    </p>
                  </div>

                  <Link
                    href="/request-store"
                    className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Запропонувати новий
                  </Link>
                </div>

                <input
                  value={storeSearch}
                  onChange={(event) => setStoreSearch(event.target.value)}
                  placeholder="Пошук магазину: Rozetka, Comfy, Allo..."
                  className="mt-5 w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />

                {selectedStore && (
                  <div className="mt-5 rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <StoreLogo
                        name={selectedStore.name}
                        websiteUrl={selectedStore.website_url}
                        size="lg"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-300">
                          Обраний магазин
                        </p>

                        <p className="mt-1 break-words text-3xl font-black text-white">
                          {selectedStore.name}
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-400">
                          /stores/{selectedStore.slug}
                        </p>

                        {selectedStore.website_url && (
                          <p className="mt-1 break-all text-sm font-bold text-slate-500">
                            {getHostName(selectedStore.website_url)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid max-h-[420px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredStores.length === 0 ? (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200 md:col-span-2">
                      Магазинів за таким пошуком не знайдено.
                    </div>
                  ) : (
                    filteredStores.map((store) => {
                      const isSelected = store.id === storeId;

                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => setStoreId(store.id)}
                          className={`rounded-[1.5rem] border p-4 text-left transition ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-400/10"
                              : "border-slate-800 bg-slate-900 hover:border-emerald-400/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <StoreLogo
                              name={store.name}
                              websiteUrl={store.website_url}
                              size="md"
                            />

                            <div className="min-w-0">
                              <p
                                className={`break-words text-lg font-black ${
                                  isSelected
                                    ? "text-emerald-300"
                                    : "text-white"
                                }`}
                              >
                                {store.name}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                /stores/{store.slug}
                              </p>

                              {store.website_url ? (
                                <p className="mt-1 break-all text-xs font-bold text-slate-600">
                                  {getHostName(store.website_url)}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs font-bold text-yellow-400">
                                  Без website_url
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Промокод
                  </label>

                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Наприклад: PTAXA20"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  {isCheckingDuplicate && (
                    <p className="mt-2 text-sm text-slate-500">
                      Перевіряю, чи немає такого коду...
                    </p>
                  )}

                  {existingPromo && (
                    <div className="mt-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-yellow-300">
                          Схожий промокод уже є
                        </p>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            existingPromo.status
                          )}`}
                        >
                          {getStatusLabel(existingPromo.status)}
                        </span>
                      </div>

                      <p className="mt-2">
                        Код:{" "}
                        <span className="font-black">{existingPromo.code}</span>
                      </p>

                      <p className="mt-1">
                        Додано: {formatDate(existingPromo.created_at)}
                      </p>

                      {existingPromo.status === "active" && (
                        <Link
                          href={`/codes/${existingPromo.id}`}
                          className="mt-3 inline-flex font-black text-yellow-200 underline"
                        >
                          Відкрити існуючий код
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Знижка / умова
                  </label>

                  <input
                    value={discountValue}
                    onChange={(event) => setDiscountValue(event.target.value)}
                    placeholder="Наприклад: -20%, безкоштовна доставка"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Діє до
                  </label>

                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Джерело
                  </label>

                  <select
                    value={sourceType}
                    onChange={(event) => setSourceType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="telegram">Telegram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="email">Email</option>
                    <option value="store_site">Сайт магазину</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
              </div>

              <div>
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

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Коментар / опис
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Наприклад: промокод з відео блогера, працює від 1000 грн"
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
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

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || isCheckingDuplicate}
                  className="flex-1 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Додаю..." : "Додати промокод"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setStoreId("");
                    setStoreSearch("");
                    setDiscountValue("");
                    setExpiresAt("");
                    setSourceType("youtube");
                    setSourceUrl("");
                    setDescription("");
                    setExistingPromo(null);
                    clearDraft();
                    setMessage("Чернетку очищено.");
                    setMessageType("info");
                  }}
                  className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Очистити
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}