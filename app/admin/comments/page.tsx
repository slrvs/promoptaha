"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";

type CommentStatusFilter = "all" | "visible" | "hidden";
type WordStatusFilter = "all" | "active" | "hidden";

type PromoComment = {
  id: string;
  promo_code_id: string;
  user_id: string;
  body: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type UserProfile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  store_name?: string | null;
  store_slug?: string | null;
  status?: string | null;
};

type ForbiddenWord = {
  id: string;
  word: string;
  severity?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, " ");
}

function normalizeForbiddenWord(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
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

function getProfileName(profile: UserProfile | null | undefined) {
  return profile?.display_name || profile?.username || profile?.email || "Користувач";
}

function getAvatarFallback(profile: UserProfile | null | undefined) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getCommentStatusLabel(status: string | null | undefined) {
  if (status === "visible") return "Видимий";
  if (status === "hidden") return "Прихований";

  return status || "Невідомо";
}

function getCommentStatusClass(status: string | null | undefined) {
  if (status === "visible") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "hidden") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-950 text-slate-300";
}

function getWordStatusLabel(status: string | null | undefined) {
  if (status === "active") return "Активне";
  if (status === "hidden") return "Вимкнене";

  return status || "Невідомо";
}

function getWordStatusClass(status: string | null | undefined) {
  if (status === "active") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "hidden") {
    return "border-slate-700 bg-slate-950 text-slate-300";
  }

  return "border-slate-700 bg-slate-950 text-slate-300";
}

