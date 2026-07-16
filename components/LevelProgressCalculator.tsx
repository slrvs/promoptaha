"use client";

import { useState } from "react";
import UserLevelBadge from "@/components/UserLevelBadge";
import UserLevelProgress from "@/components/UserLevelProgress";

export default function LevelProgressCalculator() {
  const [approvedPromos, setApprovedPromos] = useState(5);

  function handleChange(value: string) {
    const nextValue = Number(value);

    if (Number.isNaN(nextValue)) {
      setApprovedPromos(0);
      return;
    }

    setApprovedPromos(Math.max(0, Math.min(999, nextValue)));
  }

  return (
    <section className="rounded-[2rem] border border-emerald-400/20 bg-slate-900/80 p-4 sm:rounded-[2.5rem] sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-6">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
            Калькулятор рівня
          </p>

          <h2 className="text-2xl font-black sm:text-3xl">
            Перевір свій рівень
          </h2>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-400 sm:mt-3 sm:text-base sm:font-normal sm:leading-7">
            Введи кількість схвалених промокодів і побачиш свій бейдж та
            прогрес до наступного рівня.
          </p>

          <label className="mt-4 grid gap-2 sm:mt-6">
            <span className="text-sm font-black text-slate-300">
              Схвалених промокодів
            </span>

            <input
              type="number"
              min={0}
              max={999}
              value={approvedPromos}
              onChange={(event) => handleChange(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 sm:px-5 sm:py-4 sm:text-base"
            />
          </label>

          <div className="mt-4 sm:mt-5">
            <UserLevelBadge approvedPromos={approvedPromos} size="md" />
          </div>
        </div>

        <div className="scale-[0.98] sm:scale-100">
          <UserLevelProgress approvedPromos={approvedPromos} />
        </div>
      </div>
    </section>
  );
}