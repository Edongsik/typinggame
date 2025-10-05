import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")

const directories = ["data", "scripts", "public"]
await Promise.all(
  directories.map((dir) => mkdir(path.join(ROOT, dir), { recursive: true }))
)

const seedPath = path.join(ROOT, "data", "seed.txt")
let seedContent = ""
try {
  seedContent = await readFile(seedPath, "utf-8")
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown error while reading seed file"
  console.error(`Failed to read ${path.relative(ROOT, seedPath)}: ${message}`)
  process.exit(1)
}

const words = Array.from(
  new Set(
    seedContent
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  )
)

if (words.length === 0) {
  console.error("No words found in data/seed.txt. Ensure the file contains one word per line.")
  process.exit(1)
}

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/"
const SLEEP_BETWEEN_REQUESTS_MS = 200

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function syllabify(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!cleaned) {
    return ""
  }
  const vowels = new Set(["a", "e", "i", "o", "u", "y"])
  const segments = []
  let start = 0
  for (let index = 1; index < cleaned.length; index += 1) {
    const previous = cleaned[index - 1]
    const current = cleaned[index]
    if (vowels.has(current) && !vowels.has(previous)) {
      segments.push(word.slice(start, index))
      start = index
    }
  }
  segments.push(word.slice(start))
  const filtered = segments.filter(Boolean)
  if (filtered.length <= 1) {
    return word
  }
  return filtered.join("-")
}

async function fetchWordDetails(word) {
  const endpoint = `${API_BASE}${encodeURIComponent(word)}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const payload = await response.json()
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Unexpected response structure")
  }

  const entry = payload[0]
  const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : []
  const meanings = Array.isArray(entry.meanings) ? entry.meanings : []

  const pronunciation =
    phonetics.find(
      (item) =>
        item && typeof item.text === "string" && item.text.trim().length > 0
    )?.text ?? (typeof entry.phonetic === "string" ? entry.phonetic : "")

  let partOfSpeech = ""
  let meaning = ""
  let example = ""

  for (const meaningEntry of meanings) {
    if (!meaningEntry || typeof meaningEntry !== "object") {
      continue
    }
    if (!partOfSpeech && typeof meaningEntry.partOfSpeech === "string") {
      partOfSpeech = meaningEntry.partOfSpeech
    }
    const definitions = Array.isArray(meaningEntry.definitions)
      ? meaningEntry.definitions
      : []
    for (const definition of definitions) {
      if (!definition || typeof definition !== "object") {
        continue
      }
      if (!meaning && typeof definition.definition === "string") {
        meaning = definition.definition
      }
      if (!example && typeof definition.example === "string") {
        example = definition.example
      }
      if (meaning && example) {
        break
      }
    }
    if (meaning && example && partOfSpeech) {
      break
    }
  }

  return {
    word,
    meaning,
    pronunciation,
    syllables: syllabify(word),
    partOfSpeech,
    example,
  }
}

function toCsvField(value) {
  if (value == null) {
    return ""
  }
  const normalized = String(value)
  if (normalized.length === 0) {
    return ""
  }
  const escaped = normalized.replace(/"/g, '""')
  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`
  }
  return escaped
}

function toCsvRow(row) {
  return [
    row.word,
    row.meaning,
    row.pronunciation,
    row.syllables,
    row.partOfSpeech,
    row.example,
  ].map(toCsvField).join(",")
}

const results = []

for (const word of words) {
  try {
    const details = await fetchWordDetails(word)
    results.push(details)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Warning: failed to fetch "${word}": ${message}`)
    results.push({
      word,
      meaning: "",
      pronunciation: "",
      syllables: syllabify(word),
      partOfSpeech: "",
      example: "",
    })
  }
  await delay(SLEEP_BETWEEN_REQUESTS_MS)
}

const header = "word,meaning,pronunciation,syllables,partOfSpeech,example"
const csvPath = path.join(ROOT, "public", "words.csv")
const csvContent = [header, ...results.map(toCsvRow)].join("\n")

await writeFile(csvPath, `${csvContent}\n`, "utf-8")
console.log(`Saved ${results.length} entries to ${path.relative(ROOT, csvPath)}.`)

