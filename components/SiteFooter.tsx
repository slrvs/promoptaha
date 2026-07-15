import Link from "next/link";

const currentYear = 2026;

const mainLinks = [
  {
    href: "/codes",
    label: "Промокоди",
  },
  {
    href: "/deals",
    label: "Акції",
  },
  {
    href: "/stores",
    label: "Магазини",
  },
  {
    href: "/users",
    label: "Спільнота",
  },
  {
    href: "/levels",
    label: "Рівні",
  },
  {
    href: "/stats",
    label: "Статистика",
  },
];

const helpLinks = [
  {
    href: "/add",
    label: "Додати промокод",
  },
  {
    href: "/request-store",
    label: "Запропонувати магазин",
  },
  {
    href: "/rules",
    label: "Правила",
  },
  {
    href: "/contact",
    label: "Контакти",
  },
];

const legalLinks = [
  {
    href: "/about",
    label: "Про нас",
  },
  {
    href: "/privacy",
    label: "Приватність",
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900">
              <img
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xl font-black">ПромоПтаха</p>
              <p className="text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-5 max-w-md leading-7 text-slate-400">
            Спільна база промокодів, акцій і магазинів. Користувачі додають
            коди, перевіряють їх і допомагають іншим економити.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/add"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати код
            </Link>

            <Link
              href="/levels"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Рівні авторів
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Навігація
          </h2>

          <div className="mt-5 grid gap-3">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold text-slate-300 transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Участь
          </h2>

          <div className="mt-5 grid gap-3">
            {helpLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold text-slate-300 transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Інформація
          </h2>

          <div className="mt-5 grid gap-3">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold text-slate-300 transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm font-black text-emerald-300">
              🐦 Розвивай спільноту
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Додавай справжні промокоди, проходь модерацію та піднімай рівень
              автора.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm font-bold text-slate-500">
        <p>© {currentYear} ПромоПтаха. На крилах знижок.</p>

        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="transition hover:text-emerald-300">
            Приватність
          </Link>

          <Link href="/rules" className="transition hover:text-emerald-300">
            Правила
          </Link>

          <Link href="/contact" className="transition hover:text-emerald-300">
            Контакти
          </Link>
        </div>
      </section>
    </footer>
  );
}