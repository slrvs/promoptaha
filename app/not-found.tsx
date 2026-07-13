import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 text-center shadow-2xl shadow-red-950/20 lg:p-10">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-red-400/30 bg-slate-950 shadow-xl shadow-red-950/30">
            <Image
              src="/icons/promoptaha-red-bird.png"
              alt="ПромоПтаха"
              width={112}
              height={112}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <p className="mt-8 inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300">
            404 — сторінку не знайдено
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-tight">
            Пташка сюди ще не долетіла
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Такої сторінки немає, посилання змінилось або промокод уже злетів з
            гнізда. Повернись на головну або переглянь актуальні промокоди.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
            >
              На головну
            </Link>

            <Link
              href="/codes"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
            >
              Дивитись промокоди
            </Link>

            <Link
              href="/stores"
              className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-red-400 hover:text-red-300"
            >
              Магазини
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}