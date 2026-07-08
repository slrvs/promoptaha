"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function AddPromoCodePage() {
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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUserAndStores() {
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (storesError) {
      setMessage("Не вдалося завантажити магазини");
    }

    setStores(storesData || []);

    if (storesData && storesData.length > 0) {
      setStoreId(storesData[0].id);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadUserAndStores();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUserAndStores();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Щоб додати промокод, потрібно увійти в акаунт");
      return;
    }

    if (!code.trim()) {
      setMessage("Вкажи промокод");
      return;
    }

    if (!storeId) {
      setMessage("Обери магазин");
      return;
    }

    setIsSaving(true);

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

    setIsSaving(false);

    if (error) {
      if (error.code === "23505") {
        setMessage("Такий промокод для цього магазину вже є в базі");
        return;
      }

      setMessage(`Помилка: ${error.message}`);
      return;
    }

    setCode("");
    setDiscountValue("");
    setExpiresAt("");
    setSourceUrl("");
    setDescription("");
    setMessage("Промокод додано. Він очікує перевірки 🐦");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl">
              🐦
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight">ПромоПтаха</p>
              <p className="text-sm text-slate-400">На крилах знижок</p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            На головну
          </Link>
        </header>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="mb-6">
            <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              Додати новий промокод
            </p>

            <h1 className="text-4xl font-black tracking-tight">
              Принеси знижку людям
            </h1>

            <p className="mt-3 text-slate-400">
              Заповни просту форму. Промокод буде додано від твого акаунта.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Завантаження...
            </div>
          ) : !user ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300">
                Щоб додавати промокоди, потрібно увійти в акаунт.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти або зареєструватись
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                Ти увійшов як: {user.email}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Промокод
                  </label>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Наприклад LEVY15"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Магазин
                  </label>
                  <select
                    value={storeId}
                    onChange={(event) => setStoreId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Знижка
                    </label>
                    <input
                      value={discountValue}
                      onChange={(event) => setDiscountValue(event.target.value)}
                      placeholder="15%, -200 грн, sale"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Діє до
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Джерело
                  </label>
                  <select
                    value={sourceType}
                    onChange={(event) => setSourceType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
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
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Посилання на джерело
                  </label>
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Коментар
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Наприклад: промокод з випуску Леви на Джипі"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                {message && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Додаю..." : "Додати промокод"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}