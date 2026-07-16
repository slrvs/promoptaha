"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";
import UserLevelProgress from "@/components/UserLevelProgress";

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

type Promo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

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

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function getWorksPercent(promo: Promo) {
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

function getStoreWebsiteMap(storeWebsites: StoreWebsite[]) {
  return new Map(
    storeWebsites.map((storeWebsite) => [
      storeWebsite.id,
      storeWebsite.website_url || null,
    ])
  );
}

export default function UserPublicProfilePage() {
  const params = useParams<{ username: string }>();
  const profileIdentifier = decodeURIComponent(params.username || "");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [storeWebsites, setStoreWebsites] = useState<StoreWebsite[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const storeWebsiteMap = useMemo(() => {
    return getStoreWebsiteMap(storeWebsites);
  }, [storeWebsites]);

  const profileName = getProfileName(profile);
  const socialLinks = getSocialLinks(profile);

  const uniqueStoresCount = useMemo(() => {
    return new Set(
      promos
        .map((promo) => promo.store_id)
        .filter((storeId): storeId is string => Boolean(storeId))
    ).size;
  }, [promos]);

  const totalWorks = useMemo(() => {
    return promos.reduce(
      (sum, promo) => sum + Number(promo.works_count || 0),
      0
    );
  }, [promos]);

  const totalNotWorks = useMemo(() => {
    return promos.reduce(
      (sum, promo) => sum + Number(promo.not_works_count || 0),
      0
    );
  }, [promos]);

  const averageReliability = useMemo(() => {
    const totalVotes = totalWorks + totalNotWorks;

    if (totalVotes === 0) return null;

    return Math.round((totalWorks / totalVotes) * 100);
  }, [totalWorks, totalNotWorks]);

  async function loadPublicProfile() {
    setIsLoading(true);
    setMessage("");
    setProfile(null);
    setPromos([]);
    setStoreWebsites([]);

    const loadedProfile = await loadProfile(profileIdentifier);

    if (!loadedProfile) {
      setIsLoading(false);
      setMessage(
        `Профіль "${profileIdentifier}" не знайдено. Перевір username у профілі.`
      );
      return;
    }

    setProfile(loadedProfile);

    const loadedPromos = await loadApprovedPromos(loadedProfile.id);

    setPromos(loadedPromos);

    const storeIds = Array.from(
      new Set(
        loadedPromos
          .map((promo) => promo.store_id)
          .filter((storeId): storeId is string => Boolean(storeId))
      )
    );

    const loadedStoreWebsites = await loadStoreWebsites(storeIds);

    setStoreWebsites(loadedStoreWebsites);
    setIsLoading(false);
  }

  async function loadProfile(identifier: string) {
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
      return null;
    }

    return (data as UserProfile | null) || null;
  }

  async function loadApprovedPromos(userId: string) {
    const { data, error } = await supabase
      .from("promo_code_category_stats")
      .select(
        "id, slug, code, store_id, store_name, store_slug, category_name, category_slug, discount_value, expires_at, description, created_at, works_count, not_works_count, submitted_by"
      )
      .eq("status", "approved")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return [];
    }

    return (data || []) as Promo[];
  }

  async function loadStoreWebsites(storeIds: string[]) {
    if (storeIds.length === 0) return [];

    const { data, error } = await supabase
      .from("store_category_stats")
      .select("id, website_url")
      .in("id", storeIds);

    if (error) {
      return [];
    }

    return (data || []) as StoreWebsite[];
  }

  useEffect(() => {
    loadPublicProfile();
  }, [profileIdentifier]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-64 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[420px] sm:rounded-[2.5rem]" />
          <div className="mt-5 h-72 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:mt-8 sm:h-96 sm:rounded-[2.5rem]" />
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 text-center sm:rounded-[2.5rem] sm:p-8">
          <div className="text-5xl sm:text-6xl">👤</div>

          <h1 className="mt-4 text-2xl font-black sm:mt-5 sm:text-4xl">Профіль не знайдено</h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-400 sm:mt-4 sm:text-base sm:font-normal sm:leading-7">
            {message ||
              `Не вдалося знайти користувача за адресою /u/${profileIdentifier}.`}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/users"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
            >
              До спільноти
            </Link>

            <Link
              href="/profile"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
            >
              Мій профіль
            </Link>
          </div>
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

          <Link href="/users" className="hover:text-emerald-300">
            Спільнота
          </Link>

          <span>/</span>
          <span className="text-slate-300">{profileName}</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-emerald-950/20">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:p-10">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                Публічний профіль
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 text-3xl font-black text-emerald-300 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-5xl">
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
                  <div className="mb-2 flex flex-wrap gap-2 sm:mb-3">
                    <UserLevelBadge approvedPromos={promos.length} size="md" />

                    {profile.username && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-black text-emerald-300 sm:px-3 sm:py-2 sm:text-xs">
                        @{profile.username}
                      </span>
                    )}
                  </div>

                  <h1 className="break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                    {profileName}
                  </h1>

                  <p className="mt-2 text-xs font-bold text-slate-500 sm:mt-3 sm:text-sm">
                    На ПромоПтасі з {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                  {profile.bio}
                </p>
              )}

              {socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-sm"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-emerald-300 sm:text-4xl">
                  {promos.length}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  схвалених промокодів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {uniqueStoresCount}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  магазинів
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-yellow-300 sm:text-4xl">
                  {totalWorks}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  підтверджень “працює”
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {averageReliability === null
                    ? "—"
                    : `${averageReliability}%`}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  середня надійність
                </p>
              </div>

              <div className="hidden sm:col-span-2 sm:block">
                <UserLevelProgress approvedPromos={promos.length} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Промокоди автора</h2>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-400 sm:mt-2 sm:text-base sm:font-normal sm:leading-7">
                Схвалені промокоди, які додав цей користувач.
              </p>
            </div>

            <Link
              href="/users"
              className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3"
            >
              До спільноти
            </Link>
          </div>

          {promos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center sm:mt-6 sm:p-8">
              <div className="text-4xl sm:text-5xl">🎟️</div>

              <h3 className="mt-3 text-xl font-black sm:mt-4 sm:text-2xl">
                Схвалених промокодів поки немає
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
                Коли промокоди користувача пройдуть модерацію, вони зʼявляться
                тут.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              {promos.map((promo) => {
                const websiteUrl = promo.store_id
                  ? storeWebsiteMap.get(promo.store_id)
                  : null;
                const worksPercent = getWorksPercent(promo);

                return (
                  <article
                    key={promo.id}
                    className="flex flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40 sm:rounded-[2rem] sm:p-5"
                  >
                    <div className="flex items-start gap-2 sm:gap-4">
                      <StoreLogo
                        name={promo.store_name || "Магазин"}
                        websiteUrl={websiteUrl}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <Link
                          href={`/codes/${promo.slug || promo.id}`}
                          className="break-all text-lg font-black leading-tight text-white transition hover:text-emerald-300 sm:text-3xl"
                        >
                          {promo.code}
                        </Link>

                        <p className="mt-1 truncate text-xs font-black text-emerald-300 sm:mt-2 sm:text-sm">
                          {promo.store_name || "Магазин"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm font-black leading-5 text-emerald-300 sm:mt-4 sm:text-xl">
                      {promo.discount_value || "Знижка не вказана"}
                    </p>

                    {promo.description && (
                      <p className="mt-3 hidden line-clamp-3 leading-7 text-slate-400 sm:block">
                        {promo.description}
                      </p>
                    )}

                    <div className="mt-3 hidden grid-cols-2 gap-3 sm:grid sm:mt-5">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Діє до
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-200 sm:text-base">
                          {formatDate(promo.expires_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Надійність
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-200 sm:text-base">
                          {worksPercent === null ? "Немає" : `${worksPercent}%`}
                        </p>
                      </div>
                    </div>

                    {promo.category_name && (
                      <div className="mt-3 sm:mt-4">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-slate-300 sm:px-3 sm:py-2 sm:text-xs">
                          {promo.category_name}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-3 sm:pt-5">
                      <Link
                        href={`/codes/${promo.slug || promo.id}`}
                        className="inline-flex w-full min-h-9 items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-center text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:w-auto sm:rounded-full sm:px-5 sm:py-3 sm:text-sm"
                      >
                        Відкрити промокод
                      </Link>
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