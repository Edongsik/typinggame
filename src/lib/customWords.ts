import type { Word } from '../types'

const STORAGE_KEY = 'tg:custom-words'

type CustomWordStorage = {
  [dayId: string]: Word[]
}

function readCustomWords(): CustomWordStorage {
  if (typeof window === 'undefined') return {}
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CustomWordStorage
  } catch (error) {
    console.warn('커스텀 단어 읽기 실패:', error)
    return {}
  }
}

function writeCustomWords(storage: CustomWordStorage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
}

export function getCustomWords(dayId: string): Word[] {
  const storage = readCustomWords()
  return storage[dayId] || []
}

export function addCustomWord(dayId: string, word: Word) {
  const storage = readCustomWords()
  if (!storage[dayId]) {
    storage[dayId] = []
  }
  storage[dayId].push(word)
  writeCustomWords(storage)
}

export function removeCustomWord(dayId: string, wordText: string) {
  const storage = readCustomWords()
  if (!storage[dayId]) return
  
  storage[dayId] = storage[dayId].filter(w => w.word !== wordText)
  writeCustomWords(storage)
}

export function updateCustomWord(dayId: string, wordText: string, updates: Partial<Word>): boolean {
  const storage = readCustomWords()
  if (!storage[dayId]) return false
  
  const wordIndex = storage[dayId].findIndex(w => w.word === wordText)
  if (wordIndex === -1) return false
  
  storage[dayId][wordIndex] = {
    ...storage[dayId][wordIndex],
    ...updates
  }
  
  writeCustomWords(storage)
  return true
}

export function getAllCustomWords(dayId: string): Word[] {
  return getCustomWords(dayId)
}

export function clearCustomWords(dayId: string) {
  const storage = readCustomWords()
  delete storage[dayId]
  writeCustomWords(storage)
}

export function exportCustomWordsAsCSV(dayId: string): string {
  const words = getCustomWords(dayId)
  const header = "word,meaning,pronunciation,syllables,partOfSpeech,example"
  
  const rows = words.map(word => {
    const escape = (str: string) => {
      if (!str) return ""
      const escaped = str.replace(/"/g, '""')
      if (/[",\n]/.test(escaped)) return `"${escaped}"`
      return escaped
    }
    
    return [
      escape(word.word),
      escape(word.meaning),
      escape(word.pronunciation),
      escape(word.syllables),
      escape(word.partOfSpeech),
      escape(word.example)
    ].join(",")
  })
  
  return [header, ...rows].join("\n")
}