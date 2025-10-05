export type Word = {
  word: string
  meaning: string
  pronunciation: string
  syllables: string
  partOfSpeech: string
  example: string
}

export type Difficulty = 'easy' | 'normal' | 'hard'

export type GameSummary = {
  score: number
  accuracy: number
  maxStreak: number
}

export type PracticeMode = 'sequence' | 'random'

export type DayMeta = {
  id: string
  label: string
  csv: string
  total: number
  description?: string
}

export type DayStat = {
  correct: number
  wrong: number
  lastIndex: number
  completedDates: string[]
  wrongSet: string[]
}
