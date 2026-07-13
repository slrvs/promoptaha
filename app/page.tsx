"use client";

import PromoVote from "@/components/PromoVote";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_value: string | null;
  expires_at: string | null;
  status: string;
  source_type: string | null;
  store_name: string;
  store_slug: string;
  works_count: number;
  not_works_count: number;
  total_votes: number;
  success_rate: number | null;
};

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

function formatDate(date: string | null) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function sourceLabel(source: string | null) {
  const labels: Record<string, string> = {
    youtube: "YouTube",
    telegram: "Telegram",
    tiktok: "TikTok",
    instagram: "Instagram",
    email: "Email",
    store_site: "Сайт магазину",
    other: "Інше",
  };

  if (!source) return "Невідомо";
  return labels[source] ?? source;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Очікує перевірки",
    active: "Активний",
    needs_review: "Потребує перевірки",
    expired: "Прострочений",
    rejected: "Відхилений",
    duplicate: "Дублікат",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "active") {
    return "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300";
  }

  if (status === "needs_review") {
    return "rounded-full bg-yellow-400/10 px-3 py-1 text-xs text-yellow-300";
  }

  if (status === "expired") {
    return "rounded-full bg-red-400/10 px-3 py-1 text-xs text-red-300";
  }

  return "rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300";
}

function getVoterKey() {
  const storageKey = "promoptaha_voter_key";

  let voterKey = localStorage.getItem(storageKey);

  if (!voterKey) {
    voterKey = crypto.randomUUID();
    localStorage.setItem(storageKey, voterKey);
  }

  return voterKey;
}

export default function Home() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [votingPromoId, setVotingPromoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);

    const [promoResult, storesResult] = await Promise.all([
      supabase
        .from("promo_code_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),

      supabase
        .from("stores")
        .select("id, name, slug")
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(12),
    ]);

    if (promoResult.data) {
      setPromoCodes(promoResult.data as PromoCode[]);
    }

    if (storesResult.data) {
      setStores(storesResult.data as Store[]);
    }

    setIsLoading(false);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode(null);
    }, 1500);
  }

  async function votePromo(promoCodeId: string, voteType: "works" | "not_works") {
    setVotingPromoId(promoCodeId);

    const voterKey = getVoterKey();

    const { data: existingVote } = await supabase
      .from("promo_votes")
      .select("id")
      .eq("promo_code_id", promoCodeId)
      .eq("voter_key", voterKey)
      .maybeSingle();

    if (existingVote) {
      await supabase
        .from("promo_votes")
        .update({
          vote_type: voteType,
        })
        .eq("id", existingVote.id);
    } else {
      await supabase.from("promo_votes").insert({
        promo_code_id: promoCodeId,
        vote_type: voteType,
        voter_key: voterKey,
        user_id: null,
      });
    }

    await loadData();
    setVotingPromoId(null);
  }

  useEffect(() => {
    loadData();
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredPromoCodes = promoCodes.filter((promo) => {
    if (!normalizedSearch) return true;

    const searchableValues = [
      promo.code,
      promo.store_name,
      promo.store_slug,
      promo.description ?? "",
      promo.discount_value ?? "",
      sourceLabel(promo.source_type),
      statusLabel(promo.status),
    ];

    return searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    );
  });

  const hasSearch = normalizedSearch.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-between gap-4">
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
      href="/login"
      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
    >
      Увійти
    </Link>

    <Link
      href="/add"
      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
    >
      Додати промокод
    </Link>
  </div>
</header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              Жива база промокодів від людей
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              Промокоди, які ще{" "}
              <span className="text-emerald-400">живі</span>.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Знаходь робочі промокоди, додавай нові з YouTube, Telegram,
              Instagram чи сайтів магазинів і допомагай іншим перевіряти їхню
              актуальність.
            </p>

            <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-3 shadow-2xl shadow-emerald-950/20 sm:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-12 flex-1 rounded-2xl bg-slate-950 px-4 text-white outline-none placeholder:text-slate-500"
                placeholder="Пошук магазину або промокоду..."
              />

              <Link
                href="/codes"
                className="rounded-2xl bg-emerald-400 px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                Всі промокоди
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-2xl font-black text-emerald-400">1000+</p>
                <p className="text-sm text-slate-400">ціль промокодів</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-2xl font-black text-emerald-400">100</p>
                <p className="text-sm text-slate-400">магазинів</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-2xl font-black text-emerald-400">24/7</p>
                <p className="text-sm text-slate-400">перевірка людьми</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-emerald-950/20">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {hasSearch ? "Результати пошуку" : "Нові промокоди"}
              </h2>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                {filteredPromoCodes.length}
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                Завантаження промокодів...
              </div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                {hasSearch
                  ? `Нічого не знайдено за запитом "${searchQuery}"`
                  : "Поки немає промокодів. Але скоро птаха щось принесе 🐦"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPromoCodes.map((promo) => (
                  <article
                    key={promo.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-black tracking-wide">
                          {promo.code}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {promo.store_name} · {sourceLabel(promo.source_type)}
                        </p>
                      </div>

                      <span className={statusClass(promo.status)}>
                        {statusLabel(promo.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Працює</p>
                        <p className="font-bold text-emerald-300">
                          {promo.success_rate
                            ? `${promo.success_rate}%`
                            : "Новий"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Діє до</p>
                        <p className="font-bold">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Голоси</p>
                        <p className="font-bold">
                          {promo.works_count} 👍 / {promo.not_works_count} 👎
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => copyCode(promo.code)}
                      className="mt-5 w-full rounded-2xl bg-white px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
                    >
                      {copiedCode === promo.code
                        ? "Скопійовано!"
                        : "Скопіювати промокод"}
                    </button>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => votePromo(promo.id, "works")}
                        disabled={votingPromoId === promo.id}
                        className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:opacity-60"
                      >
                        👍 Працює
                      </button>

                      <button
                        onClick={() => votePromo(promo.id, "not_works")}
                        disabled={votingPromoId === promo.id}
                        className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-400 hover:text-slate-950 disabled:opacity-60"
                      >
                        👎 Не працює
                      </button>
                    </div>
                    <PromoVote
  promoId={promo.id}
  initialWorksCount={promo.works_count}
  initialNotWorksCount={promo.not_works_count}
/>
<Link
  href={`/codes/${promo.id}`}
  className="mt-4 inline-flex rounded-2xl border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
>
  Детальніше
</Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">Популярні магазини</h2>

            <Link
              href="/stores"
              className="text-sm text-emerald-300 hover:text-emerald-200"
            >
              Всі магазини →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.slug}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-center font-bold transition hover:border-emerald-400 hover:text-emerald-300"
              >
                {store.name}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}