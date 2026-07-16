import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Правила сайту",
  description:
    "Правила ПромоПтахи: як додавати промокоди, коментарі, заявки магазинів і що заборонено.",
  robots: {
    index: true,
    follow: true,
  },
};

const rules = [
  {
    title: "1. Додавай тільки реальні промокоди",
    items: [
      "Промокод має бути справжнім або взятим із джерела, яке можна перевірити.",
      "Не додавай випадкові набори символів, фейкові коди або коди, які точно не працюють.",
      "Якщо знаєш умови промокоду, вкажи їх в описі: мінімальна сума, категорія товарів, строк дії, обмеження.",
    ],
  },
  {
    title: "2. Вказуй джерело",
    items: [
      "Джерелом може бути YouTube, Telegram, Instagram, сайт магазину, email-розсилка або інше місце, де ти знайшов код.",
      "Не додавай посилання на шахрайські, небезпечні або фішингові сайти.",
      "Якщо джерело недоступне, все одно опиши, звідки приблизно взято код.",
    ],
  },
  {
    title: "3. Не вводь людей в оману",
    items: [
      "Не пиши “100% працює”, “гарантовано”, “офіційно”, якщо це не підтверджено магазином.",
      "Не перебільшуй розмір знижки.",
      "Не приховуй важливі умови використання промокоду, якщо вони тобі відомі.",
    ],
  },
  {
    title: "4. Коментарі",
    items: [
      "Коментарі мають допомагати іншим користувачам зрозуміти, працює код чи ні.",
      "Заборонені образи, спам, погрози, дискримінація, шахрайство та реклама сторонніх сумнівних сервісів.",
      "Адміністрація може приховати або видалити коментар, який порушує правила.",
    ],
  },
  {
    title: "5. Заявки магазинів",
    items: [
      "Пропонуй магазини, які реально існують і мають сайт або публічну сторінку.",
      "Не додавай копії одного й того самого магазину.",
      "Не додавай магазини, які продають незаконні або небезпечні товари.",
    ],
  },
  {
    title: "6. Заборонений контент",
    items: [
      "Заборонено додавати незаконний, шахрайський, фішинговий, порнографічний, екстремістський або шкідливий контент.",
      "Заборонено публікувати чужі персональні дані без дозволу.",
      "Заборонено масово спамити, накручувати голосування або створювати акаунти для обходу обмежень.",
    ],
  },
  {
    title: "7. Модерація",
    items: [
      "Промокоди можуть проходити модерацію перед публікацією.",
      "Адміністрація може схвалити, відхилити, приховати або видалити матеріали, які порушують правила.",
      "Причина відхилення може відображатися в профілі користувача.",
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-4 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-sm sm:tracking-[0.3em]">
            Спільнота
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-5xl">
            Правила сайту
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-emerald-100/80 sm:mt-4 sm:text-base">
            Правила потрібні, щоб ПромоПтаха залишалась корисною базою
            промокодів, а не смітником фейкових кодів і спаму.
          </p>

          <p className="mt-4 text-[11px] font-bold text-emerald-100/60 sm:mt-5 sm:text-xs">
            Останнє оновлення: 16 липня 2026
          </p>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100/90 sm:mt-8 sm:rounded-[2rem] sm:p-5">
          Промокоди додаються користувачами. Перед покупкою завжди перевіряй
          умови промокоду, строк дії та остаточну ціну на сайті магазину.
        </section>

        <div className="mt-4 grid gap-3 sm:mt-8 sm:gap-5">
          {rules.map((rule) => (
            <section
              key={rule.title}
              className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 sm:rounded-[2rem] sm:p-6"
            >
              <h2 className="text-lg font-black leading-tight text-white sm:text-xl">
                {rule.title}
              </h2>

              <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                {rule.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm font-bold leading-6 text-slate-300 sm:gap-3 sm:leading-7"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 sm:mt-8 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-lg font-black text-white sm:text-xl">
            Юридичні сторінки
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/terms"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-4 sm:text-sm"
            >
              Умови використання
            </Link>

            <Link
              href="/privacy"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-4 sm:text-sm"
            >
              Політика приватності
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
