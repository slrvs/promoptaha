"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  code: string;
  discount_value: string | null;
  expires_at: string | null;
  status: string;
  source_type: string | null;
  source_url: string | null;
  description: string | null;
  created_by: string | null;
  stores: {
    name: string;
    slug: string;
  } | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function statusLabel(status: string) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На перевірці";
  if (status === "expired") return "Закінчився";
  if (status === "rejected") return "Відхилено";

  return status;
}

export default function EditPromoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-3xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження...
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

  async function loadPromo() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setPromo(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .select(`
        id,
        code,
        discount_value,
        expires_at,
        status,
        source_type,
        source_url,
        description,
        created_by,
        stores (
          name,
          slug
        )
      `)
      .eq("id", promoId)
      .single();

    if (error || !data) {
      setPromo(null);
      setMessage("Промокод не знайдено або немає доступу.");
      setIsLoading(false);
      return;
    }

    const loadedPromo = data as PromoCode;

    setPromo(loadedPromo);
    setDiscountValue(loadedPromo.discount_value || "");
    setExpiresAt(loadedPromo.expires_at || "");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Потрібно увійти в акаунт.");
      return;
    }

    if (!promo) {
      setMessage("Промокод не знайдено.");
      return;
    }

    if (promo.status !== "pending") {
      setMessage("Редагувати можна тільки промокоди на перевірці.");
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
      .eq("id", promo.id);

    setIsSaving(false);

    if (error) {
      setMessage(`Помилка збереження: ${error.message}`);
      return;
    }

    setMessage("Зміни збережено 🐦");
    await loadPromo();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Редагування
              </p>

              <h1 className="text-4xl font-black tracking-tight">
                Редагувати промокод
              </h1>

              <p className="mt-3 text-slate-400">
                Можна редагувати тільки промокоди, які ще на перевірці.
              </p>
            </div>

            <Link
              href="/profile"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Назад у профіль
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Завантаження...
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300">
                Щоб редагувати промокод, потрібно увійти.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            </div>
          ) : !promo ? (
            <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-400/10 p-5 text-red-300">
              {message || "Промокод не знайдено."}
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-500">Промокод</p>

                <p className="mt-1 text-3xl font-black text-emerald-300">
                  {promo.code}
                </p>

                <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                  <div>
                    <p className="text-slate-600">Магазин</p>
                    <p className="text-slate-300">
                      {promo.stores?.name || "Не вказано"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-600">Статус</p>
                    <p className="text-slate-300">
                      {statusLabel(promo.status)}
                    </p>
                  </div>
                </div>
              </div>

              {promo.status !== "pending" ? (
                <div className="mt-6 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-300">
                  Цей промокод уже не на перевірці, тому редагування закрите.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Знижка
                      </label>

                      <input
                        value={discountValue}
                        onChange={(event) =>
                          setDiscountValue(event.target.value)
                        }
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
                      placeholder="Наприклад: промокод з випуску або поста"
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
                    {isSaving ? "Зберігаю..." : "Зберегти зміни"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}