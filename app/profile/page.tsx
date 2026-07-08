"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  created_at: string;
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

function formatDate(date: string | null) {
  if (!date) return "Без строку";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function statusLabel(status: string) {
  if (status === "active") return "Активний";
  if (status === "pending") return "На перевірці";
  if (status === "expired") return "Закінчився";
  if (status === "rejected") return "Відхилено";

  return status;
}

function statusClass(status: string) {
  if (status === "active") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (status === "pending") return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (status === "expired") return "border-slate-600 bg-slate-800 text-slate-300";
  if (status === "rejected") return "border-red-400/30 bg-red-400/10 text-red-300";

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    if (!userData.user) {
      setPromoCodes([]);
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
        created_at,
        stores (
          name,
          slug
        )
      `)
      .eq("created_by", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Помилка завантаження: ${error.message}`);
      setPromoCodes([]);
    } else {
      setPromoCodes((data as PromoCode[]) || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-5xl">
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

          <div className="flex items-center gap-3">
            <Link
              href="/add"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Додати
            </Link>

            <Link
              href="/"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Головна
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Профіль
          </p>

          <h1 className="text-4xl font-black tracking-tight">
            Мої промокоди
          </h1>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Завантаження...
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300">
                Щоб бачити свої промокоди, потрібно увійти в акаунт.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                Ти увійшов як: {user.email}
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {message}
                </div>
              )}

              {promoCodes.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                  Ти ще не додавав промокоди.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {promoCodes.map((promo) => (
                    <article
                      key={promo.id}
                      className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">
                            {promo.stores?.name || "Магазин"}
                          </p>

                          <p className="mt-1 text-2xl font-black tracking-tight text-emerald-300">
                            {promo.code}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                            promo.status
                          )}`}
                        >
                          {statusLabel(promo.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                        <div>
                          <p className="text-slate-600">Знижка</p>
                          <p className="text-slate-300">
                            {promo.discount_value || "Не вказано"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600">Діє до</p>
                          <p className="text-slate-300">
                            {formatDate(promo.expires_at)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600">Додано</p>
                          <p className="text-slate-300">
                            {formatDate(promo.created_at)}
                          </p>
                        </div>
                      </div>

                      {promo.description && (
                        <p className="mt-4 text-sm text-slate-400">
                          {promo.description}
                        </p>
                      )}

                      {promo.source_url && (
                        <a
                          href={promo.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-bold text-emerald-300 hover:text-emerald-200"
                        >
                          Відкрити джерело →
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}