"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function friendlyError(errorMessage: string) {
  if (
    errorMessage.includes("duplicate") ||
    errorMessage.includes("unique") ||
    errorMessage.includes("promo_codes_normalized_code_store_id")
  ) {
    return "Такий промокод для цього магазину вже є в базі.";
  }

  if (errorMessage.includes("row-level security")) {
    return "Помилка доступу Supabase. Перевір, чи ти увійшов в акаунт і чи є RLS-політика для додавання промокодів.";
  }

  return errorMessage;
}

export default function AddPromoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const [code, setCode] = useState("");
  const [storeId, setStoreId] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sourceType, setSourceType] = useState("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  async function loadPageData() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, name, slug, status")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storesError) {
      setStores([]);
      setMessage(`Помилка завантаження магазинів: ${storesError.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const loadedStores = (storesData as Store[]) || [];
    setStores(loadedStores);

    if (loadedStores.length > 0) {
      setStoreId(loadedStores[0].id);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadPageData();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadPageData();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  function resetForm() {
    setCode("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceType("youtube");
    setSourceUrl("");
    setDescription("");

    if (stores.length > 0) {
      setStoreId(stores[0].id);
    }
  }

  async function submitPromo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!user) {
      setMessage("Щоб додати промокод, потрібно увійти в акаунт.");
      setMessageType("error");
      return;
    }

    if (!code.trim()) {
      setMessage("Вкажи промокод.");
      setMessageType("error");
      return;
    }

    if (!storeId) {
      setMessage("Обери магазин.");
      setMessageType("error");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim(),
      store_id: storeId,
      discount_value: discountValue.trim() || null,
      expires_at: expiresAt || null,
      status: "pending",
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
      description: description.trim() || null,
      created_by: user.id,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка додавання: ${friendlyError(error.message)}`);
      setMessageType("error");
      return;
    }

    resetForm();
    setMessage(
      "Промокод відправлено на перевірку. Після схвалення він зʼявиться на сайті 🐦"
    );
    setMessageType("success");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Додати промокод
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Поділись знижкою з іншими
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Знайшов промокод у блогера, Telegram, TikTok, Instagram або на
                сайті магазину? Додай його в базу — після перевірки він
                зʼявиться на ПромоПтасі.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Усі промокоди
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
              >
                Немає магазину?
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-2xl font-black">Як це працює?</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-emerald-300">1. Додаєш код</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Вказуєш магазин, промокод, знижку, джерело і строк дії.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-yellow-300">2. Код перевіряється</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Нові промокоди спочатку мають статус “на перевірці”.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-emerald-300">3. Зʼявляється на сайті</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Після схвалення код бачать усі користувачі.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <p className="text-sm leading-6 text-yellow-300">
                  Не додавай вигадані або випадкові коди. Краще одразу вказати
                  джерело — так адмін швидше його перевірить.
                </p>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              {isLoading ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                  Завантаження форми...
                </div>
              ) : !user ? (
                <div className="rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
                  <h2 className="text-2xl font-black">
                    Потрібно увійти в акаунт
                  </h2>

                  <p className="mt-3 text-red-200">
                    Додавати промокоди можуть тільки зареєстровані користувачі.
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/login"
                      className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Увійти або зареєструватись
                    </Link>
                  </div>
                </div>
              ) : stores.length === 0 ? (
                <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-6 text-yellow-300">
                  <h2 className="text-2xl font-black">
                    Немає активних магазинів
                  </h2>

                  <p className="mt-3">
                    Спочатку потрібно додати або запропонувати магазин.
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/request-store"
                      className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Запропонувати магазин
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitPromo} className="space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-500">Ти увійшов як</p>
                    <p className="mt-1 font-bold text-emerald-300">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Промокод *
                    </label>

                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Наприклад: PTAHA20"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white uppercase outline-none transition placeholder:normal-case placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Магазин *
                    </label>

                    <select
                      value={storeId}
                      onChange={(event) => setStoreId(event.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                    >
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-sm text-slate-500">
                      Не знайшов магазин?{" "}
                      <Link
                        href="/request-store"
                        className="font-bold text-emerald-300"
                      >
                        Запропонувати новий
                      </Link>
                    </p>
                  </div>

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
                        placeholder="Наприклад: -20%, безкоштовна доставка"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
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
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
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
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
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

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Посилання на джерело
                    </label>

                    <input
                      value={sourceUrl}
                      onChange={(event) => setSourceUrl(event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
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
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
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
                    disabled={isSending}
                    className="w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? "Відправляю..." : "Додати промокод"}
                  </button>
                </form>
              )}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}