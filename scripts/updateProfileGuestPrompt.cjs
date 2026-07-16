const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "app", "profile", "page.tsx");

let content = fs.readFileSync(filePath, "utf8");

if (!content.includes('import LoginRequiredBox from "@/components/LoginRequiredBox";')) {
  content = content.replace(
    'import UserLevelProgress from "@/components/UserLevelProgress";',
    'import UserLevelProgress from "@/components/UserLevelProgress";\nimport LoginRequiredBox from "@/components/LoginRequiredBox";'
  );
}

const oldBlock = `  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-4xl font-black">Потрібно увійти</h1>

          <p className="mt-4 leading-7 text-slate-400">
            Кабінет доступний тільки для авторизованих користувачів.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Увійти
          </Link>
        </section>
      </main>
    );
  }`;

const newBlock = `  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link href="/" className="hover:text-emerald-300">
              Головна
            </Link>
            <span>/</span>
            <span className="text-slate-300">Мій профіль</span>
          </div>

          <section className="overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.98))] p-6 shadow-2xl shadow-emerald-950/20 lg:p-10">
            <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              Особистий кабінет
            </p>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
              Профіль доступний після входу
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
              Увійди в акаунт, щоб бачити свої промокоди, збережені коди,
              заявки магазинів, рівень автора та налаштування публічного
              профілю.
            </p>

            <div className="mt-8">
              <LoginRequiredBox
                title="Щоб відкрити профіль, увійди в акаунт"
                description="Після входу ми повернемо тебе в особистий кабінет, де будуть твої промокоди, збережені коди та заявки магазинів."
                nextPath="/profile"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-3xl">🎟️</p>
                <h2 className="mt-4 text-xl font-black">Мої промокоди</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  У профілі видно коди, які ти додав, їхній статус і причини
                  відхилення.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-3xl">⭐</p>
                <h2 className="mt-4 text-xl font-black">Збережені</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Зберігай корисні промокоди й швидко повертайся до них.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-3xl">🏆</p>
                <h2 className="mt-4 text-xl font-black">Рівень автора</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  За схвалені промокоди прокачується твій рівень у спільноті.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/codes"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Дивитись промокоди
              </Link>

              <Link
                href="/guest"
                className="rounded-full border border-slate-700 px-6 py-4 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Гостьовий режим
              </Link>
            </div>
          </section>
        </section>
      </main>
    );
  }`;

if (!content.includes(oldBlock)) {
  console.error("Не знайшов старий блок if (!user) у app/profile/page.tsx");
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, content, "utf8");

console.log("UPDATED: app/profile/page.tsx guest prompt");