function commentMatchesSearch(
  comment: PromoComment,
  searchQuery: string,
  profile: UserProfile | null | undefined,
  promo: Promo | null | undefined
) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableText = normalizeText(
    [
      comment.body,
      comment.status,
      profile?.username,
      profile?.display_name,
      profile?.email,
      promo?.code,
      promo?.store_name,
      promo?.store_slug,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(query);
}

function commentMatchesStatus(
  comment: PromoComment,
  statusFilter: CommentStatusFilter
) {
  if (statusFilter === "all") return true;

  return comment.status === statusFilter;
}

function wordMatchesStatus(word: ForbiddenWord, statusFilter: WordStatusFilter) {
  if (statusFilter === "all") return true;

  return word.status === statusFilter;
}

export default function AdminCommentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<PromoComment[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );
  const [promosMap, setPromosMap] = useState<Map<string, Promo>>(new Map());
  const [forbiddenWords, setForbiddenWords] = useState<ForbiddenWord[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [commentStatusFilter, setCommentStatusFilter] =
    useState<CommentStatusFilter>("all");
  const [wordStatusFilter, setWordStatusFilter] =
    useState<WordStatusFilter>("all");
  const [newForbiddenWord, setNewForbiddenWord] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(
    null
  );
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === adminEmail;

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      const profile = profilesMap.get(comment.user_id);
      const promo = promosMap.get(comment.promo_code_id);

      return (
        commentMatchesSearch(comment, searchQuery, profile, promo) &&
        commentMatchesStatus(comment, commentStatusFilter)
      );
    });
  }, [comments, searchQuery, commentStatusFilter, profilesMap, promosMap]);

  const filteredForbiddenWords = useMemo(() => {
    return forbiddenWords
      .filter((word) => wordMatchesStatus(word, wordStatusFilter))
      .sort((firstWord, secondWord) =>
        firstWord.word.localeCompare(secondWord.word)
      );
  }, [forbiddenWords, wordStatusFilter]);

  const stats = useMemo(() => {
    return {
      commentsTotal: comments.length,
      commentsVisible: comments.filter((comment) => comment.status === "visible")
        .length,
      commentsHidden: comments.filter((comment) => comment.status === "hidden")
        .length,
      wordsTotal: forbiddenWords.length,
      wordsActive: forbiddenWords.filter((word) => word.status === "active")
        .length,
      wordsHidden: forbiddenWords.filter((word) => word.status === "hidden")
        .length,
    };
  }, [comments, forbiddenWords]);

  async function loadAdminPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    setUser(userData.user);

    if (!userData.user || userData.user.email !== adminEmail) {
      setIsLoading(false);
      return;
    }

    await Promise.all([loadComments(), loadForbiddenWords()]);

    setIsLoading(false);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("promo_comments")
      .select("id, promo_code_id, user_id, body, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setComments([]);
      setMessage(`Не вдалося завантажити коментарі: ${error.message}`);
      setMessageType("error");
      return;
    }

    const nextComments = (data || []) as PromoComment[];

    setComments(nextComments);

    const userIds = Array.from(
      new Set(
        nextComments
          .map((comment) => comment.user_id)
          .filter((userId): userId is string => Boolean(userId))
      )
    );

    const promoIds = Array.from(
      new Set(
        nextComments
          .map((comment) => comment.promo_code_id)
          .filter((promoId): promoId is string => Boolean(promoId))
      )
    );

    await Promise.all([loadProfiles(userIds), loadPromos(promoIds)]);
  }

  async function loadProfiles(userIds: string[]) {
    if (userIds.length === 0) {
      setProfilesMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, email")
      .in("id", userIds);

    if (error) {
      setProfilesMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as UserProfile[]).map((profile) => [profile.id, profile])
    );

    setProfilesMap(nextMap);
  }

  async function loadPromos(promoIds: string[]) {
    if (promoIds.length === 0) {
      setPromosMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select("id, slug, code, store_name, store_slug, status")
      .in("id", promoIds);

    if (error) {
      setPromosMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as Promo[]).map((promo) => [promo.id, promo])
    );

    setPromosMap(nextMap);
  }

  async function loadForbiddenWords() {
    const { data, error } = await supabase
      .from("forbidden_words")
      .select("id, word, severity, status, created_at")
      .order("word", { ascending: true })
      .limit(1000);

    if (error) {
      setForbiddenWords([]);
      setMessage(`Не вдалося завантажити заборонені слова: ${error.message}`);
      setMessageType("error");
      return;
    }

    setForbiddenWords((data || []) as ForbiddenWord[]);
  }

  useEffect(() => {
    loadAdminPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function addForbiddenWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const finalWord = normalizeForbiddenWord(newForbiddenWord);

    if (!finalWord) {
      setMessage("Вкажи слово або фразу для блокування.");
      setMessageType("error");
      return;
    }

    if (finalWord.length < 2) {
      setMessage("Заборонене слово має містити хоча б 2 символи.");
      setMessageType("error");
      return;
    }

    setIsAddingWord(true);
    setMessage("");

    const { error } = await supabase.from("forbidden_words").insert({
      word: finalWord,
      severity: "block",
      status: "active",
    });

    setIsAddingWord(false);

    if (error) {
      setMessage(`Не вдалося додати слово: ${error.message}`);
      setMessageType("error");
      return;
    }

    setNewForbiddenWord("");
    setMessage("Заборонене слово додано.");
    setMessageType("success");
    await loadForbiddenWords();
  }

  async function updateCommentStatus(comment: PromoComment, nextStatus: string) {
    setUpdatingCommentId(comment.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .update({
        status: nextStatus,
      })
      .eq("id", comment.id);

    setUpdatingCommentId(null);

    if (error) {
      setMessage(`Не вдалося оновити коментар: ${error.message}`);
      setMessageType("error");
      return;
    }

    setComments((currentComments) =>
      currentComments.map((currentComment) =>
        currentComment.id === comment.id
          ? { ...currentComment, status: nextStatus }
          : currentComment
      )
    );

    setMessage(
      nextStatus === "visible"
        ? "Коментар повернуто."
        : "Коментар приховано."
    );
    setMessageType("success");
  }

  async function deleteComment(comment: PromoComment) {
    const confirmed = window.confirm("Видалити цей коментар назавжди?");

    if (!confirmed) return;

    setDeletingCommentId(comment.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .delete()
      .eq("id", comment.id);

    setDeletingCommentId(null);

    if (error) {
      setMessage(`Не вдалося видалити коментар: ${error.message}`);
      setMessageType("error");
      return;
    }

    setComments((currentComments) =>
      currentComments.filter((currentComment) => currentComment.id !== comment.id)
    );

    setMessage("Коментар видалено.");
    setMessageType("success");
  }

  async function updateWordStatus(word: ForbiddenWord, nextStatus: string) {
    setUpdatingWordId(word.id);
    setMessage("");

    const { error } = await supabase
      .from("forbidden_words")
      .update({
        status: nextStatus,
      })
      .eq("id", word.id);

    setUpdatingWordId(null);

    if (error) {
      setMessage(`Не вдалося оновити слово: ${error.message}`);
      setMessageType("error");
      return;
    }

    setForbiddenWords((currentWords) =>
      currentWords.map((currentWord) =>
        currentWord.id === word.id
          ? { ...currentWord, status: nextStatus }
          : currentWord
      )
    );

    setMessage(nextStatus === "active" ? "Слово увімкнено." : "Слово вимкнено.");
    setMessageType("success");
  }

  async function deleteWord(word: ForbiddenWord) {
    const confirmed = window.confirm(`Видалити слово “${word.word}”?`);

    if (!confirmed) return;

    setDeletingWordId(word.id);
    setMessage("");

    const { error } = await supabase
      .from("forbidden_words")
      .delete()
      .eq("id", word.id);

    setDeletingWordId(null);

    if (error) {
      setMessage(`Не вдалося видалити слово: ${error.message}`);
      setMessageType("error");
      return;
    }

    setForbiddenWords((currentWords) =>
      currentWords.filter((currentWord) => currentWord.id !== word.id)
    );

    setMessage("Слово видалено.");
    setMessageType("success");
  }

  function resetFilters() {
    setSearchQuery("");
    setCommentStatusFilter("all");
    setWordStatusFilter("all");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[380px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 h-96 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-4xl font-black">Потрібен вхід</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Щоб відкрити адмінку коментарів, потрібно увійти.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Увійти
          </Link>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
          <div className="text-6xl">⛔</div>

          <h1 className="mt-5 text-4xl font-black">Немає доступу</h1>

          <p className="mt-4 leading-7 text-red-200">
            Ця сторінка доступна тільки адміністратору.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-red-400/40 px-6 py-4 font-black text-red-200 transition hover:bg-red-400/10"
          >
            На головну
          </Link>
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
          <span className="text-slate-300">Коментарі</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Коментарі та фільтр слів
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут можна модерувати коментарі під промокодами й керувати
                словами або фразами, які блокуються при публікації.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Модерація промокодів
                </Link>

                <Link
                  href="/admin/reports"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Репорти
                </Link>

                <Link
                  href="/admin/stats"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Аналітика
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.commentsTotal}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  коментарів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.commentsVisible}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  видимі
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {stats.commentsHidden}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  приховані
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.wordsActive}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активних слів
                </p>
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

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Коментар, користувач, код, магазин..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Статус коментарів
              </span>

              <select
                value={commentStatusFilter}
                onChange={(event) =>
                  setCommentStatusFilter(event.target.value as CommentStatusFilter)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі</option>
                <option value="visible">Видимі</option>
                <option value="hidden">Приховані</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Статус слів
              </span>

              <select
                value={wordStatusFilter}
                onChange={(event) =>
                  setWordStatusFilter(event.target.value as WordStatusFilter)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі</option>
                <option value="active">Активні</option>
                <option value="hidden">Вимкнені</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Скинути
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Коментарі</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Знайдено: {filteredComments.length} / {comments.length}
                </p>
              </div>

              <button
                type="button"
                onClick={loadComments}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Оновити
              </button>
            </div>

            {filteredComments.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">💬</div>

                <h3 className="mt-4 text-2xl font-black">
                  Коментарів не знайдено
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                  Зміни пошук або фільтр статусу.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {filteredComments.map((comment) => {
                  const profile = profilesMap.get(comment.user_id);
                  const promo = promosMap.get(comment.promo_code_id);

                  return (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-lg font-black text-emerald-300">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={getProfileName(profile)}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span>{getAvatarFallback(profile)}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            {profile?.username ? (
                              <Link
                                href={`/u/${profile.username}`}
                                className="truncate font-black text-white transition hover:text-emerald-300"
                              >
                                {getProfileName(profile)}
                              </Link>
                            ) : (
                              <p className="truncate font-black text-white">
                                {getProfileName(profile)}
                              </p>
                            )}

                            <p className="text-xs font-bold text-slate-500">
                              {formatDateTime(comment.created_at)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getCommentStatusClass(
                            comment.status
                          )}`}
                        >
                          {getCommentStatusLabel(comment.status)}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                        {comment.body}
                      </p>

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Промокод
                        </p>

                        {promo ? (
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Link
                              href={`/codes/${promo.slug || promo.id}`}
                              className="break-all text-lg font-black text-emerald-300 transition hover:text-emerald-200"
                            >
                              {promo.code}
                            </Link>

                            <span className="text-sm font-bold text-slate-500">
                              {promo.store_name || "Магазин"}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm font-bold text-slate-500">
                            Промокод не знайдено або не схвалений.
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {comment.status === "visible" ? (
                          <button
                            type="button"
                            onClick={() => updateCommentStatus(comment, "hidden")}
                            disabled={updatingCommentId === comment.id}
                            className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingCommentId === comment.id
                              ? "Оновлюю..."
                              : "Приховати"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateCommentStatus(comment, "visible")
                            }
                            disabled={updatingCommentId === comment.id}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingCommentId === comment.id
                              ? "Оновлюю..."
                              : "Повернути"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteComment(comment)}
                          disabled={deletingCommentId === comment.id}
                          className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingCommentId === comment.id
                            ? "Видаляю..."
                            : "Видалити"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Заборонені слова</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Активні слова блокують нові й відредаговані коментарі.
                </p>
              </div>

              <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
                {stats.wordsActive} активних
              </span>
            </div>

            <form onSubmit={addForbiddenWord} className="mt-6 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Нове слово або фраза
                </span>

                <input
                  value={newForbiddenWord}
                  onChange={(event) => setNewForbiddenWord(event.target.value)}
                  placeholder="Введи слово або фразу..."
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </label>

              <button
                type="submit"
                disabled={isAddingWord}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingWord ? "Додаю..." : "Додати слово"}
              </button>
            </form>

            {filteredForbiddenWords.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">🧹</div>

                <h3 className="mt-4 text-2xl font-black">
                  Слів не знайдено
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                  Додай перше слово або зміни фільтр.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {filteredForbiddenWords.map((word) => (
                  <article
                    key={word.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="break-all text-xl font-black text-white">
                          {word.word}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Додано: {formatDateTime(word.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getWordStatusClass(
                          word.status
                        )}`}
                      >
                        {getWordStatusLabel(word.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {word.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => updateWordStatus(word, "hidden")}
                          disabled={updatingWordId === word.id}
                          className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingWordId === word.id
                            ? "Оновлюю..."
                            : "Вимкнути"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateWordStatus(word, "active")}
                          disabled={updatingWordId === word.id}
                          className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingWordId === word.id
                            ? "Оновлюю..."
                            : "Увімкнути"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteWord(word)}
                        disabled={deletingWordId === word.id}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingWordId === word.id ? "Видаляю..." : "Видалити"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}