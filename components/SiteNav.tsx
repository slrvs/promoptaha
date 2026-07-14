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
    href: "/stats",
    label: "Статистика",
  },
  {
    href: "/add",
    label: "Додати",
  },
];

const adminLinks: NavLink[] = [
  {
    href: "/admin/stats",
    label: "Аналітика",
  },
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

function NavItem({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
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
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-2xl px-4 py-4 font-black transition ${
        isActive
          ? "bg-emerald-400 text-slate-950"
          : "border border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
      }`}
    >
      {label}
    </Link>
  );
}

function SiteNavContent() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function loadUser() {
    setIsLoadingUser(true);

    const { data } = await supabase.auth.getUser();

    setUser(data.user);
    setIsLoadingUser(false);
  }

  async function signOut() {
    await supabase.auth.signOut();

    setUser(null);
    setIsMobileOpen(false);
    setIsAdminOpen(false);
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
    setIsMobileOpen(false);
    setIsAdminOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-5 py-4 text-white backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30">
            <Image
              src="/icons/promoptaha-bird.png"
              alt="ПромоПтаха"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black leading-5 text-white">
              ПромоПтаха
            </p>
            <p className="truncate text-xs font-bold text-emerald-300">
              На крилах знижок
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {mainLinks.map((link) => (
            <NavItem key={link.href} href={link.href} label={link.label} />
          ))}

          {user && <NavItem href="/profile" label="Профіль" />}

          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAdminOpen((current) => !current)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  pathname.startsWith("/admin")
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                }`}
              >
                Адмінка ↓
              </button>

              {isAdminOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-[1.5rem] border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                  {adminLinks.map((link) => {
                    const isActive = isActivePath(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsAdminOpen(false)}
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
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user && (
            <span className="hidden max-w-44 truncate text-sm font-bold text-slate-500 xl:inline">
              {user.email}
            </span>
          )}

          {isLoadingUser ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-800" />
          ) : user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-300 transition hover:border-red-400 hover:text-red-300"
            >
              Вийти
            </button>
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
          className="rounded-2xl border border-slate-700 px-4 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 lg:hidden"
          aria-label="Відкрити меню"
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {isMobileOpen && (
        <div className="mx-auto mt-4 w-full max-w-7xl rounded-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl shadow-black/30 lg:hidden">
          <div className="grid gap-2">
            {mainLinks.map((link) => (
              <MobileNavItem
                key={link.href}
                href={link.href}
                label={link.label}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}

            {user && (
              <MobileNavItem
                href="/profile"
                label="Профіль"
                onClick={() => setIsMobileOpen(false)}
              />
            )}
          </div>

          {isAdmin && (
            <div className="mt-5 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="mb-3 px-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                Адмінка
              </p>

              <div className="grid gap-2">
                {adminLinks.map((link) => (
                  <MobileNavItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-slate-800 pt-4">
            {user && (
              <p className="mb-3 break-all text-sm font-bold text-slate-500">
                {user.email}
              </p>
            )}

            {isLoadingUser ? (
              <div className="h-12 animate-pulse rounded-2xl bg-slate-800" />
            ) : user ? (
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-400/20"
              >
                Вийти
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="flex w-full justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
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

export default function SiteNav() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-5 py-4 text-white backdrop-blur-xl">
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900">
                <Image
                  src="/icons/promoptaha-bird.png"
                  alt="ПромоПтаха"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black leading-5 text-white">
                  ПромоПтаха
                </p>
                <p className="truncate text-xs font-bold text-emerald-300">
                  На крилах знижок
                </p>
              </div>
            </Link>

            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-800" />
          </nav>
        </header>
      }
    >
      <SiteNavContent />
    </Suspense>
  );
}