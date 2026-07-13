import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/codes`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/stores`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/add`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/request-store`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/rules`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}