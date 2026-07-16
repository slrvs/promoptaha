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
    .replace(/[’`]/g, "'")
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function getAvatarFallback(user: CommunityUser) {
  const name = user.name.trim();

  if (!name) return "П";

  return name.slice(0, 1).toUpperCase();
}

function getMobileLevel(user: CommunityUser) {
  if (user.approvedPromos >= 50) {
    return {
      emoji: "👑",
      label: "Легенда",
      className: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    };
  }

  if (user.approvedPromos >= 15) {
    return {
      emoji: "🏆",
      label: "Топ автор",
      className: "border-orange-400/40 bg-orange-400/10 text-orange-300",
    };
  }

  if (user.approvedPromos >= 5) {
    return {
      emoji: "🔥",
      label: "Мисливець",
      className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (user.approvedPromos >= 1) {
    return {
      emoji: "🟢",
      label: "Автор",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    emoji: "🐣",
    label: "Новачок",
    className: "border-slate-700 bg-slate-900 text-slate-300",
  };
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

function MobileUserTile({
  user,
  index,
}: {
  user: CommunityUser;
  index: number;
}) {
  const level = getMobileLevel(user);

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-400">
          #{index + 1}
        </span>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 text-base font-black text-emerald-300">
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
      </div>

      <div className="mt-4 min-w-0">
        <p className="truncate text-base font-black text-white">{user.name}</p>

        {user.username && (
          <p className="mt-1 truncate text-[11px] font-bold text-emerald-300">
            @{user.username}
          </p>
        )}

        <div
          className={`mt-3 inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-1 text-[10px] font-black ${level.className}`}
        >
          <span>{level.emoji}</span>
          <span className="truncate">{level.label}</span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
          <p className="text-lg font-black text-emerald-300">
            {formatNumber(user.approvedPromos)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-slate-500">кодів</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
          <p className="text-lg font-black text-white">
            {formatNumber(user.storesCount)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-slate-500">магаз.</p>
        </div>
      </div>
    </>
  );

  if (!user.username) {
    return (
      <div className="flex min-h-[195px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/u/${user.username}`}
      className="group flex min-h-[195px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40"
    >
      {content}

      <span className="mt-3 inline-flex w-full justify-center rounded-full bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition group-hover:bg-emerald-300">
        Профіль
      </span>
    </Link>
  );
}

function DesktopUserCard({
  user,
  index,
}: {
  user: CommunityUser;
  index: number;
}) {
  return (
    <article className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40">
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

            <UserLevelBadge approvedPromos={user.approvedPromos} size="sm" />
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
            {formatNumber(user.approvedPromos)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">кодів</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-xl font-black text-white">
            {formatNumber(user.storesCount)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">магазинів</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-xl font-black text-yellow-300">
            {formatNumber(user.worksCount)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">працює</p>
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
  );
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
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Спільнота</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/30 sm:rounded-[2.5rem]">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:text-sm">
                Спільнота ПромоПтахи
              </p>

              <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Автори, які приносять знижки
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                Тут зібрані користувачі, які додають промокоди, допомагають
                перевіряти їх і розвивають базу знижок.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
                <Link
                  href="/levels"
                  className="inline-flex justify-center rounded-full bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Рівні
                </Link>

                <Link
                  href="/add"
                  className="inline-flex justify-center rounded-full border border-slate-700 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати код
                </Link>

                <Link
                  href="/profile"
                  className="col-span-2 inline-flex justify-center rounded-full border border-slate-700 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:col-span-1 sm:px-6 sm:py-4 sm:text-base"
                >
                  Мій профіль
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-white sm:text-4xl">
                  {formatNumber(stats.totalUsers)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  користувачів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-emerald-300 sm:text-4xl">
                  {formatNumber(stats.usersWithPromos)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  авторів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-yellow-300 sm:text-4xl">
                  {formatNumber(stats.totalPromos)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  кодів
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl font-black text-white sm:text-4xl">
                  {formatNumber(stats.legends)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 sm:mt-2 sm:text-sm">
                  легенд
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_0.55fr_0.55fr_auto] lg:gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Пошук</span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ім'я, username, опис..."
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 lg:contents">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Рівень
                </span>

                <select
                  value={levelFilter}
                  onChange={(event) =>
                    setLevelFilter(event.target.value as LevelFilter)
                  }
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                >
                  <option value="all">Всі</option>
                  <option value="newbie">🐣 Новачки</option>
                  <option value="author">🟢 Автори</option>
                  <option value="hunter">🔥 Мисливці</option>
                  <option value="top_author">🏆 Топ</option>
                  <option value="legend">👑 Легенди</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Сортування
                </span>

                <select
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as SortMode)
                  }
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                >
                  <option value="top">Топ</option>
                  <option value="newest">Новіші</option>
                  <option value="oldest">Старіші</option>
                  <option value="promos">За кодами</option>
                  <option value="stores">За магазинами</option>
                  <option value="works">За підтвердженнями</option>
                  <option value="name">За ім'ям</option>
                </select>
              </label>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-4 sm:text-base"
              >
                Скинути
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Учасники</h2>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-400 sm:mt-2 sm:text-base sm:font-normal">
                Показано: {stats.found} / {stats.totalUsers}
              </p>
            </div>

            <Link
              href="/levels"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:px-5 sm:py-3 sm:text-sm"
            >
              Рівні
            </Link>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center sm:p-8">
              <div className="text-4xl sm:text-5xl">👥</div>

              <h3 className="mt-4 text-xl font-black sm:text-2xl">
                Користувачів не знайдено
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-slate-400 sm:text-base sm:font-normal sm:leading-7">
                Спробуй змінити пошук, рівень або сортування.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {filteredUsers.map((user, index) => (
                  <MobileUserTile key={user.id} user={user} index={index} />
                ))}
              </div>

              <div className="hidden gap-5 sm:grid md:grid-cols-2 xl:grid-cols-3">
                {filteredUsers.map((user, index) => (
                  <DesktopUserCard key={user.id} user={user} index={index} />
                ))}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}