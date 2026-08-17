import tailwindcss from "@tailwindcss/vite";
import { release } from "node:os";

const windowsBuild = Number(release().split(".")[2] || 0);
const supportsWorkerd = process.platform !== "win32" || windowsBuild >= 22000;
const cloudflareDevEnabled = process.env.NUXT_CLOUDFLARE_DEV === "true"
  || (process.env.NUXT_CLOUDFLARE_DEV !== "false" && supportsWorkerd);
const localCloudflareFallback = process.env.JWLAB_LOCAL_FALLBACK === "1"
  || (!cloudflareDevEnabled && process.argv.includes("dev"));

export default defineNuxtConfig({
  compatibilityDate: "2026-08-12",
  devtools: { enabled: false },
  modules: ["@nuxt/eslint"],
  nitro: {
    preset: localCloudflareFallback ? "node-server" : "cloudflare-module",
    cloudflare: {
      nodeCompat: true,
      dev: cloudflareDevEnabled ? { configPath: "./wrangler.web.jsonc" } : undefined,
    },
    errorHandler: "./server/error-handler.ts",
    plugins: localCloudflareFallback ? ["./dev/local-cloudflare.ts"] : [],
    prerender: { autoSubfolderIndex: false },
  },
  css: ["~/globals.css", "leaflet/dist/leaflet.css"],
  vite: {
    plugins: [tailwindcss()],
    build: { rolldownOptions: { checks: { pluginTimings: false } } },
  },
  hooks: localCloudflareFallback ? {
    "vite:extendConfig": (config) => {
      if (config.server?.watch) {
        // Nuxt's ignore matcher can receive a drive-letter path while its root
        // uses a file-URL path on Windows. Keep the fallback watcher bounded
        // without passing that mismatched absolute path to the matcher.
        config.server.watch.ignored = [/[\\/]node_modules[\\/]/, /[\\/]\.nuxt[\\/]/, /[\\/]\.output[\\/]/, /[\\/]\.git[\\/]/];
      }
    },
  } : {},
  runtimeConfig: {
    betterAuthSecret: "",
    googleClientId: "",
    googleClientSecret: "",
    sumopodApiUrl: "https://api-pay-sandbox.sumopod.com",
    sumopodApiKey: "",
    sumopodWebhookSecret: "",
    sumopodWebhookToken: "",
    bceApiUrl: "",
    bcePartnerKey: "",
    bceWebhookSecret: "",
    rajaOngkirApiUrl: "https://rajaongkir.komerce.id/api/v1",
    rajaOngkirApiKey: "",
    rajaOngkirOriginId: "",
    geocoderApiUrl: "https://nominatim.openstreetmap.org",
    r2PublicBaseUrl: "",
    public: {
      siteUrl: "http://localhost:3000",
      bceTrackingUrl: "https://bcexp.id/track",
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "id" },
      titleTemplate: "%s | JWLAB STUDIO",
      meta: [
        { name: "description", content: "Original characters and collectible figures by JWLAB STUDIO." },
        { name: "theme-color", content: "#071a3d" },
        { property: "og:image", content: "/logo-jwlab-studio.webp" },
      ],
    },
  },
  routeRules: {
    "/admin/awbprint": { ssr: false },
    "/admin/**": { ssr: true },
    "/account/**": { ssr: true },
    "/api/**": { cors: false },
  },
});
