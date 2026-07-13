"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoReportButtonProps = {
  promoId: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function PromoReportButton({ promoId }: PromoReportButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("not_working");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function sendReport() {
    setStatusMessage("");

    if (!user) {
      setStatusMessage("Щоб повідомити про проблему, потрібно увійти.");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from("promo_reports").insert({
      promo_code_id: promoId,
      reason,
      message: message.trim() || null,
      status: "pending",
      reported_by: user.id,
    });

    setIsSending(false);

    if (error) {
      setStatusMessage(`Помилка: ${error.message}`);
      return;
    }

    setReason("not_working");
    setMessage("");
    setStatusMessage("Дякуємо. Повідомлення відправлено 🐦");
    setIsOpen(false);
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 transition hover:bg-yellow-400 hover:text-slate-950"
      >
        Повідомити про проблему
      </button>

      {!user && (
        <p className="mt-3 text-sm text-slate-500">
          Для відправки повідомлення потрібно{" "}
          <Link href="/login" className="font-bold text-emerald-300">
            увійти
          </Link>
          .
        </p>
      )}

      {isOpen && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Що не так?
            </label>

            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="not_working">Промокод не працює</option>
              <option value="expired">Промокод закінчився</option>
              <option value="wrong_description">Неправильний опис</option>
              <option value="suspicious">Підозрілий промокод</option>
              <option value="other">Інше</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Коментар
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Наприклад: магазин пише, що код недійсний"
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />
          </div>

          <button
            onClick={sendReport}
            disabled={isSending || !user}
            className="w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Відправляю..." : "Відправити повідомлення"}
          </button>
        </div>
      )}

      {statusMessage && (
        <p className="mt-3 text-sm text-slate-400">{statusMessage}</p>
      )}
    </div>
  );
}