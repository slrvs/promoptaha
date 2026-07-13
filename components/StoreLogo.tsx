"use client";

import { useMemo, useState } from "react";

type StoreLogoProps = {
  name: string;
  websiteUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "h-12 w-12 rounded-2xl text-xl",
  md: "h-16 w-16 rounded-2xl text-2xl",
  lg: "h-24 w-24 rounded-[2rem] text-4xl",
  xl: "h-48 w-48 rounded-[3rem] text-7xl md:h-64 md:w-64 md:text-8xl",
};

function getDomain(url: string | null | undefined) {
  if (!url) return null;

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(normalizedUrl).hostname;

    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getLogoSources(domain: string | null) {
  if (!domain) return [];

  const encodedDomain = encodeURIComponent(domain);

  return [
    `https://www.google.com/s2/favicons?domain=${encodedDomain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://logo.clearbit.com/${domain}`,
    `https://${domain}/favicon.ico`,
  ];
}

function getInitial(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) return "🐦";

  return trimmedName.slice(0, 1).toUpperCase();
}

export default function StoreLogo({
  name,
  websiteUrl,
  size = "md",
}: StoreLogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isFallback, setIsFallback] = useState(false);

  const domain = useMemo(() => getDomain(websiteUrl), [websiteUrl]);
  const logoSources = useMemo(() => getLogoSources(domain), [domain]);

  const currentLogo = logoSources[sourceIndex];

  function handleImageError() {
    const nextIndex = sourceIndex + 1;

    if (nextIndex < logoSources.length) {
      setSourceIndex(nextIndex);
      return;
    }

    setIsFallback(true);
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-emerald-400/30 bg-slate-900 font-black text-emerald-300 shadow-lg shadow-emerald-950/30 ${sizeClasses[size]}`}
      title={domain || name}
    >
      {currentLogo && !isFallback ? (
        <img
          src={currentLogo}
          alt={`Лого ${name}`}
          onError={handleImageError}
          className="h-full w-full object-contain bg-white p-2"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{getInitial(name)}</span>
      )}
    </div>
  );
}