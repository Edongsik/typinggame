import Papa from 'papaparse'
import type { DayMeta, PracticeMode, Word } from '../types'
import { getAllCustomWords } from './customWords'

// ??BASE_URL??직접 지??(Vite??public ?더?기??로 ??
const BASE_PUBLIC_PATH = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '') || '/'
const resolvePublicPath = (relative: string): string => {
  const normalizedRelative = relative.startsWith('/') ? relative.slice(1) : relative
  if (BASE_PUBLIC_PATH === '/' || BASE_PUBLIC_PATH === './') {
    return `/${normalizedRelative}`
  }
  return `${BASE_PUBLIC_PATH}/${normalizedRelative}`
}

const DEFAULT_CSV_URL = resolvePublicPath('words.csv')
const MANIFEST_URL = resolvePublicPath('words/manifest.json')

let manifestCache: DayMeta[] | null = null
const dayWordCache = new Map<string, Word[]>()

function normalizeWords(rows: Word[]): Word[] {
  return rows
    .filter((entry): entry is Word => Boolean(entry.word))
    .map((entry) => ({
      ...entry,
      word: entry.word.trim(),
      meaning: entry.meaning?.trim() ?? '',
      pronunciation: entry.pronunciation?.trim() ?? '',
      syllables: entry.syllables?.trim() ?? '',
      partOfSpeech: entry.partOfSpeech?.trim() ?? '',
      example: entry.example?.trim() ?? '',
    }))
    .filter((entry) => entry.word.length > 0)
}

async function parseCsv(url: string): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Word>(url, {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        if (result.errors.length > 0) {
          const [{ message }] = result.errors
          reject(new Error(`CSV parse error: ${message}`))
          return
        }
        const words = normalizeWords(result.data as Word[])
        if (words.length === 0) {
          reject(new Error('CSV contained no usable rows.'))
          return
        }
        resolve(words)
      },
      error: (error) => {
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    })
  })
}

export async function loadWords(): Promise<Word[]> {
  return parseCsv(DEFAULT_CSV_URL)
}

export async function loadManifest(): Promise<DayMeta[]> {
  if (manifestCache) return manifestCache

  const response = await fetch(MANIFEST_URL)
  if (!response.ok) throw new Error(`Failed to load manifest: ${response.statusText}`)

  const payload = (await response.json()) as { days?: DayMeta[] }
  const days = Array.isArray(payload?.days) ? payload.days : []
  manifestCache = days.map((day) => ({
    id: day.id,
    label: day.label ?? day.id,
    csv: day.csv,
    total: day.total ?? 0,
    description: day.description,
  }))
  return manifestCache
}

async function loadWordsForDay(dayId: string, csvFile: string): Promise<Word[]> {
  if (dayWordCache.has(dayId)) return dayWordCache.get(dayId)!

  const url = resolvePublicPath(`words/${csvFile}`)
  const words = await parseCsv(url)
  dayWordCache.set(dayId, words)
  return words
}

export type PracticeWord = Word & { dayId: string; orderIndex: number }

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function loadDays(
  dayIds: string[],
  mode: PracticeMode = 'sequence'
): Promise<PracticeWord[]> {
  const manifest = await loadManifest()
  const tasks = dayIds.map(async (dayId) => {
    const dayMeta = manifest.find((d) => d.id === dayId)
    if (!dayMeta) throw new Error(`Unknown day id: ${dayId}`)

    // 기본 CSV에서 단어 로드
    const words = await loadWordsForDay(dayMeta.id, dayMeta.csv)
    
    // 커스텀 단어 추가
    const customWords = getAllCustomWords(dayId)
    const allWords = [...words, ...customWords]
    
    return allWords.map<PracticeWord>((word, index) => ({
      ...word,
      dayId: dayMeta.id,
      orderIndex: index,
    }))
  })

  const results = await Promise.all(tasks)
  const merged = results.flat()
  return mode === 'random' ? shuffle(merged) : merged
}

export async function getDayMeta(dayId: string): Promise<DayMeta | null> {
  const manifest = await loadManifest()
  return manifest.find((d) => d.id === dayId) ?? null
}

export function invalidateDayCache(dayId?: string) {
  if (dayId) dayWordCache.delete(dayId)
  else dayWordCache.clear()
}

export function invalidateManifestCache() {
  manifestCache = null
}
