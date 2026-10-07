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
        src: "/logo/ball-knowledge-logo-64x64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/logo/ball-knowledge-logo-129x129.png",
        sizes: "129x129",
        type: "image/png",
      },
      {
        src: "/logo/ball-knowledge-logo-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/logo/ball-knowledge-logo-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
