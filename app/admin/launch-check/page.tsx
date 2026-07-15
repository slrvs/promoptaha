"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import { getFriendlyErrorMessage } from "@/lib/friendlyError";

type CheckStatus = "ok" | "warning" | "error";

type CountCheck = {
  key: string;
  label: string;
  description: string;
  href: string;
  count: number;
  min: number;
  error?: string;
};

type ManualCheck = {
  title: string;
  description: string;
  href?: string;
  badge: string;
};

const adminEmail = "jchameleonl96@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

function getCheckStatus(check: CountCheck): CheckStatus {
  if (check.error) return "error";
  if (check.count >= check.min) return "ok";

  return "warning";
}

function getStatusLabel(status: CheckStatus) {
  if (status === "ok") return "Готово";
  if (status === "warning") return "Потрібно перевірити";

  return "Помилка";
}

function getStatusEmoji(status: CheckStatus) {
  if (status === "ok") return "✅";
  if (status === "warning") return "⚠️";

  return "❌";
}

function getStatusClass(status: CheckStatus) {
  if (status === "ok") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "warning") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-red-400/30 bg-red-400/10 text-red-300";
}

function getReadinessPercent(checks: CountCheck[]) {
  if (checks.length === 0) return 0;

  const passed = checks.filter((check) => getCheckStatus(check) === "ok").length;

  return Math.round((passed / checks.length) * 100);
}

function getReadinessLabel(percent: number) {
  if (percent >= 90) return "Майже готово до запуску";
  if (percent >= 70) return "Добре, але ще треба пройтись по чеклисту";
  if (percent >= 50) return "База є, але запускати ще рано";

  return "Потрібно доробити основу";
}

const publicRoutes: ManualCheck[] = [
  {
    title: "Головна сторінка",
    description:
      "Перевір hero-блок, останні промокоди, магазини, топ спільноти та посилання.",
    href: "/",
    badge: "Публічна",
  },
  {
    title: "Промокоди",
    description:
      "Перевір пошук, фільтри, відкриття картки промокоду, копіювання коду.",
    href: "/codes",
    badge: "Публічна",
  },
  {
    title: "Магазини",
    description:
      "Перевір список магазинів, пошук, категорії та сторінку окремого магазину.",
    href: "/stores",
    badge: "Публічна",
  },
  {
    title: "Акції",
    description:
      "Перевір сторінку акцій, фільтри, посилання на магазини та завершені акції.",
    href: "/deals",
    badge: "Публічна",
  },
  {
    title: "Спільнота",
    description:
      "Перевір список користувачів, бейджі рівнів, публічні профілі та прогрес рівня.",
    href: "/users",
    badge: "Публічна",
  },
  {
    title: "Рівні",
    description:
      "Перевір опис рівнів, калькулятор рівня та кнопки переходу до спільноти.",
    href: "/levels",
    badge: "Публічна",
  },
];

const userFlowChecks: ManualCheck[] = [
  {
    title: "Реєстрація та вхід",
    description:
      "Створи тестовий акаунт або увійди в існуючий. Перевір, що після входу відкривається профіль.",
    href: "/login",
    badge: "Користувач",
  },
  {
    title: "Особистий кабінет",
    description:
      "Перевір аватар, username, публічний профіль, збережені промокоди та прогрес рівня.",
    href: "/profile",
    badge: "Користувач",
  },
  {
    title: "Додавання промокоду",
    description:
      "Додай тестовий промокод, перевір чернетку, магазин, категорію, джерело та модерацію.",
    href: "/add",
    badge: "Користувач",
  },
  {
    title: "Заявка магазину",
    description:
      "Створи тестову заявку магазину й перевір її появу в адмінці.",
    href: "/request-store",
    badge: "Користувач",
  },
  {
    title: "Коментарі",
    description:
      "Залиши коментар під промокодом, перевір заборонені слова, редагування та видалення.",
    href: "/codes",
    badge: "Користувач",
  },
];

