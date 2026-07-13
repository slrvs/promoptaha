import Link from "next/link";

export const metadata = {
  title: "Про сайт — ПромоПтаха",
  description:
    "ПромоПтаха — спільна база промокодів, де користувачі додають і перевіряють знижки.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            Про проєкт
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            ПромоПтаха — на крилах знижок
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            ПромоПтаха — це сайт, де користувачі можуть додавати промокоди,
            знайдені у блогерів, Telegram-каналах, на сайтах магазинів,
            у розсилках або соцмережах.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-3xl">🐦</div>
              <h2 className="mt-4 text-xl font-black">Додавай</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Знайшов промокод — додай його на сайт, вкажи магазин, джерело
                та термін дії.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-3xl">✅</div>
              <h2 className="mt-4 text-xl font-black">Перевіряй</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Користувачі можуть голосувати, чи промокод працює, щоб інші
                бачили актуальність.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-3xl">💸</div>
              <h2 className="mt-4 text-xl font-black">Економ</h2>
              <p className="mt-3 leading-7 text-slate-400">
                Мета проста — швидко знайти робочий промокод і не витрачати час
                на мертві знижки.
              </p>
            </div>
          </div>

          <section className="mt-10 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
            <h2 className="text-2xl font-black text-emerald-300">
              Чому це корисно?
            </h2>

            <p className="mt-4 leading-8 text-slate-300">
              Промокоди часто з’являються у відео, постах, сторіс або закритих
              каналах. Через це їх важко знайти повторно. ПромоПтаха збирає їх
              в одному місці й дозволяє спільно перевіряти, що ще працює.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/codes"
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Дивитись промокоди
            </Link>

            <Link
              href="/add"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Додати промокод
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}