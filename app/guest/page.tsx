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
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">Гостьовий режим</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Гостьовий режим
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Можна користуватись і без акаунта
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Гість може шукати промокоди, переглядати магазини, акції,
                спільноту й рівні. Акаунт потрібен тільки для дій, які змінюють
                сайт: додавання кодів, коментарів, голосування та збереження.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/codes"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Дивитись промокоди
                </Link>

                <Link
                  href="/login"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Увійти або створити акаунт
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl">🔓</p>
                <h2 className="mt-4 text-2xl font-black">
                  Без входу доступно
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Перегляд, пошук, відкриття сторінок магазинів, промокодів,
                  акцій, авторів і рівнів.
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl">🔐</p>
                <h2 className="mt-4 text-2xl font-black">
                  Для дій потрібен акаунт
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Додавання промокодів, заявки магазинів, голосування,
                  коментарі, збережені коди й особистий профіль.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Що доступно гостю</h2>

          <p className="mt-2 leading-7 text-slate-400">
            Ці сторінки відкриті для всіх і не потребують авторизації.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {guestFeatures.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-400/40"
              >
                <p className="text-4xl">{feature.emoji}</p>

                <h3 className="mt-4 text-2xl font-black">{feature.title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>

                <p className="mt-5 text-sm font-black text-emerald-300">
                  {feature.linkLabel} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Що відкривається після входу</h2>

          <p className="mt-2 leading-7 text-slate-400">
            Акаунт потрібен для всіх дій, де користувач щось додає, зберігає
            або змінює.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accountFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
              >
                <p className="text-4xl">{feature.emoji}</p>

                <h3 className="mt-4 text-2xl font-black">{feature.title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Увійти або зареєструватися
            </Link>

            <Link
              href="/levels"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
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

              <p className="mt-3 leading-7 text-slate-400">
                Перевір, що гість бачить публічні сторінки, але не бачить
                приватні дані профілю й адмінки.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">🔒</p>

              <h3 className="mt-4 text-xl font-black">
                Перевір приватні адреси
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                `/profile`, `/admin`, `/admin/activity`, `/admin/launch-check`
                мають показувати повідомлення про відсутність доступу.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-slate-950 p-5">
              <p className="text-3xl">✅</p>

              <h3 className="mt-4 text-xl font-black">Перевір публічні дії</h3>

              <p className="mt-3 leading-7 text-slate-400">
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