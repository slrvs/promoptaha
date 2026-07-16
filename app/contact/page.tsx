import Link from "next/link";

export const metadata = {
  title: "Контакти — ПромоПтаха",
  description:
    "Зворотний зв’язок із ПромоПтахою: додати промокод, запропонувати магазин або повідомити про проблему.",
};

const contactActions = [
  {
    emoji: "🎟️",
    title: "Додати промокод",
    description:
      "Знайшов промокод у блогера, Telegram, TikTok, Instagram або на сайті магазину — додай його на перевірку.",
    href: "/login?next=/add",
    label: "Додати код",
  },
  {
    emoji: "🏪",
    title: "Запропонувати магазин",
    description:
      "Не знайшов потрібний магазин у списку? Залиш заявку — після модерації його можна буде додати на сайт.",
    href: "/login?next=/request-store",
    label: "Запропонувати",
  },
  {
    emoji: "⚠️",
    title: "Повідомити про проблему",
    description:
      "Якщо промокод не працює, має неправильний опис або сумнівне джерело — відкрий сторінку коду й натисни кнопку репорту.",
    href: "/codes",
    label: "До промокодів",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 sm:py-10">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-emerald-950/10 sm:rounded-[2.5rem] sm:p-6 sm:shadow-2xl sm:shadow-emerald-950/20 lg:p-10">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
            Зворотний зв’язок
          </p>

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Контакти ПромоПтахи
          </h1>

          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 sm:mt-6 sm:text-lg sm:font-normal sm:leading-8">
            Маєш промокод, хочеш додати магазин або знайшов проблему на сайті?
            Обери потрібний варіант нижче.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">
            {contactActions.map((action) => (
              <article
                key={action.title}
                className="flex flex-col rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 sm:rounded-3xl sm:p-6"
              >
                <div className="text-2xl sm:text-4xl">{action.emoji}</div>

                <h2 className="mt-3 text-base font-black leading-tight sm:mt-5 sm:text-2xl">
                  {action.title}
                </h2>

                <p className="mt-3 hidden leading-7 text-slate-400 sm:block">
                  {action.description}
                </p>

                <Link
                  href={action.href}
                  className="mt-auto inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-center text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:mt-6 sm:rounded-full sm:px-5 sm:py-3 sm:text-sm"
                >
                  {action.label}
                </Link>
              </article>
            ))}
          </div>

          <section className="mt-5 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:mt-10 sm:rounded-[2rem] sm:p-6">
            <h2 className="text-xl font-black text-emerald-300 sm:text-2xl">
              Як швидше допомогти?
            </h2>

            <p className="mt-3 text-sm font-bold leading-6 text-slate-300 sm:mt-4 sm:text-base sm:font-normal sm:leading-8">
              Коли додаєш промокод, вказуй джерело, термін дії, магазин і
              короткий опис умов. Так модерація швидше перевірить код, а інші
              користувачі зрозуміють, де і як його застосувати.
            </p>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-10 sm:flex sm:flex-wrap sm:gap-4">
            <Link
              href="/rules"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
            >
              Правила
            </Link>

            <Link
              href="/privacy"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-6 sm:py-4 sm:text-base"
            >
              Приватність
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
