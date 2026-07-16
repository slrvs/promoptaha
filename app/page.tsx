"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";
import UserLevelBadge from "@/components/UserLevelBadge";

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
  description?: string | null;
  website_url?: string | null;
  category_names?: string[] | null;
  category_slugs?: string[] | null;
  active_promo_count?: number | null;
  promo_count?: number | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type Deal = {
  id: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  store_website_url?: string | null;
  category_name?: string | null;
  title: string;
  slug?: string | null;
  description?: string | null;
  deal_url?: string | null;
  ends_at?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type UserProfile = {
  id: string;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TopUser = UserProfile & {
  approvedPromos: number;
  storesCount: number;
  worksCount: number;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

type PublicPromoForStats = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  works_count?: number | null;
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
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysLeft(date: string | null | undefined) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);

  const difference = target.getTime() - now.getTime();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return days;
}

function getExpiryLabel(date: string | null | undefined) {
  const daysLeft = getDaysLeft(date);

  if (daysLeft === null) return "Без терміну";
  if (daysLeft < 0) return "Закінчився";
  if (daysLeft === 0) return "Сьогодні";
  if (daysLeft === 1) return "Завтра";

  return `${daysLeft} дн.`;
}

function getWorksPercent(promo: Promo) {
  const worksCount = Number(promo.works_count || 0);
  const notWorksCount = Number(promo.not_works_count || 0);
  const total = worksCount + notWorksCount;

  if (total === 0) return null;

  return Math.round((worksCount / total) * 100);
}

function getUserName(profile: UserProfile | null | undefined) {
  return (
    profile?.display_name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "ПромоПтаха"
  );
}

function getAvatarFallback(profile: UserProfile | null | undefined) {
  const name = getUserName(profile).trim();

  if (!name) return "П";

  return name.slice(0, 1).toUpperCase();
}

function getDealHref(deal: Deal) {
  if (deal.deal_url) return deal.deal_url;
  if (deal.store_slug) return `/stores/${deal.store_slug}`;

  return "/deals";
}

function getStoreWebsiteMap(storeWebsites: StoreWebsite[]) {
  return new Map(
    storeWebsites.map((storeWebsite) => [
      storeWebsite.id,
      storeWebsite.website_url || null,
    ])
  );
}

function getTopUsers(
  profiles: UserProfile[],
  promosForStats: PublicPromoForStats[]
) {
  const statsMap = new Map<
    string,
    {
      approvedPromos: number;
      storeIds: Set<string>;
      worksCount: number;
    }
  >();

  for (const profile of profiles) {
    statsMap.set(profile.id, {
      approvedPromos: 0,
      storeIds: new Set(),
      worksCount: 0,
    });
  }

  for (const promo of promosForStats) {
    if (!promo.submitted_by) continue;

    const stats = statsMap.get(promo.submitted_by);

    if (!stats) continue;

    stats.approvedPromos += 1;
    stats.worksCount += Number(promo.works_count || 0);

    if (promo.store_id) {
      stats.storeIds.add(promo.store_id);
    }
  }

  return profiles
    .map((profile) => {
      const stats = statsMap.get(profile.id);

      return {
        ...profile,
        approvedPromos: stats?.approvedPromos || 0,
        storesCount: stats?.storeIds.size || 0,
        worksCount: stats?.worksCount || 0,
      };
    })
    .sort((firstUser, secondUser) => {
      if (secondUser.approvedPromos !== firstUser.approvedPromos) {
        return secondUser.approvedPromos - firstUser.approvedPromos;
      }

      return secondUser.worksCount - firstUser.worksCount;
    })
    .slice(0, 8);
}

function SectionHeader({
  title,
  description,
  href,
  linkLabel = "Всі",
}: {
  title: string;
  description: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <h2 className="text-xl font-black leading-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-400 sm:mt-2 sm:text-base sm:font-normal">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="shrink-0 rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function MobilePromoTile({
  promo,
  websiteUrl,
}: {
  promo: Promo;
  websiteUrl?: string | null;
}) {
  return (
    <Link
      href={`/codes/${promo.slug || promo.id}`}
      className="group flex min-h-[185px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <div className="flex items-start justify-between gap-2">
        <StoreLogo
          name={promo.store_name || "Магазин"}
          websiteUrl={websiteUrl}
          size="sm"
        />

        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-300">
          {getExpiryLabel(promo.expires_at)}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p
          className="truncate text-lg font-black leading-tight text-white transition group-hover:text-emerald-300"
          title={promo.code}
        >
          {promo.code}
        </p>

        <p className="mt-1 truncate text-base font-black text-emerald-300">
          {promo.discount_value || "Знижка"}
        </p>

        <p className="mt-3 truncate text-xs font-black text-slate-400">
          {promo.store_name || "Магазин"}
        </p>

        {promo.category_name && (
          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
            {promo.category_name}
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <span className="inline-flex w-full justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition group-hover:bg-emerald-300">
          Відкрити
        </span>
      </div>
    </Link>
  );
}

function DesktopPromoCard({
  promo,
  websiteUrl,
  author,
  authorApprovedCount,
}: {
  promo: Promo;
  websiteUrl?: string | null;
  author?: UserProfile | null;
  authorApprovedCount: number;
}) {
  const worksPercent = getWorksPercent(promo);

  return (
    <article className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40">
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <StoreLogo
            name={promo.store_name || "Магазин"}
            websiteUrl={websiteUrl}
            size="sm"
          />

          <div className="min-w-0">
            <Link
              href={`/codes/${promo.slug || promo.id}`}
              className="block truncate text-3xl font-black text-white transition hover:text-emerald-300"
              title={promo.code}
            >
              {promo.code}
            </Link>

            <p className="mt-2 text-xl font-black text-emerald-300">
              {promo.discount_value || "Знижка не вказана"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {promo.store_slug ? (
                <Link
                  href={`/stores/${promo.store_slug}`}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  {promo.store_name || "Магазин"}
                </Link>
              ) : (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                  {promo.store_name || "Магазин"}
                </span>
              )}

              {promo.category_name && (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                  {promo.category_name}
                </span>
              )}

              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                {getExpiryLabel(promo.expires_at)}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/codes/${promo.slug || promo.id}`}
          className="shrink-0 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
        >
          Відкрити
        </Link>
      </div>

      {promo.description && (
        <p className="mt-4 line-clamp-2 leading-7 text-slate-400">
          {promo.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={getUserName(author)}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{getAvatarFallback(author)}</span>
            )}
          </div>

          <div className="min-w-0">
            {author?.username ? (
              <Link
                href={`/u/${author.username}`}
                className="block truncate font-black text-emerald-300 transition hover:text-emerald-200"
              >
                {getUserName(author)}
              </Link>
            ) : (
              <p className="truncate font-black text-slate-300">
                {getUserName(author)}
              </p>
            )}

            <div className="mt-1">
              <UserLevelBadge approvedPromos={authorApprovedCount} size="sm" />
            </div>
          </div>
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-black text-slate-300">
          Надійність: {worksPercent === null ? "немає" : `${worksPercent}%`}
        </div>
      </div>
    </article>
  );
}

function MobileUserTile({
  user,
  index,
}: {
  user: TopUser;
  index: number;
}) {
  return (
    <Link
      href={user.username ? `/u/${user.username}` : "/users"}
      className="flex min-h-[155px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
          #{index + 1}
        </span>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={getUserName(user)}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{getAvatarFallback(user)}</span>
          )}
        </div>
      </div>

      <p className="mt-4 truncate font-black text-white">{getUserName(user)}</p>

      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
        {user.approvedPromos} кодів · {user.storesCount} магазинів
      </p>
    </Link>
  );
}

function DesktopUserCard({
  user,
  index,
}: {
  user: TopUser;
  index: number;
}) {
  return (
    <Link
      href={user.username ? `/u/${user.username}` : "/users"}
      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-black text-slate-300">
          #{index + 1}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-sm font-black text-emerald-300">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={getUserName(user)}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{getAvatarFallback(user)}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-black text-white">{getUserName(user)}</p>

          <div className="mt-1">
            <UserLevelBadge approvedPromos={user.approvedPromos} size="sm" />
          </div>

          <p className="mt-2 text-xs font-bold text-slate-500">
            {user.approvedPromos} кодів · {user.storesCount} магазинів
          </p>
        </div>
      </div>
    </Link>
  );
}

function MobileDealTile({ deal }: { deal: Deal }) {
  return (
    <a
      href={getDealHref(deal)}
      target={deal.deal_url ? "_blank" : undefined}
      rel={deal.deal_url ? "noreferrer" : undefined}
      className="flex min-h-[145px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <p className="line-clamp-3 text-sm font-black leading-5 text-white">
        {deal.title}
      </p>

      <p className="mt-3 truncate text-xs font-black text-emerald-300">
        {deal.store_name || "Магазин"}
      </p>

      <div className="mt-auto pt-3">
        <p className="text-[11px] font-bold text-slate-500">
          {deal.ends_at ? `До ${formatDate(deal.ends_at)}` : "Акція"}
        </p>
      </div>
    </a>
  );
}

function MobileStoreTile({ store }: { store: Store }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex min-h-[155px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      <StoreLogo name={store.name} websiteUrl={store.website_url} size="sm" />

      <p className="mt-4 truncate font-black text-white">{store.name}</p>

      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
        {Number(store.active_promo_count || 0)} активних кодів
      </p>

      {store.category_names?.[0] && (
        <p className="mt-auto truncate pt-3 text-[11px] font-black text-emerald-300">
          {store.category_names[0]}
        </p>
      )}
    </Link>
  );
}

export default function HomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [storeWebsites, setStoreWebsites] = useState<StoreWebsite[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, UserProfile>>(
    new Map()
  );
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [approvedStatsMap, setApprovedStatsMap] = useState<Map<string, number>>(
    new Map()
  );

  const [isLoading, setIsLoading] = useState(true);

  const storeWebsiteMap = useMemo(() => {
    return getStoreWebsiteMap(storeWebsites);
  }, [storeWebsites]);

  const heroStats = useMemo(() => {
    return {
      activePromos: promos.length,
      activeStores: stores.length,
      activeDeals: deals.length,
      communityMembers: topUsers.length,
    };
  }, [promos, stores, deals, topUsers]);

  async function loadHomePage() {
    setIsLoading(true);

    const [promosResult, storesResult, dealsResult, profilesResult, statsResult] =
      await Promise.all([
        supabase
          .from("promo_code_category_stats")
          .select(
            "id, slug, code, store_id, store_name, store_slug, category_name, category_slug, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(9),

        supabase
          .from("store_category_stats")
          .select(
            "id, name, slug, description, website_url, category_names, category_slugs, active_promo_count, promo_count, works_count, not_works_count"
          )
          .eq("status", "active")
          .order("active_promo_count", { ascending: false })
          .limit(8),

        supabase
          .from("store_deal_public_stats")
          .select(
            "id, store_id, store_name, store_slug, store_website_url, category_name, title, slug, description, deal_url, ends_at, status, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("profiles")
          .select(
            "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
          )
          .not("username", "is", null)
          .limit(100),

        supabase
          .from("promo_code_category_stats")
          .select("id, submitted_by, store_id, works_count")
          .eq("status", "approved")
          .not("submitted_by", "is", null)
          .limit(5000),
      ]);

    const nextPromos = promosResult.error
      ? []
      : ((promosResult.data || []) as Promo[]);
    const nextStores = storesResult.error
      ? []
      : ((storesResult.data || []) as Store[]);
    const nextDeals = dealsResult.error
      ? []
      : ((dealsResult.data || []) as Deal[]);
    const baseProfiles = profilesResult.error
      ? []
      : ((profilesResult.data || []) as UserProfile[]);
    const promosForStats = statsResult.error
      ? []
      : ((statsResult.data || []) as PublicPromoForStats[]);

    const authorIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.submitted_by)
          .filter((authorId): authorId is string => Boolean(authorId))
      )
    );

    const missingAuthorIds = authorIds.filter(
      (authorId) => !baseProfiles.some((profile) => profile.id === authorId)
    );

    let extraProfiles: UserProfile[] = [];

    if (missingAuthorIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
        )
        .in("id", missingAuthorIds);

      extraProfiles = (data || []) as UserProfile[];
    }

    const allProfilesMap = new Map<string, UserProfile>();

    for (const profile of [...baseProfiles, ...extraProfiles]) {
      allProfilesMap.set(profile.id, profile);
    }

    const approvedCountMap = new Map<string, number>();

    for (const promo of promosForStats) {
      if (!promo.submitted_by) continue;

      approvedCountMap.set(
        promo.submitted_by,
        (approvedCountMap.get(promo.submitted_by) || 0) + 1
      );
    }

    const storeIds = Array.from(
      new Set(
        nextPromos
          .map((promo) => promo.store_id)
          .filter((storeId): storeId is string => Boolean(storeId))
      )
    );

    let nextStoreWebsites: StoreWebsite[] = [];

    if (storeIds.length > 0) {
      const { data } = await supabase
        .from("store_category_stats")
        .select("id, website_url")
        .in("id", storeIds);

      nextStoreWebsites = (data || []) as StoreWebsite[];
    }

    setPromos(nextPromos);
    setStores(nextStores);
    setDeals(nextDeals);
    setProfilesMap(allProfilesMap);
    setApprovedStatsMap(approvedCountMap);
    setStoreWebsites(nextStoreWebsites);
    setTopUsers(getTopUsers([...allProfilesMap.values()], promosForStats));
    setIsLoading(false);
  }

  useEffect(() => {
    loadHomePage();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-3 py-3 text-white sm:px-5 sm:py-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[360px] animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[520px] sm:rounded-[3rem]" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
            <div className="h-40 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-72" />
            <div className="h-40 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-72" />
            <div className="h-40 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-72" />
            <div className="h-40 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:hidden" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-3 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/30 sm:rounded-[3rem]">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mb-6 sm:px-4 sm:text-sm">
                🐦 На крилах знижок
              </p>

              <h1 className="max-w-4xl text-2xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Промокоди, які перевіряє спільнота
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-slate-300 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                ПромоПтаха збирає промокоди, акції та магазини в одному місці.
                Користувачі додають коди, голосують “працює / не працює” і
                допомагають іншим економити.
              </p>

              <div className="mt-4 grid gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/codes"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-400 px-4 py-2.5 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Знайти промокод
                </Link>

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <Link
                    href="/add"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                  >
                    Додати код
                  </Link>

                  <Link
                    href="/deals"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                  >
                    Акції
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-emerald-300 sm:text-4xl">
                  {heroStats.activePromos}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  промокодів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {heroStats.activeStores}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  магазинів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-yellow-300 sm:text-4xl">
                  {heroStats.activeDeals}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  акцій
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">
                  {heroStats.communityMembers}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  авторів
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-8">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6">
            <SectionHeader
              title="Останні промокоди"
              description="Нові схвалені коди від спільноти."
              href="/codes"
            />

            {promos.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center sm:p-8">
                <div className="text-4xl sm:text-5xl">🎟️</div>
                <h3 className="mt-4 text-xl font-black sm:text-2xl">
                  Промокодів поки немає
                </h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:hidden">
                  {promos.map((promo) => {
                    const websiteUrl = promo.store_id
                      ? storeWebsiteMap.get(promo.store_id)
                      : null;

                    return (
                      <MobilePromoTile
                        key={promo.id}
                        promo={promo}
                        websiteUrl={websiteUrl}
                      />
                    );
                  })}
                </div>

                <div className="hidden gap-5 sm:grid">
                  {promos.map((promo) => {
                    const author = promo.submitted_by
                      ? profilesMap.get(promo.submitted_by)
                      : null;
                    const websiteUrl = promo.store_id
                      ? storeWebsiteMap.get(promo.store_id)
                      : null;
                    const authorApprovedCount = promo.submitted_by
                      ? approvedStatsMap.get(promo.submitted_by) || 0
                      : 0;

                    return (
                      <DesktopPromoCard
                        key={promo.id}
                        promo={promo}
                        websiteUrl={websiteUrl}
                        author={author}
                        authorApprovedCount={authorApprovedCount}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <aside className="grid gap-5 lg:gap-8">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6">
              <SectionHeader
                title="Топ спільноти"
                description="Автори з найбільшою кількістю схвалених кодів."
                href="/users"
              />

              {topUsers.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">👥</div>
                  <p className="mt-3 font-black text-slate-300">
                    Топ поки формується
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:hidden">
                    {topUsers.map((topUser, index) => (
                      <MobileUserTile
                        key={topUser.id}
                        user={topUser}
                        index={index}
                      />
                    ))}
                  </div>

                  <div className="hidden gap-4 sm:grid">
                    {topUsers.map((topUser, index) => (
                      <DesktopUserCard
                        key={topUser.id}
                        user={topUser}
                        index={index}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6">
              <SectionHeader
                title="Акції"
                description="Окремі пропозиції магазинів."
                href="/deals"
              />

              {deals.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">🏷️</div>
                  <p className="mt-3 font-black text-slate-300">
                    Акцій поки немає
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
                  {deals.map((deal) => (
                    <MobileDealTile key={deal.id} deal={deal} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6">
              <SectionHeader
                title="Магазини"
                description="Найактивніші магазини."
                href="/stores"
              />

              {stores.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <div className="text-4xl">🏪</div>
                  <p className="mt-3 font-black text-slate-300">
                    Магазинів поки немає
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
                  {stores.slice(0, 6).map((store) => (
                    <MobileStoreTile key={store.id} store={store} />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}