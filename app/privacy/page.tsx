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
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
            Дані користувачів
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Політика приватності
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-emerald-100/80 sm:text-base">
            Тут пояснюємо, які дані можуть оброблятися на ПромоПтасі, для чого
            вони потрібні та як користувач може звернутися щодо своїх даних.
          </p>

          <p className="mt-5 text-xs font-bold text-emerald-100/60">
            Останнє оновлення: 16 липня 2026
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5 text-sm font-bold leading-6 text-yellow-100/90">
          Ми не просимо зайвих персональних даних і не продаємо дані
          користувачів рекламодавцям. Email використовується для входу та
          службових потреб акаунта.
        </div>

        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-xl font-black text-white">{section.title}</h2>

              <ul className="mt-4 space-y-3">
                {section.text.map((item) => (
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
          <h2 className="text-xl font-black text-white">Контроль над даними</h2>

          <p className="mt-3 text-sm font-bold leading-7 text-slate-300">
            Щоб попросити змінити або видалити дані акаунта, звернися через
            сторінку контактів. У зверненні вкажи email акаунта або username,
            щоб ми могли ідентифікувати профіль.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Зв’язатися
            </Link>

            <Link
              href="/terms"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Умови використання
            </Link>

            <Link
              href="/rules"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Правила
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
