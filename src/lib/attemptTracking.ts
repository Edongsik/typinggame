// lib/attemptTracking.ts

const STORAGE_KEY = 'tg:attempts'

export type AttemptRecord = {
  word: string
  dayId: string
  attempts: number
  score: number
  timestamp: string
}

export type DayAttemptStats = {
  dayId: string
  totalWords: number
  averageScore: number
  averageAttempts: number
  perfectCount: number  // 첫 시도 정답
  goodCount: number     // 두 번째 시도 정답
  poorCount: number     // 세 번째 이상
  records: AttemptRecord[]
}

type AttemptStorage = {
  [dayId: string]: AttemptRecord[]
}

// 점수 계산 함수
export function calculateScore(attempts: number): number {
  if (attempts === 1) return 100
  if (attempts === 2) return 50
  return 0
}

// 등급 계산 함수
export function getGrade(score: number): string {
  if (score === 100) return 'Perfect'
  if (score === 50) return 'Good'
  return 'Try Again'
}

// Storage 읽기
function readAttemptStorage(): AttemptStorage {
  if (typeof window === 'undefined') return {}
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AttemptStorage
  } catch (error) {
    console.warn('시도 기록 읽기 실패:', error)
    return {}
  }
}

// Storage 쓰기
function writeAttemptStorage(storage: AttemptStorage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
}

// 시도 기록 추가
export function recordAttempt(
  dayId: string,
  word: string,
  attempts: number
): AttemptRecord {
  const storage = readAttemptStorage()
  
  if (!storage[dayId]) {
    storage[dayId] = []
  }
  
  const score = calculateScore(attempts)
  const record: AttemptRecord = {
    word,
    dayId,
    attempts,
    score,
    timestamp: new Date().toISOString(),
  }
  
  // 같은 단어의 이전 기록 제거 (최신 기록만 유지)
  storage[dayId] = storage[dayId].filter(r => r.word !== word)
  
  // 새 기록 추가
  storage[dayId].push(record)
  
  writeAttemptStorage(storage)
  return record
}

// 특정 Day의 모든 시도 기록 가져오기
export function getAttemptRecords(dayId: string): AttemptRecord[] {
  const storage = readAttemptStorage()
  return storage[dayId] || []
}

// 특정 Day의 통계 계산
export function getDayAttemptStats(dayId: string): DayAttemptStats {
  const records = getAttemptRecords(dayId)
  
  if (records.length === 0) {
    return {
      dayId,
      totalWords: 0,
      averageScore: 0,
      averageAttempts: 0,
      perfectCount: 0,
      goodCount: 0,
      poorCount: 0,
      records: [],
    }
  }
  
  const totalScore = records.reduce((sum, r) => sum + r.score, 0)
  const totalAttempts = records.reduce((sum, r) => sum + r.attempts, 0)
  
  return {
    dayId,
    totalWords: records.length,
    averageScore: Math.round(totalScore / records.length),
    averageAttempts: Number((totalAttempts / records.length).toFixed(1)),
    perfectCount: records.filter(r => r.score === 100).length,
    goodCount: records.filter(r => r.score === 50).length,
    poorCount: records.filter(r => r.score === 0).length,
    records: [...records].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  }
}

// 전체 통계 계산
export function getOverallAttemptStats(): {
  totalWords: number
  averageScore: number
  averageAttempts: number
  perfectCount: number
  goodCount: number
  poorCount: number
  byDay: Record<string, DayAttemptStats>
} {
  const storage = readAttemptStorage()
  const allRecords: AttemptRecord[] = []
  const byDay: Record<string, DayAttemptStats> = {}
  
  Object.keys(storage).forEach(dayId => {
    allRecords.push(...storage[dayId])
    byDay[dayId] = getDayAttemptStats(dayId)
  })
  
  if (allRecords.length === 0) {
    return {
      totalWords: 0,
      averageScore: 0,
      averageAttempts: 0,
      perfectCount: 0,
      goodCount: 0,
      poorCount: 0,
      byDay: {},
    }
  }
  
  const totalScore = allRecords.reduce((sum, r) => sum + r.score, 0)
  const totalAttempts = allRecords.reduce((sum, r) => sum + r.attempts, 0)
  
  return {
    totalWords: allRecords.length,
    averageScore: Math.round(totalScore / allRecords.length),
    averageAttempts: Number((totalAttempts / allRecords.length).toFixed(1)),
    perfectCount: allRecords.filter(r => r.score === 100).length,
    goodCount: allRecords.filter(r => r.score === 50).length,
    poorCount: allRecords.filter(r => r.score === 0).length,
    byDay,
  }
}

// 특정 단어의 최근 시도 기록 가져오기
export function getWordAttempt(dayId: string, word: string): AttemptRecord | null {
  const records = getAttemptRecords(dayId)
  return records.find(r => r.word === word) || null
}

// Day의 시도 기록 초기화
export function clearDayAttempts(dayId: string) {
  const storage = readAttemptStorage()
  delete storage[dayId]
  writeAttemptStorage(storage)
}

// 모든 시도 기록 초기화
export function clearAllAttempts() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// 오늘의 시도 기록 가져오기
export function getTodayAttempts(): AttemptRecord[] {
  const storage = readAttemptStorage()
  const today = new Date().toISOString().slice(0, 10)
  const allRecords: AttemptRecord[] = []
  
  Object.values(storage).forEach(records => {
    allRecords.push(...records.filter(r => 
      r.timestamp.slice(0, 10) === today
    ))
  })
  
  return allRecords.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// 오늘의 통계
export function getTodayStats(): {
  totalWords: number
  averageScore: number
  perfectCount: number
  goodCount: number
  poorCount: number
} {
  const todayRecords = getTodayAttempts()
  
  if (todayRecords.length === 0) {
    return {
      totalWords: 0,
      averageScore: 0,
      perfectCount: 0,
      goodCount: 0,
      poorCount: 0,
    }
  }
  
  const totalScore = todayRecords.reduce((sum, r) => sum + r.score, 0)
  
  return {
    totalWords: todayRecords.length,
    averageScore: Math.round(totalScore / todayRecords.length),
    perfectCount: todayRecords.filter(r => r.score === 100).length,
    goodCount: todayRecords.filter(r => r.score === 50).length,
    poorCount: todayRecords.filter(r => r.score === 0).length,
  }
}