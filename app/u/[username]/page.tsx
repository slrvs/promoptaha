import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import StoreLogo from "@/components/StoreLogo";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

type UserProfile = {
  id: string;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PublicPromo = {
  id: string;
  slug?: string | null;
  code: string;
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  store_website_url?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  discount_value?: string | null;
  expires_at?: string | null;
  status?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  works_count?: number | null;
  not_works_count?: number | null;
  submitted_by?: string | null;
};

type StoreWebsite = {
  id: string;
  website_url?: string | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .toLowerCase()
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яіїєґ_-]/gi, "")
    .slice(0, 32);
}

function getProfileName(profile: UserProfile) {
  return profile.display_name || profile.username || "Користувач";
}

function getAvatarFallback(profile: UserProfile) {
  const name = getProfileName(profile).trim();

  if (!name) return "🐦";

  return name.slice(0, 1).toUpperCase();
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Не вказано";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Невідомо";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getPromoLink(promo: PublicPromo) {
  return `/codes/${promo.slug || promo.id}`;
}

function getSocialLinks(profile: UserProfile) {
  return [
    {
      label: "Сайт",
      href: profile.website_url,
    },
    {
      label: "Instagram",
      href: profile.instagram_url,
    },
    {
      label: "Telegram",
      href: profile.telegram_url,
    },
    {
      label: "TikTok",
      href: profile.tiktok_url,
    },
    {
      label: "YouTube",
      href: profile.youtube_url,
    },
  ].filter((link) => Boolean(link.href));
}

function isPromoActual(promo: PublicPromo) {
  if (!promo.expires_at) return true;

  return new Date(promo.expires_at) >= new Date();
}

async function getProfile(username: string) {
  const supabase = getSupabaseClient();

  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, username, display_name, avatar_url, bio, website_url, instagram_url, telegram_url, tiktok_url, youtube_url, created_at, updated_at"
    )
    .eq("username", username)
    .maybeSingle();

  if (error || !data) return null;

  return data as UserProfile;
}

