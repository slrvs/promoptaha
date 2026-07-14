"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";
import {
  aliasesToText,
  generateSearchAliases,
  getHostName,
} from "@/lib/searchAliases";

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  search_aliases?: string[] | null;
  status?: string | null;
  created_at?: string | null;
};

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активний";
  if (status === "pending") return "Очікує";
  if (status === "rejected") return "Прихований";

  return status || "Невідомо";
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function AdminSearchToolsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);

  const [rebuiltCount, setRebuiltCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function loadStores() {
    setIsLoadingStores(true);
    setMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, website_url, search_aliases, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setStores([]);
      setMessage(`Не вдалося завантажити магазини: ${error.message}`);
      setMessageType("error");
      setIsLoadingStores(false);
      return;
    }

    setStores((data || []) as Store[]);
    setIsLoadingStores(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStores();
      return;
    }

    if (!isLoadingUser) {
      setIsLoadingStores(false);
    }
  }, [isAdmin, isLoadingUser]);

  const previewStores = useMemo(() => {
    return stores.slice(0, 8).map((store) => {
      const generatedAliases = generateSearchAliases({
        name: store.name,
        slug: store.slug,
        websiteUrl: store.website_url,
        customAliases: store.search_aliases || [],
      });

      return {
        ...store,
        generatedAliases,
      };
    });
  }, [stores]);

  async function rebuildAllStoreAliases() {
    if (stores.length === 0) {
      setMessage("Немає магазинів для перебудови.");
      setMessageType("info");
      return;
    }

    setIsRebuilding(true);
    setRebuiltCount(0);
    setFailedCount(0);
    setMessage("Починаю перебудову пошукових слів...");
    setMessageType("info");

    let success = 0;
    let failed = 0;

    for (const store of stores) {
      const generatedAliases = generateSearchAliases({
        name: store.name,
        slug: store.slug,
        websiteUrl: store.website_url,
        customAliases: store.search_aliases || [],
      });

      const { error } = await supabase
        .from("stores")
        .update({
          search_aliases: generatedAliases,
        })
        .eq("id", store.id);

      if (error) {
        failed += 1;
        setFailedCount(failed);
      } else {
        success += 1;
        setRebuiltCount(success);
      }
    }

    setIsRebuilding(false);

    if (failed > 0) {
      setMessage(
        `Готово частково: оновлено ${success}, з помилкою ${failed}.`
      );
      setMessageType("error");
    } else {
      setMessage(`Готово: пошук перебудовано для ${success} магазинів.`);
      setMessageType("success");
    }

    loadStores();
  }

  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[520px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">Потрібен вхід</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Щоб керувати пошуком, потрібно увійти в акаунт адміністратора.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Увійти
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">Доступ закрито</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Ця сторінка доступна тільки адміністратору ПромоПтахи.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              На головну
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-emerald-300">
            Адмінка
          </Link>
          <span>/</span>
          <span className="text-slate-300">Інструменти пошуку</span>
        </div>

        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Пошук
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Інструменти пошуку
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна перебудувати пошукові слова для всіх магазинів. Це
                потрібно, щоб KFC знаходився як “кфс”, “кркр”, “kfc.ua”, Comfy
                як “комфі”, “komfi” і так далі.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={rebuildAllStoreAliases}
                disabled={isRebuilding || isLoadingStores}
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRebuilding ? "Перебудовую..." : "Перебудувати всі"}
              </button>

              <button
                type="button"
                onClick={loadStores}
                disabled={isRebuilding || isLoadingStores}
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Оновити
              </button>

              <Link
                href="/admin/stores"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазини
              </Link>
            </div>
          </div>

          {message && (
            <div
              className={`mt-8 rounded-2xl border p-4 ${
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

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-4xl font-black text-white">{stores.length}</p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                магазинів у базі
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-4xl font-black text-emerald-300">
                {rebuiltCount}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                оновлено зараз
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-4xl font-black text-red-300">{failedCount}</p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                помилок зараз
              </p>
            </div>
          </div>

          {isRebuilding && (
            <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-200">
              Не закривай сторінку. Йде оновлення магазинів: {rebuiltCount} з{" "}
              {stores.length}.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Превʼю
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Як будуть виглядати aliases
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Показую перші магазини і пошукові слова, які будуть згенеровані
                для них.
              </p>
            </div>
          </div>

          {isLoadingStores ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : previewStores.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Магазинів поки немає.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {previewStores.map((store) => (
                <article
                  key={store.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        {store.name}
                      </h3>

                      <p className="mt-1 break-all text-sm font-bold text-slate-500">
                        /stores/{store.slug}
                      </p>

                      {store.website_url && (
                        <p className="mt-1 break-all text-sm font-bold text-slate-500">
                          {getHostName(store.website_url)}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        store.status
                      )}`}
                    >
                      {getStatusLabel(store.status)}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold text-slate-500">
                      Зараз у базі
                    </p>

                    <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-400">
                      {aliasesToText(store.search_aliases) || "Порожньо"}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold text-slate-500">
                      Після перебудови
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {store.generatedAliases.slice(0, 18).map((alias) => (
                        <span
                          key={alias}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300"
                        >
                          {alias}
                        </span>
                      ))}

                      {store.generatedAliases.length > 18 && (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-500">
                          +{store.generatedAliases.length - 18}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}