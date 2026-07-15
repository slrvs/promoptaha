import Link from "next/link";

const mainLinks = [
  { href: "/codes", label: "Промокоди" },
  { href: "/deals", label: "Акції" },
  { href: "/stores", label: "Магазини" },
  { href: "/stats", label: "Статистика" },
  { href: "/add", label: "Додати промокод" },
  { href: "/request-store", label: "Запропонувати магазин" },
];

const infoLinks = [
  { href: "/about", label: "Про проєкт" },
  { href: "/rules", label: "Правила" },
  { href: "/privacy", label: "Приватність" },
  { href: "/contact", label: "Контакти" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900">
              <img
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                className="h-full w-full object-contain p-1.5"
              />
            </div>

            <div>
              <p className="text-xl font-black">ПромоПтаха</p>
              <p className="text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-5 max-w-xl leading-7 text-slate-400">
            Спільна база промокодів, акцій і магазинів. Користувачі додають
            промокоди, перевіряють їхню актуальність і допомагають іншим
            економити.
          </p>

          <p className="mt-6 text-sm font-bold text-slate-500">
            © 2026 ПромоПтаха. Всі права захищено.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-black">Розділи</h2>

          <div className="mt-4 grid gap-3">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-slate-400 transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black">Інформація</h2>

          <div className="mt-4 grid gap-3">
            {infoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-slate-400 transition hover:text-emerald-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-black text-emerald-300">
              Маєш промокод або акцію?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Додай промокод або запропонуй магазин, якого ще немає в базі.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/add"
                className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
              >
                Додати
              </Link>

              <Link
                href="/request-store"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Магазин
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}