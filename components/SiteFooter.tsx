import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-red-400/30 bg-slate-900 shadow-lg shadow-red-950/30">
              <Image
                src="/icons/promoptaha-red-bird.png"
                alt="ПромоПтаха"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-xl font-black">ПромоПтаха</p>
              <p className="text-sm text-slate-500">На крилах знижок</p>
            </div>
          </div>

          <p className="mt-5 max-w-xl leading-7 text-slate-400">
            Спільна база промокодів, де користувачі додають знайдені знижки,
            перевіряють їхню актуальність і допомагають іншим економити.
          </p>
        </div>

        <div>
          <h3 className="font-black text-slate-200">Навігація</h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
            <Link href="/codes" className="hover:text-red-300">
              Промокоди
            </Link>

            <Link href="/stores" className="hover:text-red-300">
              Магазини
            </Link>

            <Link href="/add" className="hover:text-red-300">
              Додати промокод
            </Link>

            <Link href="/request-store" className="hover:text-red-300">
              Запропонувати магазин
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-200">Про проєкт</h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
            <Link href="/about" className="hover:text-red-300">
              Про сайт
            </Link>

            <Link href="/rules" className="hover:text-red-300">
              Правила користування
            </Link>

            <Link href="/login" className="hover:text-red-300">
              Увійти
            </Link>

            <Link href="/profile" className="hover:text-red-300">
              Профіль
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500">
        <p>© 2026 ПромоПтаха</p>
        <p>Промокоди перевіряються спільнотою</p>
      </section>
    </footer>
  );
}