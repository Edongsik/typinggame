import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")

const PUBLIC_DIR = path.join(ROOT, "public")
const WORDS_DIR = path.join(PUBLIC_DIR, "words")
const MANIFEST_PATH = path.join(WORDS_DIR, "manifest.json")
const OUTPUT_CSV = path.join(PUBLIC_DIR, "words.csv")

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n")
}

async function readJson(file) {
  const raw = await readFile(file, "utf-8")
  // Strip potential UTF-8 BOM
  const cleaned = raw.replace(/^\uFEFF/, "")
  return JSON.parse(cleaned)
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true })

  const manifest = await readJson(MANIFEST_PATH)
  const days = Array.isArray(manifest?.days) ? manifest.days : []
  if (days.length === 0) {
    console.error("No days found in manifest.json")
    process.exit(1)
  }

  const header = "word,meaning,pronunciation,syllables,partOfSpeech,example"
  const rows = []
  let totalFiles = 0
  let totalRows = 0

  for (const day of days) {
    const csvFile = typeof day?.csv === "string" ? day.csv : null
    if (!csvFile) continue

    const filePath = path.join(WORDS_DIR, csvFile)
    const content = normalizeNewlines((await readFile(filePath, "utf-8")).replace(/^\uFEFF/, ""))
    const lines = content.split("\n").filter((l) => l.length > 0)
    if (lines.length === 0) continue

    // Drop header if present
    const [first, ...rest] = lines
    const hasHeader = /^\s*word\s*,\s*meaning\s*,\s*pronunciation\s*,\s*syllables\s*,\s*partofspeech\s*,\s*example\s*$/i.test(
      first
    )
    const dataLines = hasHeader ? rest : lines
    rows.push(...dataLines)
    totalFiles += 1
    totalRows += dataLines.length

    // Optional sanity check against declared total
    if (typeof day.total === "number" && day.total !== dataLines.length) {
      console.warn(
        `Warning: ${csvFile} has ${dataLines.length} rows but manifest total is ${day.total}`
      )
    }
  }

  const output = [header, ...rows].join("\n") + "\n"
  await writeFile(OUTPUT_CSV, output, "utf-8")
  console.log(
    `Merged ${totalFiles} files, ${totalRows} rows -> ${path.relative(
      ROOT,
      OUTPUT_CSV
    )}`
  )
}

main().catch((err) => {
  console.error(err?.stack || String(err))
  process.exit(1)
})
