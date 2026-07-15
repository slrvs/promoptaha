"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_search_aliases?: string[] | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  all_category_ids?: string[] | null;
  all_category_names?: string[] | null;
  all_category_slugs?: string[] | null;
  search_aliases?: string[] | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

type UserVote = {
  id?: string;
  promo_code_id: string;
  user_id: string;
  vote_type: "works" | "not_works";
};

type CodeDetailsClientProps = {
  promo: PromoCode;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiresAt = new Date(date);
  expiresAt.setHours(0, 0, 0, 0);

  return expiresAt < today;
}

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Не вказано";
}

function getCategories(promo: PromoCode) {
  if (promo.all_category_names && promo.all_category_names.length > 0) {
    return promo.all_category_names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

function getTrustLabel(worksCount: number, notWorksCount: number) {
  if (worksCount === 0 && notWorksCount === 0) {
    return "Ще немає голосів";
  }

  if (worksCount > notWorksCount) {
    return "Ймовірно працює";
  }

  if (notWorksCount > worksCount) {
    return "Є скарги";
  }

  return "Голоси порівну";
}

function getTrustClass(worksCount: number, notWorksCount: number) {
  if (worksCount === 0 && notWorksCount === 0) {
    return "border-slate-700 bg-slate-900 text-slate-300";
  }

  if (worksCount > notWorksCount) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (notWorksCount > worksCount) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

export default function CodeDetailsClient({ promo }: CodeDetailsClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [worksCount, setWorksCount] = useState(Number(promo.works_count || 0));
  const [notWorksCount, setNotWorksCount] = useState(
    Number(promo.not_works_count || 0)
  );
  const [userVote, setUserVote] = useState<"works" | "not_works" | null>(null);

  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("not_working");
  const [reportDescription, setReportDescription] = useState("");

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const categories = useMemo(() => getCategories(promo), [promo]);

  const expired = isExpired(promo.expires_at);
  const totalVotes = worksCount + notWorksCount;
  const worksPercent = totalVotes > 0 ? Math.round((worksCount / totalVotes) * 100) : 0;

  async function loadUserAndVote() {
    setIsCheckingUser(true);

    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    setUser(currentUser);

    if (currentUser) {
      const { data: voteData } = await supabase
        .from("promo_votes")
        .select("promo_code_id, user_id, vote_type")
        .eq("promo_code_id", promo.id)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const vote = voteData as UserVote | null;

      if (vote?.vote_type === "works" || vote?.vote_type === "not_works") {
        setUserVote(vote.vote_type);
      }
    }

    setIsCheckingUser(false);
  }

  useEffect(() => {
    loadUserAndVote();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        loadUserAndVote();
      } else {
        setUserVote(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [promo.id]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(promo.code);

      setCopied(true);
      setMessage("Промокод скопійовано.");
      setMessageType("success");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setMessage("Не вдалося скопіювати код. Скопіюй його вручну.");
      setMessageType("error");
    }
  }

  async function vote(nextVote: "works" | "not_works") {
    if (!user) {
      setMessage("Щоб голосувати, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    setMessage("");

    const previousVote = userVote;

    const { error } = await supabase.from("promo_votes").upsert(
      {
        promo_code_id: promo.id,
        user_id: user.id,
        vote_type: nextVote,
      },
      {
        onConflict: "promo_code_id,user_id",
      }
    );

    setIsVoting(false);

    if (error) {
      setMessage(`Не вдалося зберегти голос: ${error.message}`);
      setMessageType("error");
      return;
    }

    if (previousVote !== nextVote) {
      if (previousVote === "works") {
        setWorksCount((current) => Math.max(0, current - 1));
      }

      if (previousVote === "not_works") {
        setNotWorksCount((current) => Math.max(0, current - 1));
      }

      if (nextVote === "works") {
        setWorksCount((current) => current + 1);
      }

      if (nextVote === "not_works") {
        setNotWorksCount((current) => current + 1);
      }
    }

    setUserVote(nextVote);
    setMessage("Дякуємо, голос збережено.");
    setMessageType("success");
  }

  async function submitReport() {
    if (!user) {
      setMessage("Щоб поскаржитися на промокод, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (isReporting) return;

    setIsReporting(true);
    setMessage("");

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promo.id,
      reported_by: user.id,
      reason: reportReason,
      description: reportDescription.trim() || null,
      status: "open",
    });

    setIsReporting(false);

    if (error) {
      setMessage(`Не вдалося відправити скаргу: ${error.message}`);
      setMessageType("error");
      return;
    }

    setIsReportOpen(false);
    setReportDescription("");
    setReportReason("not_working");
    setMessage("Скаргу відправлено. Адмін перевірить промокод.");
    setMessageType("success");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/codes" className="hover:text-emerald-300">
            Промокоди
          </Link>
          <span>/</span>
          <span className="break-all text-slate-300">{promo.code}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${
                    expired
                      ? "border-red-400/30 bg-red-400/10 text-red-300"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  {expired ? "Термін минув" : "Активний"}
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${getTrustClass(
                    worksCount,
                    notWorksCount
                  )}`}
                >
                  {getTrustLabel(worksCount, notWorksCount)}
                </span>

                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <h1 className="mt-6 break-all text-5xl font-black tracking-tight md:text-7xl">
                {promo.code}
              </h1>

              <p className="mt-4 text-3xl font-black text-emerald-300">
                {promo.discount_value || "Промокод на знижку"}
              </p>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                {promo.description ||
                  `Промокод для ${promo.store_name}. Перевір актуальність, скопіюй код і проголосуй, чи він працює.`}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-full bg-emerald-400 px-7 py-4 text-lg font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  {copied ? "Скопійовано" : "Скопіювати код"}
                </button>

                <Link
                  href={`/stores/${promo.store_slug}`}
                  className="rounded-full border border-slate-700 px-7 py-4 text-lg font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  До магазину
                </Link>

                {promo.source_url && (
                  <a
                    href={promo.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-7 py-4 text-lg font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Джерело
                  </a>
                )}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-3xl font-black">Перевірка коду</h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm font-bold text-slate-500">Магазин</p>
                  <Link
                    href={`/stores/${promo.store_slug}`}
                    className="mt-1 block text-xl font-black text-emerald-300 hover:text-emerald-200"
                  >
                    {promo.store_name}
                  </Link>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm font-bold text-slate-500">Діє до</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatDate(promo.expires_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm font-bold text-slate-500">Додано</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatDateTime(promo.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm font-bold text-slate-500">Джерело</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {getSourceLabel(promo.source_type)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 font-bold ${
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Чи працює код?</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Допоможи іншим користувачам: проголосуй, якщо промокод працює або
              вже не працює.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => vote("works")}
                disabled={isVoting || isCheckingUser}
                className={`rounded-2xl border px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  userVote === "works"
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-slate-800 bg-slate-950 hover:border-emerald-400/40"
                }`}
              >
                <p className="text-3xl">✅</p>
                <p className="mt-2 text-2xl font-black text-emerald-300">
                  Працює
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {worksCount} голосів
                </p>
              </button>

              <button
                type="button"
                onClick={() => vote("not_works")}
                disabled={isVoting || isCheckingUser}
                className={`rounded-2xl border px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  userVote === "not_works"
                    ? "border-red-400 bg-red-400/10"
                    : "border-slate-800 bg-slate-950 hover:border-red-400/40"
                }`}
              >
                <p className="text-3xl">❌</p>
                <p className="mt-2 text-2xl font-black text-red-300">
                  Не працює
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {notWorksCount} голосів
                </p>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-black text-slate-300">Довіра</p>
                <p className="font-black text-emerald-300">{worksPercent}%</p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${worksPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Усього голосів: {totalVotes}
              </p>
            </div>

            {!user && (
              <Link
                href="/login"
                className="mt-5 inline-flex rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Увійти, щоб голосувати
              </Link>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Поскаржитися</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Якщо промокод неправильний, не працює або має погане джерело —
              відправ скаргу на перевірку.
            </p>

            {!isReportOpen ? (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setMessage("Щоб поскаржитися, потрібно увійти.");
                    setMessageType("error");
                    return;
                  }

                  setIsReportOpen(true);
                }}
                className="mt-6 rounded-full border border-red-400/40 px-6 py-4 font-black text-red-300 transition hover:bg-red-400/10"
              >
                Поскаржитися на код
              </button>
            ) : (
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-slate-300">
                    Причина
                  </span>

                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="not_working">Не працює</option>
                    <option value="expired">Закінчився термін</option>
                    <option value="wrong_store">Не той магазин</option>
                    <option value="bad_source">Погане джерело</option>
                    <option value="spam">Спам</option>
                    <option value="other">Інше</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-slate-300">
                    Коментар
                  </span>

                  <textarea
                    value={reportDescription}
                    onChange={(event) =>
                      setReportDescription(event.target.value)
                    }
                    rows={5}
                    placeholder="Опиши проблему..."
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={isReporting}
                    className="rounded-full bg-red-400 px-6 py-4 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isReporting ? "Відправляю..." : "Відправити скаргу"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}