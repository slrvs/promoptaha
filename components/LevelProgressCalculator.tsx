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
    <section className="rounded-[2.5rem] border border-emerald-400/20 bg-slate-900/80 p-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
            Калькулятор рівня
          </p>

          <h2 className="text-3xl font-black">Перевір свій рівень</h2>

          <p className="mt-3 leading-7 text-slate-400">
            Введи кількість схвалених промокодів і побачиш, який бейдж отримає
            користувач та скільки залишилось до наступного рівня.
          </p>

          <label className="mt-6 grid gap-2">
            <span className="text-sm font-black text-slate-300">
              Кількість схвалених промокодів
            </span>

            <input
              type="number"
              min={0}
              max={999}
              value={approvedPromos}
              onChange={(event) => handleChange(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <div className="mt-5">
            <UserLevelBadge approvedPromos={approvedPromos} size="md" />
          </div>
        </div>

        <UserLevelProgress approvedPromos={approvedPromos} />
      </div>
    </section>
  );
}