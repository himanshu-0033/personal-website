import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import MusicHero from "@/components/ui/scroll-locked-video-hero"
import "./index.css"

const el = document.getElementById("root")
if (!el) throw new Error("#root is missing from hero.html")

createRoot(el).render(
  <StrictMode>
    <MusicHero />
  </StrictMode>,
)
