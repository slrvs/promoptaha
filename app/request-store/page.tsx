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

function friendlyError(errorMessage: string) {
  if (errorMessage.includes("row-level security")) {
    return "Помилка доступу Supabase. Перевір, чи ти увійшов в акаунт і чи є RLS-політика для створення заявок магазинів.";
  }

  if (
    errorMessage.includes("description") ||
    errorMessage.includes("website_url") ||
    errorMessage.includes("requested_by")
  ) {
    return "У таблиці store_requests не вистачає потрібної колонки. Треба перевірити SQL-структуру таблиці.";
  }

  return errorMessage;
}

export default function RequestStorePage() {
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");

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

  function resetForm() {
    setName("");
    setWebsiteUrl("");
    setDescription("");
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("info");

    if (!user) {
      setMessage("Щоб запропонувати магазин, потрібно увійти в акаунт.");
      setMessageType("error");
      return;
    }

    if (!name.trim()) {
      setMessage("Вкажи назву магазину.");
      setMessageType("error");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from("store_requests").insert({
      name: name.trim(),
      website_url: websiteUrl.trim() || null,
      description: description.trim() || null,
      status: "pending",
      requested_by: user.id,
    });

    setIsSending(false);

    if (error) {
      setMessage(`Помилка створення заявки: ${friendlyError(error.message)}`);
      setMessageType("error");
      return;
    }

    resetForm();
    setMessage(
      "Заявку відправлено. Після перевірки магазин можна буде додати в каталог 🐦"
    );
    setMessageType("success");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Запропонувати магазин
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                Немає потрібного магазину?
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Запропонуй магазин, для якого хочеш додавати промокоди. Після
                перевірки він зʼявиться в каталозі, і користувачі зможуть
                додавати до нього коди.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/stores"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Усі магазини
              </Link>

              <Link
                href="/add"
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати промокод
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-2xl font-black">Навіщо це потрібно?</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-emerald-300">
                    1. Ти пропонуєш магазин
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Вказуєш назву, сайт і короткий опис, щоб адмін зрозумів, що
                    саме додавати.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-yellow-300">
                    2. Заявка йде на перевірку
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Адмін перевіряє, чи магазин справжній і чи не дублюється з
                    уже наявним.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-black text-emerald-300">
                    3. Магазин зʼявляється в каталозі
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Після схвалення можна буде додавати промокоди саме для
                    цього магазину.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <p className="text-sm leading-6 text-yellow-300">
                  Краще одразу додати посилання на офіційний сайт магазину. Так
                  заявку легше перевірити.
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
                    Пропонувати нові магазини можуть тільки зареєстровані
                    користувачі.
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
              ) : (
                <form onSubmit={submitRequest} className="space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-500">Ти увійшов як</p>
                    <p className="mt-1 font-bold text-emerald-300">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Назва магазину *
                    </label>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Наприклад: Rozetka, Comfy, Steam"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Сайт магазину
                    </label>

                    <input
                      value={websiteUrl}
                      onChange={(event) => setWebsiteUrl(event.target.value)}
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
                      placeholder="Наприклад: популярний магазин техніки, часто має промокоди у блогерів"
                      rows={6}
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
                    {isSending ? "Відправляю..." : "Відправити заявку"}
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