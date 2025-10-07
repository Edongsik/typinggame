// ============================================
// 1. hooks/useGameState.ts - 게임 상태 관리
// ============================================
import { useState, useCallback } from "react"
import type { DayStat, GameSummary } from "../types"

const emptyDayStat: DayStat = {
  correct: 0,
  wrong: 0,
  lastIndex: 0,
  completedDates: [],
  wrongSet: [],
}

export function useGameState() {
  const [isRunning, setIsRunning] = useState(false)
  const [typedValue, setTypedValue] = useState("")
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [currentStat, setCurrentStat] = useState<DayStat>(emptyDayStat)
  const [isInteracted, setIsInteracted] = useState(false)

  const resetScoreboard = useCallback(() => {
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setCorrectInputs(0)
    setTotalInputs(0)
    setTypedValue("")
    setStartedAt(null)
    setElapsedMs(0)
    setSummary(null)
    setIsRunning(false)
    setTimeLeft(60)
    setIsInteracted(false)
  }, [])

  return {
    isRunning,
    setIsRunning,
    typedValue,
    setTypedValue,
    score,
    setScore,
    streak,
    setStreak,
    maxStreak,
    setMaxStreak,
    correctInputs,
    setCorrectInputs,
    totalInputs,
    setTotalInputs,
    startedAt,
    setStartedAt,
    elapsedMs,
    setElapsedMs,
    timerEnabled,
    setTimerEnabled,
    timeLeft,
    setTimeLeft,
    summary,
    setSummary,
    currentStat,
    setCurrentStat,
    isInteracted,
    setIsInteracted,
    resetScoreboard,
  }
}
