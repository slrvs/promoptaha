import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

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

type PublicPromo = {
  id: string;
  submitted_by?: string | null;
  store_id?: string | null;
  expires_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
};

type UserStats = {
  approvedPromos: number;
  actualPromos: number;
  worksVotes: number;
  notWorksVotes: number;
  stores: Set<string>;
};

type ProfileWithStats = UserProfile & {
  stats: UserStats;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const metadata: Metadata = {
  title: "Спільнота",
  description:
    "Публічні профілі користувачів ПромоПтахи, які додають промокоди та допомагають іншим економити.",
  alternates: {
    canonical: `${siteUrl}/users`,
  },
  openGraph: {
    title: "Спільнота — ПромоПтаха",
    description:
      "Користувачі ПромоПтахи, їхні публічні профілі та додані промокоди.",
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
    title: "Спільнота — ПромоПтаха",
    description:
      "Користувачі ПромоПтахи, їхні публічні профілі та додані промокоди.",
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

function getAvatarFallback(profile: UserProfile) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function isActualPromo(promo: PublicPromo) {
  if (!promo.expires_at) return true;

  return new Date(promo.expires_at) >= new Date();
}

function createEmptyStats(): UserStats {
  return {
    approvedPromos: 0,
    actualPromos: 0,
    worksVotes: 0,
    notWorksVotes: 0,
    stores: new Set<string>(),
  };
}

async function getProfiles() {
  const supabase = getSupabaseClient();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
    )
    .not("username", "is", null)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) return [];

  return (data || []) as UserProfile[];
}

async function getApprovedPromos() {
  const supabase = getSupabaseClient();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promo_code_category_stats")
    .select("id, submitted_by, store_id, expires_at, works_count, not_works_count")
    .eq("status", "approved")
    .not("submitted_by", "is", null)
    .limit(5000);

  if (error) return [];

  return (data || []) as unknown as PublicPromo[];
}

async function getProfilesWithStats() {
  const [profiles, promos] = await Promise.all([
    getProfiles(),
    getApprovedPromos(),
  ]);

  const statsByUserId = new Map<string, UserStats>();

  for (const profile of profiles) {
    statsByUserId.set(profile.id, createEmptyStats());
  }

  for (const promo of promos) {
    if (!promo.submitted_by) continue;

    const stats = statsByUserId.get(promo.submitted_by) || createEmptyStats();

    stats.approvedPromos += 1;
    stats.worksVotes += Number(promo.works_count || 0);
    stats.notWorksVotes += Number(promo.not_works_count || 0);

    if (isActualPromo(promo)) {
      stats.actualPromos += 1;
    }

    if (promo.store_id) {
      stats.stores.add(promo.store_id);
    }

    statsByUserId.set(promo.submitted_by, stats);
  }

  return profiles
    .map((profile) => ({
      ...profile,
      stats: statsByUserId.get(profile.id) || createEmptyStats(),
    }))
    .sort((firstProfile, secondProfile) => {
      if (
        secondProfile.stats.approvedPromos !== firstProfile.stats.approvedPromos
      ) {
        return (
          secondProfile.stats.approvedPromos -
          firstProfile.stats.approvedPromos
        );
      }

      return secondProfile.stats.worksVotes - firstProfile.stats.worksVotes;
    });
}

function UsersLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="h-[420px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />

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
  const profiles = await getProfilesWithStats();

  const totalProfiles = profiles.length;
  const totalApprovedPromos = profiles.reduce(
    (sum, profile) => sum + profile.stats.approvedPromos,
    0
  );
  const totalWorksVotes = profiles.reduce(
    (sum, profile) => sum + profile.stats.worksVotes,
    0
  );
  const activeContributors = profiles.filter(
    (profile) => profile.stats.approvedPromos > 0
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Спільнота</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Спільнота ПромоПтахи
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Люди, які несуть знижки
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зібрані публічні профілі користувачів, які додають
                промокоди, перевіряють їх і допомагають іншим економити.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/add"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Додати промокод
                </Link>

                <Link
                  href="/profile"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Мій профіль
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {totalProfiles}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  публічних профілів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {activeContributors}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  додавали промокоди
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {totalApprovedPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалених промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {totalWorksVotes}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  голосів “працює”
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div>
            <h2 className="text-3xl font-black">Користувачі</h2>

            <p className="mt-2 leading-7 text-slate-400">
              Першими показуються ті, хто додав найбільше схвалених
              промокодів.
            </p>
          </div>

          {profiles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🐦</div>

              <h3 className="mt-4 text-2xl font-black">
                Публічних профілів поки немає
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Коли користувачі додадуть нікнейм у профілі, вони зʼявляться
                тут.
              </p>

              <Link
                href="/profile"
                className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Налаштувати профіль
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile: ProfileWithStats, index) => (
                <article
                  key={profile.id}
                  className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-2xl font-black text-emerald-300">
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
                        <h3 className="truncate text-2xl font-black text-white">
                          {getProfileName(profile)}
                        </h3>

                        <p className="mt-1 truncate text-sm font-black text-emerald-300">
                          @{profile.username}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-400">
                      #{index + 1}
                    </span>
                  </div>

                  {profile.bio ? (
                    <p className="mt-5 line-clamp-3 leading-7 text-slate-400">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-5 leading-7 text-slate-500">
                      Користувач ще не додав опис профілю.
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {profile.stats.approvedPromos}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        промокодів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-emerald-300">
                        {profile.stats.actualPromos}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        актуальні
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-yellow-300">
                        {profile.stats.worksVotes}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {profile.stats.stores.size}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        магазинів
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <Link
                      href={`/u/${profile.username}`}
                      className="inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити профіль
                    </Link>
                  </div>

                  <p className="mt-4 text-xs font-bold text-slate-600">
                    На сайті з {formatDate(profile.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersContent />
    </Suspense>
  );
}