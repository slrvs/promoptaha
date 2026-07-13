import Link from "next/link";

export const metadata = {
  title: "Правила користування — ПромоПтаха",
  description:
    "Правила користування сайтом ПромоПтаха: додавання промокодів, перевірка актуальності та відповідальність користувачів.",
};

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            Правила
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            Правила користування
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            ПромоПтаха — це спільна база промокодів. Коди додають користувачі,
            а їхню актуальність допомагає перевіряти спільнота.
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">1. Додавання промокодів</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Користувач може додати промокод, якщо він знайшов його у
                відкритому джерелі: на сайті магазину, у відео, Telegram,
                Instagram, TikTok, email-розсилці або іншому джерелі.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">2. Модерація</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Нові промокоди можуть проходити перевірку перед публікацією.
                Адміністрація сайту може схвалити, відхилити або видалити код,
                якщо він некоректний, дублюється або має сумнівне джерело.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">3. Актуальність кодів</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Сайт не гарантує, що кожен промокод буде працювати в момент
                використання. Магазини можуть змінювати умови, завершувати
                акції або обмежувати дію кодів без попередження.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">4. Голосування</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Користувачі можуть позначати, чи промокод працює. Ці голоси
                допомагають іншим швидше зрозуміти, чи варто пробувати код.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">5. Повідомлення про проблему</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Якщо промокод не працює, має неправильний опис, веде на
                сумнівне джерело або порушує правила, користувач може
                надіслати репорт через кнопку повідомлення про проблему.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">6. Заборонено</h2>

              <ul className="mt-4 list-disc space-y-3 pl-6 leading-8 text-slate-400">
                <li>Додавати фейкові або вигадані промокоди.</li>
                <li>Додавати шкідливі, шахрайські або підозрілі посилання.</li>
                <li>Спамити однаковими кодами або заявками.</li>
                <li>Видавати себе за офіційного представника магазину без підстав.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h2 className="text-2xl font-black text-emerald-300">
                Головний принцип
              </h2>

              <p className="mt-4 leading-8 text-slate-300">
                Додавай тільки ті промокоди, які сам вважаєш реальними та
                корисними. ПромоПтаха має допомагати людям економити, а не
                витрачати час на сміття.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/codes"
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              До промокодів
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