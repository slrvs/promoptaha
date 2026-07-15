"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type VoteType = "works" | "not_works";

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  normalized_code?: string | null;

  store_id: string;
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
  works_count?: number | string | null;
  not_works_count?: number | string | null;
  submitted_by?: string | null;
};

type RelatedPromo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  works_count?: number | string | null;
  not_works_count?: number | string | null;
};

type CodeDetailsClientProps = {
  codeParam: string;
};

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

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toArray(value: string[] | null | undefined) {
  if (!value) return [];

  return Array.isArray(value) ? value : [];
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
}

function isVerified(promo: PromoCode | RelatedPromo) {
  const works = toNumber(promo.works_count);
  const notWorks = toNumber(promo.not_works_count);

  return works > 0 && works > notWorks;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Дата невідома";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function getPromoUrl(promo: PromoCode | RelatedPromo) {
  return `/codes/${promo.slug || promo.id}`;
}

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return "Джерело";
}

function getStatusLabel(promo: PromoCode | RelatedPromo) {
  if (!promo.expires_at) return "Без терміну";
  if (isExpired(promo.expires_at)) return "Прострочений";
  if (isVerified(promo)) return "Перевірений";

  return "Активний";
}

function getStatusClass(promo: PromoCode | RelatedPromo) {
  if (!promo.expires_at) {
    return "border-slate-700 bg-slate-950 text-slate-300";
  }

  if (isExpired(promo.expires_at)) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (isVerified(promo)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getCategoryNames(promo: PromoCode) {
  const names = toArray(promo.all_category_names);

  if (names.length > 0) {
    return names;
  }

  return promo.category_name ? [promo.category_name] : [];
}

export default function CodeDetailsClient({
  codeParam,
}: CodeDetailsClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [relatedPromos, setRelatedPromos] = useState<RelatedPromo[]>([]);

  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportReason, setReportReason] = useState("not_working");
  const [reportComment, setReportComment] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingPromo, setIsLoadingPromo] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const categoryNames = useMemo(() => {
    return promo ? getCategoryNames(promo) : [];
  }, [promo]);

  const totalVotes = useMemo(() => {
    if (!promo) return 0;

    return toNumber(promo.works_count) + toNumber(promo.not_works_count);
  }, [promo]);

  const trustPercent = useMemo(() => {
    if (!promo) return 0;

    const works = toNumber(promo.works_count);

    if (totalVotes === 0) return 0;

    return Math.round((works / totalVotes) * 100);
  }, [promo, totalVotes]);

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);

    return data.user;
  }

  async function loadPromo(currentUser?: User | null) {
    setIsLoadingPromo(true);
    setMessage("");

    const query = supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, normalized_code, store_id, store_name, store_slug, store_search_aliases, category_id, category_name, category_slug, all_category_ids, all_category_names, all_category_slugs, search_aliases, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
      );

    const { data, error } = isUuid(codeParam)
      ? await query.eq("id", codeParam).maybeSingle()
      : await query.eq("slug", codeParam).maybeSingle();

    if (error) {
      setPromo(null);
      setMessage(`Не вдалося завантажити промокод: ${error.message}`);
      setMessageType("error");
      setIsLoadingPromo(false);
      return;
    }

    if (!data) {
      setPromo(null);
      setMessage("Промокод не знайдено або він ще не схвалений.");
      setMessageType("error");
      setIsLoadingPromo(false);
      return;
    }

    const loadedPromo = data as unknown as PromoCode;

    setPromo(loadedPromo);
    setIsLoadingPromo(false);

    loadRelatedPromos(loadedPromo);

    if (currentUser) {
      loadUserVote(loadedPromo.id, currentUser.id);
    }
  }

  async function loadUserVote(promoId: string, userId: string) {
    const { data } = await supabase
      .from("promo_votes")
      .select("vote_type")
      .eq("promo_code_id", promoId)
      .eq("user_id", userId)
      .maybeSingle();

    setUserVote((data?.vote_type as VoteType | undefined) || null);
  }

  async function loadRelatedPromos(currentPromo: PromoCode) {
    const { data } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, discount_value, expires_at, works_count, not_works_count"
      )
      .eq("store_id", currentPromo.store_id)
      .neq("id", currentPromo.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setRelatedPromos((data || []) as unknown as RelatedPromo[]);
  }

  useEffect(() => {
    async function start() {
      const currentUser = await loadUser();

      await loadPromo(currentUser);
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (promo && session?.user) {
        loadUserVote(promo.id, session.user.id);
      }

      if (!session?.user) {
        setUserVote(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [codeParam]);

  async function copyCode() {
    if (!promo) return;

    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setMessage("Не вдалося скопіювати код. Скопіюй вручну.");
      setMessageType("error");
    }
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

    if (error) {
      setMessage(`Не вдалося зберегти голос: ${error.message}`);
      setMessageType("error");
      setIsVoting(false);
      return;
    }

    setUserVote(voteType);
    setMessage("Голос збережено. Дякуємо за перевірку!");
    setMessageType("success");
    setIsVoting(false);

    loadPromo(user);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      reason: reportReason,
      description: reportComment.trim() || null,
      status: "open",
    });

    setIsReporting(false);

    if (error) {
      setMessage(`Не вдалося відправити скаргу: ${error.message}`);
      setMessageType("error");
      return;
    }

    setReportComment("");
    setReportReason("not_working");
    setIsReportOpen(false);
    setMessage("Скаргу відправлено на перевірку.");
    setMessageType("success");
  }

  if (isLoadingPromo) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
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
            <div className="text-6xl">🎟️</div>

            <h1 className="mt-5 text-4xl font-black text-red-300">
              Промокод не знайдено
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-100">
              Можливо, промокод ще на модерації, прихований або посилання
              змінилося.
            </p>

            <Link
              href="/codes"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              До промокодів
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
          <Link href="/codes" className="hover:text-emerald-300">
            Промокоди
          </Link>
          <span>/</span>
          <span className="text-slate-300">{promo.code}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Промокод
              </p>

              <h1 className="break-all text-5xl font-black tracking-tight md:text-7xl">
                {promo.code}
              </h1>

              <p className="mt-5 text-2xl font-black text-emerald-300">
                {promo.discount_value || "Знижка"}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${getStatusClass(
                    promo
                  )}`}
                >
                  {getStatusLabel(promo)}
                </span>

                {categoryNames.length === 0 ? (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-500">
                    Без категорії
                  </span>
                ) : (
                  categoryNames.map((categoryName) => (
                    <span
                      key={categoryName}
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300"
                    >
                      {categoryName}
                    </span>
                  ))
                )}
              </div>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                {promo.description ||
                  "Промокод додано спільнотою ПромоПтаха. Перевір умови, термін дії та голоси користувачів перед використанням."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-2xl bg-emerald-400 px-6 py-5 text-xl font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  {copied ? "Скопійовано" : "Скопіювати код"}
                </button>

                {promo.source_url ? (
                  <a
                    href={promo.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-center rounded-2xl border border-slate-700 px-6 py-5 text-xl font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Відкрити джерело
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-slate-800 px-6 py-5 text-xl font-black text-slate-600"
                  >
                    Джерело не вказано
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-3xl font-black">Перевірка</h2>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
                  <p className="text-4xl font-black text-emerald-300">
                    {formatNumber(toNumber(promo.works_count))}
                  </p>
                  <p className="mt-2 text-sm font-bold text-emerald-100">
                    працює
                  </p>
                </div>

                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-center">
                  <p className="text-4xl font-black text-red-300">
                    {formatNumber(toNumber(promo.not_works_count))}
                  </p>
                  <p className="mt-2 text-sm font-bold text-red-100">
                    не працює
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-bold text-slate-500">
                  Довіра спільноти
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {totalVotes === 0 ? "—" : `${trustPercent}%`}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  На основі {formatNumber(totalVotes)} голосів користувачів.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => vote("works")}
                  disabled={isVoting || isLoadingUser}
                  className={`rounded-2xl px-5 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "works"
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                  }`}
                >
                  Працює
                </button>

                <button
                  type="button"
                  onClick={() => vote("not_works")}
                  disabled={isVoting || isLoadingUser}
                  className={`rounded-2xl px-5 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "not_works"
                      ? "bg-red-400 text-slate-950"
                      : "border border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                  }`}
                >
                  Не працює
                </button>
              </div>

              {!user && (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Щоб голосувати або скаржитися, потрібно{" "}
                  <Link href="/login" className="font-black text-emerald-300">
                    увійти
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
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

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Магазин</p>

            <p className="mt-2 text-2xl font-black text-white">
              {promo.store_name || "Магазин"}
            </p>

            {promo.store_slug && (
              <Link
                href={`/stores/${promo.store_slug}`}
                className="mt-4 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Відкрити магазин
              </Link>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Термін дії</p>

            <p className="mt-2 text-2xl font-black text-white">
              {formatDate(promo.expires_at)}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Якщо термін невідомий, перевір джерело або сайт магазину.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm font-bold text-slate-500">Джерело</p>

            <p className="mt-2 text-2xl font-black text-white">
              {getSourceLabel(promo.source_type)}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Додано: {formatDateTime(promo.created_at)}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Поскаржитись</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Повідом, якщо код неактуальний, фейковий або має неправильні
                умови.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReportOpen((current) => !current)}
              className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
            >
              {isReportOpen ? "Закрити" : "Поскаржитись"}
            </button>
          </div>

          {isReportOpen && (
            <form onSubmit={submitReport} className="mt-6 grid gap-4">
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="not_working">Не працює</option>
                <option value="expired">Закінчився термін</option>
                <option value="wrong_terms">Неправильні умови</option>
                <option value="fake">Фейковий код</option>
                <option value="duplicate">Дублікат</option>
                <option value="other">Інше</option>
              </select>

              <textarea
                value={reportComment}
                onChange={(event) => setReportComment(event.target.value)}
                placeholder="Коментар до скарги..."
                rows={4}
                className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />

              <button
                type="submit"
                disabled={isReporting}
                className="rounded-2xl bg-red-400 px-5 py-4 font-black text-slate-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReporting ? "Відправляю..." : "Відправити скаргу"}
              </button>
            </form>
          )}
        </section>

        {relatedPromos.length > 0 && (
          <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Ще промокоди
                </p>

                <h2 className="text-4xl font-black tracking-tight">
                  Інші коди цього магазину
                </h2>
              </div>

              {promo.store_slug && (
                <Link
                  href={`/stores/${promo.store_slug}`}
                  className="rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі коди магазину
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedPromos.map((relatedPromo) => (
                <article
                  key={relatedPromo.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {relatedPromo.store_name || "Магазин"}
                      </p>

                      <h3 className="mt-2 break-all text-3xl font-black text-white">
                        {relatedPromo.code}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        relatedPromo
                      )}`}
                    >
                      {getStatusLabel(relatedPromo)}
                    </span>
                  </div>

                  <p className="mt-5 text-xl font-black text-emerald-300">
                    {relatedPromo.discount_value || "Знижка"}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                      <p className="text-2xl font-black text-emerald-300">
                        {formatNumber(toNumber(relatedPromo.works_count))}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                      <p className="text-2xl font-black text-red-300">
                        {formatNumber(toNumber(relatedPromo.not_works_count))}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        ні
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                      <p className="text-sm font-black text-slate-200">
                        {formatDate(relatedPromo.expires_at)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        термін
                      </p>
                    </div>
                  </div>

                  <Link
                    href={getPromoUrl(relatedPromo)}
                    className="mt-5 flex justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Деталі
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}