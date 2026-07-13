"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

type PromoCode = {
  id: string;
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

function formatDate(date: string | null | undefined) {
  if (!date) return "Без терміну";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function isExpired(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expires = new Date(date);
  expires.setHours(0, 0, 0, 0);

  return expires < today;
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
      description: "Будь першим, хто перевірить цей промокод.",
      className: "border-slate-700 bg-slate-800 text-slate-300",
    };
  }

  if (works >= notWorks) {
    return {
      label: "Ймовірно працює",
      description: "Більшість користувачів позначили, що код працює.",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    label: "Є скарги",
    description: "Користувачі частіше повідомляли, що код не працює.",
    className: "border-red-400/30 bg-red-400/10 text-red-300",
  };
}

function friendlyError(errorMessage: string) {
  if (errorMessage.includes("row-level security")) {
    return "Помилка доступу Supabase. Перевір, чи ти увійшов в акаунт.";
  }

  return errorMessage;
}

export default function PromoDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
          <section className="mx-auto w-full max-w-6xl">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Завантаження промокоду...
            </div>
          </section>
        </main>
      }
    >
      <PromoDetailsContent />
    </Suspense>
  );
}

function PromoDetailsContent() {
  const params = useParams<{ id: string }>();
  const promoId = params.id;

  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userVote, setUserVote] = useState<VoteType | null>(null);

  const [worksCount, setWorksCount] = useState(0);
  const [notWorksCount, setNotWorksCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const [copyMessage, setCopyMessage] = useState("");
  const [voteMessage, setVoteMessage] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [reportReason, setReportReason] = useState("other");
  const [reportText, setReportText] = useState("");

  const expired = useMemo(() => isExpired(promo?.expires_at), [promo]);
  const health = getPromoHealth(worksCount, notWorksCount);

  async function loadPromo() {
    setIsLoading(true);
    setErrorMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    const { data, error } = await supabase
      .from("promo_code_stats")
      .select("*")
      .eq("id", promoId)
      .eq("status", "active")
      .single();

    if (error || !data) {
      setPromo(null);
      setErrorMessage("Промокод не знайдено або він ще не активний.");
      setIsLoading(false);
      return;
    }

    const loadedPromo = data as PromoCode;

    setPromo(loadedPromo);
    setWorksCount(loadedPromo.works_count || 0);
    setNotWorksCount(loadedPromo.not_works_count || 0);

    if (currentUser) {
      const { data: voteData } = await supabase
        .from("promo_votes")
        .select("vote_type")
        .eq("promo_code_id", promoId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (
        voteData?.vote_type === "works" ||
        voteData?.vote_type === "not_works"
      ) {
        setUserVote(voteData.vote_type);
      }
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (promoId) {
      loadPromo();
    }
  }, [promoId]);

  async function copyCode() {
    if (!promo?.code) return;

    await navigator.clipboard.writeText(promo.code);

    setCopyMessage("Промокод скопійовано 🐦");

    window.setTimeout(() => {
      setCopyMessage("");
    }, 2500);
  }

  async function vote(voteType: VoteType) {
    setVoteMessage("");

    if (!user) {
      setVoteMessage("Щоб голосувати, потрібно увійти.");
      return;
    }

    if (!promo) {
      setVoteMessage("Промокод не завантажено.");
      return;
    }

    if (userVote === voteType) {
      setVoteMessage("Твій голос уже враховано.");
      return;
    }

    setIsVoting(true);

    if (userVote) {
      const { error } = await supabase
        .from("promo_votes")
        .update({
          vote_type: voteType,
        })
        .eq("promo_code_id", promo.id)
        .eq("user_id", user.id);

      if (error) {
        setVoteMessage(`Помилка голосування: ${friendlyError(error.message)}`);
        setIsVoting(false);
        return;
      }

      if (userVote === "works" && voteType === "not_works") {
        setWorksCount((value) => Math.max(0, value - 1));
        setNotWorksCount((value) => value + 1);
      }

      if (userVote === "not_works" && voteType === "works") {
        setNotWorksCount((value) => Math.max(0, value - 1));
        setWorksCount((value) => value + 1);
      }
    } else {
      const { error } = await supabase.from("promo_votes").insert({
        promo_code_id: promo.id,
        user_id: user.id,
        vote_type: voteType,
      });

      if (error) {
        setVoteMessage(`Помилка голосування: ${friendlyError(error.message)}`);
        setIsVoting(false);
        return;
      }

      if (voteType === "works") {
        setWorksCount((value) => value + 1);
      } else {
        setNotWorksCount((value) => value + 1);
      }
    }

    setUserVote(voteType);
    setVoteMessage("Дякуємо, голос враховано.");
    setIsVoting(false);
  }

  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setReportMessage("");

    if (!user) {
      setReportMessage("Щоб надіслати репорт, потрібно увійти.");
      return;
    }

    if (!promo) {
      setReportMessage("Промокод не завантажено.");
      return;
    }

    setIsReporting(true);

    const reasonLabels: Record<string, string> = {
      other: "Інше",
      not_working: "Не працює",
      wrong_info: "Неправильна інформація",
      expired: "Акція завершилась",
      suspicious: "Сумнівне джерело",
    };

    const finalMessage = reportText.trim()
      ? `[${reasonLabels[reportReason] || "Інше"}] ${reportText.trim()}`
      : reasonLabels[reportReason] || "Інше";

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promo.id,
      reason: "other",
      message: finalMessage,
      status: "pending",
      reported_by: user.id,
    });

    setIsReporting(false);

    if (error) {
      setReportMessage(`Помилка репорту: ${friendlyError(error.message)}`);
      return;
    }

    setReportText("");
    setReportReason("other");
    setReportMessage("Репорт надіслано. Дякуємо за допомогу.");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div className="h-[500px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
            <div className="h-[500px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          </div>
        </section>
      </main>
    );
  }

  if (!promo) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
            <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-[2rem] border border-red-400/30 bg-slate-950">
              <Image
                src="/icons/promoptaha-red-bird.png"
                alt="ПромоПтаха"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-4xl font-black">Промокод не знайдено</h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-red-200">
              {errorMessage ||
                "Можливо, код ще на модерації, видалений або посилання неправильне."}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/codes"
                className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
              >
                До промокодів
              </Link>

              <Link
                href="/"
                className="rounded-full border border-red-400/30 px-6 py-4 font-black text-red-200 transition hover:bg-red-400/10"
              >
                На головну
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
          <Link href="/" className="hover:text-red-300">
            Головна
          </Link>
          <span>/</span>
          <Link href="/codes" className="hover:text-red-300">
            Промокоди
          </Link>
          <span>/</span>
          <span className="text-slate-300">{promo.code}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <article className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/20 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
                  Промокод
                </p>

                <h1 className="break-all text-5xl font-black tracking-tight md:text-7xl">
                  {promo.code}
                </h1>
              </div>

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
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm font-bold text-slate-500">
                Умова / знижка
              </p>

              <p className="mt-3 text-3xl font-black text-red-300">
                {promo.discount_value || "Умову не вказано"}
              </p>
            </div>

            {promo.description && (
              <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm font-bold text-slate-500">Опис</p>

                <p className="mt-3 whitespace-pre-wrap leading-8 text-slate-300">
                  {promo.description}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-bold text-slate-500">Магазин</p>

                {promo.store_slug ? (
                  <Link
                    href={`/stores/${promo.store_slug}`}
                    className="mt-2 inline-flex text-xl font-black text-red-300 hover:text-red-200"
                  >
                    {promo.store_name || "Відкрити"} →
                  </Link>
                ) : (
                  <p className="mt-2 text-xl font-black text-slate-200">
                    {promo.store_name || "Не вказано"}
                  </p>
                )}
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-bold text-slate-500">Діє до</p>
                <p className="mt-2 text-xl font-black text-slate-200">
                  {formatDate(promo.expires_at)}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-bold text-slate-500">Джерело</p>

                {promo.source_url ? (
                  <a
                    href={promo.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xl font-black text-red-300 hover:text-red-200"
                  >
                    {getSourceLabel(promo.source_type)} →
                  </a>
                ) : (
                  <p className="mt-2 text-xl font-black text-slate-200">
                    {getSourceLabel(promo.source_type)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={copyCode}
                className="rounded-2xl bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
              >
                Скопіювати код
              </button>

              <Link
                href="/codes"
                className="rounded-2xl border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
              >
                Інші промокоди
              </Link>

              {copyMessage && (
                <span className="flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 font-bold text-emerald-300">
                  {copyMessage}
                </span>
              )}
            </div>
          </article>

          <aside className="space-y-6">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/10">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-red-400/30 bg-slate-950">
                  <Image
                    src="/icons/promoptaha-red-bird.png"
                    alt="ПромоПтаха"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black">Перевірка коду</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Допоможи іншим користувачам.
                  </p>
                </div>
              </div>

              <div className={`mt-6 rounded-2xl border p-4 ${health.className}`}>
                <p className="font-black">{health.label}</p>
                <p className="mt-2 text-sm opacity-90">{health.description}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <p className="text-3xl font-black text-emerald-300">
                    {worksCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    працює
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <p className="text-3xl font-black text-red-300">
                    {notWorksCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    не працює
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => vote("works")}
                  disabled={isVoting}
                  className={`rounded-2xl px-5 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "works"
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  ✅ Працює
                </button>

                <button
                  type="button"
                  onClick={() => vote("not_works")}
                  disabled={isVoting}
                  className={`rounded-2xl px-5 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    userVote === "not_works"
                      ? "bg-red-500 text-white"
                      : "border border-slate-700 text-slate-200 hover:border-red-400 hover:text-red-300"
                  }`}
                >
                  ❌ Не працює
                </button>
              </div>

              {voteMessage && (
                <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                  {voteMessage}
                </p>
              )}

              {!user && (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Щоб голосувати або надсилати репорти, потрібно{" "}
                  <Link href="/login" className="font-bold text-red-300">
                    увійти
                  </Link>
                  .
                </p>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/10">
              <h2 className="text-2xl font-black">Повідомити про проблему</h2>

              <p className="mt-3 leading-7 text-slate-400">
                Якщо код не працює, опис неправильний або джерело сумнівне —
                відправ репорт на модерацію.
              </p>

              <form onSubmit={sendReport} className="mt-5 space-y-4">
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  disabled={!user || isReporting}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="not_working">Не працює</option>
                  <option value="wrong_info">Неправильна інформація</option>
                  <option value="expired">Акція завершилась</option>
                  <option value="suspicious">Сумнівне джерело</option>
                  <option value="other">Інше</option>
                </select>

                <textarea
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  disabled={!user || isReporting}
                  placeholder="Коротко опиши проблему..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!user || isReporting}
                  className="w-full rounded-2xl bg-red-500 px-5 py-4 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReporting ? "Надсилаю..." : "Надіслати репорт"}
                </button>
              </form>

              {reportMessage && (
                <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                  {reportMessage}
                </p>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}