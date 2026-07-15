"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type VoteType = "works" | "not_works";

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
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

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
  description?: string | null;
};

type UserProfile = {
  id: string;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CodeDetailsClientProps = {
  promo: Promo;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const end = new Date(date);
  const diff = end.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  return new Date(date) < new Date();
}

function getSourceTypeLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return sourceType || "Не вказано";
}

function getAuthorName(profile: UserProfile | null) {
  return profile?.display_name || profile?.username || "Користувач";
}

function getAuthorFallback(profile: UserProfile | null) {
  const name = getAuthorName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getWorksPercent(worksCount: number, notWorksCount: number) {
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

export default function CodeDetailsClient({ promo }: CodeDetailsClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  const [worksCount, setWorksCount] = useState(Number(promo.works_count || 0));
  const [notWorksCount, setNotWorksCount] = useState(
    Number(promo.not_works_count || 0)
  );
  const [myVote, setMyVote] = useState<VoteType | null>(null);

  const [isLoadingExtraData, setIsLoadingExtraData] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const daysLeft = getDaysLeft(promo.expires_at);
  const expired = isExpired(promo.expires_at);
  const worksPercent = getWorksPercent(worksCount, notWorksCount);

  const allCategoryNames = useMemo(() => {
    const names = [
      promo.category_name,
      ...(promo.all_category_names || []),
    ].filter((name): name is string => Boolean(name));

    return Array.from(new Set(names));
  }, [promo.category_name, promo.all_category_names]);

  async function loadExtraData() {
    setIsLoadingExtraData(true);

    const { data: userData } = await supabase.auth.getUser();

    setUser(userData.user);

    const storePromise: Promise<{
      data: Store | null;
      error: { message: string } | null;
    }> = promo.store_id
      ? Promise.resolve(
          supabase
            .from("store_category_stats")
            .select("id, name, slug, website_url, description")
            .eq("id", promo.store_id)
            .maybeSingle()
        ) as Promise<{
          data: Store | null;
          error: { message: string } | null;
        }>
      : Promise.resolve({ data: null, error: null });

    const profilePromise: Promise<{
      data: UserProfile | null;
      error: { message: string } | null;
    }> = promo.submitted_by
      ? Promise.resolve(
          supabase
            .from("profiles")
            .select(
              "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
            )
            .eq("id", promo.submitted_by)
            .maybeSingle()
        ) as Promise<{
          data: UserProfile | null;
          error: { message: string } | null;
        }>
      : Promise.resolve({ data: null, error: null });

    const votePromise: Promise<{
      data: { vote_type?: VoteType | null } | null;
      error: { message: string } | null;
    }> = userData.user
      ? Promise.resolve(
          supabase
            .from("promo_votes")
            .select("vote_type")
            .eq("promo_code_id", promo.id)
            .eq("user_id", userData.user.id)
            .maybeSingle()
        ) as Promise<{
          data: { vote_type?: VoteType | null } | null;
          error: { message: string } | null;
        }>
      : Promise.resolve({ data: null, error: null });

    const [storeResult, profileResult, voteResult] = await Promise.all([
      storePromise,
      profilePromise,
      votePromise,
    ]);

    if (storeResult.data) {
      setStore(storeResult.data);
    }

    if (profileResult.data) {
      setAuthorProfile(profileResult.data);
    }

    if (voteResult.data?.vote_type) {
      setMyVote(voteResult.data.vote_type);
    }

    setIsLoadingExtraData(false);
  }

  useEffect(() => {
    loadExtraData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [promo.id]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(promo.code);

      setMessage("Промокод скопійовано.");
      setMessageType("success");
    } catch {
      setMessage("Не вдалося скопіювати промокод.");
      setMessageType("error");
    }
  }

  async function vote(nextVote: VoteType) {
    if (!user) {
      setMessage("Щоб голосувати, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    setMessage("");

    const previousVote = myVote;

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
      setMessage(`Не вдалося зарахувати голос: ${error.message}`);
      setMessageType("error");
      return;
    }

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

    setMyVote(nextVote);
    setMessage(
      nextVote === "works"
        ? "Дякуємо, ти підтвердив, що промокод працює."
        : "Дякуємо, ти повідомив, що промокод не працює."
    );
    setMessageType("success");
  }

  async function submitReport() {
    if (!user) {
      setMessage("Щоб поскаржитися на промокод, потрібно увійти.");
      setMessageType("error");
      return;
    }

    if (!reportDescription.trim()) {
      setMessage("Коротко опиши проблему з промокодом.");
      setMessageType("error");
      return;
    }

    setIsReporting(true);
    setMessage("");

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promo.id,
      reported_by: user.id,
      description: reportDescription.trim(),
      status: "open",
    });

    setIsReporting(false);

    if (error) {
      setMessage(`Не вдалося відправити репорт: ${error.message}`);
      setMessageType("error");
      return;
    }

    setReportDescription("");
    setIsReportOpen(false);
    setMessage("Репорт відправлено. Адмін перевірить промокод.");
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
          <span className="text-slate-300">{promo.code}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${
                    expired
                      ? "border-red-400/30 bg-red-400/10 text-red-300"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  {expired ? "Термін минув" : "Активний промокод"}
                </span>

                {promo.category_name && (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
                    {promo.category_name}
                  </span>
                )}
              </div>

              <h1 className="mt-6 break-all text-6xl font-black tracking-tight md:text-8xl">
                {promo.code}
              </h1>

              <p className="mt-5 max-w-3xl text-xl font-bold text-emerald-300">
                {promo.discount_value || "Знижка не вказана"}
              </p>

              {promo.description && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  {promo.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Скопіювати промокод
                </button>

                {promo.source_url && (
                  <a
                    href={promo.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-7 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Джерело
                  </a>
                )}

                {promo.store_slug && (
                  <Link
                    href={`/stores/${promo.store_slug}`}
                    className="rounded-full border border-slate-700 px-7 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Сторінка магазину
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <div className="flex items-center gap-4">
                  <StoreLogo
                    name={promo.store_name || store?.name || "Магазин"}
                    websiteUrl={store?.website_url}
                    size="md"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-500">Магазин</p>

                    <h2 className="truncate text-2xl font-black text-white">
                      {promo.store_name || store?.name || "Магазин"}
                    </h2>

                    {promo.store_slug && (
                      <Link
                        href={`/stores/${promo.store_slug}`}
                        className="mt-1 inline-flex text-sm font-black text-emerald-300 hover:text-emerald-200"
                      >
                        /stores/{promo.store_slug}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm font-bold text-slate-500">Діє до</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatDate(promo.expires_at)}
                  </p>

                  {daysLeft !== null && !expired && (
                    <p className="mt-2 text-sm font-bold text-emerald-300">
                      Залишилось днів: {daysLeft}
                    </p>
                  )}
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm font-bold text-slate-500">Джерело</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {getSourceTypeLabel(promo.source_type)}
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm font-bold text-slate-500">Додано</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatDate(promo.created_at)}
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm font-bold text-slate-500">
                    Надійність
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    {worksPercent === null ? "Ще немає" : `${worksPercent}%`}
                  </p>
                </div>
              </div>
            </div>
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Перевірка промокоду</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Допоможи іншим користувачам зрозуміти, чи цей промокод ще працює.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => vote("works")}
                disabled={isVoting}
                className={`rounded-2xl border px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  myVote === "works"
                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                }`}
              >
                <p className="text-3xl font-black">👍 {worksCount}</p>
                <p className="mt-2 text-sm font-black">Працює</p>
              </button>

              <button
                type="button"
                onClick={() => vote("not_works")}
                disabled={isVoting}
                className={`rounded-2xl border px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  myVote === "not_works"
                    ? "border-red-400 bg-red-400 text-slate-950"
                    : "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                }`}
              >
                <p className="text-3xl font-black">👎 {notWorksCount}</p>
                <p className="mt-2 text-sm font-black">Не працює</p>
              </button>
            </div>

            {!user && (
              <p className="mt-4 text-sm font-bold text-slate-500">
                Щоб голосувати, потрібно{" "}
                <Link href="/login" className="text-emerald-300">
                  увійти
                </Link>
                .
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-bold text-slate-500">
                Всього перевірок
              </p>

              <p className="mt-2 text-3xl font-black text-white">
                {worksCount + notWorksCount}
              </p>

              {worksPercent !== null && (
                <p className="mt-2 text-sm font-bold text-slate-400">
                  {worksPercent}% користувачів кажуть, що промокод працює.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Додав користувач</h2>

              {isLoadingExtraData ? (
                <div className="mt-5 h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-950" />
              ) : authorProfile ? (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-2xl font-black text-emerald-300">
                      {authorProfile.avatar_url ? (
                        <img
                          src={authorProfile.avatar_url}
                          alt={getAuthorName(authorProfile)}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{getAuthorFallback(authorProfile)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xl font-black text-white">
                        {getAuthorName(authorProfile)}
                      </p>

                      {authorProfile.username && (
                        <p className="mt-1 text-sm font-black text-emerald-300">
                          @{authorProfile.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {authorProfile.bio && (
                    <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                      {authorProfile.bio}
                    </p>
                  )}

                  {authorProfile.username && (
                    <Link
                      href={`/u/${authorProfile.username}`}
                      className="mt-5 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити профіль
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="font-black text-slate-300">
                    Автор ще не налаштував публічний профіль
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Коли користувач додасть нікнейм у профілі, тут зʼявиться
                    посилання на його сторінку.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Поскаржитися</h2>

              <p className="mt-3 leading-7 text-slate-400">
                Якщо промокод не працює, веде не туди або має неправильний опис,
                можна відправити репорт.
              </p>

              {!isReportOpen ? (
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="mt-5 rounded-full border border-red-400/40 px-5 py-3 font-black text-red-300 transition hover:bg-red-400/10"
                >
                  Поскаржитися
                </button>
              ) : (
                <div className="mt-5 grid gap-4">
                  <textarea
                    value={reportDescription}
                    onChange={(event) =>
                      setReportDescription(event.target.value)
                    }
                    rows={5}
                    placeholder="Опиши проблему з промокодом..."
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={isReporting}
                      className="rounded-full bg-red-400 px-5 py-3 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isReporting ? "Відправляю..." : "Відправити репорт"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsReportOpen(false);
                        setReportDescription("");
                      }}
                      className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              )}

              {!user && (
                <p className="mt-4 text-sm font-bold text-slate-500">
                  Щоб відправити репорт, потрібно{" "}
                  <Link href="/login" className="text-emerald-300">
                    увійти
                  </Link>
                  .
                </p>
              )}
            </section>
          </section>
        </section>

        {allCategoryNames.length > 0 && (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Категорії</h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {allCategoryNames.map((categoryName) => (
                <span
                  key={categoryName}
                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300"
                >
                  {categoryName}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}