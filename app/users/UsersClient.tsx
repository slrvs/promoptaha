"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UserLevelBadge from "@/components/UserLevelBadge";

export type CommunityUser = {
  id: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  name: string;
  approvedPromos: number;
  storesCount: number;
  worksCount: number;
};

type UsersClientProps = {
  initialUsers: CommunityUser[];
};

type SortMode =
  | "top"
  | "newest"
  | "oldest"
  | "promos"
  | "stores"
  | "works"
  | "name";

type LevelFilter =
  | "all"
  | "newbie"
  | "author"
  | "hunter"
  | "top_author"
  | "legend";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ʼ’`]/g, "'")
    .replace(/\s+/g, " ");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getAvatarFallback(user: CommunityUser) {
  const name = user.name.trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function userMatchesSearch(user: CommunityUser, searchQuery: string) {
  const query = normalizeText(searchQuery);

  if (!query) return true;

  const searchableText = normalizeText(
    [
      user.name,
      user.username,
      user.email,
      user.bio,
      user.approvedPromos,
      user.storesCount,
      user.worksCount,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return searchableText.includes(query);
}

function userMatchesLevel(user: CommunityUser, levelFilter: LevelFilter) {
  if (levelFilter === "all") return true;

  if (levelFilter === "newbie") {
    return user.approvedPromos === 0;
  }

  if (levelFilter === "author") {
    return user.approvedPromos >= 1 && user.approvedPromos < 5;
  }

  if (levelFilter === "hunter") {
    return user.approvedPromos >= 5 && user.approvedPromos < 15;
  }

  if (levelFilter === "top_author") {
    return user.approvedPromos >= 15 && user.approvedPromos < 50;
  }

  if (levelFilter === "legend") {
    return user.approvedPromos >= 50;
  }

  return true;
}

function sortUsers(users: CommunityUser[], sortMode: SortMode) {
  return [...users].sort((firstUser, secondUser) => {
    if (sortMode === "newest") {
      return (
        new Date(secondUser.createdAt || 0).getTime() -
        new Date(firstUser.createdAt || 0).getTime()
      );
    }

    if (sortMode === "oldest") {
      return (
        new Date(firstUser.createdAt || 0).getTime() -
        new Date(secondUser.createdAt || 0).getTime()
      );
    }

    if (sortMode === "promos") {
      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    if (sortMode === "stores") {
      return secondUser.storesCount - firstUser.storesCount;
    }

    if (sortMode === "works") {
      return secondUser.worksCount - firstUser.worksCount;
    }

    if (sortMode === "name") {
      return firstUser.name.localeCompare(secondUser.name, "uk");
    }

    if (secondUser.approvedPromos !== firstUser.approvedPromos) {
      return secondUser.approvedPromos - firstUser.approvedPromos;
    }

    return secondUser.worksCount - firstUser.worksCount;
  });
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("top");

  const filteredUsers = useMemo(() => {
    const filtered = initialUsers.filter((user) => {
      return (
        userMatchesSearch(user, searchQuery) &&
        userMatchesLevel(user, levelFilter)
      );
    });

    return sortUsers(filtered, sortMode);
  }, [initialUsers, searchQuery, levelFilter, sortMode]);

  const stats = useMemo(() => {
    const totalUsers = initialUsers.length;
    const usersWithPromos = initialUsers.filter(
      (user) => user.approvedPromos > 0
    ).length;
    const totalPromos = initialUsers.reduce(
      (sum, user) => sum + user.approvedPromos,
      0
    );
    const totalWorks = initialUsers.reduce(
      (sum, user) => sum + user.worksCount,
      0
    );
    const legends = initialUsers.filter(
      (user) => user.approvedPromos >= 50
    ).length;

    return {
      totalUsers,
      usersWithPromos,
      totalPromos,
      totalWorks,
      legends,
      found: filteredUsers.length,
    };
  }, [initialUsers, filteredUsers]);

  function resetFilters() {
    setSearchQuery("");
    setLevelFilter("all");
    setSortMode("top");
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

        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/30">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Спільнота ПромоПтахи
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Автори, які приносять знижки
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Тут зібрані користувачі, які додають промокоди, допомагають
                перевіряти їх і розвивають базу знижок.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/levels"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Як працюють рівні
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
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
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.totalUsers}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  користувачів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {stats.usersWithPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  авторів з кодами
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {stats.totalPromos}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалених кодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">
                  {stats.legends}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  легенд спільноти
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.55fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Імʼя, username, опис..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Рівень</span>

              <select
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(event.target.value as LevelFilter)
                }
                className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">Всі рівні</option>
                <option value="newbie">🐣 Новачки</option>
                <option value="author">🟢 Автори</option>
                <option value="hunter">🔥 Мисливці</option>
                <option value="top_author">🏆 Топ автори</option>
                <option value="legend">👑 Легенди</option>
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
                <option value="top">Топ спочатку</option>
                <option value="newest">Новіші</option>
                <option value="oldest">Старіші</option>
                <option value="promos">За кодами</option>
                <option value="stores">За магазинами</option>
                <option value="works">За підтвердженнями</option>
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
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Учасники</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Показано: {stats.found} / {stats.totalUsers}
              </p>
            </div>

            <Link
              href="/levels"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Рівні спільноти
            </Link>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">👥</div>

              <h3 className="mt-4 text-2xl font-black">
                Користувачів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Спробуй змінити пошук, рівень або сортування.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((user, index) => (
                <article
                  key={user.id}
                  className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-2xl font-black text-emerald-300">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{getAvatarFallback(user)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-black text-slate-400">
                          #{index + 1}
                        </span>

                        <UserLevelBadge
                          approvedPromos={user.approvedPromos}
                          size="sm"
                        />
                      </div>

                      {user.username ? (
                        <Link
                          href={`/u/${user.username}`}
                          className="break-words text-2xl font-black text-white transition hover:text-emerald-300"
                        >
                          {user.name}
                        </Link>
                      ) : (
                        <p className="break-words text-2xl font-black text-white">
                          {user.name}
                        </p>
                      )}

                      {user.username && (
                        <p className="mt-1 text-sm font-bold text-emerald-300">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {user.bio && (
                    <p className="mt-5 line-clamp-3 leading-7 text-slate-400">
                      {user.bio}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <p className="text-xl font-black text-emerald-300">
                        {user.approvedPromos}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        кодів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <p className="text-xl font-black text-white">
                        {user.storesCount}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        магазинів
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <p className="text-xl font-black text-yellow-300">
                        {user.worksCount}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        працює
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    {user.username ? (
                      <Link
                        href={`/u/${user.username}`}
                        className="inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                      >
                        Відкрити профіль
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-400">
                        Без публічного username
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-bold text-slate-600">
                    На сайті з {formatDate(user.createdAt)}
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