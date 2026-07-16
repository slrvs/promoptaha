"use client";

import { getFriendlyErrorMessage } from "@/lib/friendlyError";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";
import UserLevelProgress from "@/components/UserLevelProgress";

type Profile = {
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

type MyPromo = {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeOptionalUrl(value: string) {
  const trimmedValue = value.trim();

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

function getDateInputValue(date: string | null | undefined) {
  if (!date) return "";

  return new Date(date).toISOString().slice(0, 10);
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

function getProfileName(profile: Profile | null, user: User | null) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "Користувач"
  );
}

function getAvatarFallback(profile: Profile | null, user: User | null) {
  const name = getProfileName(profile, user).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension) return extension;

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function getWorksPercent(promo: FavoritePromo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

function getStoreName(stores: Store[], storeId: string | null | undefined) {
  if (!storeId) return "Магазин";

  return stores.find((store) => store.id === storeId)?.name || "Магазин";
}

function getStoreSlug(stores: Store[], storeId: string | null | undefined) {
  if (!storeId) return null;

  return stores.find((store) => store.id === storeId)?.slug || null;
}

function getStoreWebsite(stores: Store[], storeId: string | null | undefined) {
  if (!storeId) return null;

  return stores.find((store) => store.id === storeId)?.website_url || null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [myPromos, setMyPromos] = useState<MyPromo[]>([]);
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritePromos, setFavoritePromos] = useState<FavoritePromo[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);

  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editStoreId, setEditStoreId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDiscountValue, setEditDiscountValue] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editSourceType, setEditSourceType] = useState("other");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [savingPromoId, setSavingPromoId] = useState<string | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState<string | null>(null);
  const [removingFavoriteId, setRemovingFavoriteId] = useState<string | null>(
    null
  );
  const [copiedFavoriteId, setCopiedFavoriteId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const approvedPromosCount = useMemo(() => {
    return myPromos.filter((promo) => promo.status === "approved").length;
  }, [myPromos]);

  const pendingPromosCount = useMemo(() => {
    return myPromos.filter((promo) => promo.status === "pending").length;
  }, [myPromos]);

  const rejectedPromosCount = useMemo(() => {
    return myPromos.filter((promo) => promo.status === "rejected").length;
  }, [myPromos]);

  const profileName = getProfileName(profile, user);
  const publicProfileUrl = profile?.username ? `/u/${profile.username}` : "";

  async function loadProfilePage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setMyPromos([]);
      setFavoriteRecords([]);
      setFavoritePromos([]);
      setStoreRequests([]);
      setIsLoading(false);
      return;
    }

    await Promise.all([
      loadProfile(currentUser),
      loadReferenceData(),
      loadMyPromos(currentUser.id),
      loadFavorites(currentUser.id),
      loadStoreRequests(currentUser.id),
    ]);

    setIsLoading(false);
  }

  async function loadProfile(currentUser: User) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      setMessage(`Не вдалося завантажити профіль: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    const loadedProfile = (data as Profile | null) || null;

    setProfile(loadedProfile);
    setUsername(loadedProfile?.username || "");
    setDisplayName(loadedProfile?.display_name || "");
    setAvatarUrl(loadedProfile?.avatar_url || "");
    setBio(loadedProfile?.bio || "");
    setWebsiteUrl(loadedProfile?.website_url || "");
    setInstagramUrl(loadedProfile?.instagram_url || "");
    setTelegramUrl(loadedProfile?.telegram_url || "");
    setTiktokUrl(loadedProfile?.tiktok_url || "");
    setYoutubeUrl(loadedProfile?.youtube_url || "");
  }

  async function loadReferenceData() {
    const [storesResult, categoriesResult] = await Promise.all([
      supabase
        .from("store_category_stats")
        .select(
          "id, name, slug, website_url, category_id, category_names, category_slugs"
        )
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(1000),

      supabase
        .from("categories")
        .select("id, name, slug, status")
        .eq("status", "active")
        .order("name", { ascending: true })
        .limit(300),
    ]);

    setStores(storesResult.error ? [] : ((storesResult.data || []) as Store[]));
    setCategories(
      categoriesResult.error ? [] : ((categoriesResult.data || []) as Category[])
    );
  }

  async function loadMyPromos(userId: string) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, submitted_by, rejection_reason, created_at"
      )
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setMyPromos([]);
      return;
    }

    setMyPromos((data || []) as MyPromo[]);
  }

  async function loadFavorites(userId: string) {
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

    const promos = (promosData || []) as FavoritePromo[];
    const promosMap = new Map(promos.map((promo) => [promo.id, promo]));

    const orderedPromos = records
      .map((record) => promosMap.get(record.promo_code_id))
      .filter((promo): promo is FavoritePromo => Boolean(promo));

    setFavoritePromos(orderedPromos);
  }

  async function loadStoreRequests(userId: string) {
    const { data, error } = await supabase
      .from("store_requests")
      .select("*")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setStoreRequests([]);
      return;
    }

    setStoreRequests((data || []) as StoreRequest[]);
  }

  useEffect(() => {
    loadProfilePage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (!session?.user) {
        setProfile(null);
        setMyPromos([]);
        setFavoriteRecords([]);
        setFavoritePromos([]);
        setStoreRequests([]);
        setIsProfileEditorOpen(false);
      } else {
        loadProfilePage();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function saveProfile(nextAvatarUrl?: string) {
    if (!user) return false;

    const finalUsername = normalizeUsername(username);

    if (username.trim() && finalUsername.length < 3) {
      setMessage("Username має містити хоча б 3 символи.");
      setMessageType("error");
      return false;
    }

    setIsSavingProfile(true);
    setMessage("");

    const payload = {
      id: user.id,
      email: user.email || profile?.email || null,
      username: finalUsername || null,
      display_name: displayName.trim() || null,
      avatar_url:
        nextAvatarUrl === undefined
          ? avatarUrl.trim() || null
          : nextAvatarUrl || null,
      bio: bio.trim() || null,
      website_url: normalizeOptionalUrl(websiteUrl) || null,
      instagram_url: normalizeOptionalUrl(instagramUrl) || null,
      telegram_url: normalizeOptionalUrl(telegramUrl) || null,
      tiktok_url: normalizeOptionalUrl(tiktokUrl) || null,
      youtube_url: normalizeOptionalUrl(youtubeUrl) || null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, {
        onConflict: "id",
      })
      .select(
        "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
      )
      .single();

    setIsSavingProfile(false);

    if (error) {
      setMessage(`Не вдалося зберегти профіль: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return false;
    }

    const savedProfile = data as Profile;

    setProfile(savedProfile);
    setUsername(savedProfile.username || "");
    setDisplayName(savedProfile.display_name || "");
    setAvatarUrl(savedProfile.avatar_url || "");
    setBio(savedProfile.bio || "");
    setWebsiteUrl(savedProfile.website_url || "");
    setInstagramUrl(savedProfile.instagram_url || "");
    setTelegramUrl(savedProfile.telegram_url || "");
    setTiktokUrl(savedProfile.tiktok_url || "");
    setYoutubeUrl(savedProfile.youtube_url || "");
    setIsProfileEditorOpen(false);

    setMessage("Профіль збережено.");
    setMessageType("success");

    return true;
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProfile();
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    if (!user) return;

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Потрібно обрати файл зображення.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Зображення завелике. Максимум — 5 МБ.");
      setMessageType("error");
      return;
    }

    setIsUploadingAvatar(true);
    setMessage("");

    const extension = getFileExtension(file);
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      setIsUploadingAvatar(false);
      setMessage(`Не вдалося завантажити аватар: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    setAvatarUrl(publicUrl);

    await saveProfile(publicUrl);

    setIsUploadingAvatar(false);
  }

  async function removeAvatar() {
    setAvatarUrl("");
    await saveProfile("");
  }

  function startEditProfile() {
    setUsername(profile?.username || "");
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || "");
    setBio(profile?.bio || "");
    setWebsiteUrl(profile?.website_url || "");
    setInstagramUrl(profile?.instagram_url || "");
    setTelegramUrl(profile?.telegram_url || "");
    setTiktokUrl(profile?.tiktok_url || "");
    setYoutubeUrl(profile?.youtube_url || "");
    setIsProfileEditorOpen(true);
  }

  function cancelEditProfile() {
    setUsername(profile?.username || "");
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || "");
    setBio(profile?.bio || "");
    setWebsiteUrl(profile?.website_url || "");
    setInstagramUrl(profile?.instagram_url || "");
    setTelegramUrl(profile?.telegram_url || "");
    setTiktokUrl(profile?.tiktok_url || "");
    setYoutubeUrl(profile?.youtube_url || "");
    setIsProfileEditorOpen(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function startEditPromo(promo: MyPromo) {
    if (promo.status === "approved") {
      setMessage("Схвалені промокоди не можна редагувати напряму.");
      setMessageType("error");
      return;
    }

    setEditingPromoId(promo.id);
    setEditStoreId(promo.store_id || "");
    setEditCategoryId(promo.category_id || "");
    setEditCode(promo.code || "");
    setEditDiscountValue(promo.discount_value || "");
    setEditExpiresAt(getDateInputValue(promo.expires_at));
    setEditSourceType(promo.source_type || "other");
    setEditSourceUrl(promo.source_url || "");
    setEditDescription(promo.description || "");
  }

  function cancelEditPromo() {
    setEditingPromoId(null);
    setEditStoreId("");
    setEditCategoryId("");
    setEditCode("");
    setEditDiscountValue("");
    setEditExpiresAt("");
    setEditSourceType("other");
    setEditSourceUrl("");
    setEditDescription("");
  }

  async function saveEditedPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !editingPromoId) return;

    if (editCode.trim().length < 2) {
      setMessage("Промокод має містити хоча б 2 символи.");
      setMessageType("error");
      return;
    }

    setSavingPromoId(editingPromoId);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({
        store_id: editStoreId || null,
        category_id: editCategoryId || null,
        code: editCode.trim(),
        discount_value: editDiscountValue.trim() || null,
        expires_at: editExpiresAt || null,
        source_type: editSourceType || "other",
        source_url: normalizeOptionalUrl(editSourceUrl) || null,
        description: editDescription.trim() || null,
        status: "pending",
        rejection_reason: null,
      })
      .eq("id", editingPromoId)
      .eq("submitted_by", user.id);

    setSavingPromoId(null);

    if (error) {
      setMessage(`Не вдалося зберегти промокод: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    cancelEditPromo();
    await loadMyPromos(user.id);

    setMessage("Промокод оновлено і повернуто на модерацію.");
    setMessageType("success");
  }

  async function deletePromo(promo: MyPromo) {
    if (!user) return;

    if (promo.status === "approved") {
      setMessage("Схвалені промокоди не можна видалити з профілю.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm("Видалити цей промокод?");

    if (!confirmed) return;

    setDeletingPromoId(promo.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promo.id)
      .eq("submitted_by", user.id);

    setDeletingPromoId(null);

    if (error) {
      setMessage(`Не вдалося видалити промокод: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    await loadMyPromos(user.id);

    setMessage("Промокод видалено.");
    setMessageType("success");
  }

  async function removeFavorite(favoritePromoId: string) {
    if (!user) return;

    const favorite = favoriteRecords.find(
      (record) => record.promo_code_id === favoritePromoId
    );

    if (!favorite) return;

    setRemovingFavoriteId(favorite.id);
    setMessage("");

    const { error } = await supabase
      .from("promo_favorites")
      .delete()
      .eq("id", favorite.id)
      .eq("user_id", user.id);

    setRemovingFavoriteId(null);

    if (error) {
      setMessage(`Не вдалося прибрати зі збережених: ${getFriendlyErrorMessage(error)}`);
      setMessageType("error");
      return;
    }

    await loadFavorites(user.id);

    setMessage("Промокод прибрано зі збережених.");
    setMessageType("success");
  }

  async function copyFavoriteCode(promo: FavoritePromo) {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedFavoriteId(promo.id);

      window.setTimeout(() => {
        setCopiedFavoriteId(null);
      }, 900);
    } catch {
      setMessage("Не вдалося скопіювати код.");
      setMessageType("error");
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[360px] animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[420px] sm:rounded-[2.5rem]" />
          <div className="mt-5 h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:mt-8 sm:h-96 sm:rounded-[2.5rem]" />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 text-center sm:rounded-[2.5rem] sm:p-8">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-2xl font-black sm:text-4xl">Потрібно увійти</h1>

          <p className="mt-4 hidden leading-7 text-slate-400 sm:block">
            Кабінет доступний тільки для авторизованих користувачів.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Увійти
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Мій профіль</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20 sm:rounded-[2.5rem]">
          <div className="grid gap-4 p-3 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:text-sm">
                Особистий кабінет
              </p>

              <div className="flex items-center gap-3 sm:flex-wrap sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 text-2xl font-black text-emerald-300 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-5xl">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profileName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getAvatarFallback(profile, user)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <UserLevelBadge
                      approvedPromos={approvedPromosCount}
                      size="md"
                    />

                    {profile?.username && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">
                        @{profile.username}
                      </span>
                    )}
                  </div>

                  <h1 className="break-words text-2xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                    {profileName}
                  </h1>

                  <p className="mt-2 break-all text-xs font-bold text-slate-500 sm:mt-3 sm:text-sm">
                    {user.email}
                  </p>
                </div>
              </div>

              {profile?.bio && (
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                  {profile.bio}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <button
                  type="button"
                  onClick={
                    isProfileEditorOpen ? cancelEditProfile : startEditProfile
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  {isProfileEditorOpen
                    ? "Закрити редагування"
                    : "Редагувати профіль"}
                </button>

                {publicProfileUrl && (
                  <Link
                    href={publicProfileUrl}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-700 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                  >
                    Публічний профіль
                  </Link>
                )}

                <Link
                  href="/add"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-700 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-700 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Запропонувати магазин
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-400/40 px-3 py-2 text-center text-sm font-black text-red-300 transition hover:bg-red-400/10 sm:col-span-1 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Вийти
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                  <p className="text-2xl font-black text-emerald-300 sm:text-4xl">
                    {approvedPromosCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                    схвалених кодів
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                  <p className="text-2xl font-black text-yellow-300 sm:text-4xl">
                    {pendingPromosCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                    на модерації
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                  <p className="text-2xl font-black text-red-300 sm:text-4xl">
                    {rejectedPromosCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                    відхилено
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                  <p className="text-2xl font-black text-white sm:text-4xl">
                    {favoritePromos.length}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                    збережено
                  </p>
                </div>
              </div>

              <div className="hidden sm:block">\n                <UserLevelProgress approvedPromos={approvedPromosCount} />\n              </div>
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

        {isProfileEditorOpen && (
          <section className="mt-5 rounded-[2rem] border border-emerald-400/30 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Редагування профілю</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Заповни публічні дані, які бачитимуть інші користувачі.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelEditProfile}
                className="inline-flex justify-center rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
              >
                Скасувати
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"
            >
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-5">
                <h3 className="text-2xl font-black">Аватар</h3>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-900 text-4xl font-black text-emerald-300">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Аватар"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{getAvatarFallback(profile, user)}</span>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <label className="cursor-pointer rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
                      {isUploadingAvatar ? "Завантажую..." : "Завантажити"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10"
                      >
                        Прибрати
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-300">
                      Username
                    </span>

                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="admin_ptaha"
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-300">
                      Імʼя
                    </span>

                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="ПромоПтаха"
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-slate-300">
                    Біо
                  </span>

                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={4}
                    placeholder="Коротко про себе..."
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="Сайт"
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={instagramUrl}
                    onChange={(event) => setInstagramUrl(event.target.value)}
                    placeholder="Instagram"
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={telegramUrl}
                    onChange={(event) => setTelegramUrl(event.target.value)}
                    placeholder="Telegram"
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={tiktokUrl}
                    onChange={(event) => setTiktokUrl(event.target.value)}
                    placeholder="TikTok"
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="YouTube"
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 md:col-span-2"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingProfile ? "Зберігаю..." : "Зберегти профіль"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditProfile}
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Мої промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Тут можна переглянути свої коди, відредагувати відхилені або ті,
                що ще на модерації.
              </p>
            </div>

            <Link
              href="/add"
              className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
            >
              Додати код
            </Link>
          </div>

          {myPromos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🎟️</div>
              <h3 className="mt-4 text-2xl font-black">
                Ти ще не додавав промокоди
              </h3>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-1 sm:gap-5">
              {myPromos.map((promo) => {
                const isEditing = editingPromoId === promo.id;
                const storeName = getStoreName(stores, promo.store_id);
                const storeSlug = getStoreSlug(stores, promo.store_id);
                const storeWebsite = getStoreWebsite(stores, promo.store_id);

                return (
                  <article
                    key={promo.id}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-5"
                  >
                    {isEditing ? (
                      <form onSubmit={saveEditedPromo} className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Магазин
                            </span>

                            <select
                              value={editStoreId}
                              onChange={(event) =>
                                setEditStoreId(event.target.value)
                              }
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            >
                              <option value="">Не вибрано</option>

                              {stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                  {store.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Категорія
                            </span>

                            <select
                              value={editCategoryId}
                              onChange={(event) =>
                                setEditCategoryId(event.target.value)
                              }
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            >
                              <option value="">Не вибрано</option>

                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <input
                            value={editCode}
                            onChange={(event) => setEditCode(event.target.value)}
                            placeholder="Промокод"
                            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                          />

                          <input
                            value={editDiscountValue}
                            onChange={(event) =>
                              setEditDiscountValue(event.target.value)
                            }
                            placeholder="Знижка, наприклад -10%"
                            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <input
                            type="date"
                            value={editExpiresAt}
                            onChange={(event) =>
                              setEditExpiresAt(event.target.value)
                            }
                            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                          />

                          <select
                            value={editSourceType}
                            onChange={(event) =>
                              setEditSourceType(event.target.value)
                            }
                            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="telegram">Telegram</option>
                            <option value="instagram">Instagram</option>
                            <option value="tiktok">TikTok</option>
                            <option value="website">Сайт</option>
                            <option value="other">Інше</option>
                          </select>

                          <input
                            value={editSourceUrl}
                            onChange={(event) =>
                              setEditSourceUrl(event.target.value)
                            }
                            placeholder="Посилання на джерело"
                            className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                          />
                        </div>

                        <textarea
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          rows={4}
                          placeholder="Опис або умови використання"
                          className="resize-none rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                        />

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={savingPromoId === promo.id}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingPromoId === promo.id
                              ? "Зберігаю..."
                              : "Зберегти і на модерацію"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditPromo}
                            className="inline-flex justify-center rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                          >
                            Скасувати
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                            <StoreLogo
                              name={storeName}
                              websiteUrl={storeWebsite}
                              size="sm"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-lg font-black text-white sm:break-all sm:text-4xl">
                                {promo.code}
                              </p>

                              <p className="mt-1 truncate text-sm font-black text-emerald-300 sm:mt-2 sm:text-xl">
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

                                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                                  {formatDate(promo.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {promo.status === "approved" ? (
                              <Link
                                href={`/codes/${promo.slug || promo.id}`}
                                className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                              >
                                Відкрити
                              </Link>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditPromo(promo)}
                                  className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                                >
                                  Редагувати
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deletePromo(promo)}
                                  disabled={deletingPromoId === promo.id}
                                  className="inline-flex justify-center rounded-full border border-red-400/40 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-sm"
                                >
                                  {deletingPromoId === promo.id
                                    ? "Видаляю..."
                                    : "Видалити"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {promo.description && (
                          <p className="mt-4 hidden leading-7 text-slate-400 sm:block">
                            {promo.description}
                          </p>
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

                              <p className="mt-3 text-sm font-bold text-red-200/80">
                                Відредагуй промокод і він знову піде на
                                модерацію.
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Збережені промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Промокоди, які ти зберіг для себе.
              </p>
            </div>
          </div>

          {favoritePromos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">⭐</div>
              <h3 className="mt-4 text-2xl font-black">
                Збережених промокодів поки немає
              </h3>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              {favoritePromos.map((promo) => {
                const worksPercent = getWorksPercent(promo);
                const favorite = favoriteRecords.find(
                  (record) => record.promo_code_id === promo.id
                );

                return (
                  <article
                    key={promo.id}
                    className="flex min-h-[190px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:min-h-0 sm:rounded-[2rem] sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <StoreLogo
                        name={promo.store_name || "Магазин"}
                        websiteUrl={null}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="truncate text-lg font-black text-white transition hover:text-emerald-300 sm:break-all sm:text-3xl"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-2 text-sm font-black text-emerald-300">
                          {promo.store_name || "Магазин"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xl font-black text-emerald-300">
                      {promo.discount_value || "Знижка не вказана"}
                    </p>

                    {promo.description && (
                      <p className="mt-3 hidden line-clamp-3 leading-7 text-slate-400 sm:block">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
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
                          {worksPercent === null ? "Немає" : `${worksPercent}%`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto grid gap-2 pt-4 sm:flex sm:flex-wrap sm:gap-3 sm:pt-5">
                      <button
                        type="button"
                        onClick={() => copyFavoriteCode(promo)}
                        className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                      >
                        {copiedFavoriteId === promo.id
                          ? "Скопійовано"
                          : "Копіювати"}
                      </button>

                      <Link
                        href={`/codes/${promo.slug || promo.id}`}
                        className="inline-flex justify-center rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                      >
                        Деталі
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeFavorite(promo.id)}
                        disabled={
                          favorite ? removingFavoriteId === favorite.id : false
                        }
                        className="inline-flex justify-center rounded-full border border-red-400/40 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-sm"
                      >
                        Прибрати
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Мої заявки магазинів</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Магазини, які ти пропонував додати на сайт.
              </p>
            </div>

            <Link
              href="/request-store"
              className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
            >
              Запропонувати магазин
            </Link>
          </div>

          {storeRequests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🏪</div>
              <h3 className="mt-4 text-2xl font-black">
                Заявок магазинів поки немає
              </h3>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-1 sm:gap-4">
              {storeRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-5"
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
                          className="mt-2 inline-flex text-sm font-black text-emerald-300 transition hover:text-emerald-200"
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

                    {request.created_store_id && (
                      <Link
                        href={`/stores/${
                          stores.find(
                            (store) => store.id === request.created_store_id
                          )?.slug || ""
                        }`}
                        className="inline-flex justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
                      >
                        Відкрити магазин
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}