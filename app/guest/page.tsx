import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Гостьовий режим",
  description:
    "Що можна робити на ПромоПтасі без акаунта, а які можливості доступні після входу.",
};

const guestFeatures = [
  {
    emoji: "🔎",
    title: "Шукати промокоди",
    description:
      "Можна переглядати промокоди, магазини, акції, категорії та сторінки користувачів.",
    href: "/codes",
    linkLabel: "Дивитись промокоди",
  },
  {
    emoji: "🏪",
    title: "Переглядати магазини",
    description:
      "Можна відкривати сторінки магазинів і дивитись доступні промокоди та акції.",
    href: "/stores",
    linkLabel: "Перейти до магазинів",
  },
  {
    emoji: "🔥",
    title: "Дивитись акції",
    description:
      "Можна переглядати публічні акції магазинів і переходити до деталей.",
    href: "/deals",
    linkLabel: "Дивитись акції",
  },
  {
    emoji: "👥",
    title: "Дивитись спільноту",
    description:
      "Можна бачити авторів, їхні рівні, публічні профілі та внесок у базу.",
    href: "/users",
    linkLabel: "Відкрити спільноту",
  },
];

const accountFeatures = [
  {
    emoji: "🎟️",
    title: "Додавати промокоди",
    description:
      "Після входу можна додавати промокоди, джерело, магазин, категорію та опис.",
  },
  {
    emoji: "⭐",
    title: "Зберігати промокоди",
    description:
      "Можна додавати корисні коди в обране й швидко знаходити їх у профілі.",
  },
  {
    emoji: "💬",
    title: "Коментувати",
    description:
      "Можна залишати коментарі під промокодами, редагувати й видаляти свої повідомлення.",
  },
  {
    emoji: "🏆",
    title: "Прокачувати рівень",
    description:
      "За схвалені промокоди користувач отримує рівні автора ПромоПтахи.",
  },
  {
    emoji: "🏪",
    title: "Пропонувати магазини",
    description:
      "Можна надіслати заявку на додавання нового магазину в базу.",
  },
  {
    emoji: "🛡️",
    title: "Голосувати за коди",
    description:
      "Можна позначати, чи працює промокод, і допомагати іншим користувачам.",
  },
];

export default function GuestPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Гостьовий режим</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.12),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-emerald-950/20">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                Гостьовий режим
              </p>

              <h1 className="max-w-4xl text-2xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Можна користуватись і без акаунта
              </h1>

              <p className="mt-3 max-w-3xl text-[13px] font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                Гість може шукати промокоди, переглядати магазини, акції,
                спільноту й рівні. Акаунт потрібен тільки для дій, які змінюють
                сайт: додавання кодів, коментарів, голосування та збереження.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/codes"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Дивитись промокоди
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                >
                  Увійти або створити акаунт
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl sm:text-4xl">🔓</p>
                <h2 className="mt-3 text-base font-black leading-tight sm:mt-4 sm:text-2xl">
                  Без входу доступно
                </h2>
                <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                  Перегляд, пошук, відкриття сторінок магазинів, промокодів,
                  акцій, авторів і рівнів.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-3xl sm:text-4xl">🔐</p>
                <h2 className="mt-3 text-base font-black leading-tight sm:mt-4 sm:text-2xl">
                  Для дій потрібен акаунт
                </h2>
                <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                  Додавання промокодів, заявки магазинів, голосування,
                  коментарі, збережені коди й особистий профіль.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <h2 className="text-2xl font-black sm:text-3xl">Що доступно гостю</h2>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:text-base sm:font-normal sm:leading-7">
            Ці сторінки відкриті для всіх і не потребують авторизації.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {guestFeatures.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 transition hover:border-emerald-400/40 sm:rounded-[2rem] sm:p-5"
              >
                <p className="text-3xl sm:text-4xl">{feature.emoji}</p>

                <h3 className="mt-3 text-base font-black leading-tight sm:mt-4 sm:text-2xl">{feature.title}</h3>

                <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                  {feature.description}
                </p>

                <p className="mt-3 text-xs font-black text-emerald-300 sm:mt-5 sm:text-sm">
                  {feature.linkLabel} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <h2 className="text-2xl font-black sm:text-3xl">Що відкривається після входу</h2>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:text-base sm:font-normal sm:leading-7">
            Акаунт потрібен для всіх дій, де користувач щось додає, зберігає
            або змінює.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {accountFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-[2rem] sm:p-5"
              >
                <p className="text-3xl sm:text-4xl">{feature.emoji}</p>

                <h3 className="mt-3 text-base font-black leading-tight sm:mt-4 sm:text-2xl">{feature.title}</h3>

                <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
            >
              Увійти або зареєструватися
            </Link>

            <Link
              href="/levels"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
            >
              Подивитись рівні
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-yellow-400/20 bg-yellow-400/10 p-6">
          <h2 className="text-3xl font-black text-yellow-300">
            Що перевірити перед запуском
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🧪</p>

              <h3 className="mt-4 text-xl font-black">Відкрий інкогніто</h3>

              <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                Перевір, що гість бачить публічні сторінки, але не бачить
                приватні дані профілю й адмінки.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🔒</p>

              <h3 className="mt-4 text-xl font-black">
                Перевір приватні адреси
              </h3>

              <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                `/profile`, `/admin`, `/admin/activity`, `/admin/launch-check`
                мають показувати повідомлення про відсутність доступу.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">✅</p>

              <h3 className="mt-4 text-xl font-black">Перевір публічні дії</h3>

              <p className="mt-2 hidden text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:block sm:text-base sm:font-normal sm:leading-7">
                Кнопки додавання, коментування, збереження й голосування мають
                вести до входу або показувати зрозуміле повідомлення.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}