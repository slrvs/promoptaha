import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Політика приватності",
  description:
    "Політика приватності ПромоПтахи: які дані ми обробляємо, навіщо вони потрібні та як користувач може звернутися щодо своїх даних.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: "1. Які дані ми можемо обробляти",
    text: [
      "Email, який використовується для входу або реєстрації.",
      "Username, display name, avatar, bio та посилання на соціальні мережі, якщо користувач сам додає їх у профілі.",
      "Промокоди, коментарі, голосування, збережені промокоди, заявки магазинів і репорти.",
      "Технічні дані, які можуть оброблятися сервісами хостингу, Supabase або браузером: IP-адреса, user-agent, час запиту, технічні логи безпеки.",
    ],
  },
  {
    title: "2. Для чого потрібні ці дані",
    text: [
      "Щоб користувач міг увійти в акаунт і користуватися функціями сайту.",
      "Щоб показувати авторство промокодів, рівні користувачів, коментарі та публічні профілі.",
      "Щоб модерувати промокоди, заявки магазинів, коментарі та скарги.",
      "Щоб захищати сайт від спаму, шахрайства, масових фейкових заявок і технічних атак.",
      "Щоб покращувати роботу сайту та знаходити помилки.",
    ],
  },
  {
    title: "3. Що видно публічно",
    text: [
      "Публічно можуть відображатися username, display name, avatar, bio, соціальні посилання, рівень користувача, кількість схвалених промокодів і додані користувачем публічні матеріали.",
      "Email користувача не призначений для публічного показу на сайті.",
      "Адміністративна інформація, технічні логи та службові дані не показуються публічно.",
    ],
  },
  {
    title: "4. Сторонні сервіси",
    text: [
      "Для роботи сайту можуть використовуватися сторонні сервіси, зокрема хостинг, база даних, авторизація, зберігання аватарів або аналітика.",
      "Такі сервіси можуть обробляти технічні дані відповідно до власних політик приватності та умов використання.",
      "Ми не продаємо персональні дані користувачів рекламодавцям.",
    ],
  },
  {
    title: "5. Зберігання та видалення даних",
    text: [
      "Дані зберігаються стільки, скільки потрібно для роботи сайту, безпеки, модерації та виконання правил.",
      "Користувач може звернутися щодо видалення або зміни своїх даних через сторінку контактів.",
      "Деякі дані можуть зберігатися довше, якщо це потрібно для безпеки, запобігання шахрайству, вирішення спорів або виконання вимог законодавства.",
    ],
  },
  {
    title: "6. Безпека",
    text: [
      "Ми використовуємо доступні технічні засоби для захисту акаунтів, бази даних і користувацького контенту.",
      "Користувач також відповідає за безпеку свого акаунта, доступу до email та пристроїв.",
      "Якщо користувач помітив підозрілу активність, він може звернутися через сторінку контактів.",
    ],
  },
  {
    title: "7. Зміни політики",
    text: [
      "Політика приватності може оновлюватися.",
      "Актуальна версія завжди доступна на цій сторінці.",
      "Продовження використання сайту після оновлення означає згоду з актуальною версією політики.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-4 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-sm sm:tracking-[0.3em]">
            Дані користувачів
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-5xl">
            Політика приватності
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-emerald-100/80 sm:mt-4 sm:text-base">
            Тут пояснюємо, які дані можуть оброблятися на сайті ПромоПтаха,
            для чого вони потрібні та як користувач може звернутися щодо своїх
            даних.
          </p>

          <p className="mt-4 text-[11px] font-bold text-emerald-100/60 sm:mt-5 sm:text-xs">
            Останнє оновлення: 16 липня 2026
          </p>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100/90 sm:mt-8 sm:rounded-[2rem] sm:p-5">
          Ми не просимо зайвих персональних даних і не продаємо дані
          користувачів рекламодавцям. Email використовується для входу та
          службових потреб акаунта.
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

              <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                {section.text.map((item) => (
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
            Контроль над даними
          </h2>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-300 sm:leading-7">
            Щоб попросити змінити або видалити дані акаунта, звернися через
            сторінку контактів. У зверненні вкажи email акаунта або username,
            щоб ми могли ідентифікувати профіль.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-400 px-3 py-2 text-center text-xs font-black text-slate-950 transition hover:bg-emerald-300 sm:rounded-full sm:px-5 sm:py-3 sm:text-sm"
            >
              Зв’язатися
            </Link>

            <Link
              href="/terms"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-sm"
            >
              Умови
            </Link>

            <Link
              href="/rules"
              className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:col-span-1 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-sm"
            >
              Правила
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
