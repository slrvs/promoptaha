"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

type NavLink = {
  href: string;
  label: string;
};

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
    href: "/stores",
    label: "Магазини",
  },
  {
    href: "/add",
    label: "Додати",
  },
];

const adminLinks: NavLink[] = [
  {
    href: "/admin",
    label: "Модерація промокодів",
  },
  {
    href: "/admin/stores",
    label: "Магазини",
  },
  {
    href: "/admin/store-requests",
    label: "Заявки магазинів",
  },
  {
    href: "/admin/reports",
    label: "Репорти",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function NavItem({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        isActive
          ? "bg-emerald-400 text-slate-950"
          : "text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavItem({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick: () => void;
}) {
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-2xl px-4 py-4 text-base font-black transition ${
        isActive
          ? "bg-emerald-400 text-slate-950"
          : "border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default function SiteNav() {
  return (
    <Suspense fallback={null}>
      <SiteNavContent />
    </Suspense>
  );
}

function SiteNavContent() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const adminActive = isAdminPath(pathname);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoadingUser(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-5 py-4 text-white backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30">
            <Image
              src="/icons/promoptaha-bird.png"
              alt="ПромоПтаха"
              fill
              sizes="48px"
              className="object-cover transition group-hover:scale-110"
              priority
            />
          </div>

          <div>
            <p className="text-xl font-black leading-5 text-white">
              ПромоПтаха
            </p>
            <p className="text-xs font-bold text-emerald-300">
              На крилах знижок
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {mainLinks.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
            />
          ))}

          {user && (
            <NavItem href="/profile" label="Профіль" pathname={pathname} />
          )}

          {isAdmin && (
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() =>
                  setIsAdminMenuOpen((currentValue) => !currentValue)
                }
                className={`rounded-full px-5 py-2 text-sm font-black transition ${
                  adminActive
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                Адмінка {isAdminMenuOpen ? "↑" : "↓"}
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-[1.5rem] border border-slate-800 bg-slate-900 p-3 shadow-2xl shadow-black/40">
                  <div className="grid gap-2">
                    {adminLinks.map((link) => {
                      const isActive = isActivePath(pathname, link.href);

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsAdminMenuOpen(false)}
                          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                            isActive
                              ? "bg-emerald-400 text-slate-950"
                              : "border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
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

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {isLoadingUser ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-800" />
          ) : user ? (
            <>
              <span className="hidden max-w-44 truncate text-sm font-bold text-slate-500 xl:inline">
                {user.email}
              </span>

              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-red-400 hover:text-red-300"
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
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 lg:hidden"
          aria-label="Відкрити меню"
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="mx-auto mt-4 w-full max-w-7xl lg:hidden">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl shadow-black/30">
            <div className="grid gap-2">
              {mainLinks.map((link) => (
                <MobileNavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  pathname={pathname}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}

              {user && (
                <MobileNavItem
                  href="/profile"
                  label="Профіль"
                  pathname={pathname}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}
            </div>

            {isAdmin && (
              <div className="mt-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/5 p-3">
                <p className="mb-3 px-2 text-sm font-black text-emerald-300">
                  Адмін-меню
                </p>

                <div className="grid gap-2">
                  {adminLinks.map((link) => (
                    <MobileNavItem
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      pathname={pathname}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-slate-800 pt-4">
              {isLoadingUser ? (
                <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
              ) : user ? (
                <div className="grid gap-3">
                  <p className="break-all rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-500">
                    {user.email}
                  </p>

                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-4 font-black text-red-300 transition hover:bg-red-400/20"
                  >
                    Вийти
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex rounded-2xl bg-emerald-400 px-4 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Увійти
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}