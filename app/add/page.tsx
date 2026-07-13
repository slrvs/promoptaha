"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
};

type ExistingPromo = {
  id: string;
  code: string;
  normalized_code: string;
  status: string;
  created_at?: string | null;
};

type AddPromoDraft = {
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

function getStatusLabel(status: string) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилений";
  return status;
}

function loadDraft(): AddPromoDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY);

    if (!savedDraft) return null;

    return JSON.parse(savedDraft) as AddPromoDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: AddPromoDraft) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(DRAFT_KEY);
}

export default function AddPromoPage() {
  const isDraftReady = useRef(false);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
        store.slug.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [stores, storeSearch]);

  async function loadPageData() {
    setIsLoading(true);
    setMessage("");

    const draft = loadDraft();

    if (draft) {
      setCode(draft.code || "");
      setStoreId(draft.storeId || "");
      setDiscountValue(draft.discountValue || "");
      setExpiresAt(draft.expiresAt || "");
      setSourceType(draft.sourceType || "youtube");
      setSourceUrl(draft.sourceUrl || "");
      setDescription(draft.description || "");
    }

    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storesError) {
      setStores([]);
      setMessage(`Помилка завантаження магазинів: ${storesError.message}`);
      setMessageType("error");
      setIsLoading(false);
      isDraftReady.current = true;
      return;
    }

    const loadedStores = (storesData || []) as Store[];

    setStores(loadedStores);

    const savedStoreId = draft?.storeId || "";

    if (loadedStores.length > 0) {
      if (
        savedStoreId &&
        loadedStores.some((store) => store.id === savedStoreId)
      ) {
        setStoreId(savedStoreId);
      } else {
        setStoreId(loadedStores[0].id);
      }
    }

    setIsLoading(false);
    isDraftReady.current = true;
  }

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (!isDraftReady.current) return;

    saveDraft({
      code,
      storeId,
      discountValue,
      expiresAt,
      sourceType,
      sourceUrl,
      description,
    });
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
        .select("id, code, normalized_code, status, created_at")
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

  async function addPromo(event: FormEvent<HTMLFormElement>) {
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
        "Увага: такий промокод для цього магазину вже є. Якщо це справді новий код — зміни код або уточни опис."
      );
      setMessageType("error");
      return;
    }

    setIsSaving(true);

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

    setIsSaving(false);

    if (error) {
      setMessage(`Помилка додавання: ${friendlyError(error.message)}`);
      setMessageType("error");
      return;
    }

    clearDraft();

    setCode("");
    setStoreSearch("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceType("youtube");
    setSourceUrl("");
    setDescription("");
    setExistingPromo(null);

    if (stores.length > 0) {
      setStoreId(stores[0].id);
    }

    setMessage("Промокод додано на модерацію 🐦");
    setMessageType("success");
  }

  function clearFormDraft() {
    clearDraft();

    setCode("");
    setStoreSearch("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceType("youtube");
    setSourceUrl("");
    setDescription("");
    setExistingPromo(null);

    if (stores.length > 0) {
      setStoreId(stores[0].id);
    }

    setMessage("Чернетку очищено.");
    setMessageType("info");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Додати промокод
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Поділись знижкою
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Додай промокод, магазин, джерело та умови. Після модерації код
                з’явиться на сайті.
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Форма автоматично зберігається в браузері. Можеш перейти на
                інший сайт, скопіювати код і повернутись — дані мають
                залишитись.
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
                href="/codes"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                До промокодів
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження форми...
            </div>
          ) : !user ? (
            <div className="mt-8 rounded-[2rem] border border-red-400/30 bg-red-400/10 p-6">
              <h2 className="text-2xl font-black text-red-300">
                Потрібен вхід
              </h2>

              <p className="mt-3 leading-7 text-red-100">
                Щоб додавати промокоди, потрібно увійти в акаунт.
              </p>

              <Link
                href="/login"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            </div>
          ) : stores.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-yellow-400/30 bg-yellow-400/10 p-6">
              <h2 className="text-2xl font-black text-yellow-300">
                Немає активних магазинів
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                Спочатку треба додати або запропонувати магазин.
              </p>

              <Link
                href="/request-store"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Запропонувати магазин
              </Link>
            </div>
          ) : (
            <form onSubmit={addPromo} className="mt-8 space-y-6">
              <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Магазин</h2>
                    <p className="mt-2 leading-7 text-slate-400">
                      Знайди магазин через пошук і натисни на нього. Обраний
                      магазин збережеться в чернетці.
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
                  placeholder="Пошук магазину: ROZETKA, Comfy, КРКР..."
                  className="mt-5 w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />

                {selectedStore && (
                  <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                    <p className="text-sm font-bold text-emerald-300">
                      Обраний магазин
                    </p>

                    <p className="mt-1 text-2xl font-black text-white">
                      {selectedStore.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      /stores/{selectedStore.slug}
                    </p>
                  </div>
                )}

                <div className="mt-5 grid max-h-72 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredStores.length === 0 ? (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200 md:col-span-2">
                      Магазинів за таким пошуком не знайдено. Можеш
                      запропонувати новий магазин.
                    </div>
                  ) : (
                    filteredStores.map((store) => {
                      const isSelected = store.id === storeId;

                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => setStoreId(store.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-400/10"
                              : "border-slate-800 bg-slate-900 hover:border-emerald-400/50"
                          }`}
                        >
                          <p
                            className={`text-lg font-black ${
                              isSelected ? "text-emerald-300" : "text-white"
                            }`}
                          >
                            {store.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            /stores/{store.slug}
                          </p>
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
                      <p className="font-black text-yellow-300">
                        Схожий промокод уже є
                      </p>

                      <p className="mt-2">
                        Код:{" "}
                        <span className="font-black">{existingPromo.code}</span>
                      </p>

                      <p className="mt-1">
                        Статус:{" "}
                        <span className="font-black">
                          {getStatusLabel(existingPromo.status)}
                        </span>
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
                  disabled={isSaving || isCheckingDuplicate}
                  className="flex-1 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Додаю..." : "Додати на модерацію"}
                </button>

                <button
                  type="button"
                  onClick={clearFormDraft}
                  className="rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Очистити чернетку
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}