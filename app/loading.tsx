import Image from "next/image";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-red-950/20">
          <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center overflow-hidden rounded-[2rem] border border-red-400/30 bg-slate-950 shadow-xl shadow-red-950/30">
            <Image
              src="/icons/promoptaha-red-bird.png"
              alt="ПромоПтаха"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">ПромоПтаха летить...</h1>

          <p className="mt-3 text-slate-400">
            Завантажуємо знижки, магазини та промокоди.
          </p>
        </div>
      </section>
    </main>
  );
}