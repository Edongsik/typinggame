import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
const rawBase = process.env.VITE_REPO_BASE?.trim() ?? ""
const repoBase = rawBase && rawBase !== "/" ? rawBase.replace(/\/+$/, "") : ""

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : repoBase ? `${repoBase}/` : "/",
  plugins: [react()],
}))
