// Builds a single self-contained HTML file in demo mode (no PWA, no Supabase) for sharing a preview link.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: { "import.meta.env.VITE_SUPABASE_URL": "undefined", "import.meta.env.VITE_SUPABASE_ANON_KEY": "undefined" },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: "dist-preview", assetsInlineLimit: 100_000_000 },
});
