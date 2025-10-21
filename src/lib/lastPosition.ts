const PREFIX = 'tg:last-word:'

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function setLastWord(dayId: string, word: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(PREFIX + dayId, word)
  } catch {}
}

export function getLastWord(dayId: string): string | null {
  if (!isBrowser()) return null
  try {
    const v = window.localStorage.getItem(PREFIX + dayId)
    return v || null
  } catch {
    return null
  }
}

export function clearLastWord(dayId: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(PREFIX + dayId)
  } catch {}
}

