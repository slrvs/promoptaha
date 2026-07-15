"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import UserLevelBadge from "@/components/UserLevelBadge";

type SortMode =
  | "newest"
  | "oldest"
  | "promos"
  | "approved"
  | "pending"
  | "rejected"
  | "comments"
  | "favorites"
  | "name";

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
  submitted_by?: string | null;
  status?: string | null;
};

type PromoComment = {
  id: string;
  user_id: string;
  status?: string | null;
};

type PromoFavorite = {
  id: string;
  user_id: string;
};

type AdminUser = UserProfile & {
  promosTotal: number;
  promosApproved: number;
  promosPending: number;
  promosRejected: number;
  commentsTotal: number;
  commentsVisible: number;
  favoritesTotal: number;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, " ");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getProfileName(profile: UserProfile) {
  return (
    profile.display_name || profile.username || profile.email || "Користувач"
  );
}

function getAvatarFallback(profile: UserProfile) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function getSocialCount(profile: UserProfile) {
  return [
    profile.website_url,
    profile.instagram_url,
    profile.telegram_url,
    profile.tiktok_url,
    profile.youtube_url,
  ].filter(Boolean).length;
}

function getAdminProfileHref(user: AdminUser) {
  return `/admin/users/${encodeURIComponent(user.username || user.id)}`;
}

