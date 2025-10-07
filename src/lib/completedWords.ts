// lib/completedWords.ts

const STORAGE_KEY = 'tg:completed-words'

type CompletedWordsStorage = {
  [dayId: string]: string[]
}

function readCompletedWords(): CompletedWordsStorage {
  if (typeof window === 'undefined') return {}
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CompletedWordsStorage
  } catch (error) {
    console.warn('완료 단어 읽기 실패:', error)
    return {}
  }
}

function writeCompletedWords(storage: CompletedWordsStorage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
}

export function isWordCompleted(dayId: string, word: string): boolean {
  const storage = readCompletedWords()
  return storage[dayId]?.includes(word) ?? false
}

export function toggleWordCompleted(dayId: string, word: string): boolean {
  const storage = readCompletedWords()
  
  if (!storage[dayId]) {
    storage[dayId] = []
  }
  
  const index = storage[dayId].indexOf(word)
  
  if (index >= 0) {
    storage[dayId].splice(index, 1)
    writeCompletedWords(storage)
    return false
  } else {
    storage[dayId].push(word)
    writeCompletedWords(storage)
    return true
  }
}

export function getCompletedWords(dayId: string): string[] {
  const storage = readCompletedWords()
  return storage[dayId] || []
}

export function clearCompletedWords(dayId: string) {
  const storage = readCompletedWords()
  delete storage[dayId]
  writeCompletedWords(storage)
}

export function markWordsAsCompleted(dayId: string, words: string[]) {
  const storage = readCompletedWords()
  
  if (!storage[dayId]) {
    storage[dayId] = []
  }
  
  words.forEach(word => {
    if (!storage[dayId].includes(word)) {
      storage[dayId].push(word)
    }
  })
  
  writeCompletedWords(storage)
}

export function getCompletedWordsCount(dayId: string): number {
  const storage = readCompletedWords()
  return storage[dayId]?.length ?? 0
}