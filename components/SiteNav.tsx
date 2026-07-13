"use client";

import { Suspense, useEffect, useState } from "react";
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

function navLinkClass(pathname: string, href: string) {
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return `rounded-full px-4 py-2 text-sm font-bold transition ${
    isActive
      ? "bg-emerald-400 text-slate-950"
      : "text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
  }`;
}

function SiteNavFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950 px-5 py-4 text-white">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
            П
          </div>

          <div>
            <p className="text-lg font-black leading-none text-white">
              ПромоПтаха
            </p>
            <p className="mt-1 text-xs text-slate-500">На крилах знижок</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-4 py-2 text-sm font-bold text-slate-500">
            Завантаження меню...
          </span>
        </div>
      </nav>
    </header>
  );
}

function SiteNavContent() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(data.user);
        setIsLoadingUser(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoadingUser(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950 px-5 py-4 text-white">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950 transition group-hover:bg-emerald-300">
            П
          </div>

          <div>
            <p className="text-lg font-black leading-none text-white">
              ПромоПтаха
            </p>
            <p className="mt-1 text-xs text-slate-500">На крилах знижок</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className={navLinkClass(pathname, "/")}>
            Головна
          </Link>

          <Link href="/codes" className={navLinkClass(pathname, "/codes")}>
            Коди
          </Link>

          <Link href="/stores" className={navLinkClass(pathname, "/stores")}>
            Магазини
          </Link>

          <Link href="/add" className={navLinkClass(pathname, "/add")}>
            Додати
          </Link>

          <Link
            href="/request-store"
            className={navLinkClass(pathname, "/request-store")}
          >
            Запропонувати магазин
          </Link>

          {!isLoadingUser && user && (
            <Link
              href="/profile"
              className={navLinkClass(pathname, "/profile")}
            >
              Профіль
            </Link>
          )}

          {!isLoadingUser && isAdmin && (
            <>
              <Link href="/admin" className={navLinkClass(pathname, "/admin")}>
                Адмінка
              </Link>

              <Link
                href="/admin/reports"
                className={navLinkClass(pathname, "/admin/reports")}
              >
                Репорти
              </Link>

              <Link
                href="/admin/store-requests"
                className={navLinkClass(pathname, "/admin/store-requests")}
              >
                Заявки магазинів
              </Link>
            </>
          )}

          {!isLoadingUser && !user && (
            <Link href="/login" className={navLinkClass(pathname, "/login")}>
              Увійти
            </Link>
          )}

          {!isLoadingUser && user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-red-400 hover:bg-red-400/10 hover:text-red-300"
            >
              Вийти
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function SiteNav() {
  return (
    <Suspense fallback={<SiteNavFallback />}>
      <SiteNavContent />
    </Suspense>
  );
}