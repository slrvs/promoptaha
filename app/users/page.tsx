import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import UsersClient, { type CommunityUser } from "./UsersClient";

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

type PromoForStats = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  works_count?: number | null;
};

export const metadata: Metadata = {
  title: "Спільнота",
  description:
    "Автори ПромоПтахи: користувачі, які додають промокоди, допомагають перевіряти знижки та розвивають базу магазинів.",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createServerSupabaseClient() {
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder",
    {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
          }),
      },
    }
  );
}

function getUserName(profile: UserProfile) {
  return (
    profile.display_name ||
    profile.username ||
    profile.email?.split("@")[0] ||
    "Користувач"
  );
}

async function getCommunityUsers() {
  const supabase = createServerSupabaseClient();

  const [profilesResult, promosResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, username, display_name, avatar_url, bio, created_at, updated_at"
      )
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("promo_code_category_stats")
      .select("id, submitted_by, store_id, works_count")
      .eq("status", "approved")
      .not("submitted_by", "is", null)
      .limit(5000),
  ]);

  const profiles = profilesResult.error
    ? []
    : ((profilesResult.data || []) as UserProfile[]);

  const promos = promosResult.error
    ? []
    : ((promosResult.data || []) as PromoForStats[]);

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

  for (const promo of promos) {
    if (!promo.submitted_by) continue;

    const stats = statsMap.get(promo.submitted_by);

    if (!stats) continue;

    stats.approvedPromos += 1;
    stats.worksCount += Number(promo.works_count || 0);

    if (promo.store_id) {
      stats.storeIds.add(promo.store_id);
    }
  }

  const users: CommunityUser[] = profiles.map((profile) => {
    const stats = statsMap.get(profile.id);

    return {
      id: profile.id,
      email: profile.email || null,
      username: profile.username || null,
      displayName: profile.display_name || null,
      avatarUrl: profile.avatar_url || null,
      bio: profile.bio || null,
      createdAt: profile.created_at || null,
      updatedAt: profile.updated_at || null,
      name: getUserName(profile),
      approvedPromos: stats?.approvedPromos || 0,
      storesCount: stats?.storeIds.size || 0,
      worksCount: stats?.worksCount || 0,
    };
  });

  return users.sort((firstUser, secondUser) => {
    if (secondUser.approvedPromos !== firstUser.approvedPromos) {
      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    return secondUser.worksCount - firstUser.worksCount;
  });
}

async function UsersContent() {
  const users = await getCommunityUsers();

  return <UsersClient initialUsers={users} />;
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
          <section className="mx-auto w-full max-w-7xl">
            <div className="h-[360px] animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900 sm:h-[420px] sm:rounded-[2.5rem]" />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
              <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
              <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
              <div className="h-48 animate-pulse rounded-[1.5rem] border border-slate-800 bg-slate-900 sm:h-80 sm:rounded-[2rem]" />
            </div>
          </section>
        </main>
      }
    >
      <UsersContent />
    </Suspense>
  );
}