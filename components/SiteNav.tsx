"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";

type NavLink = {
  href: string;
  label: string;
};

type AdminLink = {
  href: string;
  label: string;
  description: string;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

const mainLinks: NavLink[] = [
  {
    href: "/",
    label: "Головна",
  },
  {
    href: "/codes",
    label: "Промокоди",
  },
  {
    href: "/deals",
    label: "Акції",
  },
  {
    href: "/stores",
    label: "Магазини",
  },
  {
    href: "/users",
    label: "Спільнота",
  },
  {
    href: "/stats",
    label: "Статистика",
  },
  {
    href: "/add",
    label: "Додати",
  },
];

const adminLinks: AdminLink[] = [
  {
    href: "/admin/stats",
    label: "Аналітика",
    description: "Загальна статистика сайту",
  },
  {
    href: "/admin/activity",
    label: "Журнал дій",
    description: "Історія модерації та адмінських змін",
  },
  {
    href: "/admin",
    label: "Модерація промокодів",
    description: "Схвалення, відхилення та перевірка кодів",
  },
  {
    href: "/admin/users",
    label: "Користувачі",
    description: "Профілі, активність, коментарі та збереження",
  },
  {
    href: "/admin/comments",
    label: "Коментарі",
    description: "Модерація коментарів і заборонені слова",
  },
  {
    href: "/admin/deals",
    label: "Акції",
    description: "Створення та редагування акцій",
  },
  {
    href: "/admin/stores",
    label: "Магазини",
    description: "Створення та редагування магазинів",
  },
  {
    href: "/admin/categories",
    label: "Категорії",
    description: "Категорії магазинів і промокодів",
  },
  {
    href: "/admin/search-tools",
    label: "Інструменти пошуку",
    description: "Псевдоніми та пошукові alias",
  },
  {
    href: "/admin/store-requests",
    label: "Заявки магазинів",
    description: "Магазини, які запропонували користувачі",
  },
  {
    href: "/admin/reports",
    label: "Репорти",
    description: "Скарги на промокоди",
  },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getUserLabel(user: User | null) {
  if (!user?.email) return "Профіль";

  return user.email.split("@")[0] || "Профіль";
}

export default function SiteNav() {
  const pathname = usePathname();

  const navRef = useRef<HTMLElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const isAdmin = user?.email === adminEmail;

  const currentAdminSection = useMemo(() => {
    if (!pathname.startsWith("/admin")) return null;

    return adminLinks.find((link) => isLinkActive(pathname, link.href)) || null;
  }, [pathname]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    setUser(data.user);
  }

  function closeMenus() {
    setIsAdminMenuOpen(false);
    setIsAccountMenuOpen(false);
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    closeMenus();
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (navRef.current?.contains(target)) {
        return;
      }

      closeMenus();
      setIsMobileOpen(false);
    }

    function handleScroll() {
      closeMenus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-5 py-4 text-white backdrop-blur"
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900">
            <img
              src="/icons/promoptaha-bird.png"
              alt="ПромоПтаха"
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-black tracking-tight">
              ПромоПтаха
            </p>
            <p className="truncate text-xs font-bold text-emerald-300">
              На крилах знижок
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 xl:flex">
          {mainLinks.map((link) => {
            const active = isLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  active
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-emerald-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAdminMenuOpen((current) => !current);
                  setIsAccountMenuOpen(false);
                }}
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  pathname.startsWith("/admin")
                    ? "bg-yellow-300 text-slate-950"
                    : "text-yellow-300 hover:bg-slate-900"
                }`}
              >
                Адмін
                {currentAdminSection ? `: ${currentAdminSection.label}` : ""}
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 top-14 w-96 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/40">
                  <div className="grid max-h-[70vh] gap-2 overflow-y-auto">
                    {adminLinks.map((link) => {
                      const active = isLinkActive(pathname, link.href);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          title={link.description}
                          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                            active
                              ? "bg-yellow-300 text-slate-950"
                              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-yellow-300"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen((current) => !current);
                  setIsAdminMenuOpen(false);
                }}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                {getUserLabel(user)}
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/40">
                  <div className="grid gap-2">
                    <Link
                      href="/profile"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-slate-800 hover:text-emerald-300"
                    >
                      Профіль
                    </Link>

                    <Link
                      href="/add"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-slate-800 hover:text-emerald-300"
                    >
                      Додати промокод
                    </Link>

                    <Link
                      href="/request-store"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-slate-800 hover:text-emerald-300"
                    >
                      Запропонувати магазин
                    </Link>

                    <button
                      type="button"
                      onClick={signOut}
                      className="rounded-2xl bg-red-400/10 px-4 py-3 text-left text-sm font-black text-red-300 transition hover:bg-red-400/20"
                    >
                      Вийти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Увійти
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((current) => !current)}
          className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 xl:hidden"
        >
          {isMobileOpen ? "Закрити" : "Меню"}
        </button>
      </nav>

      {isMobileOpen && (
        <div className="mx-auto mt-4 grid w-full max-w-7xl gap-4 rounded-[2rem] border border-slate-800 bg-slate-950 p-4 xl:hidden">
          <div className="grid gap-2">
            {mainLinks.map((link) => {
              const active = isLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-slate-900 text-slate-300 hover:text-emerald-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {isAdmin && (
            <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/5 p-3">
              <p className="mb-3 px-2 text-sm font-black text-yellow-300">
                Адмінка
              </p>

              <div className="grid gap-2">
                {adminLinks.map((link) => {
                  const active = isLinkActive(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                        active
                          ? "bg-yellow-300 text-slate-950"
                          : "bg-slate-900 text-slate-300 hover:text-yellow-300"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <p className="mb-3 px-2 text-sm font-black text-slate-300">
              Акаунт
            </p>

            {user ? (
              <div className="grid gap-2">
                <Link
                  href="/profile"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-slate-200 transition hover:text-emerald-300"
                >
                  Профіль
                </Link>

                <Link
                  href="/request-store"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-slate-200 transition hover:text-emerald-300"
                >
                  Запропонувати магазин
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-2xl bg-red-400/10 px-4 py-3 text-left text-sm font-black text-red-300"
                >
                  Вийти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Увійти
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}