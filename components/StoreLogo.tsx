"use client";

import { useMemo, useState } from "react";

type StoreLogoProps = {
  name: string;
  websiteUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const fallbackLogo = "/icons/promoptaha-bird.png";

const sizeClasses = {
  sm: "h-12 w-12 rounded-2xl",
  md: "h-16 w-16 rounded-2xl",
  lg: "h-24 w-24 rounded-[2rem]",
  xl: "h-48 w-48 rounded-[3rem] md:h-64 md:w-64",
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

function getStoreLogoUrl(url: string | null | undefined) {
  const domain = getDomain(url);

  if (!domain) return null;

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain
  )}&sz=128`;
}

export default function StoreLogo({
  name,
  websiteUrl,
  size = "md",
}: StoreLogoProps) {
  const [hasError, setHasError] = useState(false);

  const logoUrl = useMemo(() => getStoreLogoUrl(websiteUrl), [websiteUrl]);

  const imageSrc = !logoUrl || hasError ? fallbackLogo : logoUrl;

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-emerald-400/30 bg-slate-900 shadow-lg shadow-emerald-950/30 ${sizeClasses[size]}`}
    >
      <img
        src={imageSrc}
        alt={`Лого ${name}`}
        onError={() => setHasError(true)}
        className="h-full w-full object-contain p-2"
      />
    </div>
  );
}