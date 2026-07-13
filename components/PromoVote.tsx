"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, User } from "@supabase/supabase-js";

type PromoVoteProps = {
  promoId: string;
  initialWorksCount?: number | null;
  initialNotWorksCount?: number | null;
};

type VoteValue = "works" | "not_works";

type ExistingVote = {
  id: string;
  vote_type: VoteValue;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export default function PromoVote({
  promoId,
  initialWorksCount = 0,
  initialNotWorksCount = 0,
}: PromoVoteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [voteId, setVoteId] = useState("");
  const [myVote, setMyVote] = useState<VoteValue | null>(null);
  const [worksCount, setWorksCount] = useState(initialWorksCount || 0);
  const [notWorksCount, setNotWorksCount] = useState(initialNotWorksCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUserAndVote() {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setVoteId("");
      setMyVote(null);
      return;
    }

    const { data, error } = await supabase
      .from("promo_votes")
      .select("id, vote_type")
      .eq("promo_code_id", promoId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      setVoteId("");
      setMyVote(null);
      return;
    }

    const existingVote = data as ExistingVote | null;

    if (
      existingVote &&
      (existingVote.vote_type === "works" ||
        existingVote.vote_type === "not_works")
    ) {
      setVoteId(existingVote.id);
      setMyVote(existingVote.vote_type);
    } else {
      setVoteId("");
      setMyVote(null);
    }
  }

  useEffect(() => {
    loadUserAndVote();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUserAndVote();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [promoId]);

  async function vote(value: VoteValue) {
    setMessage("");

    if (!user) {
      setMessage("Щоб голосувати, потрібно увійти.");
      return;
    }

    if (myVote === value) {
      setMessage("Ти вже так проголосував.");
      return;
    }

    setIsLoading(true);

    const previousVote = myVote;

    let errorMessage = "";

    if (voteId) {
      const { error } = await supabase
        .from("promo_votes")
        .update({
          vote_type: value,
        })
        .eq("id", voteId);

      if (error) {
        errorMessage = error.message;
      }
    } else {
      const { data, error } = await supabase
        .from("promo_votes")
        .insert({
          promo_code_id: promoId,
          user_id: user.id,
          vote_type: value,
        })
        .select("id")
        .single();

      if (error) {
        errorMessage = error.message;
      } else if (data?.id) {
        setVoteId(data.id);
      }
    }

    setIsLoading(false);

    if (errorMessage) {
      setMessage(`Помилка голосування: ${errorMessage}`);
      return;
    }

    if (previousVote === "works") {
      setWorksCount((count) => Math.max(0, count - 1));
    }

    if (previousVote === "not_works") {
      setNotWorksCount((count) => Math.max(0, count - 1));
    }

    if (value === "works") {
      setWorksCount((count) => count + 1);
    }

    if (value === "not_works") {
      setNotWorksCount((count) => count + 1);
    }

    setMyVote(value);

    setMessage(
      value === "works"
        ? "Дякуємо за підтвердження 🐦"
        : "Дякуємо, позначили як проблемний"
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => vote("works")}
          disabled={isLoading}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition disabled:opacity-60 ${
            myVote === "works"
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400 hover:text-slate-950"
          }`}
        >
          👍 Працює ({worksCount})
        </button>

        <button
          onClick={() => vote("not_works")}
          disabled={isLoading}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition disabled:opacity-60 ${
            myVote === "not_works"
              ? "border-red-400 bg-red-400 text-slate-950"
              : "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400 hover:text-slate-950"
          }`}
        >
          👎 Не працює ({notWorksCount})
        </button>
      </div>

      {!user && (
        <p className="mt-2 text-xs text-slate-500">
          Для голосування треба{" "}
          <Link href="/login" className="font-bold text-emerald-300">
            увійти
          </Link>
          .
        </p>
      )}

      {message && <p className="mt-2 text-xs text-slate-400">{message}</p>}
    </div>
  );
}