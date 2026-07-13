"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type VoteType = "works" | "not_works";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getSourceLabel(source: string | null | undefined) {
  if (source === "youtube") return "YouTube";
  if (source === "telegram") return "Telegram";
  if (source === "tiktok") return "TikTok";
  if (source === "instagram") return "Instagram";
  if (source === "email") return "Email";
  if (source === "store_site") return "Сайт магазину";
  if (source === "other") return "Інше";

  return "Джерело не вказано";
}

function getPromoHealth(works: number, notWorks: number) {
  const total = works + notWorks;

  if (total === 0) {
    return {
      label: "Ще не перевіряли",
      className: "border-slate-700 bg-slate-800 text-slate-300",
    };
  }

  if (works >= notWorks) {
    return {
      label: "Ймовірно працює",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    label: "Є скарги",
    className: "border-red-400/30 bg-red-400/10 text-red-300",
  };
}

export default function CodeDetailsClient({ codeParam }: { codeParam: string }) {
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userVote, setUserVote] = useState<VoteType | null>(null);

  const [isLoadingPromo, setIsLoadingPromo] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const works = promo?.works_count || 0;
  const notWorks = promo?.not_works_count || 0;
  const expired = isExpired(promo?.expires_at);
  const health = getPromoHealth(works, notWorks);

  const canonicalPath = useMemo(() => {
    if (!promo) return `/codes/${codeParam}`;

    return `/codes/${promo.slug || promo.id}`;
  }, [promo, codeParam]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    setUser(data.user);
  }

  async function loadPromo() {
    setIsLoadingPromo(true);
    setMessage("");

    const query = supabase
      .from("promo_code_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count"
      );

    const { data, error } = isUuid(codeParam)
      ? await query.eq("id", codeParam).maybeSingle()
      : await query.eq("slug", codeParam).maybeSingle();

    if (error || !data) {
      setPromo(null);
      setMessage("Промокод не знайдено або він ще не активний.");
      setMessageType("error");
      setIsLoadingPromo(false);
      return;
    }

    setPromo(data as PromoCode);
    setIsLoadingPromo(false);
  }

  async function loadUserVote(currentUser: User, promoId: string) {
    const { data } = await supabase
      .from("promo_votes")
      .select("vote_type")
      .eq("promo_code_id", promoId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (data?.vote_type === "works" || data?.vote_type === "not_works") {
      setUserVote(data.vote_type);
    } else {
      setUserVote(null);
    }
  }

  useEffect(() => {
    loadUser();
    loadPromo();
  }, [codeParam]);

  useEffect(() => {
    if (user && promo) {
      loadUserVote(user, promo.id);
    }
  }, [user, promo?.id]);

  async function copyCode() {
    if (!promo) return;

    await navigator.clipboard.writeText(promo.code);

    setMessage("Промокод скопійовано.");
    setMessageType("success");
  }

  async function copyLink() {
    const origin = window.location.origin;
    await navigator.clipboard.writeText(`${origin}${canonicalPath}`);

    setMessage("Посилання скопійовано.");
    setMessageType("success");
  }

  async function vote(voteType: VoteType) {
    if (!promo) return;

    if (!user) {
      setMessage("Щоб голосувати, потрібно увійти.");
      setMessageType("error");
      return;
    }

    setIsVoting(true);
    setMessage("");

    const { error } = await supabase.from("promo_votes").upsert(
      {
        promo_code_id: promo.id,
        user_id: user.id,
        vote_type: voteType,
      },
      {
        onConflict: "promo_code_id,user_id",
      }
    );

    setIsVoting(false);

    if (error) {
      setMessage(`Не вдалося зарахувати голос: ${error.message}`);
      setMessageType("error");
      return;
    }

    setUserVote(voteType);
    setMessage("Голос зараховано. Дякуємо за перевірку.");
    setMessageType("success");
    loadPromo();
  }

  async function reportPromo() {
    if (!promo) return;

    if (!user) {
      setMessage("Щоб поскаржитися на промокод, потрібно увійти.");
      setMessageType("error");
      return;
    }

    setIsReporting(true);
    setMessage("");

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promo.id,
      reported_by: user.id,
    });

    setIsReporting(false);

    if (error) {
      setMessage(`Не вдалося відправити скаргу: ${error.message}`);
      setMessageType("error");
      return;
    }

    setMessage("Скаргу відправлено на модерацію.");
    setMessageType("success");
  }

  if (isLoadingPromo) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-6xl">
          <div className="h-[560px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!promo) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <h1 className="text-4xl font-black text-red-300">
              Промокод не знайдено
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Можливо, код ще на модерації, був відхилений або посилання
              неправильне.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/codes"
                className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                До промокодів
              </Link>

              <Link
                href="/add"
                className="rounded-full border border-red-400/30 px-6 py-4 font-black text-red-100 transition hover:bg-red-400/10"
              >
                Додати код
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/codes" className="hover:text-emerald-300">
            Промокоди
          </Link>
          <span>/</span>
          {promo.store_slug ? (
            <Link
              href={`/stores/${promo.store_slug}`}
              className="hover:text-emerald-300"
            >
              {promo.store_name || "Магазин"}
            </Link>
          ) : (
            <span>{promo.store_name || "Магазин"}</span>
          )}
          <span>/</span>
          <span className="break-all text-slate-300">{promo.code}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_0.75fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${
                    expired
                      ? "border-red-400/30 bg-red-400/10 text-red-300"
                      : promo.expires_at
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                  }`}
                >
                  {expired
                    ? "Прострочений"
                    : promo.expires_at
                    ? "Активний"
                    : "Без дати"}
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${health.className}`}
                >
                  {health.label}
                </span>
              </div>

              <p className="mt-8 text-sm font-bold text-slate-500">
                Промокод для {promo.store_name || "магазину"}
              </p>

              <h1 className="mt-3 break-all text-5xl font-black tracking-tight md:text-7xl">
                {promo.code}
              </h1>

              <div className="mt-6 rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 p-5">
                <p className="text-sm font-bold text-emerald-300">
                  Знижка / умова
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {promo.discount_value || "Умову не вказано"}
                </p>
              </div>

              {promo.description && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  {promo.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Копіювати код
                </button>

                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Копіювати посилання
                </button>

                {promo.store_slug && (
                  <Link
                    href={`/stores/${promo.store_slug}`}
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Магазин
                  </Link>
                )}
              </div>

              <div className="mt-6 break-all rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                Красиве посилання:{" "}
                <span className="font-bold text-slate-300">
                  {canonicalPath}
                </span>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-2xl font-black">Перевірка коду</h2>

              <p className="mt-3 leading-7 text-slate-400">
                Познач, чи спрацював промокод. Так інші користувачі швидше
                зрозуміють, чи варто його пробувати.
              </p>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => vote("works")}
                  className={`rounded-2xl border px-5 py-4 text-left font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "works"
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                  }`}
                >
                  ✅ Працює
                  <span className="ml-2 text-sm opacity-80">({works})</span>
                </button>

                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => vote("not_works")}
                  className={`rounded-2xl border px-5 py-4 text-left font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "not_works"
                      ? "border-red-400 bg-red-400 text-slate-950"
                      : "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                  }`}
                >
                  ❌ Не працює
                  <span className="ml-2 text-sm opacity-80">({notWorks})</span>
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-bold text-slate-500">Діє до</p>
                  <p className="mt-1 font-black text-slate-200">
                    {formatDate(promo.expires_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-bold text-slate-500">Джерело</p>
                  <p className="mt-1 font-black text-slate-200">
                    {getSourceLabel(promo.source_type)}
                  </p>
                </div>

                {promo.source_url && (
                  <a
                    href={promo.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-400/50"
                  >
                    <p className="text-xs font-bold text-slate-500">
                      Посилання на джерело
                    </p>
                    <p className="mt-1 break-all font-black text-emerald-300">
                      Відкрити
                    </p>
                  </a>
                )}
              </div>

              <button
                type="button"
                disabled={isReporting}
                onClick={reportPromo}
                className="mt-6 w-full rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReporting ? "Відправляю..." : "Поскаржитися"}
              </button>

              {message && (
                <div
                  className={`mt-5 rounded-2xl border p-4 text-sm ${
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
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}