const adminChecks: ManualCheck[] = [
  {
    title: "Модерація промокодів",
    description:
      "Схвали, відхили та поверни промокод на модерацію. Перевір причину відхилення.",
    href: "/admin",
    badge: "Адмін",
  },
  {
    title: "Модерація коментарів",
    description:
      "Приховай, віднови й видали тестовий коментар. Перевір заборонені слова.",
    href: "/admin/comments",
    badge: "Адмін",
  },
  {
    title: "Заявки магазинів",
    description:
      "Схвали заявку, створи магазин із заявки та перевір публічну сторінку магазину.",
    href: "/admin/store-requests",
    badge: "Адмін",
  },
  {
    title: "Користувачі",
    description:
      "Перевір список користувачів, сторінку користувача, промокоди, коментарі та збережені.",
    href: "/admin/users",
    badge: "Адмін",
  },
  {
    title: "Журнал дій",
    description:
      "Перевір, що нові адмінські дії записуються після схвалення/відхилення/видалення.",
    href: "/admin/activity",
    badge: "Адмін",
  },
  {
    title: "Аналітика",
    description:
      "Перевір загальну статистику сайту, магазини, категорії, промокоди та заявки.",
    href: "/admin/stats",
    badge: "Адмін",
  },
];

const technicalChecks: ManualCheck[] = [
  {
    title: "Sitemap",
    description:
      "Перевір, що sitemap відкривається і містить головні сторінки, магазини, промокоди та користувачів.",
    href: "/sitemap.xml",
    badge: "SEO",
  },
  {
    title: "Robots",
    description:
      "Перевір, що robots.txt не відкриває адмінку, профіль та приватні сторінки для індексації.",
    href: "/robots.txt",
    badge: "SEO",
  },
  {
    title: "404 сторінка",
    description:
      "Відкрий неіснуючу адресу й перевір, що сайт показує нормальну сторінку помилки.",
    href: "/this-page-does-not-exist",
    badge: "UX",
  },
  {
    title: "Мобільна версія",
    description:
      "Перевір головну, меню, промокоди, профіль і адмінку на вузькому екрані.",
    badge: "UX",
  },
  {
    title: "Build перед запуском",
    description:
      "Перед релізом обовʼязково запусти npm run build і переконайся, що немає помилок.",
    badge: "Технічне",
  },
];

