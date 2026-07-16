import Link from "next/link";

type LoginRequiredBoxProps = {
  title?: string;
  description?: string;
  nextPath?: string;
  compact?: boolean;
};

export default function LoginRequiredBox({
  title = "Потрібен акаунт",
  description = "Увійди або створи акаунт, щоб виконати цю дію.",
  nextPath = "/profile",
  compact = false,
}: LoginRequiredBoxProps) {
  const safeNextPath =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/profile";

  const loginHref = `/login?next=${encodeURIComponent(safeNextPath)}`;

  return (
    <div
      className={`rounded-2xl border border-emerald-400/30 bg-emerald-400/10 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-emerald-300">{title}</p>

          <p className="mt-2 text-sm font-bold leading-6 text-emerald-100/80">
            {description}
          </p>
        </div>

        <Link
          href={loginHref}
          className="inline-flex shrink-0 justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
        >
          Увійти
        </Link>
      </div>
    </div>
  );
}