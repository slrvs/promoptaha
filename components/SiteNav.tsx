"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";

type NavLink = {
  href: string;
  label: string;
};

const adminEmail = "jchameleonl96@gmail.com";

const mainLinks: NavLink[] = [
  { href: "/", label: "Головна" },
  { href: "/codes", label: "Промокоди" },
  { href: "/deals", label: "Акції" },
  { href: "/stores", label: "Магазини" },
  { href: "/users", label: "Спільнота" },
  { href: "/stats", label: "Статистика" },
  { href: "/add", label: "Додати" },
];

const adminLinks: NavLink[] = [
  { href: "/admin/stats", label: "Аналітика" },
  { href: "/admin", label: "Модерація промокодів" },
  { href: "/admin/deals", label: "Акції" },
  { href: "/admin/stores", label: "Магазини" },
  { href: "/admin/categories", label: "Категорії" },
  { href: "/admin/search-tools", label: "Інструменти пошуку" },
  { href: "/admin/store-requests", label: "Заявки магазинів" },
  { href: "/admin/reports", label: "Репорти" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const isAdmin = user?.email === adminEmail;

  const activeAdminSection = useMemo(() => {
    return pathname.startsWith("/admin");
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setIsCheckingUser(true);

      const { data } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUser(data.user);
      setIsCheckingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 text-white shadow-xl shadow-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30">
            <img
              src="/icons/promoptaha-bird.png"
              alt="ПромоПтаха"
              className="h-full w-full object-contain p-1.5"
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

        <nav className="hidden items-center gap-1 xl:flex">
          {mainLinks.map((link) => {
            const isActive = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  isActive
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
                onClick={() => setIsAdminMenuOpen((current) => !current)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeAdminSection
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-emerald-300"
                }`}
              >
                Адмінка
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                  {adminLinks.map((link) => {
                    const isActive = isActivePath(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block rounded-2xl px-4 py-3 text-sm font-black transition ${
                          isActive
                            ? "bg-emerald-400 text-slate-950"
                            : "text-slate-300 hover:bg-slate-900 hover:text-emerald-300"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {isCheckingUser ? (
            <div className="h-11 w-28 animate-pulse rounded-full bg-slate-900" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className={`rounded-full border px-5 py-3 text-sm font-black transition ${
                  pathname.startsWith("/profile")
                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                    : "border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                Профіль
              </Link>

              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-red-400/40 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/10"
              >
                Вийти
              </button>
            </>
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
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 xl:hidden"
          aria-label="Відкрити меню"
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-5 pb-5 xl:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2 pt-4">
            {mainLinks.map((link) => {
              const isActive = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <Link
                href="/profile"
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  pathname.startsWith("/profile")
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                Профіль
              </Link>
            )}

            {isAdmin && (
              <div className="mt-2 rounded-3xl border border-slate-800 bg-slate-900 p-3">
                <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Адмінка
                </p>

                <div className="grid gap-2">
                  {adminLinks.map((link) => {
                    const isActive = isActivePath(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                          isActive
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-slate-950 text-slate-300 hover:text-emerald-300"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-2 grid gap-2">
              {isCheckingUser ? (
                <div className="h-12 animate-pulse rounded-2xl bg-slate-900" />
              ) : user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-2xl border border-red-400/40 px-4 py-3 text-left text-sm font-black text-red-300 transition hover:bg-red-400/10"
                >
                  Вийти
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Увійти
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}