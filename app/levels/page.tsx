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
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:mb-6 sm:gap-3 sm:text-sm">
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

        <section className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.12),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] shadow-xl shadow-emerald-950/20 sm:rounded-[2.5rem] sm:shadow-2xl sm:shadow-emerald-950/30">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                Рівні спільноти
              </p>

              <h1 className="max-w-4xl text-2xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Бейджі авторів ПромоПтахи
              </h1>

              <p className="mt-3 max-w-3xl text-[13px] font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
                Рівень користувача залежить від кількості схвалених
                промокодів. Чим більше корисних кодів проходить модерацію, тим
                вищий статус у спільноті.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/users"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
                >
                  Перейти до спільноти
                </Link>

                <Link
                  href="/add"
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
                >
                  Додати промокод
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-emerald-300 sm:text-4xl">5</p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  рівнів автора
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-yellow-300 sm:text-4xl">50+</p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  кодів для легенди
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:rounded-[2rem] sm:p-6">
                <p className="text-2xl font-black text-white sm:text-4xl">1</p>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                  схвалений код для старту
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 sm:mt-8">
          <LevelProgressCalculator />
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-1 sm:gap-5">
          {levels.map((level) => (
            <article
              key={level.title}
              className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-3 transition hover:border-emerald-400/40 sm:rounded-[2rem] sm:p-6"
            >
              <div className="grid gap-3 sm:gap-5 lg:grid-cols-[0.6fr_1fr_auto] lg:items-center">
                <div>
                  <div className="text-3xl sm:text-5xl">{level.emoji}</div>

                  <h2 className="mt-3 text-lg font-black leading-tight sm:mt-4 sm:text-3xl">{level.title}</h2>

                  <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-normal">
                    {level.requirement}
                  </p>
                </div>

                <p className="hidden leading-7 text-slate-400 sm:block">
                  {level.description}
                </p>

                <div className="hidden lg:block lg:text-right">
                  <UserLevelBadge
                    approvedPromos={level.approvedPromos}
                    size="md"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 sm:mt-8 sm:rounded-[2.5rem] sm:p-6">
          <h2 className="text-2xl font-black sm:text-3xl">Як підняти рівень?</h2>

          <div className="mt-4 grid gap-3 sm:mt-5 md:grid-cols-3 md:gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
              <p className="text-3xl">🎟️</p>

              <h3 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">
                Додавай справжні коди
              </h3>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
                Промокод має бути зрозумілим, актуальним і привʼязаним до
                правильного магазину.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
              <p className="text-3xl">🔎</p>

              <h3 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">Вказуй джерело</h3>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
                Посилання на YouTube, Telegram, сайт або інше джерело допомагає
                швидше пройти модерацію.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
              <p className="text-3xl">✅</p>

              <h3 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">Чекай схвалення</h3>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
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