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

export default function RequestStorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Щоб запропонувати магазин, потрібно увійти.");
      return;
    }

    if (!name.trim()) {
      setMessage("Вкажи назву магазину.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("store_requests").insert({
      name: name.trim(),
      website_url: websiteUrl.trim() || null,
      description: description.trim() || null,
      status: "pending",
      requested_by: user.id,
    });

    setIsSaving(false);

    if (error) {
      setMessage(`Помилка: ${error.message}`);
      return;
    }

    setName("");
    setWebsiteUrl("");
    setDescription("");
    setMessage("Запит магазину відправлено. Він очікує перевірки 🐦");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Новий магазин
          </p>

          <h1 className="text-4xl font-black tracking-tight">
            Запропонувати магазин
          </h1>

          <p className="mt-3 text-slate-400">
            Якщо потрібного магазину ще немає в ПромоПтасі — відправ запит, і
            його можна буде додати після перевірки.
          </p>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
              Завантаження...
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300">
                Щоб запропонувати магазин, потрібно увійти в акаунт.
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
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                Ти увійшов як: {user.email}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Назва магазину
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Наприклад: Rozetka, Comfy, Steam"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Сайт магазину
                  </label>

                  <input
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
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
                    placeholder="Наприклад: магазин часто дає промокоди в Telegram"
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
                  {isSaving ? "Відправляю..." : "Запропонувати магазин"}
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}