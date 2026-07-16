import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Умови використання",
  description:
    "Умови використання ПромоПтахи: правила користування сайтом, відповідальність користувачів, промокоди, магазини та контент.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: "1. Що таке ПромоПтаха",
    text: [
      "ПромоПтаха — це спільна база промокодів, акцій, магазинів і користувацьких перевірок.",
      "Сайт допомагає знаходити промокоди, ділитися ними, перевіряти їхню актуальність і залишати коментарі.",
      "ПромоПтаха не є продавцем товарів або послуг, не приймає оплату за товари і не відповідає за виконання замовлень магазинами.",
    ],
  },
  {
    title: "2. Промокоди та акції",
    text: [
      "Промокоди можуть додаватися користувачами сайту або адміністрацією.",
      "Ми не гарантуємо, що кожен промокод спрацює, буде доступний усім користувачам або діятиме до зазначеної дати.",
      "Перед покупкою користувач має самостійно перевірити умови промокоду, строк дії, обмеження, мінімальну суму замовлення та остаточну ціну на сайті відповідного магазину.",
      "Позначки “працює”, “не працює”, коментарі та статистика є користувацькими сигналами, а не офіційною гарантією.",
    ],
  },
  {
    title: "3. Користувацький контент",
    text: [
      "Користувач відповідає за промокоди, коментарі, заявки магазинів, опис, посилання та інший контент, який додає на сайт.",
      "Заборонено додавати фейкові, шахрайські, незаконні, образливі, спамні матеріали або контент, який порушує права інших осіб.",
      "Адміністрація може модерувати, приховувати, редагувати або видаляти контент, якщо він порушує правила сайту або може вводити інших користувачів в оману.",
    ],
  },
  {
    title: "4. Магазини, бренди та торговельні марки",
    text: [
      "Назви магазинів, брендів, сервісів і торговельних марок використовуються лише для ідентифікації відповідних продавців, сервісів або джерел промокодів.",
      "ПромоПтаха не заявляє про офіційне партнерство, представництво або схвалення з боку магазинів, якщо це прямо не зазначено окремо.",
      "Усі торговельні марки, логотипи, назви компаній і брендів належать їхнім відповідним власникам.",
      "Якщо правовласник вважає, що матеріал на сайті порушує його права, він може звернутися через сторінку контактів.",
    ],
  },
  {
    title: "5. Обліковий запис",
    text: [
      "Для додавання промокодів, коментарів, голосування, збереження кодів і заявок магазину може знадобитися акаунт.",
      "Користувач має надавати актуальну інформацію у профілі та не видавати себе за іншу особу.",
      "Адміністрація може обмежити доступ до акаунта у разі спаму, шахрайства, масового додавання фейкових промокодів або порушення правил.",
    ],
  },
  {
    title: "6. Відповідальність",
    text: [
      "Сайт надається “як є”. Ми намагаємося підтримувати актуальність інформації, але не гарантуємо відсутність помилок, застарілих промокодів або недоступних акцій.",
      "Покупки, оплата, доставка, повернення товарів, гарантія та інші питання щодо товарів або послуг вирішуються між користувачем і відповідним магазином.",
      "ПромоПтаха не несе відповідальності за рішення користувача купити товар або послугу на сторонньому сайті.",
    ],
  },
  {
    title: "7. Зміни умов",
    text: [
      "Ми можемо оновлювати ці умови, правила сайту та політику приватності.",
      "Актуальна версія документів завжди розміщується на сайті.",
      "Продовження використання сайту після оновлення означає згоду з новими умовами.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-4 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-sm sm:tracking-[0.3em]">
            Юридичне
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-5xl">
            Умови використання
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-emerald-100/80 sm:mt-4 sm:text-base">
            Ці умови пояснюють, як працює ПромоПтаха, що можна робити на сайті,
            за що відповідає користувач і що важливо знати перед використанням
            промокодів.
          </p>

          <p className="mt-4 text-[11px] font-bold text-emerald-100/60 sm:mt-5 sm:text-xs">
            Останнє оновлення: 16 липня 2026
          </p>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100/90 sm:mt-8 sm:rounded-[2rem] sm:p-5">
          ПромоПтаха не є продавцем товарів або послуг і не є офіційним
          представником магазинів. Промокоди додаються користувачами, а умови
          їх використання потрібно перевіряти на сайті відповідного продавця.
        </section>

        <div className="mt-4 grid gap-3 sm:mt-8 sm:gap-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 sm:rounded-[2rem] sm:p-6"
            >
              <h2 className="text-lg font-black leading-tight text-white sm:text-xl">
                {section.title}
              </h2>

              <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
                {section.text.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm font-bold leading-6 text-slate-300 sm:leading-7"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 sm:mt-8 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-lg font-black text-white sm:text-xl">
            Пов’язані сторінки
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/rules"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-4 sm:text-sm"
            >
              Правила
            </Link>

            <Link
              href="/privacy"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-4 sm:text-sm"
            >
              Приватність
            </Link>

            <Link
              href="/contact"
              className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:col-span-1 sm:rounded-full sm:bg-transparent sm:px-4 sm:text-sm"
            >
              Контакти
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
