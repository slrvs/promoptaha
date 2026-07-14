import Image from "next/image";
import Link from "next/link";

const mainLinks = [
  {
    href: "/codes",
    label: "Промокоди",
  },
  {
    href: "/stores",
    label: "Магазини",
  },
  {
    href: "/stats",
    label: "Статистика",
  },
  {
    href: "/add",
    label: "Додати код",
  },
  {
    href: "/request-store",
    label: "Запропонувати магазин",
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
    <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30">
              <Image
                src="/icons/promoptaha-bird.png"
                alt="ПромоПтаха"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-xl font-black leading-5">ПромоПтаха</p>
              <p className="text-sm font-bold text-emerald-300">
                На крилах знижок
              </p>
            </div>
          </Link>

          <p className="mt-5 max-w-xl leading-7 text-slate-400">
            Спільна база промокодів, де користувачі додають, перевіряють і
            знаходять актуальні знижки для магазинів.
          </p>

          <p className="mt-5 text-sm font-bold text-slate-600">
            © 2026 ПромоПтаха. Всі права захищені.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            Сайт
          </h2>

          <div className="mt-4 grid gap-3">
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
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            Інформація
          </h2>

          <div className="mt-4 grid gap-3">
            {infoLinks.map((link) => (
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
      </section>
    </footer>
  );
}