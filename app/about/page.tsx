import Link from "next/link";

export const metadata = {
  title: "Про сайт — ПромоПтаха",
  description:
    "ПромоПтаха — спільна база промокодів, де користувачі додають і перевіряють знижки.",
};

const features = [
  {
    emoji: "🐦",
    title: "Додавай",
    description:
      "Знайшов промокод — додай його на сайт, вкажи магазин, джерело та термін дії.",
  },
  {
    emoji: "✅",
    title: "Перевіряй",
    description:
      "Користувачі голосують, чи промокод працює, щоб інші бачили актуальність.",
  },
  {
    emoji: "💸",
    title: "Економ",
    description:
      "Мета проста — швидко знайти робочий промокод і не витрачати час на мертві знижки.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-10">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:p-6 sm:shadow-2xl sm:shadow-emerald-950/20 lg:p-10">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
            Про проєкт
          </p>

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            ПромоПтаха — на крилах знижок
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
            ПромоПтаха — це сайт, де користувачі можуть додавати промокоди,
            знайдені у блогерів, Telegram-каналах, на сайтах магазинів,
            у розсилках або соцмережах.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-3xl sm:p-5"
              >
                <div className="text-2xl sm:text-3xl">{feature.emoji}</div>

                <h2 className="mt-3 text-base font-black sm:mt-4 sm:text-xl">
                  {feature.title}
                </h2>

                <p className="mt-2 hidden leading-7 text-slate-400 sm:mt-3 sm:block">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-5 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:mt-10 sm:rounded-[2rem] sm:p-6">
            <h2 className="text-xl font-black text-emerald-300 sm:text-2xl">
              Чому це корисно?
            </h2>

            <p className="mt-3 text-sm font-bold leading-6 text-slate-300 sm:mt-4 sm:text-base sm:font-normal sm:leading-8">
              Промокоди часто з’являються у відео, постах, сторіс або закритих
              каналах. Через це їх важко знайти повторно. ПромоПтаха збирає їх
              в одному місці й дозволяє спільно перевіряти, що ще працює.
            </p>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-10 sm:flex sm:flex-wrap sm:gap-4">
            <Link
              href="/codes"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
            >
              Дивитись промокоди
            </Link>

            <Link
              href="/login?next=/add"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
            >
              Додати промокод
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
