import Link from "next/link";

export const metadata = {
  title: "Контакти — ПромоПтаха",
  description:
    "Зворотний зв’язок із ПромоПтахою: додати промокод, запропонувати магазин або повідомити про проблему.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-red-950/20 lg:p-10">
          <p className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
            Зворотний зв’язок
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            Контакти ПромоПтахи
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            Маєш промокод, хочеш додати магазин або знайшов проблему на сайті?
            Обери потрібний варіант нижче.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <div className="text-4xl">🎟️</div>

              <h2 className="mt-5 text-2xl font-black">Додати промокод</h2>

              <p className="mt-4 leading-7 text-slate-400">
                Знайшов промокод у блогера, Telegram, TikTok, Instagram або на
                сайті магазину — додай його на перевірку.
              </p>

              <Link
                href="/add"
                className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400"
              >
                Додати код
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <div className="text-4xl">🏪</div>

              <h2 className="mt-5 text-2xl font-black">Запропонувати магазин</h2>

              <p className="mt-4 leading-7 text-slate-400">
                Не знайшов потрібний магазин у списку? Залиш заявку — після
                модерації магазин можна буде додати на сайт.
              </p>

              <Link
                href="/request-store"
                className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400"
              >
                Запропонувати
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <div className="text-4xl">⚠️</div>

              <h2 className="mt-5 text-2xl font-black">Повідомити про проблему</h2>

              <p className="mt-4 leading-7 text-slate-400">
                Якщо промокод не працює, має неправильний опис або сумнівне
                джерело — відкрий його сторінку та натисни кнопку репорту.
              </p>

              <Link
                href="/codes"
                className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400"
              >
                До промокодів
              </Link>
            </div>
          </div>

          <section className="mt-10 rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6">
            <h2 className="text-2xl font-black text-red-300">
              Як швидше допомогти?
            </h2>

            <p className="mt-4 leading-8 text-slate-300">
              Коли додаєш промокод, вказуй джерело, термін дії, магазин і
              короткий опис умови. Так модерація швидше перевірить код, а інші
              користувачі зрозуміють, де і як його застосувати.
            </p>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/rules"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
            >
              Правила користування
            </Link>

            <Link
              href="/privacy"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
            >
              Політика конфіденційності
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}