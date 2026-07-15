type UserLevelBadgeProps = {
  approvedPromos?: number | null;
  size?: "sm" | "md";
};

function getUserLevel(approvedPromos: number) {
  if (approvedPromos >= 50) {
    return {
      emoji: "👑",
      label: "Легенда ПромоПтахи",
      className: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
    };
  }

  if (approvedPromos >= 15) {
    return {
      emoji: "🏆",
      label: "Топ автор",
      className: "border-orange-400/40 bg-orange-400/10 text-orange-300",
    };
  }

  if (approvedPromos >= 5) {
    return {
      emoji: "🔥",
      label: "Мисливець за знижками",
      className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (approvedPromos >= 1) {
    return {
      emoji: "🟢",
      label: "Автор",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    emoji: "🐣",
    label: "Новачок",
    className: "border-slate-700 bg-slate-900 text-slate-300",
  };
}

export default function UserLevelBadge({
  approvedPromos = 0,
  size = "md",
}: UserLevelBadgeProps) {
  const safeApprovedPromos = Math.max(0, Number(approvedPromos || 0));
  const level = getUserLevel(safeApprovedPromos);

  const sizeClass =
    size === "sm"
      ? "px-2 py-1 text-[11px]"
      : "px-3 py-2 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-black ${sizeClass} ${level.className}`}
      title={`${level.label}: ${safeApprovedPromos} схвалених промокодів`}
    >
      <span>{level.emoji}</span>
      <span>{level.label}</span>
    </span>
  );
}