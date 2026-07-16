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
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
            Спільнота
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Правила сайту
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-emerald-100/80 sm:text-base">
            Правила потрібні, щоб ПромоПтаха залишалась корисною базою
            промокодів, а не смітником фейкових кодів і спаму.
          </p>

          <p className="mt-5 text-xs font-bold text-emerald-100/60">
            Останнє оновлення: 16 липня 2026
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5 text-sm font-bold leading-6 text-yellow-100/90">
          Промокоди додаються користувачами. Перед покупкою завжди перевіряй
          умови промокоду, строк дії та остаточну ціну на сайті магазину.
        </div>

        <div className="mt-8 space-y-5">
          {rules.map((rule) => (
            <section
              key={rule.title}
              className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-xl font-black text-white">{rule.title}</h2>

              <ul className="mt-4 space-y-3">
                {rule.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm font-bold leading-7 text-slate-300"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black text-white">Юридичні сторінки</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Умови використання
            </Link>

            <Link
              href="/privacy"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Політика приватності
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
