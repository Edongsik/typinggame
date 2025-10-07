// ============================================
// 3. hooks/useTimers.ts - 타이머 관리
// ============================================
import { useRef, useCallback } from "react"

export function useTimers() {
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimedMode = useCallback(() => {
    if (timerIntervalRef.current != null) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const clearElapsedTicker = useCallback(() => {
    if (elapsedIntervalRef.current != null) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
  }, [])

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current != null) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  const startElapsedTicker = useCallback(
    (startedAtMs: number, setElapsedMs: (ms: number) => void) => {
      clearElapsedTicker()
      setElapsedMs(0)
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtMs)
      }, 200)
    },
    [clearElapsedTicker]
  )

  const startTimedMode = useCallback(
    (setTimeLeft: (fn: (prev: number) => number) => void, onTimeUp: () => void) => {
      clearTimedMode()
      setTimeLeft(() => 60)
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1) {
            clearTimedMode()
            onTimeUp()
            return 0
          }
          return previous - 1
        })
      }, 1000)
    },
    [clearTimedMode]
  )

  return {
    timerIntervalRef,
    elapsedIntervalRef,
    autoAdvanceRef,
    clearTimedMode,
    clearElapsedTicker,
    clearAutoAdvance,
    startElapsedTicker,
    startTimedMode,
  }
}
