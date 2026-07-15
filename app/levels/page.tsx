import type { Metadata } from "next";
import Link from "next/link";
import UserLevelBadge from "@/components/UserLevelBadge";
import LevelProgressCalculator from "@/components/LevelProgressCalculator";

export const metadata: Metadata = {
  title: "Рівні спільноти",
  description:
    "Пояснення рівнів користувачів ПромоПтахи: Новачок, Автор, Мисливець за знижками, Топ автор і Легенда ПромоПтахи.",
};

const levels = [
  {
    approvedPromos: 0,
    title: "Новачок",
    emoji: "🐣",
    requirement: "0 схвалених промокодів",
    description:
      "Користувач щойно приєднався до спільноти або ще не має схвалених промокодів.",
  },
  {
    approvedPromos: 1,
    title: "Автор",
    emoji: "🟢",
    requirement: "від 1 схваленого промокоду",
    description:
      "Перший промокод пройшов модерацію — користувач уже допоміг спільноті знайти знижку.",
  },
  {
    approvedPromos: 5,
    title: "Мисливець за знижками",
    emoji: "🔥",
    requirement: "від 5 схвалених промокодів",
    description:
      "Користувач регулярно додає корисні промокоди та вже помітно допомагає іншим економити.",
  },
  {
    approvedPromos: 15,
    title: "Топ автор",
    emoji: "🏆",
    requirement: "від 15 схвалених промокодів",
    description:
      "Активний автор, який стабільно поповнює базу перевіреними промокодами.",
  },
  {
    approvedPromos: 50,
    title: "Легенда ПромоПтахи",
    emoji: "👑",
    requirement: "від 50 схвалених промокодів",
    description:
      "Один із найсильніших учасників спільноти. Такий користувач уже суттєво вплинув на базу знижок.",
  },
];

export default function LevelsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>

          <Link href="/users" className="hover:text-emerald-300">
            Спільнота
          </Link>

          <span>/</span>
          <span className="text-slate-300">Рівні</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-2xl shadow-emerald-950/30">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Рівні спільноти
              </p>

              <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Бейджі авторів ПромоПтахи
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Рівень користувача залежить від кількості схвалених
                промокодів. Чим більше корисних кодів проходить модерацію, тим
                вищий статус у спільноті.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/users"
                  className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Перейти до спільноти
                </Link>

                <Link
                  href="/add"
                  className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Додати промокод
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-emerald-300">5</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  рівнів автора
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-yellow-300">50+</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  кодів для легенди
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-4xl font-black text-white">1</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалений код для старту
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <LevelProgressCalculator />
        </div>

        <section className="mt-8 grid gap-5">
          {levels.map((level) => (
            <article
              key={level.title}
              className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 transition hover:border-emerald-400/40"
            >
              <div className="grid gap-5 lg:grid-cols-[0.6fr_1fr_auto] lg:items-center">
                <div>
                  <div className="text-5xl">{level.emoji}</div>

                  <h2 className="mt-4 text-3xl font-black">{level.title}</h2>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {level.requirement}
                  </p>
                </div>

                <p className="leading-7 text-slate-400">
                  {level.description}
                </p>

                <div className="lg:text-right">
                  <UserLevelBadge
                    approvedPromos={level.approvedPromos}
                    size="md"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-3xl font-black">Як підняти рівень?</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl">🎟️</p>

              <h3 className="mt-4 text-xl font-black">
                Додавай справжні коди
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Промокод має бути зрозумілим, актуальним і привʼязаним до
                правильного магазину.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl">🔎</p>

              <h3 className="mt-4 text-xl font-black">Вказуй джерело</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Посилання на YouTube, Telegram, сайт або інше джерело допомагає
                швидше пройти модерацію.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-3xl">✅</p>

              <h3 className="mt-4 text-xl font-black">Чекай схвалення</h3>

              <p className="mt-3 leading-7 text-slate-400">
                У рівень зараховуються тільки ті промокоди, які пройшли
                модерацію та стали видимими на сайті.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}