async function getStoreWebsiteMap(storeIds: string[]) {
  const supabase = getSupabaseClient();

  if (!supabase || storeIds.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await supabase
    .from("store_category_stats")
    .select("id, website_url")
    .in("id", storeIds);

  if (error) {
    return new Map<string, string | null>();
  }

  return new Map(
    ((data || []) as StoreWebsite[]).map((store) => [
      store.id,
      store.website_url || null,
    ])
  );
}

async function getUserPromos(userId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promo_code_category_stats")
    .select(
      "id, slug, code, store_id, store_name, store_slug, category_name, category_slug, discount_value, expires_at, status, source_type, source_url, description, created_at, works_count, not_works_count, submitted_by"
    )
    .eq("submitted_by", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  const promos = (data || []) as unknown as PublicPromo[];
  const storeIds = Array.from(
    new Set(
      promos
        .map((promo) => promo.store_id)
        .filter((storeId): storeId is string => Boolean(storeId))
    )
  );

  const storeWebsiteMap = await getStoreWebsiteMap(storeIds);

  return promos.map((promo) => ({
    ...promo,
    store_website_url: promo.store_id
      ? storeWebsiteMap.get(promo.store_id) || null
      : null,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: "Користувача не знайдено",
      description: "Публічний профіль користувача на ПромоПтасі.",
    };
  }

  const name = getProfileName(profile);
  const description =
    profile.bio ||
    `Публічний профіль ${name} на ПромоПтасі: промокоди, внесок у спільноту та корисні знижки.`;

  return {
    title: `${name} — профіль`,
    description,
    alternates: {
      canonical: `${siteUrl}/u/${profile.username}`,
    },
    openGraph: {
      title: `${name} — ПромоПтаха`,
      description,
      type: "profile",
      url: `${siteUrl}/u/${profile.username}`,
      images: profile.avatar_url
        ? [
            {
              url: profile.avatar_url,
              alt: name,
            },
          ]
        : [
            {
              url: "/icons/promoptaha-bird.png",
              width: 512,
              height: 512,
              alt: "ПромоПтаха",
            },
          ],
    },
    twitter: {
      card: "summary",
      title: `${name} — ПромоПтаха`,
      description,
      images: profile.avatar_url
        ? [profile.avatar_url]
        : ["/icons/promoptaha-bird.png"],
    },
  };
}

export default async function PublicUserPage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const profile = await getProfile(username);

  if (!profile || !profile.username) {
    notFound();
  }

  const promos = await getUserPromos(profile.id);
  const socialLinks = getSocialLinks(profile);

  const actualPromosCount = promos.filter(isPromoActual).length;
  const storesCount = new Set(promos.map((promo) => promo.store_id)).size;
  const worksVotesCount = promos.reduce(
    (sum, promo) => sum + Number(promo.works_count || 0),
    0
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: getProfileName(profile),
    url: `${siteUrl}/u/${profile.username}`,
    description: profile.bio || "Публічний профіль користувача ПромоПтахи.",
    image: profile.avatar_url || `${siteUrl}/icons/promoptaha-bird.png`,
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-300">
            Головна
          </Link>
          <span>/</span>
          <span className="text-slate-300">@{profile.username}</span>
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-emerald-950/20">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                Публічний профіль
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-950 text-5xl font-black text-emerald-300">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={getProfileName(profile)}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getAvatarFallback(profile)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="break-words text-5xl font-black tracking-tight md:text-7xl">
                    {getProfileName(profile)}
                  </h1>

                  <p className="mt-3 text-lg font-black text-emerald-300">
                    @{profile.username}
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    На ПромоПтасі з {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>

              {profile.bio ? (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-500">
                  Користувач ще не додав опис профілю.
                </p>
              )}

              {socialLinks.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="font-black text-slate-300">
                    Соцмережі ще не додані
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Коли користувач додасть посилання у своєму профілі, вони
                    зʼявляться тут.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">
                  {promos.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  схвалених промокодів
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-emerald-300">
                  {worksVotesCount}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  голосів “працює”
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-yellow-300">
                  {actualPromosCount}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  ще актуальні
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
                <p className="text-4xl font-black text-white">{storesCount}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  магазинів
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Промокоди користувача</h2>

              <p className="mt-2 leading-7 text-slate-400">
                Тут показані тільки схвалені промокоди, які вже доступні на
                сайті.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Додати промокод
            </Link>
          </div>

          {promos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
              <div className="text-5xl">🎟️</div>

              <h3 className="mt-4 text-2xl font-black">
                Схвалених промокодів поки немає
              </h3>

              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
                Сторінка профілю вже працює. Коли користувач додасть промокоди,
                які пройдуть модерацію, вони зʼявляться тут.
              </p>

              <Link
                href="/codes"
                className="mt-6 inline-flex rounded-full border border-slate-700 px-5 py-3 font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Переглянути всі промокоди
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {promos.map((promo) => (
                <article
                  key={promo.id}
                  className="flex flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap gap-2">
                    {promo.category_name && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                        {promo.category_name}
                      </span>
                    )}

                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
                      Схвалено
                    </span>
                  </div>

                  <div className="mt-5 flex items-start gap-4">
                    <StoreLogo
                      name={promo.store_name || "Магазин"}
                      websiteUrl={promo.store_website_url}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <h3 className="break-all text-3xl font-black text-white">
                        {promo.code}
                      </h3>

                      <p className="mt-2 truncate text-sm font-bold text-slate-500">
                        {promo.store_name || "Магазин"}
                      </p>
                    </div>
                  </div>

                  {promo.description && (
                    <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                      {promo.description}
                    </p>
                  )}

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        Знижка
                      </p>
                      <p className="mt-1 font-black text-slate-200">
                        {promo.discount_value || "Не вказано"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        Діє до
                      </p>
                      <p className="mt-1 font-black text-slate-200">
                        {formatDate(promo.expires_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        Додано
                      </p>
                      <p className="mt-1 font-black text-slate-200">
                        {formatDateTime(promo.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-5">
                    <Link
                      href={getPromoLink(promo)}
                      className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                    >
                      Відкрити
                    </Link>

                    {promo.store_slug && (
                      <Link
                        href={`/stores/${promo.store_slug}`}
                        className="rounded-full border border-slate-700 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Магазин
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}