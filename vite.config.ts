import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const root = path.dirname(fileURLToPath(import.meta.url))

// The seven static HTML pages still open straight off disk with no build
// step. This config only ever builds hero.html, so `vite build` cannot
// touch or rewrite index.html and the rest of the plain site.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": root },
  },
  build: {
    outDir: "dist",
    // Vite's own output goes in _hero/, not assets/, so that copy-static.mjs
    // can drop the site's real assets/ folder into dist/ without the two
    // merging into one directory.
    assetsDir: "_hero",
    rollupOptions: {
      input: path.resolve(root, "hero.html"),
    },
  },
})
