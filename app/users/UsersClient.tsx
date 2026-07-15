"use client";

import UserLevelBadge from "@/components/UserLevelBadge";
import { useMemo, useState } from "react";
import Link from "next/link";

export type CommunityUser = {
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
  approvedPromos: number;
  actualPromos: number;
  expiredPromos: number;
  worksVotes: number;
  notWorksVotes: number;
  storesCount: number;
};

type UsersClientProps = {
  users: CommunityUser[];
};

type SortMode =
  | "top_promos"
  | "actual_promos"
  | "works_votes"
  | "stores"
  | "newest"
  | "oldest"
  | "name";

type FilterMode = "all" | "authors" | "with_bio" | "with_socials" | "empty";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, " ");
}

function getProfileName(profile: CommunityUser) {
  return profile.display_name || profile.username || "Користувач";
}

function getAvatarFallback(profile: CommunityUser) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getSocialCount(profile: CommunityUser) {
  return [
    profile.website_url,
    profile.instagram_url,
    profile.telegram_url,
    profile.tiktok_url,
    profile.youtube_url,
  ].filter(Boolean).length;
}

function userMatchesSearch(user: CommunityUser, searchQuery: string) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableText = normalizeText(
    [
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

function userMatchesFilter(user: CommunityUser, filterMode: FilterMode) {
  if (filterMode === "all") return true;

  if (filterMode === "authors") {
    return user.approvedPromos > 0;
  }

  if (filterMode === "with_bio") {
    return Boolean(user.bio?.trim());
  }

  if (filterMode === "with_socials") {
    return getSocialCount(user) > 0;
  }

  if (filterMode === "empty") {
    return user.approvedPromos === 0;
  }

  return true;
}

function sortUsers(users: CommunityUser[], sortMode: SortMode) {
  return [...users].sort((firstUser, secondUser) => {
    if (sortMode === "actual_promos") {
      if (secondUser.actualPromos !== firstUser.actualPromos) {
        return secondUser.actualPromos - firstUser.actualPromos;
      }

      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    if (sortMode === "works_votes") {
      if (secondUser.worksVotes !== firstUser.worksVotes) {
        return secondUser.worksVotes - firstUser.worksVotes;
      }

      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    if (sortMode === "stores") {
      if (secondUser.storesCount !== firstUser.storesCount) {
        return secondUser.storesCount - firstUser.storesCount;
      }

      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    if (sortMode === "newest") {
      return (
        new Date(secondUser.created_at || 0).getTime() -
        new Date(firstUser.created_at || 0).getTime()
      );
    }

    if (sortMode === "oldest") {
      return (
        new Date(firstUser.created_at || 0).getTime() -
        new Date(secondUser.created_at || 0).getTime()
      );
    }

    if (sortMode === "name") {
      return getProfileName(firstUser).localeCompare(getProfileName(secondUser));
    }

    if (secondUser.approvedPromos !== firstUser.approvedPromos) {
      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    if (secondUser.worksVotes !== firstUser.worksVotes) {
      return secondUser.worksVotes - firstUser.worksVotes;
    }

    return getProfileName(firstUser).localeCompare(getProfileName(secondUser));
  });
}

export default function UsersClient({ users }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("top_promos");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      return (
        userMatchesSearch(user, searchQuery) &&
        userMatchesFilter(user, filterMode)
      );
    });

    return sortUsers(filtered, sortMode);
  }, [users, searchQuery, filterMode, sortMode]);

  const globalStats = useMemo(() => {
    return {
      publicProfiles: users.length,
      activeAuthors: users.filter((user) => user.approvedPromos > 0).length,
      totalPromos: users.reduce((sum, user) => sum + user.approvedPromos, 0),
      totalActualPromos: users.reduce(
        (sum, user) => sum + user.actualPromos,
        0
      ),
      totalExpiredPromos: users.reduce(
        (sum, user) => sum + user.expiredPromos,
        0
      ),
      totalWorksVotes: users.reduce((sum, user) => sum + user.worksVotes, 0),
      totalNotWorksVotes: users.reduce(
        (sum, user) => sum + user.notWorksVotes,
        0
      ),
      usersWithSocials: users.filter((user) => getSocialCount(user) > 0).length,
    };
  }, [users]);

  const filteredStats = useMemo(() => {
    return {
      users: filteredUsers.length,
      authors: filteredUsers.filter((user) => user.approvedPromos > 0).length,
      promos: filteredUsers.reduce((sum, user) => sum + user.approvedPromos, 0),
      actual: filteredUsers.reduce((sum, user) => sum + user.actualPromos, 0),
      works: filteredUsers.reduce((sum, user) => sum + user.worksVotes, 0),
    };
  }, [filteredUsers]);

  function resetFilters() {
    setSearchQuery("");
    setFilterMode("all");
    setSortMode("top_promos");
  }

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
          <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Спільнота ПромоПтахи
              </p>

              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Люди, які допомагають знаходити знижки
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зібрані користувачі, які налаштували публічний профіль,
                додають промокоди та допомагають перевіряти актуальність
                знижок.
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

                <Link
                  href="/codes"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Всі промокоди
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {globalStats.publicProfiles}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  публічних профілів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {globalStats.activeAuthors}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  активних авторів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {globalStats.totalActualPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  актуальних промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {globalStats.totalWorksVotes}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  голосів “працює”
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Нікнейм, імʼя, опис, соцмережа..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Фільтр</span>

              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі профілі</option>
                <option value="authors">Тільки автори</option>
                <option value="with_bio">З описом</option>
                <option value="with_socials">З посиланнями</option>
                <option value="empty">Без промокодів</option>
              </select>
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
                <option value="top_promos">Більше промокодів</option>
                <option value="actual_promos">Більше актуальних</option>
                <option value="works_votes">Більше голосів “працює”</option>
                <option value="stores">Більше магазинів</option>
                <option value="newest">Нові профілі</option>
                <option value="oldest">Старі профілі</option>
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
                {filteredStats.users}
              </p>
              <p className="text-xs font-bold text-slate-500">знайдено</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-emerald-300">
                {filteredStats.authors}
              </p>
              <p className="text-xs font-bold text-slate-500">авторів</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-white">
                {filteredStats.promos}
              </p>
              <p className="text-xs font-bold text-slate-500">промокодів</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-yellow-300">
                {filteredStats.actual}
              </p>
              <p className="text-xs font-bold text-slate-500">актуальних</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-2xl font-black text-white">
                {filteredStats.works}
              </p>
              <p className="text-xs font-bold text-slate-500">працює</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Учасники</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Можна шукати за нікнеймом, імʼям, описом або посиланнями.
              </p>
            </div>

            <p className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-black text-slate-300">
              Показано: {filteredUsers.length} / {users.length}
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-950 p-10 text-center">
              <div className="text-6xl">🐦</div>

              <h3 className="mt-5 text-3xl font-black">
                Нічого не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Спробуй змінити пошук, фільтр або сортування.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((user, index) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-emerald-400/30 bg-slate-900 text-3xl font-black text-emerald-300">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={getProfileName(user)}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{getAvatarFallback(user)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-black text-slate-400">
                          #{index + 1}
                        </span>

                        <UserLevelBadge approvedPromos={user.approvedPromos} size="sm" />
                     
                      </div>

                      <h3 className="mt-2 truncate text-2xl font-black text-white">
                        {getProfileName(user)}
                      </h3>

                      <p className="mt-1 truncate text-sm font-black text-emerald-300">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {user.bio ? (
                    <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-400">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="mt-5 line-clamp-3 min-h-[84px] leading-7 text-slate-500">
                      Користувач ще не додав опис профілю.
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {user.approvedPromos}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        промокодів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-emerald-300">
                        {user.actualPromos}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        актуальні
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-yellow-300">
                        {user.worksVotes}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-2xl font-black text-white">
                        {user.storesCount}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        магазинів
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">
                      На сайті з {formatDate(user.created_at)}
                    </span>

                    {getSocialCount(user) > 0 && (
                      <span className="rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">
                        посилань: {getSocialCount(user)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}