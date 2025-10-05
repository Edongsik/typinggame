import type { DayStat } from '../types'

const STORAGE_KEY = 'tg:v1:progress'

const defaultStat: DayStat = {
  correct: 0,
  wrong: 0,
  lastIndex: 0,
  completedDates: [],
  wrongSet: [],
}

type ProgressState = Record<string, DayStat>

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

function readState(): ProgressState {
  if (!isBrowser()) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as ProgressState
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.warn('무슨에러이지>Prigress.ts.', error)
    return {}
  }
}

function writeState(state: ProgressState) {
  if (!isBrowser()) {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function normalizeStat(stat?: DayStat): DayStat {
  if (!stat) {
    return { ...defaultStat }
  }
  return {
    correct: stat.correct ?? 0,
    wrong: stat.wrong ?? 0,
    lastIndex: stat.lastIndex ?? 0,
    completedDates: Array.isArray(stat.completedDates) ? [...new Set(stat.completedDates)] : [],
    wrongSet: Array.isArray(stat.wrongSet) ? [...new Set(stat.wrongSet)] : [],
  }
}

export function getStat(dayId: string): DayStat {
  const state = readState()
  return normalizeStat(state[dayId])
}

export function setStat(dayId: string, stat: DayStat) {
  const state = readState()
  state[dayId] = normalizeStat(stat)
  writeState(state)
}

export function markAnswer(dayId: string, word: string, ok: boolean, nextIndex: number) {
  const state = readState()
  const stat = normalizeStat(state[dayId])
  stat.lastIndex = Math.max(0, nextIndex)
  if (ok) {
    stat.correct += 1
    stat.wrongSet = stat.wrongSet.filter((entry) => entry !== word)
  } else {
    stat.wrong += 1
    if (!stat.wrongSet.includes(word)) {
      stat.wrongSet.push(word)
    }
  }
  state[dayId] = stat
  writeState(state)
}

export function markDayCompleted(dayId: string) {
  const state = readState()
  const stat = normalizeStat(state[dayId])
  const today = new Date().toISOString().slice(0, 10)
  if (!stat.completedDates.includes(today)) {
    stat.completedDates.push(today)
  }
  state[dayId] = stat
  writeState(state)
}

export function resetDay(dayId: string, options: { keepWrongSet?: boolean } = {}) {
  const state = readState()
  const current = normalizeStat(state[dayId])
  const wrongSet = options.keepWrongSet ? [...new Set(current.wrongSet)] : []
  state[dayId] = {
    correct: 0,
    wrong: 0,
    lastIndex: 0,
    completedDates: current.completedDates,
    wrongSet,
  }
  writeState(state)
}
