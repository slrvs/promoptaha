type LegalDisclaimerBoxProps = {
  variant?: "promo" | "store" | "general";
  className?: string;
};

const content = {
  promo: {
    title: "Важливо про промокод",
    text: [
      "ПромоПтаха не є продавцем товарів або послуг і не гарантує роботу промокоду.",
      "Промокоди можуть додаватися користувачами. Перед покупкою перевіряй умови, строк дії, обмеження та остаточну ціну на сайті відповідного магазину.",
    ],
  },
  store: {
    title: "Важливо про магазин",
    text: [
      "ПромоПтаха не є офіційним представником цього магазину, якщо це прямо не зазначено окремо.",
      "Назви магазинів і брендів використовуються лише для ідентифікації. Усі торговельні марки належать їхнім власникам.",
    ],
  },
  general: {
    title: "Юридичне уточнення",
    text: [
      "ПромоПтаха не є продавцем товарів або послуг. Інформація на сайті може додаватися користувачами.",
      "Перед покупкою перевіряй умови акції, промокоду або пропозиції на сайті відповідного продавця.",
    ],
  },
};

export default function LegalDisclaimerBox({
  variant = "general",
  className = "",
}: LegalDisclaimerBoxProps) {
  const current = content[variant];

  return (
    <section
      className={`rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-xl">
          ⚠️
        </div>

        <div>
          <h2 className="text-base font-black text-yellow-100">
            {current.title}
          </h2>

          <div className="mt-2 space-y-2">
            {current.text.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm font-bold leading-6 text-yellow-100/80"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
