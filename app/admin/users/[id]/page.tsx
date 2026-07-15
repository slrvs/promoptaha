"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";

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

type PromoCode = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  category_id?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
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

type FavoriteRecord = {
  id: string;
  promo_code_id: string;
  user_id: string;
  created_at?: string | null;
};

type FavoritePromo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  category_name?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  description?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type StoreRequest = {
  id: string;
  store_name?: string | null;
  name?: string | null;
  website_url?: string | null;
  url?: string | null;
  description?: string | null;
  comment?: string | null;
  status?: string | null;
  created_store_id?: string | null;
  created_at?: string | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  website_url?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const adminEmail = "jchameleonl96@gmail.com";

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

function getProfileName(profile: UserProfile | null) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.email ||
    "Користувач"
  );
}

function getAvatarFallback(profile: UserProfile | null) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getPromoStatusLabel(status: string | null | undefined) {
  if (status === "approved") return "Схвалено";
  if (status === "pending") return "На модерації";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getPromoStatusClass(status: string | null | undefined) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-slate-700 bg-slate-950 text-slate-300";
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

function getRequestStatusLabel(status: string | null | undefined) {
  if (status === "approved") return "Схвалено";
  if (status === "pending") return "На розгляді";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getRequestName(request: StoreRequest) {
  return request.store_name || request.name || "Магазин без назви";
}

function getRequestUrl(request: StoreRequest) {
  return request.website_url || request.url || "";
}

function getRequestDescription(request: StoreRequest) {
  return request.description || request.comment || "";
}

function getWorksPercent(promo: FavoritePromo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
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

export default function AdminUserDetailsPage() {
  const params = useParams<{ id: string }>();
  const targetIdentifier = decodeURIComponent(params.id || "");

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [comments, setComments] = useState<PromoComment[]>([]);
  const [commentPromosMap, setCommentPromosMap] = useState<
    Map<string, FavoritePromo>
  >(new Map());
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritePromos, setFavoritePromos] = useState<FavoritePromo[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(
    null
  );
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = authUser?.email === adminEmail;

  const storesMap = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const stats = useMemo(() => {
    return {
      promosTotal: promos.length,
      promosApproved: promos.filter((promo) => promo.status === "approved")
        .length,
      promosPending: promos.filter((promo) => promo.status === "pending")
        .length,
      promosRejected: promos.filter((promo) => promo.status === "rejected")
        .length,
      commentsTotal: comments.length,
      commentsVisible: comments.filter((comment) => comment.status === "visible")
        .length,
      commentsHidden: comments.filter((comment) => comment.status === "hidden")
        .length,
      favoritesTotal: favoriteRecords.length,
      storeRequestsTotal: storeRequests.length,
    };
  }, [promos, comments, favoriteRecords, storeRequests]);

  async function loadAdminPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    setAuthUser(userData.user);

    if (!userData.user || userData.user.email !== adminEmail) {
      setIsLoading(false);
      return;
    }

    const loadedProfile = await loadProfile();

    if (!loadedProfile) {
      setIsLoading(false);
      return;
    }

    await Promise.all([
      loadReferenceData(),
      loadPromos(loadedProfile.id),
      loadComments(loadedProfile.id),
      loadFavorites(loadedProfile.id),
      loadStoreRequests(loadedProfile.id),
    ]);

    setIsLoading(false);
  }

  async function loadProfile() {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetIdentifier
      );

    const query = supabase
      .from("profiles")
      .select(
        "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
      );

    const { data, error } = isUuid
      ? await query.eq("id", targetIdentifier).maybeSingle()
      : await query.eq("username", targetIdentifier).maybeSingle();

    if (error) {
      setProfile(null);
      setMessage(`Не вдалося завантажити профіль: ${error.message}`);
      setMessageType("error");
      return null;
    }

    const loadedProfile = (data as UserProfile | null) || null;

    setProfile(loadedProfile);

    if (!loadedProfile) {
      setMessage("Користувача не знайдено.");
      setMessageType("error");
      return null;
    }

    return loadedProfile;
  }

  async function loadReferenceData() {
    const [storesResult, categoriesResult] = await Promise.all([
      supabase
        .from("store_category_stats")
        .select("id, name, slug, website_url")
        .order("name", { ascending: true })
        .limit(1000),

      supabase
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true })
        .limit(300),
    ]);

    if (!storesResult.error) {
      setStores((storesResult.data || []) as Store[]);
    }

    if (!categoriesResult.error) {
      setCategories((categoriesResult.data || []) as Category[]);
    }
  }

  async function loadPromos(userId: string) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, rejection_reason, created_at"
      )
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setPromos([]);
      return;
    }

    setPromos((data || []) as PromoCode[]);
  }

  async function loadComments(userId: string) {
    const { data, error } = await supabase
      .from("promo_comments")
      .select("id, promo_code_id, user_id, body, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setComments([]);
      return;
    }

    const nextComments = (data || []) as PromoComment[];

    setComments(nextComments);

    const promoIds = Array.from(
      new Set(
        nextComments
          .map((comment) => comment.promo_code_id)
          .filter((promoId): promoId is string => Boolean(promoId))
      )
    );

    await loadCommentPromos(promoIds);
  }

  async function loadCommentPromos(promoIds: string[]) {
    if (promoIds.length === 0) {
      setCommentPromosMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, category_name, discount_value, expires_at, description, works_count, not_works_count"
      )
      .in("id", promoIds);

    if (error) {
      setCommentPromosMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as FavoritePromo[]).map((promo) => [promo.id, promo])
    );

    setCommentPromosMap(nextMap);
  }

  async function loadFavorites(userId: string) {
    const { data: favoritesData, error: favoritesError } = await supabase
      .from("promo_favorites")
      .select("id, promo_code_id, user_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (favoritesError) {
      setFavoriteRecords([]);
      setFavoritePromos([]);
      return;
    }

    const nextFavoriteRecords = (favoritesData || []) as FavoriteRecord[];

    setFavoriteRecords(nextFavoriteRecords);

    const promoIds = nextFavoriteRecords.map(
      (favorite) => favorite.promo_code_id
    );

    if (promoIds.length === 0) {
      setFavoritePromos([]);
      return;
    }

    const { data: promosData, error: promosError } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, category_name, discount_value, expires_at, description, works_count, not_works_count"
      )
      .in("id", promoIds);

    if (promosError) {
      setFavoritePromos([]);
      return;
    }

    const promos = (promosData || []) as FavoritePromo[];
    const promosMap = new Map(promos.map((promo) => [promo.id, promo]));

    setFavoritePromos(
      nextFavoriteRecords
        .map((favorite) => promosMap.get(favorite.promo_code_id))
        .filter((promo): promo is FavoritePromo => Boolean(promo))
    );
  }

  async function loadStoreRequests(userId: string) {
    const { data, error } = await supabase
      .from("store_requests")
      .select("*")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setStoreRequests([]);
      return;
    }

    setStoreRequests((data || []) as StoreRequest[]);
  }

  useEffect(() => {
    loadAdminPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [targetIdentifier]);

  async function updateCommentStatus(
    comment: PromoComment,
    nextStatus: "visible" | "hidden"
  ) {
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

  if (!authUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-4xl font-black">Потрібен вхід</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Щоб відкрити адмін-профіль користувача, потрібно увійти.
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

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">👤</div>

          <h1 className="mt-5 text-4xl font-black">
            Користувача не знайдено
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            Перевір ID або username у посиланні.
          </p>

          <Link
            href="/admin/users"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            До списку користувачів
          </Link>
        </section>
      </main>
    );
  }

  const socialLinks = getSocialLinks(profile);

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

          <Link href="/admin/users" className="hover:text-emerald-300">
            Користувачі
          </Link>

          <span>/</span>
          <span className="text-slate-300">{getProfileName(profile)}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Адмін-профіль користувача
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-950 text-5xl font-black text-emerald-300">
                  {profile.avatar_url ? (
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
                  <div className="mb-3 flex flex-wrap gap-2">
                    <UserLevelBadge
                      approvedPromos={stats.promosApproved}
                      size="sm"
                    />

                    {profile.username && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                        @{profile.username}
                      </span>
                    )}
                  </div>

                  <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                    {getProfileName(profile)}
                  </h1>

                  <p className="mt-3 break-all text-sm font-bold text-slate-500">
                    {profile.email || "email не вказано"}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  {profile.bio}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {profile.username && (
                  <Link
                    href={`/u/${profile.username}`}
                    className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Публічний профіль
                  </Link>
                )}

                <Link
                  href="/admin/users"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  До користувачів
                </Link>

                <Link
                  href="/admin"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-yellow-300 hover:text-yellow-300"
                >
                  Модерація
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.promosTotal}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.promosApproved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалено
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.commentsTotal}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  коментарів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.favoritesTotal}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  збережень
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
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Дані профілю</h2>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-bold text-slate-500">ID</p>
                <p className="mt-1 break-all font-black text-slate-200">
                  {profile.id}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-bold text-slate-500">Створено</p>
                <p className="mt-1 font-black text-slate-200">
                  {formatDateTime(profile.created_at)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-bold text-slate-500">Оновлено</p>
                <p className="mt-1 font-black text-slate-200">
                  {formatDateTime(profile.updated_at)}
                </p>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-black">Посилання</h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Зведення активності</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-2xl font-black text-yellow-300">
                  {stats.promosPending}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  на модерації
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-2xl font-black text-red-300">
                  {stats.promosRejected}
                </p>
                <p className="text-xs font-bold text-slate-500">відхилено</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-2xl font-black text-emerald-300">
                  {stats.commentsVisible}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  видимих коментарів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-2xl font-black text-red-300">
                  {stats.commentsHidden}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  прихованих коментарів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-2xl font-black text-white">
                  {stats.storeRequestsTotal}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  заявок магазинів
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Промокоди користувача</h2>

          {promos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🎟️</div>
              <h3 className="mt-4 text-2xl font-black">Промокодів немає</h3>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              {promos.map((promo) => {
                const store = promo.store_id
                  ? storesMap.get(promo.store_id)
                  : null;
                const category = promo.category_id
                  ? categoriesMap.get(promo.category_id)
                  : null;

                return (
                  <article
                    key={promo.id}
                    className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                              promo.status
                            )}`}
                          >
                            {getPromoStatusLabel(promo.status)}
                          </span>

                          {store && (
                            <Link
                              href={`/stores/${store.slug}`}
                              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              {store.name}
                            </Link>
                          )}

                          {category && (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                              {category.name}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 break-all text-3xl font-black text-white">
                          {promo.code}
                        </h3>

                        <p className="mt-3 text-xl font-black text-emerald-300">
                          {promo.discount_value || "Знижка не вказана"}
                        </p>
                      </div>

                      {promo.status === "approved" && (
                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити
                        </Link>
                      )}
                    </div>

                    {promo.status === "rejected" &&
                      promo.rejection_reason?.trim() && (
                        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
                          <p className="text-sm font-black text-red-300">
                            Причина відхилення
                          </p>

                          <p className="mt-2 whitespace-pre-wrap leading-7 text-red-100">
                            {promo.rejection_reason}
                          </p>
                        </div>
                      )}

                    {promo.description && (
                      <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Діє до
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Джерело
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {promo.source_type || "Не вказано"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Додано
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          {formatDateTime(promo.created_at)}
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
                            Джерело
                          </p>
                          <p className="mt-1 font-black text-emerald-300">
                            Відкрити
                          </p>
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-3xl font-black">Коментарі користувача</h2>

            {comments.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">💬</div>
                <h3 className="mt-4 text-2xl font-black">Коментарів немає</h3>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {comments.map((comment) => {
                  const promo = commentPromosMap.get(comment.promo_code_id);

                  return (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getCommentStatusClass(
                            comment.status
                          )}`}
                        >
                          {comment.status === "visible"
                            ? "Видимий"
                            : comment.status === "hidden"
                              ? "Прихований"
                              : comment.status || "Невідомо"}
                        </span>

                        <p className="text-xs font-bold text-slate-500">
                          {formatDateTime(comment.created_at)}
                        </p>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                        {comment.body}
                      </p>

                      {promo && (
                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            До промокоду
                          </p>

                          <Link
                            href={`/codes/${promo.slug || promo.id}`}
                            className="mt-1 inline-flex break-all font-black text-emerald-300 transition hover:text-emerald-200"
                          >
                            {promo.code}
                          </Link>

                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {promo.store_name || "Магазин"}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        {comment.status === "visible" ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateCommentStatus(comment, "hidden")
                            }
                            disabled={updatingCommentId === comment.id}
                            className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                          className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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
            <h2 className="text-3xl font-black">Збережені промокоди</h2>

            {favoritePromos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                <div className="text-5xl">⭐</div>
                <h3 className="mt-4 text-2xl font-black">Збережень немає</h3>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {favoritePromos.map((promo) => {
                  const store = promo.store_id
                    ? storesMap.get(promo.store_id)
                    : null;
                  const worksPercent = getWorksPercent(promo);

                  return (
                    <article
                      key={promo.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <StoreLogo
                          name={promo.store_name || store?.name || "Магазин"}
                          websiteUrl={store?.website_url}
                          size="sm"
                        />

                        <div className="min-w-0">
                          <Link
                            href={`/codes/${promo.slug || promo.id}`}
                            className="break-all text-2xl font-black text-white transition hover:text-emerald-300"
                          >
                            {promo.code}
                          </Link>

                          <p className="mt-1 text-sm font-black text-emerald-300">
                            {promo.store_name || store?.name || "Магазин"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Діє до
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {formatDate(promo.expires_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Надійність
                          </p>
                          <p className="mt-1 font-black text-slate-200">
                            {worksPercent === null
                              ? "Немає"
                              : `${worksPercent}%`}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Заявки магазинів</h2>

          {storeRequests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🏪</div>
              <h3 className="mt-4 text-2xl font-black">Заявок немає</h3>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {storeRequests.map((request) => {
                const linkedStore = request.created_store_id
                  ? storesMap.get(request.created_store_id)
                  : null;

                return (
                  <article
                    key={request.id}
                    className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                          request.status
                        )}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl font-black text-white">
                      {getRequestName(request)}
                    </h3>

                    {getRequestUrl(request) && (
                      <p className="mt-2 break-all text-sm font-black text-emerald-300">
                        {getRequestUrl(request)}
                      </p>
                    )}

                    {getRequestDescription(request) && (
                      <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                        {getRequestDescription(request)}
                      </p>
                    )}

                    <p className="mt-4 text-sm font-bold text-slate-500">
                      Створено: {formatDate(request.created_at)}
                    </p>

                    {linkedStore && (
                      <Link
                        href={`/stores/${linkedStore.slug}`}
                        className="mt-5 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        Відкрити магазин
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}