import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import UsersClient, { type CommunityUser } from "./UsersClient";

type UserProfile = {
  id: string;
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

type PromoForStats = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  expires_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const metadata: Metadata = {
  title: "Спільнота",
  description:
    "Користувачі ПромоПтахи, які додають промокоди, перевіряють знижки та допомагають іншим економити.",
  alternates: {
    canonical: `${siteUrl}/users`,
  },
  openGraph: {
    title: "Спільнота | ПромоПтаха",
    description:
      "Користувачі ПромоПтахи, які додають промокоди, перевіряють знижки та допомагають іншим економити.",
    type: "website",
    url: `${siteUrl}/users`,
    images: [
      {
        url: "/icons/promoptaha-bird.png",
        width: 512,
        height: 512,
        alt: "ПромоПтаха",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Спільнота | ПромоПтаха",
    description:
      "Користувачі ПромоПтахи, які додають промокоди, перевіряють знижки та допомагають іншим економити.",
    images: ["/icons/promoptaha-bird.png"],
  },
};

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => {
        return fetch(input, {
          ...init,
          cache: "no-store",
        });
      },
    },
  });
}

function getProfileName(profile: UserProfile) {
  return profile.display_name || profile.username || "Користувач";
}

function isActualPromo(promo: PromoForStats) {
  if (!promo.expires_at) return true;

  return new Date(promo.expires_at) >= new Date();
}

async function getCommunityUsers(): Promise<CommunityUser[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const [profilesResult, promosResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
      )
      .not("username", "is", null)
      .order("created_at", { ascending: true })
      .limit(500),

    supabase
      .from("promo_code_category_stats")
      .select(
        "id, submitted_by, store_id, expires_at, works_count, not_works_count"
      )
      .eq("status", "approved")
      .not("submitted_by", "is", null)
      .limit(10000),
  ]);

  if (profilesResult.error || promosResult.error) {
    return [];
  }

  const profiles = (profilesResult.data || []) as UserProfile[];
  const promos = (promosResult.data || []) as unknown as PromoForStats[];

  const statsMap = new Map<
    string,
    {
      approvedPromos: number;
      actualPromos: number;
      expiredPromos: number;
      worksVotes: number;
      notWorksVotes: number;
      storeIds: Set<string>;
    }
  >();

  for (const profile of profiles) {
    statsMap.set(profile.id, {
      approvedPromos: 0,
      actualPromos: 0,
      expiredPromos: 0,
      worksVotes: 0,
      notWorksVotes: 0,
      storeIds: new Set<string>(),
    });
  }

  for (const promo of promos) {
    if (!promo.submitted_by) continue;

    const stats = statsMap.get(promo.submitted_by);

    if (!stats) continue;

    stats.approvedPromos += 1;
    stats.worksVotes += Number(promo.works_count || 0);
    stats.notWorksVotes += Number(promo.not_works_count || 0);

    if (isActualPromo(promo)) {
      stats.actualPromos += 1;
    } else {
      stats.expiredPromos += 1;
    }

    if (promo.store_id) {
      stats.storeIds.add(promo.store_id);
    }
  }

  return profiles
    .map((profile) => {
      const stats = statsMap.get(profile.id) || {
        approvedPromos: 0,
        actualPromos: 0,
        expiredPromos: 0,
        worksVotes: 0,
        notWorksVotes: 0,
        storeIds: new Set<string>(),
      };

      return {
        ...profile,
        approvedPromos: stats.approvedPromos,
        actualPromos: stats.actualPromos,
        expiredPromos: stats.expiredPromos,
        worksVotes: stats.worksVotes,
        notWorksVotes: stats.notWorksVotes,
        storesCount: stats.storeIds.size,
      };
    })
    .sort((firstUser, secondUser) => {
      if (secondUser.approvedPromos !== firstUser.approvedPromos) {
        return secondUser.approvedPromos - firstUser.approvedPromos;
      }

      if (secondUser.worksVotes !== firstUser.worksVotes) {
        return secondUser.worksVotes - firstUser.worksVotes;
      }

      return getProfileName(firstUser).localeCompare(getProfileName(secondUser));
    });
}

function UsersLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-[380px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />

        <div className="mt-8 h-32 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

async function UsersContent() {
  const users = await getCommunityUsers();

  return <UsersClient users={users} />;
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersContent />
    </Suspense>
  );
}