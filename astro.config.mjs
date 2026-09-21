// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Build timestamp captured once per build (this config is evaluated fresh in
// each ephemeral build dir), so EVERY sitemap URL gets the SAME <lastmod>. A
// per-page mtime isn't available in a static build, so build-time is the
// accepted freshness signal — without it @astrojs/sitemap emits no <lastmod>
// at all and Google loses the "recently updated" hint.
const BUILD_LASTMOD = new Date().toISOString();

// Kleap Astro template — SEO/GEO-first, edge-rendered on Cloudflare Workers.
// output:'static' (Astro 5+) = SSG by default; pages opt into Edge SSR with
// `export const prerender = false`. The deployer overwrites `site` with the
// real domain at deploy time (drives canonical + sitemap absolute URLs).
export default defineConfig({
  site: "https://example.kleap.io",
  output: "static",
  // imageService:'compile' = optimize images with sharp at BUILD time (sharp is
  // unsupported in the Workers runtime). Keeps sharp a devDependency only.
  adapter: cloudflare({ imageService: "compile" }),
  integrations: [
    react(),
    // serialize sets <lastmod> on every URL (build-time). @astrojs/sitemap emits
    // none by default → freshness signal lost. Keep item.url/priority/changefreq
    // as the integration computed them; only stamp lastmod.
    sitemap({
      // Keep owner-only scaffold pages (login/signup/dashboard/crm) OUT of the
      // sitemap — they ship noindex, so listing them is a mixed crawl signal.
      filter: (page) => !/^https?:\/\/[^/]+\/(login|signup|dashboard|crm)\/?$/.test(page),
      serialize(item) {
        item.lastmod = BUILD_LASTMOD;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // 🧪 CRITICAL for the ephemeral preview build: each build runs in a temp
      // dir whose node_modules is a SYMLINK to the shared template node_modules.
      // Vite's default preserveSymlinks:false resolves that symlink to its
      // realpath, which splits React into TWO module identities → islands render
      // but setState is a silent no-op (the renderer's React ≠ the event React),
      // with ZERO console errors. preserveSymlinks keeps the symlink path as the
      // identity, and dedupe collapses every react/react-dom import onto one copy
      // so hooks/state work. Without this, NO interactive island hydrates.
      preserveSymlinks: true,
      dedupe: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
      // 🧪 CRITICAL for DEPLOY: the @astrojs/react SSR renderer pulls in
      // react-dom/server. The default resolves to the BROWSER build
      // (react-dom/server.browser), which throws at Cloudflare Worker startup
      // → upload fails with validation error 10021. The EDGE build is built for
      // edge runtimes (Workers/Deno). Alias it so the generated _worker.js
      // passes CF's startup validation. (Static pages don't invoke the worker,
      // but CF still evaluates the script at upload — so it must not throw.)
      alias: {
        "react-dom/server": "react-dom/server.edge",
        // `@/…` → the app's src/. shadcn components.json + AI-written imports use
        // `@/components/ui/button`, `@/lib/utils`. Resolved relative to THIS
        // config file, which is copied into each ephemeral build dir, so it
        // points at that build's own src/ (not the shared template).
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