function userMatchesSearch(user: AdminUser, searchQuery: string) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableText = normalizeText(
    [
      user.email,
      user.username,
      user.display_name,
      user.bio,
      user.website_url,
      user.instagram_url,
      user.telegram_url,
      user.tiktok_url,
      user.youtube_url,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(query);
}

function sortUsers(users: AdminUser[], sortMode: SortMode) {
  return [...users].sort((firstUser, secondUser) => {
    if (sortMode === "oldest") {
      return (
        new Date(firstUser.created_at || 0).getTime() -
        new Date(secondUser.created_at || 0).getTime()
      );
    }

    if (sortMode === "promos") {
      return secondUser.promosTotal - firstUser.promosTotal;
    }

    if (sortMode === "approved") {
      return secondUser.promosApproved - firstUser.promosApproved;
    }

    if (sortMode === "pending") {
      return secondUser.promosPending - firstUser.promosPending;
    }

    if (sortMode === "rejected") {
      return secondUser.promosRejected - firstUser.promosRejected;
    }

    if (sortMode === "comments") {
      return secondUser.commentsTotal - firstUser.commentsTotal;
    }

    if (sortMode === "favorites") {
      return secondUser.favoritesTotal - firstUser.favoritesTotal;
    }

    if (sortMode === "name") {
      return getProfileName(firstUser).localeCompare(
        getProfileName(secondUser)
      );
    }

    return (
      new Date(secondUser.created_at || 0).getTime() -
      new Date(firstUser.created_at || 0).getTime()
    );
  });
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [isLoading, setIsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isAdmin = user?.email === adminEmail;

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((item) =>
      userMatchesSearch(item, searchQuery)
    );

    return sortUsers(filtered, sortMode);
  }, [users, searchQuery, sortMode]);

  const stats = useMemo(() => {
    return {
      usersTotal: users.length,
      usersWithUsername: users.filter((item) => item.username).length,
      usersWithBio: users.filter((item) => item.bio?.trim()).length,
      usersWithSocials: users.filter((item) => getSocialCount(item) > 0).length,
      promosTotal: users.reduce((sum, item) => sum + item.promosTotal, 0),
      promosApproved: users.reduce(
        (sum, item) => sum + item.promosApproved,
        0
      ),
      promosPending: users.reduce((sum, item) => sum + item.promosPending, 0),
      promosRejected: users.reduce((sum, item) => sum + item.promosRejected, 0),
      commentsTotal: users.reduce((sum, item) => sum + item.commentsTotal, 0),
      favoritesTotal: users.reduce((sum, item) => sum + item.favoritesTotal, 0),
    };
  }, [users]);

  async function loadAdminPage() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    setUser(userData.user);

    if (!userData.user || userData.user.email !== adminEmail) {
      setIsLoading(false);
      return;
    }

    await loadUsers();

    setIsLoading(false);
  }

  async function loadUsers() {
    const [profilesResult, promosResult, commentsResult, favoritesResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
          )
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase.from("promo_codes").select("id, submitted_by, status").limit(10000),

        supabase.from("promo_comments").select("id, user_id, status").limit(10000),

        supabase.from("promo_favorites").select("id, user_id").limit(10000),
      ]);

    if (profilesResult.error) {
      setUsers([]);
      setMessage(
        `Не вдалося завантажити користувачів: ${profilesResult.error.message}`
      );
      setMessageType("error");
      return;
    }

    const profiles = (profilesResult.data || []) as UserProfile[];
    const promos = promosResult.error
      ? []
      : ((promosResult.data || []) as PromoCode[]);
    const comments = commentsResult.error
      ? []
      : ((commentsResult.data || []) as PromoComment[]);
    const favorites = favoritesResult.error
      ? []
      : ((favoritesResult.data || []) as PromoFavorite[]);

    const statsMap = new Map<
      string,
      {
        promosTotal: number;
        promosApproved: number;
        promosPending: number;
        promosRejected: number;
        commentsTotal: number;
        commentsVisible: number;
        favoritesTotal: number;
      }
    >();

    for (const profile of profiles) {
      statsMap.set(profile.id, {
        promosTotal: 0,
        promosApproved: 0,
        promosPending: 0,
        promosRejected: 0,
        commentsTotal: 0,
        commentsVisible: 0,
        favoritesTotal: 0,
      });
    }

    for (const promo of promos) {
      if (!promo.submitted_by) continue;

      const userStats = statsMap.get(promo.submitted_by);

      if (!userStats) continue;

      userStats.promosTotal += 1;

      if (promo.status === "approved") {
        userStats.promosApproved += 1;
      }

      if (promo.status === "pending") {
        userStats.promosPending += 1;
      }

      if (promo.status === "rejected") {
        userStats.promosRejected += 1;
      }
    }

    for (const comment of comments) {
      if (!comment.user_id) continue;

      const userStats = statsMap.get(comment.user_id);

      if (!userStats) continue;

      userStats.commentsTotal += 1;

      if (comment.status === "visible") {
        userStats.commentsVisible += 1;
      }
    }

    for (const favorite of favorites) {
      if (!favorite.user_id) continue;

      const userStats = statsMap.get(favorite.user_id);

      if (!userStats) continue;

      userStats.favoritesTotal += 1;
    }

    const nextUsers = profiles.map((profile) => {
      const profileStats = statsMap.get(profile.id) || {
        promosTotal: 0,
        promosApproved: 0,
        promosPending: 0,
        promosRejected: 0,
        commentsTotal: 0,
        commentsVisible: 0,
        favoritesTotal: 0,
      };

      return {
        ...profile,
        ...profileStats,
      };
    });

    setUsers(nextUsers);
  }

  useEffect(() => {
    loadAdminPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function resetFilters() {
    setSearchQuery("");
    setSortMode("newest");
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

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-4xl font-black">Потрібен вхід</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Щоб відкрити адмінку користувачів, потрібно увійти.
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
          <span className="text-slate-300">Користувачі</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Адмінка
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Користувачі
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут видно профілі користувачів, їхню активність, промокоди,
                коментарі та збережені коди.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Модерація промокодів
                </Link>

                <Link
                  href="/admin/comments"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Коментарі
                </Link>

                <Link
                  href="/admin/stats"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Аналітика
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.usersTotal}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  користувачів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.promosApproved}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалених кодів
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

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Email, username, імʼя, опис..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Сортування
              </span>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="newest">Нові профілі</option>
                <option value="oldest">Старі профілі</option>
                <option value="promos">Більше промокодів</option>
                <option value="approved">Більше схвалених</option>
                <option value="pending">Більше pending</option>
                <option value="rejected">Більше відхилених</option>
                <option value="comments">Більше коментарів</option>
                <option value="favorites">Більше збережень</option>
                <option value="name">За імʼям</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 px-5 py-4 font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Скинути
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-white">
                {filteredUsers.length}
              </p>
              <p className="text-xs font-bold text-slate-500">знайдено</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-emerald-300">
                {stats.usersWithUsername}
              </p>
              <p className="text-xs font-bold text-slate-500">з нікнеймом</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-white">
                {stats.usersWithBio}
              </p>
              <p className="text-xs font-bold text-slate-500">з описом</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-yellow-300">
                {stats.usersWithSocials}
              </p>
              <p className="text-xs font-bold text-slate-500">із соцмережами</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-red-300">
                {stats.promosRejected}
              </p>
              <p className="text-xs font-bold text-slate-500">відхилених</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Список користувачів</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Показано: {filteredUsers.length} / {users.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Оновити
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">👥</div>

              <h3 className="mt-4 text-2xl font-black">
                Користувачів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Зміни пошук або сортування.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              {filteredUsers.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-emerald-400/30 bg-slate-900 text-3xl font-black text-emerald-300">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={getProfileName(item)}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{getAvatarFallback(item)}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <UserLevelBadge
                            approvedPromos={item.promosApproved}
                            size="sm"
                          />

                          {item.username ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-black text-emerald-300">
                              @{item.username}
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
                              без username
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 break-words text-3xl font-black text-white">
                          {getProfileName(item)}
                        </h3>

                        <p className="mt-1 break-all text-sm font-bold text-slate-500">
                          {item.email || "email не вказано"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={getAdminProfileHref(item)}
                        className="rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-200"
                      >
                        Адмін-профіль
                      </Link>

                      {item.username && (
                        <Link
                          href={`/u/${item.username}`}
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                        >
                          Публічний профіль
                        </Link>
                      )}
                    </div>
                  </div>

                  {item.bio && (
                    <p className="mt-5 line-clamp-3 leading-7 text-slate-400">
                      {item.bio}
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {item.promosTotal}
                      </p>
                      <p className="text-xs font-bold text-slate-500">всього</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-emerald-300">
                        {item.promosApproved}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        схвалено
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-yellow-300">
                        {item.promosPending}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        pending
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-red-300">
                        {item.promosRejected}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        відхилено
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {item.commentsTotal}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        коментарів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {item.favoritesTotal}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        збережень
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {getSocialCount(item)}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        посилань
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-400">
                      Створено: {formatDate(item.created_at)}
                    </span>

                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-400">
                      Оновлено: {formatDate(item.updated_at)}
                    </span>
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