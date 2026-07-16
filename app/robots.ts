import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/codes",
          "/stores",
          "/deals",
          "/users",
          "/levels",
          "/guest",
          "/stats",
          "/about",
          "/rules",
          "/privacy",
          "/contact",
          "/request-store",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/profile",
          "/profile/",
          "/login",
          "/login/",
          "/auth",
          "/auth/",
          "/api",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}