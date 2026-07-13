"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getHostName(url: string | null | undefined) {
  if (!url) return null;

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function StoreCard({ store }: { store: Store }) {
  return (
    <article className="group rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-950/20">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30">
          <Image
            src="/icons/promoptaha-bird.png"
            alt="ПромоПтаха"
            fill
            sizes="64px"
            className="object-cover transition group-hover:scale-110"
          />
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-2xl font-black text-white">
            {store.name}
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-500">
            /stores/{store.slug}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
        {store.description ||
          "Магазин у базі ПромоПтахи. Тут можуть з’являтися промокоди, знижки та перевірені користувачами коди."}
      </p>

      {store.website_url && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold text-slate-500">Сайт магазину</p>

          <a
            href={store.website_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex break-all font-black text-emerald-300 hover:text-emerald-200"
          >
            {getHostName(store.website_url)} →
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/stores/${store.slug}`}
          className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-emerald-300"
        >
          Відкрити
        </Link>

        <Link
          href="/add"
          className="rounded-2xl border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          Додати код
        </Link>
      </div>
    </article>
  );
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStores() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, description, website_url, status, created_at")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      setStores([]);
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setStores((data || []) as Store[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return stores;
    }

    return stores.filter((store) => {
      return (
        store.name.toLowerCase().includes(normalizedSearch) ||
        store.slug.toLowerCase().includes(normalizedSearch) ||
        (store.description || "").toLowerCase().includes(normalizedSearch) ||
        (store.website_url || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [stores, search]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="mb-5 inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Магазини
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Каталог магазинів
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl">
                Обирай магазин і дивись доступні промокоди. Якщо потрібного
                магазину ще немає — запропонуй його на модерацію.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/request-store"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Запропонувати магазин
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-emerald-300">
                    {stores.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    активних магазинів
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-yellow-300">
                    {filteredStores.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    знайдено
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-3xl font-black text-slate-200">🐦</p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    ПромоПтаха
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center rounded-[2rem] border border-emerald-400/20 bg-slate-950 p-8">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.22),transparent_60%)]" />

              <div className="relative text-center">
                <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-[3rem] border border-emerald-400/30 bg-slate-900 shadow-2xl shadow-emerald-950/40 md:h-64 md:w-64">
                  <Image
                    src="/icons/promoptaha-bird.png"
                    alt="ПромоПтаха"
                    fill
                    sizes="256px"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
                  <p className="text-sm font-bold text-slate-500">
                    Магазини зі знижками
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    Знайди потрібний
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/10 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Пошук
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                Усі магазини
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Шукай магазин за назвою, slug, описом або адресою сайту.
              </p>
            </div>

            <Link
              href="/request-store"
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Немає магазину?
            </Link>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук: Rozetka, Comfy, Kasta..."
            className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
          />

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
              Помилка завантаження: {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-950"
                />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h2 className="mt-4 text-3xl font-black">
                Магазинів не знайдено
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити пошук або запропонуй магазин, якого ще немає в
                базі.
              </p>

              <Link
                href="/request-store"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Запропонувати магазин
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}