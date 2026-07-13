import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ПромоПтаха",
    short_name: "ПромоПтаха",
    description: "На крилах знижок",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#34D399",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}