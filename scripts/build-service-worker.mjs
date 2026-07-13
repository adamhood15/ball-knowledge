// Builds public/sw.js from public/sw-src.js by injecting the precache manifest.
// Runs as a plain postbuild step (see package.json) — deliberately never touches
// next.config, so it can't collide with Next's bundler (see AGENTS.md section 1
// on resolving build/config incompatibilities rather than working around them:
// this whole script exists because tools that hook next.config's webpack()
// function break under Next.js 16's Turbopack default).
import { injectManifest } from "workbox-build";

const { count, size, warnings } = await injectManifest({
  globDirectory: "public",
  // Only the small set of static PWA assets. Page/API caching strategies
  // (network-first for live data, stale-while-revalidate for daily-refresh
  // player metadata) are scoped to Phase 9, not here.
  globPatterns: ["icons/*.png"],
  swSrc: "public/sw-src.js",
  swDest: "public/sw.js",
});

for (const warning of warnings) {
  console.warn(warning);
}

console.log(`Generated public/sw.js — precached ${count} files, ${size} bytes.`);
