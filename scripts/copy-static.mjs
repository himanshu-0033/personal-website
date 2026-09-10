// Vite only builds hero.html. Vercel serves dist/, so without this the seven
// plain HTML pages never reach the deploy and / returns 404. Copy them in
// verbatim -- no bundler touches them, which is the point.
import { cpSync, existsSync } from "node:fs"

const STATIC = [
  "index.html",
  "about.html",
  "contact.html",
  "education.html",
  "experience.html",
  "projects.html",
  "skills.html",
  "css",
  "js",
  "assets",
]

for (const item of STATIC) {
  if (!existsSync(item)) throw new Error(`copy-static: ${item} is missing`)
  cpSync(item, `dist/${item}`, { recursive: true })
}

console.log(`copy-static: ${STATIC.length} items -> dist/`)
