type UserLevelProgressProps = {
  approvedPromos?: number | null;
};

type LevelInfo = {
  emoji: string;
  label: string;
  min: number;
};

const levels: LevelInfo[] = [
  {
    emoji: "🐣",
    label: "Новачок",
    min: 0,
  },
  {
    emoji: "🟢",
    label: "Автор",
    min: 1,
  },
  {
    emoji: "🔥",
    label: "Мисливець за знижками",
    min: 5,
  },
  {
    emoji: "🏆",
    label: "Топ автор",
    min: 15,
  },
  {
    emoji: "👑",
    label: "Легенда ПромоПтахи",
    min: 50,
  },
];

function getCurrentLevel(approvedPromos: number) {
  return [...levels]
    .reverse()
    .find((level) => approvedPromos >= level.min) || levels[0];
}

function getNextLevel(approvedPromos: number) {
  return levels.find((level) => approvedPromos < level.min) || null;
}

export default function UserLevelProgress({
  approvedPromos = 0,
}: UserLevelProgressProps) {
  const safeApprovedPromos = Math.max(0, Number(approvedPromos || 0));
  const currentLevel = getCurrentLevel(safeApprovedPromos);
  const nextLevel = getNextLevel(safeApprovedPromos);

  const previousLevelMin = currentLevel.min;
  const nextLevelMin = nextLevel?.min || currentLevel.min;
  const range = Math.max(1, nextLevelMin - previousLevelMin);
  const currentProgress = Math.max(0, safeApprovedPromos - previousLevelMin);
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((currentProgress / range) * 100))
    : 100;

  const needed = nextLevel
    ? Math.max(0, nextLevel.min - safeApprovedPromos)
    : 0;

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">Поточний рівень</p>

          <p className="mt-2 text-2xl font-black text-white">
            {currentLevel.emoji} {currentLevel.label}
          </p>
        </div>

        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
          {safeApprovedPromos} кодів
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>

      {nextLevel ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-bold text-slate-400">
            До наступного рівня:{" "}
            <span className="font-black text-emerald-300">
              {nextLevel.emoji} {nextLevel.label}
            </span>
          </p>

          <p className="font-black text-slate-300">
            ще {needed} {needed === 1 ? "код" : "кодів"}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm font-black text-yellow-300">
          👑 Максимальний рівень досягнуто
        </p>
      )}
    </div>
  );
}