const STORAGE_KEY = 'tg:pending-target'

type PendingTarget = {
  dayId: string
  word: string
} | null

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function setPendingTarget(dayId: string, word: string) {
  if (!isBrowser()) return
  const payload = { dayId, word }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function getPendingTarget(): PendingTarget {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && typeof parsed.dayId === 'string' && typeof parsed.word === 'string') {
      return parsed as PendingTarget
    }
    return null
  } catch {
    return null
  }
}

export function clearPendingTarget() {
  if (!isBrowser()) return
  window.localStorage.removeItem(STORAGE_KEY)
}

