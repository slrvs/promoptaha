"use client";

import { getFriendlyErrorMessage } from "@/lib/friendlyError";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";
import LoginRequiredBox from "@/components/LoginRequiredBox";

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
  category_names?: string[] | null;
  category_slugs?: string[] | null;
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

type PromoComment = {
  id: string;
  promo_code_id: string;
  user_id: string;
  body: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ForbiddenWord = {
  id: string;
  word: string;
  severity?: string | null;
  status?: string | null;
};

type FavoriteRecord = {
  id: string;
  promo_code_id: string;
  user_id: string;
  created_at?: string | null;
};

type VoteRecord = {
  id: string;
  promo_code_id: string;
  user_id: string;
  vote_type: VoteType;
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

function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) return "";

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

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

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);
  const difference = target.getTime() - now.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getExpiryLabel(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) return "Без терміну";
  if (daysLeft < 0) return "Закінчився";
  if (daysLeft === 0) return "Сьогодні";
  if (daysLeft === 1) return "Завтра";

  return `${daysLeft} дн.`;
}

function getExpiryClass(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) {
    return "border-slate-700 bg-slate-900 text-slate-300";
  }

  if (daysLeft < 0) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (daysLeft <= 7) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
}

function getWorksPercent(worksCount: number, notWorksCount: number) {
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

function getProfileName(profile: UserProfile | null | undefined) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "ПромоПтаха"
  );
}

function getAvatarFallback(profile: UserProfile | null | undefined) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getSourceLabel(sourceType: string | null | undefined) {
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "telegram") return "Telegram";
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "website") return "Сайт";
  if (sourceType === "other") return "Інше";

  return sourceType || "Не вказано";
}

function getSocialLinks(profile: UserProfile | null) {
  if (!profile) return [];

  return [
    {
      label: "Сайт",
      href: profile.website_url,
    },
    {
      label: "Instagram",
      href: profile.instagram_url,
    },
    {
      label: "Telegram",
      href: profile.telegram_url,
    },
    {
      label: "TikTok",
      href: profile.tiktok_url,
    },
    {
      label: "YouTube",
      href: profile.youtube_url,
    },
  ].filter((link): link is { label: string; href: string } =>
    Boolean(link.href)
  );
}

