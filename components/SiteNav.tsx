"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function SiteNav() {
  const [user, setUser] = useState<User | null>(null);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 px-5 py-4 text-white backdrop-blur">
      <section className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl">
            🐦
          </div>

          <div>
            <p className="text-xl font-black tracking-tight">ПромоПтаха</p>
            <p className="text-xs text-slate-400">На крилах знижок</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-full border border-slate-800 px-4 py-2 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Головна
          </Link>

          <Link
            href="/codes"
            className="rounded-full border border-slate-800 px-4 py-2 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Коди
          </Link>

          <Link
            href="/stores"
            className="rounded-full border border-slate-800 px-4 py-2 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Магазини
          </Link>

          <Link
            href="/add"
            className="rounded-full border border-slate-800 px-4 py-2 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Додати
          </Link>

          {user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
              >
                Профіль
              </Link>

              <Link
                href="/admin"
                className="rounded-full border border-slate-800 px-4 py-2 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Адмінка
              </Link>

              <button
                onClick={signOut}
                className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-300 transition hover:bg-red-400 hover:text-slate-950"
              >
                Вийти
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-emerald-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              Увійти
            </Link>
          )}
        </nav>
      </section>
    </header>
  );
}