export default function AdminLaunchCheckPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [checks, setChecks] = useState<CountCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const readinessPercent = useMemo(() => {
    return getReadinessPercent(checks);
  }, [checks]);

  const okCount = useMemo(() => {
    return checks.filter((check) => getCheckStatus(check) === "ok").length;
  }, [checks]);

  const warningCount = useMemo(() => {
    return checks.filter((check) => getCheckStatus(check) === "warning").length;
  }, [checks]);

  const errorCount = useMemo(() => {
    return checks.filter((check) => getCheckStatus(check) === "error").length;
  }, [checks]);

  async function loadLaunchChecks() {
    setIsLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setAuthUser(currentUser);

    const currentIsAdmin = currentUser?.email === adminEmail;
    setIsAdmin(currentIsAdmin);

    if (!currentUser || !currentIsAdmin) {
      setChecks([]);
      setIsLoading(false);
      return;
    }

    const nextChecks: CountCheck[] = [];

    const profilesResult = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    nextChecks.push({
      key: "profiles",
      label: "Користувачі",
      description:
        "Має бути хоча б один профіль користувача. Якщо тут 0 — профілі не створюються або RLS блокує читання.",
      href: "/admin/users",
      count: profilesResult.count || 0,
      min: 1,
      error: profilesResult.error
        ? getFriendlyErrorMessage(profilesResult.error)
        : undefined,
    });

    const categoriesResult = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    nextChecks.push({
      key: "categories",
      label: "Активні категорії",
      description:
        "Категорії потрібні для магазинів, промокодів, фільтрів і SEO.",
      href: "/admin/categories",
      count: categoriesResult.count || 0,
      min: 3,
      error: categoriesResult.error
        ? getFriendlyErrorMessage(categoriesResult.error)
        : undefined,
    });

    const storesResult = await supabase
      .from("store_category_stats")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    nextChecks.push({
      key: "stores",
      label: "Активні магазини",
      description:
        "Магазини мають бути в базі, щоб користувачі могли додавати промокоди.",
      href: "/admin/stores",
      count: storesResult.count || 0,
      min: 10,
      error: storesResult.error
        ? getFriendlyErrorMessage(storesResult.error)
        : undefined,
    });

    const approvedPromosResult = await supabase
      .from("promo_code_category_stats")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    nextChecks.push({
      key: "approved_promos",
      label: "Схвалені промокоди",
      description:
        "Для запуску бажано мати хоча б кілька схвалених промокодів, щоб сайт не виглядав порожнім.",
      href: "/codes",
      count: approvedPromosResult.count || 0,
      min: 5,
      error: approvedPromosResult.error
        ? getFriendlyErrorMessage(approvedPromosResult.error)
        : undefined,
    });

    const pendingPromosResult = await supabase
      .from("promo_codes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    nextChecks.push({
      key: "pending_promos",
      label: "Промокоди на модерації",
      description:
        "Це не обовʼязково, але корисно бачити, що модерація працює і є що перевіряти.",
      href: "/admin",
      count: pendingPromosResult.count || 0,
      min: 0,
      error: pendingPromosResult.error
        ? getFriendlyErrorMessage(pendingPromosResult.error)
        : undefined,
    });

    const commentsResult = await supabase
      .from("promo_comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "visible");

    nextChecks.push({
      key: "comments",
      label: "Видимі коментарі",
      description:
        "Коментарі не критичні для запуску, але показують, що соціальна частина сайту працює.",
      href: "/admin/comments",
      count: commentsResult.count || 0,
      min: 0,
      error: commentsResult.error
        ? getFriendlyErrorMessage(commentsResult.error)
        : undefined,
    });

    const storeRequestsResult = await supabase
      .from("store_requests")
      .select("id", { count: "exact", head: true });

    nextChecks.push({
      key: "store_requests",
      label: "Заявки магазинів",
      description:
        "Перевірка, що таблиця заявок існує і доступна для адмінки.",
      href: "/admin/store-requests",
      count: storeRequestsResult.count || 0,
      min: 0,
      error: storeRequestsResult.error
        ? getFriendlyErrorMessage(storeRequestsResult.error)
        : undefined,
    });

    const activityLogsResult = await supabase
      .from("admin_activity_logs")
      .select("id", { count: "exact", head: true });

    nextChecks.push({
      key: "activity_logs",
      label: "Журнал адмін-дій",
      description:
        "Після тестової модерації тут має бути хоча б один запис.",
      href: "/admin/activity",
      count: activityLogsResult.count || 0,
      min: 1,
      error: activityLogsResult.error
        ? getFriendlyErrorMessage(activityLogsResult.error)
        : undefined,
    });

    setChecks(nextChecks);
    setIsLoading(false);
  }

  useEffect(() => {
    loadLaunchChecks();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setAuthUser(nextUser);
      setIsAdmin(nextUser?.email === adminEmail);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-7xl">
          <div className="h-[360px] animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
          <div className="mt-8 h-96 animate-pulse rounded-[2.5rem] border border-slate-800 bg-slate-900" />
        </section>
      </main>
    );
  }

  if (!authUser || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-red-400/30 bg-red-400/10 p-8 text-center">
          <div className="text-6xl">🔒</div>

          <h1 className="mt-5 text-4xl font-black">Немає доступу</h1>

          <p className="mt-4 leading-7 text-red-100">
            Чеклист запуску доступний тільки адміну.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            На головну
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>

          <Link href="/admin" className="hover:text-emerald-300">
            Адмін
          </Link>

          <span>/</span>
          <span className="text-slate-300">Чеклист запуску</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Підготовка до запуску
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Launch check ПромоПтахи
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Це контрольна сторінка перед публічним запуском. Вона допомагає
                швидко перевірити базу, публічні сторінки, користувацькі дії,
                адмінку, SEO та технічні речі.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadLaunchChecks}
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Оновити перевірку
                </button>

                <Link
                  href="/admin/activity"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Журнал дій
                </Link>

                <Link
                  href="/admin/stats"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Аналітика
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-sm font-bold text-slate-500">
                Готовність за автоматичними перевірками
              </p>

              <p className="mt-3 text-7xl font-black text-emerald-300">
                {readinessPercent}%
              </p>

              <p className="mt-3 text-xl font-black text-white">
                {getReadinessLabel(readinessPercent)}
              </p>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <p className="text-3xl font-black text-emerald-300">
                    {okCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-100/80">
                    готово
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
                  <p className="text-3xl font-black text-yellow-300">
                    {warningCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-yellow-100/80">
                    перевірити
                  </p>
                </div>

                <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
                  <p className="text-3xl font-black text-red-300">
                    {errorCount}
                  </p>
                  <p className="mt-1 text-xs font-bold text-red-100/80">
                    помилки
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`mt-6 rounded-2xl border p-4 font-bold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : messageType === "error"
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Автоматичні перевірки бази</h2>

          <p className="mt-2 leading-7 text-slate-400">
            Ці пункти читаються напряму з Supabase. Якщо є помилка — треба
            перевірити RLS, таблицю або view.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {checks.map((check) => {
              const status = getCheckStatus(check);

              return (
                <Link
                  key={check.key}
                  href={check.href}
                  className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                          status
                        )}`}
                      >
                        {getStatusEmoji(status)} {getStatusLabel(status)}
                      </span>

                      <h3 className="mt-4 text-2xl font-black">
                        {check.label}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-400">
                        {check.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-right">
                      <p className="text-4xl font-black text-white">
                        {check.count}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        мінімум {check.min}
                      </p>
                    </div>
                  </div>

                  {check.error && (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
                      {check.error}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <ChecklistSection
          title="Публічна частина"
          description="Сторінки, які бачить будь-який відвідувач без входу в акаунт."
          items={publicRoutes}
        />

        <ChecklistSection
          title="Користувацький сценарій"
          description="Дії звичайного користувача: реєстрація, профіль, додавання коду, заявки, коментарі."
          items={userFlowChecks}
        />

        <ChecklistSection
          title="Адмінський сценарій"
          description="Дії адміністратора: модерація, заявки, користувачі, журнал, аналітика."
          items={adminChecks}
        />

        <ChecklistSection
          title="SEO / технічні перевірки"
          description="Sitemap, robots, 404, мобільна версія та фінальний build."
          items={technicalChecks}
        />

        <section className="mt-8 rounded-[2.5rem] border border-yellow-400/20 bg-yellow-400/10 p-6">
          <h2 className="text-3xl font-black text-yellow-300">
            Перед публічним запуском
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🧪</p>

              <h3 className="mt-4 text-xl font-black">Протестуй як гість</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Вийди з акаунта або відкрий інкогніто й перевір, що публічні
                сторінки не показують адмінські функції.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🔐</p>

              <h3 className="mt-4 text-xl font-black">Перевір доступи</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Адмінка, профіль, журнал і модерація мають бути закриті для
                неавторизованих користувачів.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🚀</p>

              <h3 className="mt-4 text-xl font-black">Зроби build</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Перед пушем і деплоєм обовʼязково виконай npm run build.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function ChecklistSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ManualCheck[];
}) {
  return (
    <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="text-3xl font-black">{title}</h2>

      <p className="mt-2 leading-7 text-slate-400">{description}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const content = (
            <article className="h-full rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40">
              <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                {item.badge}
              </span>

              <h3 className="mt-4 text-2xl font-black">{item.title}</h3>

              <p className="mt-3 leading-7 text-slate-400">
                {item.description}
              </p>

              {item.href && (
                <p className="mt-4 text-sm font-black text-emerald-300">
                  Відкрити →
                </p>
              )}
            </article>
          );

          if (item.href) {
            return (
              <Link key={item.title} href={item.href}>
                {content}
              </Link>
            );
          }

          return <div key={item.title}>{content}</div>;
        })}
      </div>
    </section>
  );
}