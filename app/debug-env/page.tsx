"use client";

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const keyPreview = supabaseKey
    ? `${supabaseKey.slice(0, 18)}...${supabaseKey.slice(-8)}`
    : "EMPTY";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-black">Debug ENV</h1>

        <div className="mt-6 space-y-4 text-sm">
          <div className="rounded-2xl bg-slate-950 p-4">
            <p className="font-bold text-slate-400">NEXT_PUBLIC_SUPABASE_URL</p>
            <p className="mt-2 break-all text-emerald-300">
              {supabaseUrl || "EMPTY"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <p className="font-bold text-slate-400">
              NEXT_PUBLIC_SUPABASE_ANON_KEY preview
            </p>
            <p className="mt-2 break-all text-emerald-300">{keyPreview}</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <p className="font-bold text-slate-400">Key length</p>
            <p className="mt-2 text-emerald-300">{supabaseKey.length}</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <p className="font-bold text-slate-400">Key type check</p>
            <ul className="mt-2 space-y-1 text-slate-300">
              <li>starts with sb_publishable_: {String(supabaseKey.startsWith("sb_publishable_"))}</li>
              <li>starts with sb_secret_: {String(supabaseKey.startsWith("sb_secret_"))}</li>
              <li>starts with eyJ: {String(supabaseKey.startsWith("eyJ"))}</li>
              <li>contains spaces: {String(/\s/.test(supabaseKey))}</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <p className="font-bold text-slate-400">NEXT_PUBLIC_SITE_URL</p>
            <p className="mt-2 break-all text-emerald-300">
              {siteUrl || "EMPTY"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}