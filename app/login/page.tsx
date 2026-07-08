"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUser() {
    setIsLoading(true);

    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    setIsLoading(false);
  }

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp() {
    setMessage("");

    if (!email || !password) {
      setMessage("Вкажи email і пароль");
      return;
    }

    if (password.length < 6) {
      setMessage("Пароль має бути мінімум 6 символів");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка реєстрації: ${error.message}`);
      return;
    }

    setMessage(
      "Реєстрація створена. Якщо Supabase попросить підтвердження — перевір пошту."
    );
  }

  async function signIn() {
    setMessage("");

    if (!email || !password) {
      setMessage("Вкажи email і пароль");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка входу: ${error.message}`);
      return;
    }

    setMessage("Вхід виконано 🐦");
    await loadUser();
  }

  async function signOut() {
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`Помилка виходу: ${error.message}`);
      return;
    }

    setUser(null);
    setMessage("Ти вийшов з акаунта");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-xl">
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

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Акаунт
          </p>

          <h1 className="text-4xl font-black tracking-tight">
            Вхід у ПромоПтаху
          </h1>

          <p className="mt-3 text-slate-400">
            Увійди, щоб додавати промокоди від свого імені та збирати рейтинг.
          </p>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Перевіряю акаунт...
            </div>
          ) : user ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-500">Ти увійшов як</p>
                <p className="mt-1 font-bold text-emerald-300">
                  {user.email}
                </p>
              </div>

              <button
                onClick={signOut}
                className="w-full rounded-2xl border border-red-400/30 bg-red-400/10 px-6 py-4 font-black text-red-300 transition hover:bg-red-400 hover:text-slate-950"
              >
                Вийти
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="мінімум 6 символів"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={signIn}
                  disabled={isSending}
                  className="rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  Увійти
                </button>

                <button
                  onClick={signUp}
                  disabled={isSending}
                  className="rounded-2xl border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                >
                  Зареєструватись
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}