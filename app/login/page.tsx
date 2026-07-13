"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function friendlyAuthError(errorMessage: string) {
  if (errorMessage.includes("Invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (errorMessage.includes("Email not confirmed")) {
    return "Email ще не підтверджено. Перевір пошту.";
  }

  if (errorMessage.includes("Password should be at least")) {
    return "Пароль має бути довшим. Спробуй мінімум 6 символів.";
  }

  if (errorMessage.includes("User already registered")) {
    return "Користувач з таким email вже зареєстрований. Спробуй увійти.";
  }

  return errorMessage;
}

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

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

  function resetMessage() {
    setMessage("");
    setMessageType("info");
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessage();

    if (!email.trim()) {
      setMessage("Вкажи email.");
      setMessageType("error");
      return;
    }

    if (!password.trim()) {
      setMessage("Вкажи пароль.");
      setMessageType("error");
      return;
    }

    setIsSending(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка входу: ${friendlyAuthError(error.message)}`);
      setMessageType("error");
      return;
    }

    setUser(data.user);
    setMessage("Ти увійшов в акаунт 🐦");
    setMessageType("success");
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessage();

    if (!email.trim()) {
      setMessage("Вкажи email.");
      setMessageType("error");
      return;
    }

    if (!password.trim()) {
      setMessage("Вкажи пароль.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Пароль має бути мінімум 6 символів.");
      setMessageType("error");
      return;
    }

    setIsSending(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка реєстрації: ${friendlyAuthError(error.message)}`);
      setMessageType("error");
      return;
    }

    setUser(data.user);

    setMessage(
      data.user
        ? "Акаунт створено. Ти увійшов в систему 🐦"
        : "Акаунт створено. Перевір пошту для підтвердження реєстрації."
    );
    setMessageType("success");
  }

  async function signOut() {
    await supabase.auth.signOut();

    setUser(null);
    setEmail("");
    setPassword("");
    setMessage("Ти вийшов з акаунта.");
    setMessageType("info");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <aside>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Акаунт
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Увійди в ПромоПтаху
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Акаунт потрібен, щоб додавати промокоди, пропонувати магазини,
                голосувати за коди та повідомляти про проблеми.
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-2xl">🎟️</p>
                  <h2 className="mt-3 text-xl font-black">
                    Додавай промокоди
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Нові коди потрапляють на перевірку, а після схвалення
                    зʼявляються на сайті.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-2xl">✅</p>
                  <h2 className="mt-3 text-xl font-black">
                    Перевіряй роботу кодів
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Голоси “працює” або “не працює”, щоб база була корисною.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-2xl">🐦</p>
                  <h2 className="mt-3 text-xl font-black">
                    Допомагай спільноті
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Повідомляй про проблемні промокоди і пропонуй нові магазини.
                  </p>
                </div>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              {isLoading ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                  Перевіряю акаунт...
                </div>
              ) : user ? (
                <div>
                  <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
                    <p className="text-sm font-bold text-emerald-300">
                      Ти вже увійшов
                    </p>

                    <h2 className="mt-3 break-all text-3xl font-black text-white">
                      {user.email}
                    </h2>

                    <p className="mt-3 text-slate-400">
                      Можеш перейти в профіль, додати промокод або вийти з
                      акаунта.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/profile"
                      className="rounded-2xl bg-emerald-400 px-5 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Перейти в профіль
                    </Link>

                    <Link
                      href="/add"
                      className="rounded-2xl border border-slate-700 px-5 py-4 text-center font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Додати промокод
                    </Link>

                    <Link
                      href="/request-store"
                      className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 text-center font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
                    >
                      Запропонувати магазин
                    </Link>

                    <button
                      onClick={signOut}
                      className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400 hover:text-slate-950"
                    >
                      Вийти
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        setMode("login");
                        resetMessage();
                      }}
                      className={`rounded-2xl border px-5 py-3 font-black transition ${
                        mode === "login"
                          ? "border-emerald-400 bg-emerald-400 text-slate-950"
                          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                      }`}
                    >
                      Увійти
                    </button>

                    <button
                      onClick={() => {
                        setMode("register");
                        resetMessage();
                      }}
                      className={`rounded-2xl border px-5 py-3 font-black transition ${
                        mode === "register"
                          ? "border-emerald-400 bg-emerald-400 text-slate-950"
                          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                      }`}
                    >
                      Зареєструватись
                    </button>
                  </div>

                  <form
                    onSubmit={mode === "login" ? signIn : signUp}
                    className="mt-6 space-y-5"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-300">
                        Email
                      </label>

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-300">
                        Пароль
                      </label>

                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Мінімум 6 символів"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
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
                      {isSending
                        ? mode === "login"
                          ? "Входжу..."
                          : "Створюю акаунт..."
                        : mode === "login"
                        ? "Увійти"
                        : "Створити акаунт"}
                    </button>
                  </form>

                  <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-sm leading-6 text-yellow-300">
                      Якщо в Supabase увімкнене підтвердження email, після
                      реєстрації треба буде відкрити лист на пошті.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}