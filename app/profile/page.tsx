"use client";

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
  search_aliases?: string[] | null;
  rejection_reason?: string | null;
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

type FavoriteRecord = {
  id: string;
  promo_code_id: string;
  user_id: string;
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
  submitted_by?: string | null;
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
    .toLowerCase()
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яіїєґ_-]/gi, "")
    .slice(0, 32);
}

function normalizeOptionalUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function normalizeSocialUrl(
  value: string,
  platform: "instagram" | "telegram" | "tiktok" | "youtube"
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  const handle = trimmedValue.replace(/^@/, "");

  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "telegram") return `https://t.me/${handle}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  if (platform === "youtube") return `https://www.youtube.com/@${handle}`;

  return trimmedValue;
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

  return date.slice(0, 10);
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

function getProfileName(profile: Profile | null, user: User | null) {
  return (
    profile?.display_name ||
    profile?.username ||
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
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "png";
}

function getWorksPercent(promo: FavoritePromo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
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
  const [editCode, setEditCode] = useState("");
  const [editStoreId, setEditStoreId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDiscountValue, setEditDiscountValue] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editSourceType, setEditSourceType] = useState("other");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [isDeletingPromoId, setIsDeletingPromoId] = useState<string | null>(
    null
  );
  const [isRemovingFavoriteId, setIsRemovingFavoriteId] = useState<
    string | null
  >(null);
  const [copyingPromoId, setCopyingPromoId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const storesMap = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  const promoStats = useMemo(() => {
    return {
      total: myPromos.length,
      pending: myPromos.filter((promo) => promo.status === "pending").length,
      approved: myPromos.filter((promo) => promo.status === "approved").length,
      rejected: myPromos.filter((promo) => promo.status === "rejected").length,
    };
  }, [myPromos]);

  async function loadProfilePage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser(userData.user);

    await Promise.all([
      loadProfile(userData.user),
      loadReferenceData(),
      loadMyPromos(userData.user.id),
      loadFavorites(userData.user.id),
      loadStoreRequests(userData.user.id),
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
      setMessage(`Не вдалося завантажити профіль: ${error.message}`);
      setMessageType("error");
      return;
    }

    const nextProfile = (data as Profile | null) || null;

    setProfile(nextProfile);

    setUsername(nextProfile?.username || "");
    setDisplayName(nextProfile?.display_name || "");
    setAvatarUrl(nextProfile?.avatar_url || "");
    setBio(nextProfile?.bio || "");
    setWebsiteUrl(nextProfile?.website_url || "");
    setInstagramUrl(nextProfile?.instagram_url || "");
    setTelegramUrl(nextProfile?.telegram_url || "");
    setTiktokUrl(nextProfile?.tiktok_url || "");
    setYoutubeUrl(nextProfile?.youtube_url || "");
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

    if (!storesResult.error) {
      setStores((storesResult.data || []) as Store[]);
    }

    if (!categoriesResult.error) {
      setCategories((categoriesResult.data || []) as Category[]);
    }
  }

  async function loadMyPromos(userId: string) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "id, slug, code, store_id, category_id, discount_value, expires_at, status, source_type, source_url, description, search_aliases, rejection_reason, created_at"
      )
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setMyPromos([]);
      setMessage(`Не вдалося завантажити твої промокоди: ${error.message}`);
      setMessageType("error");
      return;
    }

    setMyPromos((data || []) as MyPromo[]);
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
        setStores([]);
        setCategories([]);
        setIsProfileEditorOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function saveProfile(nextAvatarUrl?: string | null) {
    if (!user) {
      setMessage("Щоб редагувати профіль, потрібно увійти.");
      setMessageType("error");
      return false;
    }

    const finalUsername = normalizeUsername(username);

    if (!finalUsername) {
      setMessage("Вкажи публічний нікнейм для профілю.");
      setMessageType("error");
      return false;
    }

    setIsSavingProfile(true);
    setMessage("");

    const payload = {
      id: user.id,
      email: user.email || null,
      username: finalUsername,
      display_name: displayName.trim() || null,
      avatar_url:
        typeof nextAvatarUrl === "string"
          ? nextAvatarUrl
          : avatarUrl.trim() || null,
      bio: bio.trim() || null,
      website_url: normalizeOptionalUrl(websiteUrl),
      instagram_url: normalizeSocialUrl(instagramUrl, "instagram"),
      telegram_url: normalizeSocialUrl(telegramUrl, "telegram"),
      tiktok_url: normalizeSocialUrl(tiktokUrl, "tiktok"),
      youtube_url: normalizeSocialUrl(youtubeUrl, "youtube"),
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
      setMessage(`Не вдалося зберегти профіль: ${error.message}`);
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

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    if (!user) {
      setMessage("Щоб завантажити аватарку, потрібно увійти.");
      setMessageType("error");
      return;
    }

    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
    ) {
      setMessage("Підтримуються тільки JPG, PNG, WEBP або GIF.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Файл завеликий. Максимум — 5 МБ.");
      setMessageType("error");
      return;
    }

    setIsUploadingAvatar(true);
    setMessage("");

    const extension = getFileExtension(file);
    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setIsUploadingAvatar(false);
      setMessage(`Не вдалося завантажити аватарку: ${uploadError.message}`);
      setMessageType("error");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const nextAvatarUrl = publicUrlData.publicUrl;

    setAvatarUrl(nextAvatarUrl);

    const saved = await saveProfile(nextAvatarUrl);

    setIsUploadingAvatar(false);

    if (saved) {
      setMessage("Аватарку завантажено і збережено в профілі.");
      setMessageType("success");
    }
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

  function startEditPromo(promo: MyPromo) {
    if (promo.status === "approved") {
      setMessage("Схвалений промокод не можна редагувати з профілю.");
      setMessageType("error");
      return;
    }

    setEditingPromoId(promo.id);
    setEditCode(promo.code || "");
    setEditStoreId(promo.store_id || "");
    setEditCategoryId(promo.category_id || "");
    setEditDiscountValue(promo.discount_value || "");
    setEditExpiresAt(getDateInputValue(promo.expires_at));
    setEditSourceType(promo.source_type || "other");
    setEditSourceUrl(promo.source_url || "");
    setEditDescription(promo.description || "");
  }

  function cancelEditPromo() {
    setEditingPromoId(null);
    setEditCode("");
    setEditStoreId("");
    setEditCategoryId("");
    setEditDiscountValue("");
    setEditExpiresAt("");
    setEditSourceType("other");
    setEditSourceUrl("");
    setEditDescription("");
  }

  async function saveEditedPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !editingPromoId) return;

    const finalCode = editCode.trim();
    const finalStoreId = editStoreId.trim();

    if (!finalCode) {
      setMessage("Вкажи промокод.");
      setMessageType("error");
      return;
    }

    if (!finalStoreId) {
      setMessage("Обери магазин.");
      setMessageType("error");
      return;
    }

    setIsSavingPromo(true);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .update({
        code: finalCode,
        store_id: finalStoreId,
        category_id: editCategoryId || null,
        discount_value: editDiscountValue.trim() || null,
        expires_at: editExpiresAt || null,
        source_type: editSourceType || "other",
        source_url: normalizeOptionalUrl(editSourceUrl),
        description: editDescription.trim() || null,
        status: "pending",
        rejection_reason: null,
      })
      .eq("id", editingPromoId)
      .eq("submitted_by", user.id);

    setIsSavingPromo(false);

    if (error) {
      setMessage(`Не вдалося оновити промокод: ${error.message}`);
      setMessageType("error");
      return;
    }

    cancelEditPromo();
    await loadMyPromos(user.id);

    setMessage("Промокод оновлено і повернуто на модерацію.");
    setMessageType("success");
  }

  async function deletePromo(promoId: string) {
    if (!user) return;

    const promo = myPromos.find((item) => item.id === promoId);

    if (!promo) return;

    if (promo.status === "approved") {
      setMessage("Схвалений промокод не можна видалити з профілю.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Видалити промокод ${promo.code}? Цю дію не можна скасувати.`
    );

    if (!confirmed) return;

    setIsDeletingPromoId(promoId);
    setMessage("");

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", promoId)
      .eq("submitted_by", user.id);

    setIsDeletingPromoId(null);

    if (error) {
      setMessage(`Не вдалося видалити промокод: ${error.message}`);
      setMessageType("error");
      return;
    }

    setMyPromos((currentPromos) =>
      currentPromos.filter((currentPromo) => currentPromo.id !== promoId)
    );

    setMessage("Промокод видалено.");
    setMessageType("success");
  }

  async function removeFavorite(promoId: string) {
    if (!user) return;

    setIsRemovingFavoriteId(promoId);
    setMessage("");

    const { error } = await supabase
      .from("promo_favorites")
      .delete()
      .eq("promo_code_id", promoId)
      .eq("user_id", user.id);

    setIsRemovingFavoriteId(null);

    if (error) {
      setMessage(`Не вдалося прибрати зі збережених: ${error.message}`);
      setMessageType("error");
      return;
    }

    setFavoriteRecords((currentRecords) =>
      currentRecords.filter((record) => record.promo_code_id !== promoId)
    );

    setFavoritePromos((currentPromos) =>
      currentPromos.filter((promo) => promo.id !== promoId)
    );

    setMessage("Промокод прибрано зі збережених.");
    setMessageType("success");
  }

  async function copyFavoriteCode(promo: FavoritePromo) {
    setCopyingPromoId(promo.id);

    try {
      await navigator.clipboard.writeText(promo.code);
      setMessage(`Промокод ${promo.code} скопійовано.`);
      setMessageType("success");
    } catch {
      setMessage("Не вдалося скопіювати промокод.");
      setMessageType("error");
    }

    window.setTimeout(() => {
      setCopyingPromoId(null);
    }, 600);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🐦</div>

          <h1 className="mt-5 text-4xl font-black">Потрібен вхід</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Щоб переглянути профіль, свої промокоди та збережені коди, потрібно
            увійти в акаунт.
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

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Профіль</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Особистий кабінет
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-950 text-5xl font-black text-emerald-300">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={getProfileName(profile, user)}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getAvatarFallback(profile, user)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                    {getProfileName(profile, user)}
                  </h1>

                  <p className="mt-3 text-lg font-black text-emerald-300">
                    {profile?.username ? `@${profile.username}` : user.email}
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>

              {profile?.bio && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  {profile.bio}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    isProfileEditorOpen ? cancelEditProfile : startEditProfile
                  }
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  {isProfileEditorOpen
                    ? "Закрити редагування"
                    : "Редагувати профіль"}
                </button>

                {profile?.username && (
                  <Link
                    href={`/u/${profile.username}`}
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Мій публічний профіль
                  </Link>
                )}

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border border-red-400/40 px-6 py-4 font-black text-red-300 transition hover:bg-red-400/10"
                >
                  Вийти
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {promoStats.total}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  моїх промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {promoStats.approved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалено
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {favoritePromos.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  збережено
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-red-300">
                  {promoStats.rejected}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  відхилено
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

        {isProfileEditorOpen && (
          <section className="mt-8 rounded-[2.5rem] border border-emerald-400/30 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Редагування профілю</h2>

                <p className="mt-2 leading-7 text-slate-400">
                  Зміни аватарку, нікнейм, опис і соцмережі. Після збереження
                  це меню сховається, а профіль оновиться.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelEditProfile}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-red-400 hover:text-red-300"
              >
                Скасувати
              </button>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-2xl font-black">Аватарка</h3>

                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-900 text-5xl font-black text-emerald-300">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={getProfileName(profile, user)}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{getAvatarFallback(profile, user)}</span>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <label className="inline-flex cursor-pointer rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
                      {isUploadingAvatar ? "Завантажую..." : "Завантажити файл"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={uploadAvatar}
                        disabled={isUploadingAvatar || isSavingProfile}
                        className="hidden"
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        disabled={isSavingProfile || isUploadingAvatar}
                        className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Прибрати аватарку
                      </button>
                    )}
                  </div>
                </div>

                <label className="mt-6 grid gap-2">
                  <span className="text-sm font-black text-slate-300">
                    URL аватарки
                  </span>

                  <input
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://..."
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>
              </section>

              <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-2xl font-black">Дані профілю</h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-300">
                      Публічний нікнейм
                    </span>

                    <input
                      value={username}
                      onChange={(event) =>
                        setUsername(normalizeUsername(event.target.value))
                      }
                      placeholder="admin"
                      className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-black text-slate-300">
                      Імʼя / назва
                    </span>

                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="D00DOSER"
                      className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </label>
                </div>

                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-black text-slate-300">Опис</span>

                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={5}
                    placeholder="Коротко про себе..."
                    className="resize-none rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="Сайт"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={instagramUrl}
                    onChange={(event) => setInstagramUrl(event.target.value)}
                    placeholder="Instagram"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={telegramUrl}
                    onChange={(event) => setTelegramUrl(event.target.value)}
                    placeholder="Telegram"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={tiktokUrl}
                    onChange={(event) => setTiktokUrl(event.target.value)}
                    placeholder="TikTok"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />

                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="YouTube"
                    className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 md:col-span-2"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => saveProfile()}
                    disabled={isSavingProfile || isUploadingAvatar}
                    className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingProfile ? "Зберігаю..." : "Зберегти профіль"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditProfile}
                    disabled={isSavingProfile || isUploadingAvatar}
                    className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Скасувати
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Мої промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Якщо промокод відхилено, тут буде видно причину від адміна.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати промокод
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
            <div className="mt-6 grid gap-5">
              {myPromos.map((promo) => {
                const store = promo.store_id
                  ? storesMap.get(promo.store_id)
                  : null;
                const isEditing = editingPromoId === promo.id;

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
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                              {store.name}
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

                      <div className="flex flex-wrap gap-3">
                        {promo.status === "approved" ? (
                          <Link
                            href={`/codes/${promo.slug || promo.id}`}
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            Відкрити
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              isEditing
                                ? cancelEditPromo()
                                : startEditPromo(promo)
                            }
                            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                          >
                            {isEditing ? "Закрити редактор" : "Редагувати"}
                          </button>
                        )}

                        {promo.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => deletePromo(promo.id)}
                            disabled={isDeletingPromoId === promo.id}
                            className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeletingPromoId === promo.id
                              ? "Видаляю..."
                              : "Видалити"}
                          </button>
                        )}
                      </div>
                    </div>

                    {promo.status === "rejected" &&
                      promo.rejection_reason?.trim() &&
                      !isEditing && (
                        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
                          <p className="text-sm font-black text-red-300">
                            Причина відхилення
                          </p>

                          <p className="mt-2 whitespace-pre-wrap leading-7 text-red-100">
                            {promo.rejection_reason}
                          </p>

                          <p className="mt-3 text-sm font-bold text-red-200/80">
                            Виправ промокод і натисни “Редагувати” — після
                            збереження він знову піде на модерацію.
                          </p>
                        </div>
                      )}

                    {promo.description && !isEditing && (
                      <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                        {promo.description}
                      </p>
                    )}

                    {!isEditing && (
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
                            {formatDate(promo.created_at)}
                          </p>
                        </div>

                        {store && (
                          <Link
                            href={`/stores/${store.slug}`}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-400/50"
                          >
                            <p className="text-xs font-bold text-slate-500">
                              Магазин
                            </p>
                            <p className="mt-1 font-black text-emerald-300">
                              {store.name}
                            </p>
                          </Link>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <form
                        onSubmit={saveEditedPromo}
                        className="mt-6 grid gap-4"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Промокод
                            </span>

                            <input
                              value={editCode}
                              onChange={(event) =>
                                setEditCode(event.target.value)
                              }
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />
                          </label>

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
                              <option value="">Обери магазин</option>

                              {stores.map((storeItem) => (
                                <option key={storeItem.id} value={storeItem.id}>
                                  {storeItem.name}
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
                              <option value="">
                                Автоматично / без категорії
                              </option>

                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Знижка
                            </span>

                            <input
                              value={editDiscountValue}
                              onChange={(event) =>
                                setEditDiscountValue(event.target.value)
                              }
                              placeholder="Наприклад: -10%"
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Діє до
                            </span>

                            <input
                              type="date"
                              value={editExpiresAt}
                              onChange={(event) =>
                                setEditExpiresAt(event.target.value)
                              }
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-black text-slate-300">
                              Джерело
                            </span>

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
                          </label>

                          <label className="grid gap-2 md:col-span-2">
                            <span className="text-sm font-black text-slate-300">
                              Посилання на джерело
                            </span>

                            <input
                              value={editSourceUrl}
                              onChange={(event) =>
                                setEditSourceUrl(event.target.value)
                              }
                              placeholder="https://..."
                              className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                            />
                          </label>
                        </div>

                        <label className="grid gap-2">
                          <span className="text-sm font-black text-slate-300">
                            Опис
                          </span>

                          <textarea
                            value={editDescription}
                            onChange={(event) =>
                              setEditDescription(event.target.value)
                            }
                            rows={5}
                            className="resize-none rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
                          />
                        </label>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={isSavingPromo}
                            className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingPromo
                              ? "Зберігаю..."
                              : "Зберегти і на модерацію"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditPromo}
                            className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Скасувати
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Збережені промокоди</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Промокоди, які ти зберіг кнопкою “Зберегти” на сторінці коду.
              </p>
            </div>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Знайти промокоди
            </Link>
          </div>

          {favoritePromos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">⭐</div>

              <h3 className="mt-4 text-2xl font-black">
                Збережених промокодів поки немає
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Відкрий будь-який промокод і натисни “Зберегти”, щоб він
                зʼявився тут.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {favoritePromos.map((promo) => {
                const store = promo.store_id
                  ? storesMap.get(promo.store_id)
                  : null;
                const worksPercent = getWorksPercent(promo);

                return (
                  <article
                    key={promo.id}
                    className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
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
                          className="break-all text-3xl font-black text-white transition hover:text-emerald-300"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-2 truncate text-sm font-black text-emerald-300">
                          {promo.store_name || store?.name || "Магазин"}
                        </p>
                      </div>
                    </div>

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
                          {worksPercent === null ? "Немає" : `${worksPercent}%`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      <button
                        type="button"
                        onClick={() => copyFavoriteCode(promo)}
                        disabled={copyingPromoId === promo.id}
                        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {copyingPromoId === promo.id
                          ? "Скопійовано"
                          : "Копіювати"}
                      </button>

                      <Link
                        href={`/codes/${promo.slug || promo.id}`}
                        className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Деталі
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeFavorite(promo.id)}
                        disabled={isRemovingFavoriteId === promo.id}
                        className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRemovingFavoriteId === promo.id
                          ? "Прибираю..."
                          : "Прибрати"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Мої заявки магазинів</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Тут видно магазини, які ти запропонував додати на сайт.
              </p>
            </div>

            <Link
              href="/request-store"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
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

                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      {linkedStore ? (
                        <Link
                          href={`/stores/${linkedStore.slug}`}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Відкрити магазин
                        </Link>
                      ) : request.status === "approved" &&
                        request.created_store_id ? (
                        <Link
                          href="/stores"
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Переглянути магазини
                        </Link>
                      ) : null}
                    </div>
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