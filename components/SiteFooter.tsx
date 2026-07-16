import Link from "next/link";

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

const serviceLinks = [
  {
    href: "/login?next=/add",
    label: "Додати код",
  },
  {
    href: "/login?next=/request-store",
    label: "Запропонувати магазин",
  },
  {
    href: "/guest",
    label: "Гостьовий режим",
  },
  {
    href: "/login?next=/profile",
    label: "Профіль",
  },
];

const infoLinks = [
  {
    href: "/about",
    label: "Про сайт",
  },
  {
    href: "/rules",
    label: "Правила",
  },
  {
    href: "/terms",
    label: "Умови",
  },
  {
    href: "/privacy",
    label: "Приватність",
  },
  {
    href: "/contact",
    label: "Контакти",
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 px-3 py-6 text-white sm:px-5 sm:py-10">
      <section className="mx-auto grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.8fr_0.9fr_0.8fr] lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 sm:h-14 sm:w-14">
              <img
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xl font-black sm:text-2xl">ПромоПтаха</p>
              <p className="text-xs font-bold text-emerald-300 sm:text-sm">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-4 max-w-md text-sm font-bold leading-6 text-slate-400 sm:mt-5 sm:text-base sm:font-normal sm:leading-7">
            Спільна база промокодів, акцій і магазинів. Користувачі додають
            коди, перевіряють їх, голосують і допомагають іншим економити.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/guest"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-center text-xs font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 sm:rounded-full sm:px-5 sm:py-3 sm:text-sm"
            >
              Гостьовий режим
            </Link>

            <Link
              href="/login?next=/add"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-center text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-sm"
            >
              Додати код
            </Link>

            <Link
              href="/levels"
              className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-center text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300 sm:col-span-1 sm:rounded-full sm:bg-transparent sm:px-5 sm:py-3 sm:text-sm"
            >
              Рівні авторів
            </Link>
          </div>

          <p className="mt-5 text-xs font-bold text-slate-600 sm:mt-6 sm:text-sm">
            © 2026 ПромоПтаха
          </p>
        </div>

        <FooterColumn title="Навігація" links={mainLinks} />
        <FooterColumn title="Дії" links={serviceLinks} />
        <FooterColumn title="Інформація" links={infoLinks} />
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.18em]">
        {title}
      </h2>

      <nav className="mt-3 grid gap-2 sm:mt-5 sm:gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-bold text-slate-300 transition hover:text-emerald-300 sm:text-base"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
