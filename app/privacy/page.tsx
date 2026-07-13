import Link from "next/link";

export const metadata = {
  title: "Політика конфіденційності — ПромоПтаха",
  description:
    "Політика конфіденційності сайту ПромоПтаха: які дані використовуються та для чого.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <section className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            Конфіденційність
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            Політика конфіденційності
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            Ця сторінка пояснює, які дані можуть використовуватись на сайті
            ПромоПтаха та для чого вони потрібні.
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">1. Які дані використовуються</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Для роботи сайту може використовуватись email користувача,
                інформація про додані промокоди, голосування, заявки магазинів
                та повідомлення про проблеми з промокодами.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">2. Для чого потрібен email</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Email використовується для входу в акаунт, відновлення доступу,
                прив’язки доданих промокодів до користувача та захисту від
                зловживань.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">3. Користувацький контент</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Користувачі можуть додавати промокоди, посилання на джерела,
                описи, заявки магазинів і репорти. Частина цієї інформації може
                бути публічною після модерації.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">4. Авторизація</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Авторизація працює через Supabase Auth. Сайт не показує пароль
                адміністрації та не зберігає його у відкритому вигляді.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">5. Безпека</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Доступ до даних обмежується правилами безпеки бази даних.
                Адміністративні дії доступні тільки користувачу з відповідними
                правами.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-2xl font-black">6. Видалення або зміна даних</h2>

              <p className="mt-4 leading-8 text-slate-400">
                Якщо потрібно змінити або видалити доданий промокод, це можна
                зробити через профіль, якщо промокод ще очікує модерації. Інші
                питання можна вирішувати через адміністрацію сайту.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h2 className="text-2xl font-black text-emerald-300">
                Коротко
              </h2>

              <p className="mt-4 leading-8 text-slate-300">
                ПромоПтаха використовує дані тільки для роботи сайту:
                авторизації, додавання промокодів, модерації та захисту від
                спаму.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/rules"
              className="rounded-full bg-emerald-400 px-6 py-4 font-black text-white transition hover:bg-emerald-400"
            >
              Правила користування
            </Link>

            <Link
              href="/"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              На головну
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
