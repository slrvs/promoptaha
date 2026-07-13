"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

type StoreJoin =
  | {
      name?: string | null;
      slug?: string | null;
    }
  | {
      name?: string | null;
      slug?: string | null;
    }[]
  | null;

type PromoCode = {
  id: string;
  code: string;
  store_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_by?: string | null;
  stores?: StoreJoin;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getStoreName(store: StoreJoin) {
  if (!store) return null;

  if (Array.isArray(store)) {
    return store[0]?.name || null;
  }

  return store.name || null;
}

function getStoreSlug(store: StoreJoin) {
  if (!store) return null;

  if (Array.isArray(store)) {
    return store[0]?.slug || null;
  }

  return store.slug || null;
}

function sourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Не вказано";
}

function normalizeDateForInput(date: string | null | undefined) {
  if (!date) return "";
  return date.slice(0, 10);
}

function friendlyError(errorMessage: string) {
  if (errorMessage.includes("row-level security")) {
    return "Помилка доступу Supabase. Редагувати можна тільки свій промокод зі статусом “на перевірці”.";
  }

  return errorMessage;
}

export default function EditPromoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-5xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження редактора...
            </div>
          </section>
        </main>
      }
    >
      <EditPromoPageContent />
    </Suspense>
  );
}

function EditPromoPageContent() {
  const params = useParams<{ id: string }>();
  const promoId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [promo, setPromo] = useState<PromoCode | null>(null);

  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sourceType, setSourceType] = useState("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  async function loadPromo() {
    setIsLoading(true);
    setMessage("");
    setMessageType("info");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setPromo(null);
      setMessage("Щоб редагувати промокод, потрібно увійти.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, code, store_id, discount_value, expires_at, status, source_type, source_url, description, created_by, stores(name, slug)"
      )
      .eq("id", promoId)
      .single();

    if (error || !data) {
      setPromo(null);
      setMessage("Промокод не знайдено або немає доступу.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const loadedPromo = data as unknown as PromoCode;

    setPromo(loadedPromo);
    setDiscountValue(loadedPromo.discount_value || "");
    setExpiresAt(normalizeDateForInput(loadedPromo.expires_at));
    setSourceType(loadedPromo.source_type || "youtube");
    setSourceUrl(loadedPromo.source_url || "");
    setDescription(loadedPromo.description || "");

    setIsLoading(false);
  }

  useEffect(() => {
    if (promoId) {
      loadPromo();
    }
  }, [promoId]);

  async function savePromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!user) {
      setMessage("Щоб редагувати промокод, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!promo) {
      setMessage("Промокод не завантажено.");
      setMessageType("error");
      return;
    }

    if (promo.created_by !== user.id) {
      setMessage("Ти можеш редагувати тільки свої промокоди.");
      setMessageType("error");
      return;
    }

    if (promo.status !== "pending") {
      setMessage("Редагувати можна тільки промокоди зі статусом “на перевірці”.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("promo_codes")
      .update({
        discount_value: discountValue.trim() || null,
        expires_at: expiresAt || null,
        source_type: sourceType,
        source_url: sourceUrl.trim() || null,
        description: description.trim() || null,
      })
      .eq("id", promo.id)
      .eq("status", "pending");

    setIsSaving(false);

    if (error) {
      setMessage(`Помилка збереження: ${friendlyError(error.message)}`);
      setMessageType("error");
      return;
    }

    setPromo({
      ...promo,
      discount_value: discountValue.trim() || null,
      expires_at: expiresAt || null,
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
      description: description.trim() || null,
    });

    setMessage("Промокод оновлено 🐦");
    setMessageType("success");
  }

  const storeName = getStoreName(promo?.stores || null);
  const storeSlug = getStoreSlug(promo?.stores || null);
  const canEdit = Boolean(
    user && promo && promo.created_by === user.id && promo.status === "pending"
  );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Редагування
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Редагувати промокод
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Можна редагувати тільки свої промокоди, які ще очікують
                модерації.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                До профілю
              </Link>

              <Link
                href="/add"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Додати інший код
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Завантаження промокоду...
            </div>
          ) : !promo ? (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
              <h2 className="text-2xl font-black">Промокод не знайдено</h2>

              <p className="mt-3 text-red-200">
                {message || "Такого промокоду немає або немає доступу."}
              </p>

              <div className="mt-6">
                <Link
                  href="/profile"
                  className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  До профілю
                </Link>
              </div>
            </div>
          ) : (
            <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <h2 className="text-2xl font-black">Промокод</h2>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">Код</p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">
                    {promo.code}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">Магазин</p>

                  {storeSlug ? (
                    <Link
                      href={`/stores/${storeSlug}`}
                      className="mt-1 inline-flex font-bold text-emerald-300 hover:text-emerald-200"
                    >
                      {storeName || "Відкрити магазин"} →
                    </Link>
                  ) : (
                    <p className="mt-1 text-slate-300">
                      {storeName || "Не вказано"}
                    </p>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">Статус</p>
                  <p className="mt-1 font-bold text-yellow-300">
                    {promo.status === "pending"
                      ? "На перевірці"
                      : promo.status || "Невідомо"}
                  </p>
                </div>

                {!canEdit && (
                  <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-300">
                    Цей промокод не можна редагувати. Доступне редагування
                    тільки для власних pending-промокодів.
                  </div>
                )}
              </aside>

              <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <form onSubmit={savePromo} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-300">
                        Знижка / умова
                      </label>

                      <input
                        value={discountValue}
                        onChange={(event) =>
                          setDiscountValue(event.target.value)
                        }
                        disabled={!canEdit}
                        placeholder="Наприклад: -20%, безкоштовна доставка"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-300">
                        Діє до
                      </label>

                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(event) => setExpiresAt(event.target.value)}
                        disabled={!canEdit}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Джерело
                    </label>

                    <select
                      value={sourceType}
                      onChange={(event) => setSourceType(event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="telegram">Telegram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="email">Email</option>
                      <option value="store_site">Сайт магазину</option>
                      <option value="other">Інше</option>
                    </select>

                    <p className="mt-2 text-sm text-slate-500">
                      Поточне джерело: {sourceLabel(promo.source_type)}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Посилання на джерело
                    </label>

                    <input
                      value={sourceUrl}
                      onChange={(event) => setSourceUrl(event.target.value)}
                      disabled={!canEdit}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Коментар / опис
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      disabled={!canEdit}
                      placeholder="Наприклад: промокод з відео блогера, працює від 1000 грн"
                      rows={6}
                      className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
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

                  <button
                    type="submit"
                    disabled={!canEdit || isSaving}
                    className="w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Зберігаю..." : "Зберегти зміни"}
                  </button>
                </form>
              </section>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}