export default function CodeDetailsClient({ promo }: CodeDetailsClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [authorApprovedPromos, setAuthorApprovedPromos] = useState(0);

  const [worksCount, setWorksCount] = useState(Number(promo.works_count || 0));
  const [notWorksCount, setNotWorksCount] = useState(
    Number(promo.not_works_count || 0)
  );
  const [myVote, setMyVote] = useState<VoteType | null>(null);

  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const [comments, setComments] = useState<PromoComment[]>([]);
  const [commentProfilesMap, setCommentProfilesMap] = useState<
    Map<string, UserProfile>
  >(new Map());
  const [forbiddenWords, setForbiddenWords] = useState<ForbiddenWord[]>([]);

  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  const [reportDescription, setReportDescription] = useState("");

  const [isLoadingExtra, setIsLoadingExtra] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const promoPath = `/codes/${promo.slug || promo.id}`;
  const sourceUrl = normalizeOptionalUrl(promo.source_url);
  const storeWebsiteUrl = store?.website_url || "";
  const worksPercent = getWorksPercent(worksCount, notWorksCount);
  const categoryNames = promo.all_category_names?.length
    ? promo.all_category_names
    : promo.category_name
      ? [promo.category_name]
      : [];

  const socialLinks = useMemo(() => {
    return getSocialLinks(authorProfile);
  }, [authorProfile]);

  async function loadExtraData() {
    setIsLoadingExtra(true);

    const { data: userData } = await supabase.auth.getUser();

    const currentUser = userData.user;

    setUser(currentUser);

    await Promise.all([
      loadStore(),
      loadAuthorProfileAndStats(),
      loadForbiddenWords(),
      loadComments(),
      currentUser ? loadMyVote(currentUser.id) : Promise.resolve(),
      currentUser ? loadFavorite(currentUser.id) : Promise.resolve(),
    ]);

    setIsLoadingExtra(false);
  }

  async function loadStore() {
    if (!promo.store_id) {
      setStore(null);
      return;
    }

    const { data, error } = await supabase
      .from("store_category_stats")
      .select("id, name, slug, website_url, category_names, category_slugs")
      .eq("id", promo.store_id)
      .maybeSingle();

    if (error) {
      setStore(null);
      return;
    }

    setStore((data as Store | null) || null);
  }

  async function loadAuthorProfileAndStats() {
    if (!promo.submitted_by) {
      setAuthorProfile(null);
      setAuthorApprovedPromos(0);
      return;
    }

    const [profileResult, approvedResult] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
        )
        .eq("id", promo.submitted_by)
        .maybeSingle(),

      supabase
        .from("promo_code_category_stats")
        .select("id")
        .eq("status", "approved")
        .eq("submitted_by", promo.submitted_by)
        .limit(5000),
    ]);

    if (!profileResult.error) {
      setAuthorProfile((profileResult.data as UserProfile | null) || null);
    }

    if (!approvedResult.error) {
      setAuthorApprovedPromos((approvedResult.data || []).length);
    }
  }

  async function loadForbiddenWords() {
    const { data, error } = await supabase
      .from("forbidden_words")
      .select("id, word, severity, status")
      .eq("status", "active")
      .eq("severity", "block");

    if (error) {
      setForbiddenWords([]);
      return;
    }

    setForbiddenWords((data || []) as ForbiddenWord[]);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("promo_comments")
      .select("id, promo_code_id, user_id, body, status, created_at, updated_at")
      .eq("promo_code_id", promo.id)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setComments([]);
      setCommentProfilesMap(new Map());
      return;
    }

    const nextComments = (data || []) as PromoComment[];

    setComments(nextComments);

    await loadCommentProfiles(nextComments);
  }

  async function loadCommentProfiles(nextComments: PromoComment[]) {
    const userIds = Array.from(
      new Set(
        nextComments
          .map((comment) => comment.user_id)
          .filter((userId): userId is string => Boolean(userId))
      )
    );

    if (userIds.length === 0) {
      setCommentProfilesMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
      )
      .in("id", userIds);

    if (error) {
      setCommentProfilesMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as UserProfile[]).map((profile) => [profile.id, profile])
    );

    setCommentProfilesMap(nextMap);
  }

  async function loadMyVote(userId: string) {
    const { data, error } = await supabase
      .from("promo_votes")
      .select("id, promo_code_id, user_id, vote_type")
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setMyVote(null);
      return;
    }

    const voteRecord = (data as VoteRecord | null) || null;

    setMyVote(voteRecord?.vote_type || null);
  }

  async function loadFavorite(userId: string) {
    const { data, error } = await supabase
      .from("promo_favorites")
      .select("id, promo_code_id, user_id, created_at")
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setFavoriteId(null);
      return;
    }

    const favorite = (data as FavoriteRecord | null) || null;

    setFavoriteId(favorite?.id || null);
  }

  useEffect(() => {
    loadExtraData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        loadMyVote(session.user.id);
        loadFavorite(session.user.id);
      } else {
        setMyVote(null);
        setFavoriteId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [promo.id]);

  function validateCommentBody(value: string) {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 2) {
      return "Коментар має містити хоча б 2 символи.";
    }

    if (trimmedValue.length > 1000) {
      return "Коментар завеликий. Максимум — 1000 символів.";
    }

    const lowerValue = trimmedValue.toLowerCase();

    const matchedWord = forbiddenWords.find((forbiddenWord) => {
      return lowerValue.includes(forbiddenWord.word.toLowerCase());
    });

    if (matchedWord) {
      return "Коментар містить заборонене слово.";
    }

    return "";
  }

  async function copyCode() {
    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(promo.code);
      setMessage(`Промокод ${promo.code} скопійовано.`);
      setMessageType("success");
    } catch {
      setMessage("Не вдалося скопіювати промокод.");
      setMessageType("error");
    }

    window.setTimeout(() => {
      setIsCopying(false);
    }, 700);
  }

  async function vote(nextVote: VoteType) {
    if (!user) {
      setMessage("Щоб голосувати, увійди в акаунт.");
      setMessageType("info");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    setMessage("");

    if (myVote === nextVote) {
      const { error } = await supabase
        .from("promo_votes")
        .delete()
        .eq("promo_code_id", promo.id)
        .eq("user_id", user.id);

      setIsVoting(false);

      if (error) {
        setMessage(
          `Не вдалося прибрати голос: ${getFriendlyErrorMessage(error)}`
        );
        setMessageType("error");
        return;
      }

      if (nextVote === "works") {
        setWorksCount((currentCount) => Math.max(0, currentCount - 1));
      } else {
        setNotWorksCount((currentCount) => Math.max(0, currentCount - 1));
      }

      setMyVote(null);
      setMessage("Голос прибрано.");
      setMessageType("success");
      return;
    }

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
      setMessage(`Не вдалося проголосувати: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    if (previousVote === "works") {
      setWorksCount((currentCount) => Math.max(0, currentCount - 1));
    }

    if (previousVote === "not_works") {
      setNotWorksCount((currentCount) => Math.max(0, currentCount - 1));
    }

    if (nextVote === "works") {
      setWorksCount((currentCount) => currentCount + 1);
    } else {
      setNotWorksCount((currentCount) => currentCount + 1);
    }

    setMyVote(nextVote);
    setMessage("Голос зараховано.");
    setMessageType("success");
  }

  async function toggleFavorite() {
    if (!user) {
      setMessage("Щоб зберігати промокоди, увійди в акаунт.");
      setMessageType("info");
      return;
    }

    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    setMessage("");

    if (favoriteId) {
      const { error } = await supabase
        .from("promo_favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user.id);

      setIsTogglingFavorite(false);

      if (error) {
        setMessage(
          `Не вдалося прибрати зі збережених: ${getFriendlyErrorMessage(
            error
          )}`
        );
        setMessageType("error");
        return;
      }

      setFavoriteId(null);
      setMessage("Промокод прибрано зі збережених.");
      setMessageType("success");
      return;
    }

    const { data, error } = await supabase
      .from("promo_favorites")
      .insert({
        promo_code_id: promo.id,
        user_id: user.id,
      })
      .select("id, promo_code_id, user_id, created_at")
      .single();

    setIsTogglingFavorite(false);

    if (error) {
      setMessage(
        `Не вдалося зберегти промокод: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    const favorite = data as FavoriteRecord;

    setFavoriteId(favorite.id);
    setMessage("Промокод додано до збережених.");
    setMessageType("success");
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Щоб надіслати репорт, увійди в акаунт.");
      setMessageType("info");
      return;
    }

    setIsReporting(true);
    setMessage("");

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promo.id,
      reported_by: user.id,
      description: reportDescription.trim() || null,
      status: "open",
    });

    setIsReporting(false);

    if (error) {
      setMessage(
        `Не вдалося надіслати репорт: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    setReportDescription("");
    setMessage("Репорт надіслано. Дякуємо за допомогу.");
    setMessageType("success");
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Щоб писати коментарі, увійди в акаунт.");
      setMessageType("info");
      return;
    }

    const validationError = validateCommentBody(commentBody);

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    setIsAddingComment(true);
    setMessage("");

    const { error } = await supabase.from("promo_comments").insert({
      promo_code_id: promo.id,
      user_id: user.id,
      body: commentBody.trim(),
      status: "visible",
    });

    setIsAddingComment(false);

    if (error) {
      setMessage(
        `Не вдалося додати коментар: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    setCommentBody("");
    await loadComments();

    setMessage("Коментар додано.");
    setMessageType("success");
  }

  function startEditComment(comment: PromoComment) {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingCommentBody("");
  }

  async function updateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !editingCommentId) return;

    const validationError = validateCommentBody(editingCommentBody);

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    setIsUpdatingComment(true);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .update({
        body: editingCommentBody.trim(),
        status: "visible",
      })
      .eq("id", editingCommentId)
      .eq("user_id", user.id);

    setIsUpdatingComment(false);

    if (error) {
      setMessage(
        `Не вдалося оновити коментар: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    cancelEditComment();
    await loadComments();

    setMessage("Коментар оновлено.");
    setMessageType("success");
  }

  async function deleteComment(comment: PromoComment) {
    if (!user) return;

    const confirmed = window.confirm("Видалити цей коментар?");

    if (!confirmed) return;

    setDeletingCommentId(comment.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", user.id);

    setDeletingCommentId(null);

    if (error) {
      setMessage(
        `Не вдалося видалити коментар: ${getFriendlyErrorMessage(error)}`
      );
      setMessageType("error");
      return;
    }

    await loadComments();

    setMessage("Коментар видалено.");
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
          <span className="text-slate-300">{promo.code}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-black ${getExpiryClass(
                    promo.expires_at
                  )}`}
                >
                  {getExpiryLabel(promo.expires_at)}
                </span>

                {promo.category_name && (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
                    {promo.category_name}
                  </span>
                )}
              </div>

              <h1 className="break-all text-6xl font-black tracking-tight md:text-8xl">
                {promo.code}
              </h1>

              <p className="mt-5 text-3xl font-black text-emerald-300">
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
                  disabled={isCopying}
                  className="rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCopying ? "Скопійовано" : "Копіювати код"}
                </button>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={isTogglingFavorite}
                  className={`rounded-full px-7 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    favoriteId
                      ? "bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                      : "border border-slate-700 text-slate-200 hover:border-yellow-300 hover:text-yellow-300"
                  }`}
                >
                  {favoriteId ? "★ Збережено" : "☆ Зберегти"}
                </button>

                {sourceUrl && (
                  <a
                    href={sourceUrl}
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
                    Магазин
                  </Link>
                )}
              </div>

              {!user && (
                <div className="mt-6">
                  <LoginRequiredBox
                    compact
                    title="Хочеш зберегти або перевірити код?"
                    description="Увійди, щоб додати промокод у збережені, проголосувати, написати коментар або надіслати репорт."
                    nextPath={promoPath}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <div className="flex items-center gap-4">
                  <StoreLogo
                    name={promo.store_name || store?.name || "Магазин"}
                    websiteUrl={storeWebsiteUrl}
                    size="md"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-500">Магазин</p>

                    {promo.store_slug ? (
                      <Link
                        href={`/stores/${promo.store_slug}`}
                        className="text-2xl font-black text-white transition hover:text-emerald-300"
                      >
                        {promo.store_name || store?.name || "Магазин"}
                      </Link>
                    ) : (
                      <p className="text-2xl font-black text-white">
                        {promo.store_name || store?.name || "Магазин"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-emerald-300">
                    {worksCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    працює
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-red-300">
                    {notWorksCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    не працює
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm font-bold text-slate-500">Надійність</p>
                <p className="mt-2 text-4xl font-black text-white">
                  {worksPercent === null ? "Немає" : `${worksPercent}%`}
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Перевірка</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Проголосуй, чи працює цей промокод.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => vote("works")}
                  disabled={isVoting}
                  className={`rounded-2xl border px-5 py-5 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    myVote === "works"
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                  }`}
                >
                  Працює
                </button>

                <button
                  type="button"
                  onClick={() => vote("not_works")}
                  disabled={isVoting}
                  className={`rounded-2xl border px-5 py-5 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    myVote === "not_works"
                      ? "border-red-400 bg-red-400 text-slate-950"
                      : "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                  }`}
                >
                  Не працює
                </button>
              </div>

              {!user && (
                <div className="mt-4">
                  <LoginRequiredBox
                    compact
                    title="Хочеш проголосувати?"
                    description="Увійди, щоб позначити, працює промокод чи ні. Так ти допоможеш іншим користувачам."
                    nextPath={promoPath}
                  />
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Автор</h2>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 text-2xl font-black text-emerald-300">
                  {authorProfile?.avatar_url ? (
                    <img
                      src={authorProfile.avatar_url}
                      alt={getProfileName(authorProfile)}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getAvatarFallback(authorProfile)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  {authorProfile?.username ? (
                    <Link
                      href={`/u/${authorProfile.username}`}
                      className="break-words text-2xl font-black text-white transition hover:text-emerald-300"
                    >
                      {getProfileName(authorProfile)}
                    </Link>
                  ) : (
                    <p className="break-words text-2xl font-black text-white">
                      {getProfileName(authorProfile)}
                    </p>
                  )}

                  {authorProfile?.username && (
                    <p className="mt-1 text-sm font-bold text-emerald-300">
                      @{authorProfile.username}
                    </p>
                  )}

                  {promo.submitted_by && (
                    <div className="mt-3">
                      <UserLevelBadge
                        approvedPromos={authorApprovedPromos}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {authorProfile?.bio && (
                <p className="mt-5 line-clamp-4 leading-7 text-slate-400">
                  {authorProfile.bio}
                </p>
              )}

              {socialLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Деталі</h2>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">Діє до</p>
                  <p className="mt-1 font-black text-slate-200">
                    {formatDate(promo.expires_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">Джерело</p>
                  <p className="mt-1 font-black text-slate-200">
                    {getSourceLabel(promo.source_type)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">Додано</p>
                  <p className="mt-1 font-black text-slate-200">
                    {formatDateTime(promo.created_at)}
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <section className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Коментарі</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Додай уточнення, умови використання або свій досвід.
              </p>

              {user ? (
                <form onSubmit={addComment} className="mt-6 grid gap-4">
                  <textarea
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    rows={4}
                    placeholder="Напиши коментар..."
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <button
                    type="submit"
                    disabled={isAddingComment}
                    className="w-fit rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingComment ? "Додаю..." : "Додати коментар"}
                  </button>
                </form>
              ) : (
                <div className="mt-6">
                  <LoginRequiredBox
                    title="Хочеш написати коментар?"
                    description="Увійди, щоб додати уточнення, поділитися досвідом або написати умови використання промокоду."
                    nextPath={promoPath}
                  />
                </div>
              )}

              {isLoadingExtra ? (
                <div className="mt-6 h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-950" />
              ) : comments.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <div className="text-5xl">💬</div>

                  <h3 className="mt-4 text-2xl font-black">
                    Коментарів поки немає
                  </h3>

                  <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                    Будь першим, хто додасть уточнення.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {comments.map((comment) => {
                    const commentProfile = commentProfilesMap.get(
                      comment.user_id
                    );
                    const isOwnComment = user?.id === comment.user_id;
                    const isEditing = editingCommentId === comment.id;

                    return (
                      <article
                        key={comment.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
                              {commentProfile?.avatar_url ? (
                                <img
                                  src={commentProfile.avatar_url}
                                  alt={getProfileName(commentProfile)}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span>
                                  {getAvatarFallback(commentProfile)}
                                </span>
                              )}
                            </div>

                            <div>
                              {commentProfile?.username ? (
                                <Link
                                  href={`/u/${commentProfile.username}`}
                                  className="font-black text-emerald-300 transition hover:text-emerald-200"
                                >
                                  {getProfileName(commentProfile)}
                                </Link>
                              ) : (
                                <p className="font-black text-slate-300">
                                  {getProfileName(commentProfile)}
                                </p>
                              )}

                              <p className="mt-1 text-xs font-bold text-slate-500">
                                {formatDateTime(comment.created_at)}
                              </p>
                            </div>
                          </div>

                          {isOwnComment && !isEditing && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEditComment(comment)}
                                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                              >
                                Редагувати
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteComment(comment)}
                                disabled={deletingCommentId === comment.id}
                                className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingCommentId === comment.id
                                  ? "Видаляю..."
                                  : "Видалити"}
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <form
                            onSubmit={updateComment}
                            className="mt-4 grid gap-3"
                          >
                            <textarea
                              value={editingCommentBody}
                              onChange={(event) =>
                                setEditingCommentBody(event.target.value)
                              }
                              rows={4}
                              className="resize-none rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="submit"
                                disabled={isUpdatingComment}
                                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingComment
                                  ? "Зберігаю..."
                                  : "Зберегти"}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditComment}
                                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                              >
                                Скасувати
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                            {comment.body}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Репорт</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Повідом, якщо код не працює, має неправильний опис або сумнівне
                джерело.
              </p>

              {user ? (
                <form onSubmit={submitReport} className="mt-6 grid gap-4">
                  <textarea
                    value={reportDescription}
                    onChange={(event) =>
                      setReportDescription(event.target.value)
                    }
                    rows={4}
                    placeholder="Що саме не так?"
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400"
                  />

                  <button
                    type="submit"
                    disabled={isReporting}
                    className="w-fit rounded-full border border-red-400/40 px-6 py-4 font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isReporting ? "Надсилаю..." : "Надіслати репорт"}
                  </button>
                </form>
              ) : (
                <div className="mt-6">
                  <LoginRequiredBox
                    title="Хочеш надіслати репорт?"
                    description="Увійди, щоб повідомити про неправильний опис, неробочий код або сумнівне джерело."
                    nextPath={promoPath}
                  />
                </div>
              )}
            </section>

            {categoryNames.length > 0 && (
              <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-3xl font-black">Категорії</h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {categoryNames.map((categoryName) => (
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
        </section>
      </section>
    </main>
  );
}