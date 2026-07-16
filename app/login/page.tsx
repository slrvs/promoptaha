"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getFriendlyErrorMessage } from "@/lib/friendlyError";

type AuthMode = "login" | "signup";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAuthErrorMessage(error: unknown) {
  const message = getFriendlyErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "Потрібно підтвердити email. Перевір пошту.";
  }

  if (lowerMessage.includes("already registered")) {
    return "Користувач із таким email вже зареєстрований.";
  }

  if (lowerMessage.includes("password")) {
    return "Перевір пароль. Він може бути занадто коротким або неправильним.";
  }

  if (lowerMessage.includes("captcha")) {
    return "У Supabase, схоже, увімкнена CAPTCHA. Поки ми її пропускаємо — вимкни CAPTCHA protection у Supabase Dashboard.";
  }

  return message || "Сталася помилка авторизації.";
}

function sanitizeNextPath(value: string | null) {
  if (!value) return "/profile";

  const decodedValue = decodeURIComponent(value).trim();

  if (!decodedValue.startsWith("/")) return "/profile";
  if (decodedValue.startsWith("//")) return "/profile";
  if (decodedValue.startsWith("/login")) return "/profile";
  if (decodedValue.startsWith("/auth")) return "/profile";

  return decodedValue;
}

function getRedirectUrl(nextPath: string) {
  return `${siteUrl}/login?next=${encodeURIComponent(nextPath)}`;
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [redirectPath, setRedirectPath] = useState("/profile");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const isSignup = mode === "signup";

  const title = isSignup ? "Створити акаунт" : "Увійти";
  const subtitle = isSignup
    ? "Зареєструйся, щоб додавати промокоди, коментувати та зберігати коди."
    : "Увійди, щоб керувати профілем, додавати промокоди й голосувати.";

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isSignup ? "Створюю акаунт..." : "Входжу...";
    }

    return isSignup ? "Зареєструватися" : "Увійти";
  }, [isSubmitting, isSignup]);

  const redirectLabel = useMemo(() => {
    if (redirectPath === "/profile") return "профіль";
    if (redirectPath === "/add") return "додавання промокоду";
    if (redirectPath === "/request-store") return "заявку магазину";
    if (redirectPath.startsWith("/codes/")) return "сторінку промокоду";
    if (redirectPath.startsWith("/stores/")) return "сторінку магазину";
    if (redirectPath.startsWith("/admin")) return "адмінку";

    return "потрібну сторінку";
  }, [redirectPath]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = sanitizeNextPath(params.get("next"));

    setRedirectPath(nextPath);
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setMessageType("info");
    setPassword("");
    setPasswordRepeat("");
  }

  function validateForm() {
    const finalEmail = normalizeEmail(email);

    if (!finalEmail || !finalEmail.includes("@")) {
      return "Введи коректний email.";
    }

    if (password.length < 6) {
      return "Пароль має містити хоча б 6 символів.";
    }

    if (isSignup && password !== passwordRepeat) {
      return "Паролі не збігаються.";
    }

    return "";
  }

  async function createProfileIfNeeded(userId: string, userEmail: string) {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail,
      },
      {
        onConflict: "id",
      }
    );
  }

  function goToRedirectPath() {
    router.push(redirectPath);
    router.refresh();
  }

  async function handleLogin(finalEmail: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user?.id) {
      await createProfileIfNeeded(data.user.id, finalEmail);
    }

    setMessage(`Вхід виконано. Перенаправляю на ${redirectLabel}...`);
    setMessageType("success");

    window.setTimeout(() => {
      goToRedirectPath();
    }, 500);
  }

  async function handleSignup(finalEmail: string) {
    const { data, error } = await supabase.auth.signUp({
      email: finalEmail,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(redirectPath),
      },
    });

    if (error) {
      throw error;
    }

    if (data.user?.id) {
      await createProfileIfNeeded(data.user.id, finalEmail);
    }

    if (data.session) {
      setMessage(`Акаунт створено. Перенаправляю на ${redirectLabel}...`);
      setMessageType("success");

      window.setTimeout(() => {
        goToRedirectPath();
      }, 500);

      return;
    }

    setMessage(
      "Акаунт створено. Перевір пошту та підтвердь email, якщо Supabase вимагає підтвердження."
    );
    setMessageType("success");
    setPassword("");
    setPasswordRepeat("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const finalEmail = normalizeEmail(email);

    try {
      if (isSignup) {
        await handleSignup(finalEmail);
      } else {
        await handleLogin(finalEmail);
      }
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] p-4 shadow-2xl shadow-emerald-950/30 sm:rounded-[2.5rem] sm:p-6 lg:p-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 sm:h-14 sm:w-14">
              <img
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xl font-black sm:text-2xl">ПромоПтаха</p>
              <p className="text-xs font-bold text-emerald-300 sm:text-sm">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:mt-8 sm:px-4 sm:text-sm">
            Кабінет автора
          </p>

          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:mt-5 sm:text-5xl md:text-7xl">
            Твій кабінет знижок
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
            Увійди або створи акаунт, щоб додавати промокоди, отримувати рівні
            автора, зберігати корисні коди та допомагати спільноті.
          </p>

          <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3 lg:mt-8">
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 lg:rounded-[2rem] lg:p-5">
              <p className="text-3xl">🎟️</p>
              <p className="mt-3 font-black">Додавай коди</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Публікуй промокоди після модерації.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 lg:rounded-[2rem] lg:p-5">
              <p className="text-3xl">⭐</p>
              <p className="mt-3 font-black">Зберігай</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Тримай потрібні промокоди в кабінеті.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4 lg:rounded-[2rem] lg:p-5">
              <p className="text-3xl">🏆</p>
              <p className="mt-3 font-black">Прокачуй рівень</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Більше схвалених кодів — вищий рівень автора.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/50 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
          <div className="flex rounded-2xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition sm:px-4 sm:py-3 ${
                mode === "login"
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-400 hover:text-emerald-300"
              }`}
            >
              Вхід
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition sm:px-4 sm:py-3 ${
                mode === "signup"
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-400 hover:text-emerald-300"
              }`}
            >
              Реєстрація
            </button>
          </div>

          <div className="mt-5 sm:mt-7">
            <h2 className="text-2xl font-black sm:text-4xl">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">{subtitle}</p>

            {redirectPath !== "/profile" && (
              <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 sm:mt-5 sm:p-4">
                <p className="font-black text-emerald-300">
                  Після входу повернемо тебе на {redirectLabel}.
                </p>

                <p className="mt-2 break-all text-sm font-bold text-emerald-100/80">
                  {redirectPath}
                </p>
              </div>
            )}
          </div>

          {message && (
            <div
              className={`mt-5 rounded-2xl border p-3 text-sm font-bold sm:mt-6 sm:p-4 sm:text-base ${
                messageType === "success"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : messageType === "error"
                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                    : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:mt-6 sm:gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">Email</span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-300">
                Пароль
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Мінімум 6 символів"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
              />
            </label>

            {isSignup && (
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-300">
                  Повтори пароль
                </span>

                <input
                  type="password"
                  value={passwordRepeat}
                  onChange={(event) => setPasswordRepeat(event.target.value)}
                  placeholder="Ще раз пароль"
                  autoComplete="new-password"
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-full sm:px-7 sm:py-4 sm:text-base"
            >
              {submitLabel}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:mt-6 sm:p-5">
            {isSignup ? (
              <p className="text-sm font-bold leading-6 text-slate-400 sm:font-normal">
                Вже маєш акаунт?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-black text-emerald-300 transition hover:text-emerald-200"
                >
                  Увійти
                </button>
              </p>
            ) : (
              <p className="text-sm font-bold leading-6 text-slate-400 sm:font-normal">
                Ще немає акаунта?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-black text-emerald-300 transition hover:text-emerald-200"
                >
                  Зареєструватися
                </button>
              </p>
            )}

            <p className="mt-3 text-xs font-bold leading-5 text-slate-500 sm:text-sm sm:font-normal sm:leading-6">
              Можеш користуватись сайтом і без акаунта: переглядати промокоди,
              магазини, акції та спільноту.
            </p>

            <Link
              href="/guest"
              className="mt-4 inline-flex text-sm font-black text-emerald-300 transition hover:text-emerald-200"
            >
              Що доступно гостю →
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}