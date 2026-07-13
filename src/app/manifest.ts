import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ball Knowledge — Fantasy Trade Analyzer",
    short_name: "Ball Knowledge",
    description: "Scoring-settings-aware fantasy football trade analyzer",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0620",
    theme_color: "#0c0620",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
