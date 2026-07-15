"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
import UserLevelBadge from "@/components/UserLevelBadge";
import UserLevelProgress from "@/components/UserLevelProgress";
import StoreLogo from "@/components/StoreLogo";

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

type UserPromo = {
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
  submitted_by?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
};

type UserComment = {
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
  created_at?: string | null;
};

type RelatedPromo = {
  id: string;
  slug?: string | null;
  code?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
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
  category_id?: string | null;
  category_names?: string[] | null;
  category_slugs?: string[] | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

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
  if (!date) return "Не вказано";

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
    profile?.email?.split("@")[0] ||
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

  return "border-slate-700 bg-slate-900 text-slate-300";
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
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

function getRequestStatusLabel(status: string | null | undefined) {
  if (status === "approved") return "Схвалено";
  if (status === "pending") return "На розгляді";
  if (status === "rejected") return "Відхилено";

  return status || "Невідомо";
}

function getRequestName(request: StoreRequest) {
  return request.store_name || request.name || "Магазин";
}

function getRequestUrl(request: StoreRequest) {
  return request.website_url || request.url || "";
}

function getRequestDescription(request: StoreRequest) {
  return request.description || request.comment || "";
}

function getStoreName(
  storesMap: Map<string, Store>,
  storeId: string | null | undefined
) {
  if (!storeId) return "Магазин";

  return storesMap.get(storeId)?.name || "Магазин";
}

function getStoreSlug(
  storesMap: Map<string, Store>,
  storeId: string | null | undefined
) {
  if (!storeId) return null;

  return storesMap.get(storeId)?.slug || null;
}

function getStoreWebsite(
  storesMap: Map<string, Store>,
  storeId: string | null | undefined
) {
  if (!storeId) return null;

  return storesMap.get(storeId)?.website_url || null;
}

function getCategoryName(
  categoriesMap: Map<string, Category>,
  categoryId: string | null | undefined
) {
  if (!categoryId) return null;

  return categoriesMap.get(categoryId)?.name || null;
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
  const profileIdentifier = decodeURIComponent(params.id || "");

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [promos, setPromos] = useState<UserPromo[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritePromos, setFavoritePromos] = useState<FavoritePromo[]>([]);
  const [relatedPromosMap, setRelatedPromosMap] = useState<
    Map<string, RelatedPromo>
  >(new Map());
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingCommentId, setIsUpdatingCommentId] = useState<string | null>(
    null
  );
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const profileName = getProfileName(profile);
  const socialLinks = getSocialLinks(profile);

  const storesMap = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const approvedPromosCount = useMemo(() => {
    return promos.filter((promo) => promo.status === "approved").length;
  }, [promos]);

  const pendingPromosCount = useMemo(() => {
    return promos.filter((promo) => promo.status === "pending").length;
  }, [promos]);

  const rejectedPromosCount = useMemo(() => {
    return promos.filter((promo) => promo.status === "rejected").length;
  }, [promos]);

  const visibleCommentsCount = useMemo(() => {
    return comments.filter((comment) => comment.status === "visible").length;
  }, [comments]);

  const hiddenCommentsCount = useMemo(() => {
    return comments.filter((comment) => comment.status === "hidden").length;
  }, [comments]);

  async function loadAdminUserPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setAuthUser(currentUser);

    const currentIsAdmin = currentUser?.email === adminEmail;

    setIsAdmin(currentIsAdmin);

    if (!currentUser || !currentIsAdmin) {
      setIsLoading(false);
      return;
    }

    const [profileResult] = await Promise.all([
      loadTargetProfile(profileIdentifier),
      loadReferenceData(),
    ]);

    if (!profileResult) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setProfile(profileResult);

    await loadUserData(profileResult.id);

    setIsLoading(false);
  }

  async function loadTargetProfile(identifier: string) {
    const selectFields =
      "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at";

    if (isUuid(identifier)) {
      const { data, error } = await supabase
        .from("profiles")
        .select(selectFields)
        .eq("id", identifier)
        .maybeSingle();

      if (error) {
        setMessage(`Не вдалося завантажити профіль: ${error.message}`);
        setMessageType("error");
        return null;
      }

      return (data as UserProfile | null) || null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(selectFields)
      .ilike("username", identifier)
      .maybeSingle();

    if (error) {
      setMessage(`Не вдалося завантажити профіль: ${error.message}`);
      setMessageType("error");
      return null;
    }

    return (data as UserProfile | null) || null;
  }

  async function loadReferenceData() {
    const [storesResult, categoriesResult] = await Promise.all([
      supabase
        .from("store_category_stats")
        .select(
          "id, name, slug, website_url, category_id, category_names, category_slugs"
        )
        .order("name", { ascending: true })
        .limit(1000),

      supabase
        .from("categories")
        .select("id, name, slug, status")
        .order("name", { ascending: true })
        .limit(300),
    ]);

    setStores(storesResult.error ? [] : ((storesResult.data || []) as Store[]));
    setCategories(
      categoriesResult.error ? [] : ((categoriesResult.data || []) as Category[])
    );
  }

  async function loadUserData(userId: string) {
    await Promise.all([
      loadUserPromos(userId),
      loadUserComments(userId),
      loadUserFavorites(userId),
      loadUserStoreRequests(userId),
    ]);
  }

  async function loadUserPromos(userId: string) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, submitted_by, rejection_reason, created_at"
      )
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setPromos([]);
      return;
    }

    setPromos((data || []) as UserPromo[]);
  }

  async function loadUserComments(userId: string) {
    const { data, error } = await supabase
      .from("promo_comments")
      .select("id, promo_code_id, user_id, body, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setComments([]);
      setRelatedPromosMap(new Map());
      return;
    }

    const nextComments = (data || []) as UserComment[];

    setComments(nextComments);

    await loadRelatedPromos(nextComments);
  }

  async function loadRelatedPromos(nextComments: UserComment[]) {
    const promoIds = Array.from(
      new Set(
        nextComments
          .map((comment) => comment.promo_code_id)
          .filter((promoId): promoId is string => Boolean(promoId))
      )
    );

    if (promoIds.length === 0) {
      setRelatedPromosMap(new Map());
      return;
    }

    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select("id, slug, code, store_name, store_slug")
      .in("id", promoIds);

    if (error) {
      setRelatedPromosMap(new Map());
      return;
    }

    const nextMap = new Map(
      ((data || []) as RelatedPromo[]).map((promo) => [promo.id, promo])
    );

    setRelatedPromosMap(nextMap);
  }

  async function loadUserFavorites(userId: string) {
    const { data, error } = await supabase
      .from("promo_favorites")
      .select("id, promo_code_id, user_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setFavoriteRecords([]);
      setFavoritePromos([]);
      return;
    }

    const records = (data || []) as FavoriteRecord[];

    setFavoriteRecords(records);

    const promoIds = records.map((record) => record.promo_code_id);

    if (promoIds.length === 0) {
      setFavoritePromos([]);
      return;
    }

    const { data: promosData, error: promosError } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, category_name, discount_value, expires_at, description, works_count, not_works_count, created_at"
      )
      .in("id", promoIds);

    if (promosError) {
      setFavoritePromos([]);
      return;
    }

    const nextPromos = (promosData || []) as FavoritePromo[];
    const promosMap = new Map(nextPromos.map((promo) => [promo.id, promo]));

    const orderedPromos = records
      .map((record) => promosMap.get(record.promo_code_id))
      .filter((promo): promo is FavoritePromo => Boolean(promo));

    setFavoritePromos(orderedPromos);
  }

  async function loadUserStoreRequests(userId: string) {
    const { data, error } = await supabase
      .from("store_requests")
      .select("*")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setStoreRequests([]);
      return;
    }

    setStoreRequests((data || []) as StoreRequest[]);
  }

  useEffect(() => {
    loadAdminUserPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setAuthUser(nextUser);
      setIsAdmin(nextUser?.email === adminEmail);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [profileIdentifier]);

  async function updateCommentStatus(
    comment: UserComment,
    nextStatus: "visible" | "hidden"
  ) {
    if (!profile) return;

    setIsUpdatingCommentId(comment.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .update({
        status: nextStatus,
      })
      .eq("id", comment.id);

    setIsUpdatingCommentId(null);

    if (error) {
      setMessage(`Не вдалося оновити коментар: ${error.message}`);
      setMessageType("error");
      return;
    }

    await loadUserComments(profile.id);

    setMessage("Статус коментаря оновлено.");
    setMessageType("success");
  }

  async function deleteComment(comment: UserComment) {
    if (!profile) return;

    const confirmed = window.confirm("Видалити цей коментар назавжди?");

    if (!confirmed) return;

    setIsDeletingCommentId(comment.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_comments")
      .delete()
      .eq("id", comment.id);

    setIsDeletingCommentId(null);

    if (error) {
      setMessage(`Не вдалося видалити коментар: ${error.message}`);
      setMessageType("error");
      return;
    }

    await loadUserComments(profile.id);

    setMessage("Коментар видалено.");
    setMessageType("success");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[420px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 h-96 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!authUser || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
          <div className="text-6xl">🔒</div>

          <h1 className="mt-5 text-4xl font-black">Немає доступу</h1>

          <p className="mt-4 leading-7 text-red-100">
            Ця сторінка доступна тільки адміну.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
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
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">👤</div>

          <h1 className="mt-5 text-4xl font-black">
            Користувача не знайдено
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            Не вдалося знайти профіль за адресою{" "}
            <span className="font-black text-slate-200">
              {profileIdentifier}
            </span>
            .
          </p>

          <Link
            href="/admin/users"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Назад до користувачів
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

          <Link href="/admin/users" className="hover:text-emerald-300">
            Адмін: користувачі
          </Link>

          <span>/</span>
          <span className="text-slate-300">{profileName}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-yellow-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-yellow-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Адмін-профіль користувача
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-950 text-5xl font-black text-emerald-300">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profileName}
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
                      approvedPromos={approvedPromosCount}
                      size="md"
                    />

                    {profile.username && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">
                        @{profile.username}
                      </span>
                    )}
                  </div>

                  <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                    {profileName}
                  </h1>

                  <p className="mt-3 text-sm font-bold text-slate-500">
                    {profile.email || "Email не вказано"}
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
                  До всіх користувачів
                </Link>

                <Link
                  href="/admin/comments"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Коментарі
                </Link>

                <Link
                  href="/admin"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Модерація
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-emerald-300">
                    {approvedPromosCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    схвалених кодів
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-yellow-300">
                    {pendingPromosCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    на модерації
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-red-300">
                    {rejectedPromosCount}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    відхилено
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                  <p className="text-4xl font-black text-white">
                    {favoriteRecords.length}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    збережено
                  </p>
                </div>
              </div>

              <UserLevelProgress approvedPromos={approvedPromosCount} />
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
              <h2 className="text-3xl font-black">Дані профілю</h2>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">ID</p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-300">
                    {profile.id}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">Email</p>
                  <p className="mt-1 break-all font-black text-slate-200">
                    {profile.email || "Не вказано"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">
                    Створено
                  </p>
                  <p className="mt-1 font-black text-slate-200">
                    {formatDateTime(profile.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-bold text-slate-500">
                    Оновлено
                  </p>
                  <p className="mt-1 font-black text-slate-200">
                    {formatDateTime(profile.updated_at)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Активність</h2>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-black text-white">
                    {promos.length}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    всього промокодів
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-black text-emerald-300">
                    {visibleCommentsCount}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    видимих коментарів
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-black text-yellow-300">
                    {hiddenCommentsCount}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    прихованих коментарів
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-black text-white">
                    {storeRequests.length}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    заявок магазинів
                  </p>
                </div>
              </div>
            </section>

            {socialLinks.length > 0 && (
              <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-3xl font-black">Соцмережі</h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={normalizeOptionalUrl(link.href)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <section className="grid gap-8">
            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Промокоди користувача</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Усі промокоди, які користувач додав на сайт.
              </p>

              {promos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <div className="text-5xl">🎟️</div>

                  <h3 className="mt-4 text-2xl font-black">
                    Промокодів немає
                  </h3>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {promos.map((promo) => {
                    const storeName = getStoreName(storesMap, promo.store_id);
                    const storeSlug = getStoreSlug(storesMap, promo.store_id);
                    const storeWebsite = getStoreWebsite(
                      storesMap,
                      promo.store_id
                    );
                    const categoryName = getCategoryName(
                      categoriesMap,
                      promo.category_id
                    );

                    return (
                      <article
                        key={promo.id}
                        className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div className="flex min-w-0 items-start gap-4">
                            <StoreLogo
                              name={storeName}
                              websiteUrl={storeWebsite}
                              size="sm"
                            />

                            <div className="min-w-0">
                              <p className="break-all text-3xl font-black text-white">
                                {promo.code}
                              </p>

                              <p className="mt-2 text-xl font-black text-emerald-300">
                                {promo.discount_value || "Знижка не вказана"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                                    promo.status
                                  )}`}
                                >
                                  {getPromoStatusLabel(promo.status)}
                                </span>

                                {storeSlug ? (
                                  <Link
                                    href={`/stores/${storeSlug}`}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                                  >
                                    {storeName}
                                  </Link>
                                ) : (
                                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                    {storeName}
                                  </span>
                                )}

                                {categoryName && (
                                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                    {categoryName}
                                  </span>
                                )}

                                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                  {formatDate(promo.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {promo.status === "approved" && (
                              <Link
                                href={`/codes/${promo.slug || promo.id}`}
                                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                              >
                                Відкрити
                              </Link>
                            )}

                            <Link
                              href="/admin"
                              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Модерація
                            </Link>
                          </div>
                        </div>

                        {promo.description && (
                          <p className="mt-4 leading-7 text-slate-400">
                            {promo.description}
                          </p>
                        )}

                        {promo.source_url && (
                          <a
                            href={normalizeOptionalUrl(promo.source_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex text-sm font-black text-emerald-300 transition hover:text-emerald-200"
                          >
                            Джерело
                          </a>
                        )}

                        {promo.status === "rejected" &&
                          promo.rejection_reason && (
                            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
                              <p className="font-black text-red-300">
                                Причина відхилення
                              </p>

                              <p className="mt-2 leading-7 text-red-100">
                                {promo.rejection_reason}
                              </p>
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Коментарі користувача</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Коментарі, які користувач залишав під промокодами.
              </p>

              {comments.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <div className="text-5xl">💬</div>

                  <h3 className="mt-4 text-2xl font-black">
                    Коментарів немає
                  </h3>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {comments.map((comment) => {
                    const relatedPromo = relatedPromosMap.get(
                      comment.promo_code_id
                    );

                    return (
                      <article
                        key={comment.id}
                        className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getCommentStatusClass(
                                  comment.status
                                )}`}
                              >
                                {getCommentStatusLabel(comment.status)}
                              </span>

                              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                {formatDateTime(comment.created_at)}
                              </span>
                            </div>

                            {relatedPromo && (
                              <div className="mt-4">
                                <p className="text-sm font-bold text-slate-500">
                                  Промокод
                                </p>

                                <Link
                                  href={`/codes/${
                                    relatedPromo.slug || relatedPromo.id
                                  }`}
                                  className="mt-1 inline-flex break-all text-xl font-black text-emerald-300 transition hover:text-emerald-200"
                                >
                                  {relatedPromo.code || "Промокод"}
                                </Link>

                                {relatedPromo.store_name && (
                                  <p className="mt-1 text-sm font-bold text-slate-500">
                                    {relatedPromo.store_name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {comment.status !== "hidden" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCommentStatus(comment, "hidden")
                                }
                                disabled={isUpdatingCommentId === comment.id}
                                className="rounded-full border border-yellow-400/40 px-4 py-2 text-xs font-black text-yellow-300 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingCommentId === comment.id
                                  ? "Оновлюю..."
                                  : "Приховати"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCommentStatus(comment, "visible")
                                }
                                disabled={isUpdatingCommentId === comment.id}
                                className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdatingCommentId === comment.id
                                  ? "Оновлюю..."
                                  : "Відновити"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => deleteComment(comment)}
                              disabled={isDeletingCommentId === comment.id}
                              className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeletingCommentId === comment.id
                                ? "Видаляю..."
                                : "Видалити"}
                            </button>
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                          {comment.body}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Збережені промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Промокоди, які користувач додав у збережені.
              </p>

              {favoritePromos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <div className="text-5xl">⭐</div>

                  <h3 className="mt-4 text-2xl font-black">
                    Збережених немає
                  </h3>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {favoritePromos.map((promo) => {
                    const worksPercent = getWorksPercent(promo);

                    return (
                      <article
                        key={promo.id}
                        className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                      >
                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-2 text-sm font-black text-emerald-300">
                          {promo.store_name || "Магазин"}
                        </p>

                        <p className="mt-4 text-xl font-black text-emerald-300">
                          {promo.discount_value || "Знижка не вказана"}
                        </p>

                        {promo.description && (
                          <p className="mt-3 line-clamp-3 leading-7 text-slate-400">
                            {promo.description}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-3">
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

            <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-3xl font-black">Заявки магазинів</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Магазини, які користувач пропонував додати.
              </p>

              {storeRequests.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <div className="text-5xl">🏪</div>

                  <h3 className="mt-4 text-2xl font-black">Заявок немає</h3>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {storeRequests.map((request) => {
                    const createdStore = request.created_store_id
                      ? storesMap.get(request.created_store_id)
                      : null;

                    return (
                      <article
                        key={request.id}
                        className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getPromoStatusClass(
                                  request.status
                                )}`}
                              >
                                {getRequestStatusLabel(request.status)}
                              </span>

                              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                {formatDate(request.created_at)}
                              </span>
                            </div>

                            <h3 className="mt-4 text-2xl font-black">
                              {getRequestName(request)}
                            </h3>

                            {getRequestUrl(request) && (
                              <a
                                href={normalizeOptionalUrl(getRequestUrl(request))}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex break-all text-sm font-black text-emerald-300 transition hover:text-emerald-200"
                              >
                                {getRequestUrl(request)}
                              </a>
                            )}

                            {getRequestDescription(request) && (
                              <p className="mt-3 leading-7 text-slate-400">
                                {getRequestDescription(request)}
                              </p>
                            )}
                          </div>

                          {createdStore && (
                            <Link
                              href={`/stores/${createdStore.slug}`}
                              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                            >
                              Відкрити магазин
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}