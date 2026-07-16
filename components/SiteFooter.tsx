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
    href: "/guest",
    label: "Гостьовий режим",
  },
  {
    href: "/stats",
    label: "Статистика",
  },
];

const serviceLinks = [
  {
    href: "/login?next=/add",
    label: "Додати промокод",
  },
  {
    href: "/login?next=/request-store",
    label: "Запропонувати магазин",
  },
  {
    href: "/login",
    label: "Увійти",
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
    <footer className="border-t border-slate-900 bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900">
              <img
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-2xl font-black">ПромоПтаха</p>
              <p className="text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-5 max-w-md leading-7 text-slate-400">
            Спільна база промокодів, акцій і магазинів. Користувачі додають
            коди, перевіряють їх, голосують і допомагають іншим економити.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/guest"
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
            >
              Гостьовий режим
            </Link>

            <Link
              href="/login?next=/add"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Додати промокод
            </Link>

            <Link
              href="/levels"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Рівні авторів
            </Link>
          </div>

          <p className="mt-6 text-sm font-bold text-slate-600">
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
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h2>

      <nav className="mt-5 grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-bold text-slate-300 transition hover:text-emerald-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}