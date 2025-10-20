// hooks/useGameLogic.ts
import { useState, useCallback, useRef, useEffect } from "react"
import type { PracticeWord } from "../lib/csv"
import type { DayStat, PracticeMode } from "../types"
import { getStat, markAnswer, markDayCompleted, incrementReviewCount } from "../lib/progress"

const TIMED_MODE_SECONDS = 60

export function useGameLogic(
  sessionWords: PracticeWord[],
  selectedDayId: string | null,
  isReviewMode: boolean,
  mode: PracticeMode,
  baseWords: PracticeWord[]
) {
  // 게임 상태
  const [isRunning, setIsRunning] = useState(false)
  const [queueIndex, setQueueIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  
  // 타이머 상태
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMED_MODE_SECONDS)
  
  // Refs
  const isRunningRef = useRef(false)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // 현재 단어
  const currentWord = sessionWords[queueIndex] ?? null
  
  // 통계
  const currentStat = selectedDayId ? getStat(selectedDayId) : {
    correct: 0,
    wrong: 0,
    lastIndex: 0,
    completedDates: [],
    wrongSet: [],
    reviewCount: 0
  }
  
  // isRunningRef 동기화
  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])
  
  // 타이머 클리어 함수들
  const clearTimedMode = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])
  
  const clearElapsedTicker = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
  }, [])
  
  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  // 다음 문제로 인덱스가 변경되면 autoAdvanceRef를 비워 다음 입력에서 정답 처리가 가능하도록 함
  useEffect(() => {
    if (autoAdvanceRef.current) {
      autoAdvanceRef.current = null
    }
  }, [queueIndex])
  
  // 스코어보드 리셋
  const resetScoreboard = useCallback(() => {
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setCorrectInputs(0)
    setTotalInputs(0)
    setStartedAt(null)
    setElapsedMs(0)
    clearElapsedTicker()
    clearAutoAdvance()
    clearTimedMode()
    setIsRunning(false)
    isRunningRef.current = false
    setTimeLeft(TIMED_MODE_SECONDS)
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode])
  
  // 경과 시간 티커 시작
  const startElapsedTicker = useCallback((startedAtMs: number) => {
    clearElapsedTicker()
    setElapsedMs(0)
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtMs)
    }, 200)
  }, [clearElapsedTicker])
  
  // 타이머 모드 시작
  const startTimedMode = useCallback((onTimeUp: () => void) => {
    clearTimedMode()
    setTimeLeft(TIMED_MODE_SECONDS)
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimedMode()
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimedMode])
  
  // 정답 처리
  const handleCorrectWord = useCallback((refreshStat: (dayId: string) => void) => {
    console.log('🎯 [handleCorrectWord] 시작')
    console.log('  queueIndex:', queueIndex)
    console.log('  sessionWords.length:', sessionWords.length)
    
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) {
      console.log('  ❌ current 또는 selectedDayId 없음')
      return
    }
    
    console.log('  현재 단어:', current.word)
    console.log('  autoAdvanceRef.current (before clear):', autoAdvanceRef.current)
    
    clearAutoAdvance()
    console.log('  ✅ 이전 타이머 취소')
    console.log('  autoAdvanceRef.current (after clear):', autoAdvanceRef.current)
    
    setScore((prev) => prev + 10 + streak * 2)
    setStreak((prev) => {
      const next = prev + 1
      setMaxStreak((max) => Math.max(max, next))
      return next
    })
    
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? Math.min(current.orderIndex + 1, baseWords.length)
      : currentStat.lastIndex
    
    markAnswer(selectedDayId, current.word, true, nextProgressIndex)
    refreshStat(selectedDayId)
    
    console.log('  ⏰ 타이머 설정 (1.2초 후 실행)')
    console.log('  isRunningRef.current:', isRunningRef.current)
    
    // ✅ 자동 진행: setQueueIndex를 함수형 업데이트로 사용
    const timerId = setTimeout(() => {
      console.log('⏰ [setTimeout] 1.2초 경과')
      console.log('  isRunningRef.current:', isRunningRef.current)
      
      if (isRunningRef.current) {
        setQueueIndex((prevIndex) => {
          console.log('  📊 [setQueueIndex] prevIndex:', prevIndex)
          console.log('  📊 다음 인덱스:', prevIndex + 1)
          console.log('  📊 전체:', sessionWords.length)
          
          if (prevIndex + 1 >= sessionWords.length) {
            console.log('  ✅ 세션 완료!')
            return prevIndex
          } else {
            console.log('  ➡️ 다음 단어로 이동')
            return prevIndex + 1
          }
        })
      } else {
        console.log('  ❌ 게임이 중지됨, 진행하지 않음')
      }
    }, 1200)
    
    autoAdvanceRef.current = timerId
    
    console.log('  타이머 ID 설정:', autoAdvanceRef.current)
    
    // ✅ 세션 완료 여부 반환
    const isLastWord = queueIndex + 1 >= sessionWords.length
    console.log('  isLastWord:', isLastWord)
    console.log('🎯 [handleCorrectWord] 종료\n')
    
    return { isComplete: isLastWord }
  }, [
    sessionWords,
    queueIndex,
    selectedDayId,
    clearAutoAdvance,
    streak,
    isReviewMode,
    mode,
    baseWords.length,
    currentStat.lastIndex,
    isRunningRef,
    setQueueIndex,
    setScore,
    setStreak,
    setMaxStreak,
  ])
  
  // 오답 처리
  const handleIncorrectAttempt = useCallback((refreshStat: (dayId: string) => void) => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) return
    
    clearAutoAdvance()
    setStreak(0)
    
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? current.orderIndex
      : currentStat.lastIndex
    
    markAnswer(selectedDayId, current.word, false, nextProgressIndex)
    refreshStat(selectedDayId)
  }, [sessionWords, queueIndex, selectedDayId, clearAutoAdvance, isReviewMode, mode, currentStat.lastIndex])
  
  // 다음 단어로 이동
  const handleNext = useCallback(() => {
    if (sessionWords.length === 0) return false
    
    clearAutoAdvance()
    
    if (queueIndex + 1 >= sessionWords.length) {
      return true // 세션 완료
    }
    
    setQueueIndex(queueIndex + 1)
    return false
  }, [clearAutoAdvance, queueIndex, sessionWords.length])
  
  // 이전 단어로 이동
  const handlePrevious = useCallback(() => {
    if (sessionWords.length === 0 || queueIndex === 0) return
    clearAutoAdvance()
    setQueueIndex(queueIndex - 1)
  }, [clearAutoAdvance, queueIndex, sessionWords.length])
  
  // 게임 시작
  const handleStart = useCallback(() => {
    if (sessionWords.length === 0) return
    
    clearAutoAdvance()
    clearElapsedTicker()
    setIsRunning(true)
    isRunningRef.current = true
    
    const startedAtMs = Date.now()
    setStartedAt(startedAtMs)
    startElapsedTicker(startedAtMs)
    
    if (timerEnabled) {
      startTimedMode(() => {
        // Time up callback은 외부에서 주입
      })
    } else {
      clearTimedMode()
      setTimeLeft(TIMED_MODE_SECONDS)
    }
  }, [sessionWords.length, clearAutoAdvance, clearElapsedTicker, clearTimedMode, startElapsedTicker, startTimedMode, timerEnabled])
  
  // 타이머 토글
  const handleToggleTimer = useCallback(() => {
    setTimerEnabled((prev) => {
      const next = !prev
      if (!next) {
        clearTimedMode()
        setTimeLeft(TIMED_MODE_SECONDS)
      } else if (isRunningRef.current) {
        startTimedMode(() => {})
      }
      return next
    })
  }, [clearTimedMode, startTimedMode])
  
  // 세션 완료 처리
  const handleSessionComplete = useCallback((refreshStat: (dayId: string) => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    clearElapsedTicker()
    clearTimedMode()
    clearAutoAdvance()
    
    isRunningRef.current = false
    setIsRunning(false)
    
    if (!selectedDayId) return
    
    if (isReviewMode) {
      incrementReviewCount(selectedDayId)
      refreshStat(selectedDayId)
      return { type: 'review' as const }
    }
    
    if (mode === "sequence") {
      markDayCompleted(selectedDayId)
      refreshStat(selectedDayId)
      return { type: 'completion' as const }
    }
    
    return { type: 'none' as const }
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode, isReviewMode, mode, selectedDayId])
  
  // Cleanup
  useEffect(() => {
    return () => {
      clearElapsedTicker()
      clearTimedMode()
      clearAutoAdvance()
    }
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode])
  
  return {
    // States
    isRunning,
    queueIndex,
    score,
    streak,
    maxStreak,
    correctInputs,
    totalInputs,
    startedAt,
    elapsedMs,
    timerEnabled,
    timeLeft,
    currentWord,
    currentStat,
    
    // Refs
    isRunningRef,
    autoAdvanceRef,
    
    // Setters
    setQueueIndex,
    setCorrectInputs,
    setTotalInputs,
    setIsRunning,
    
    // Actions
    handleCorrectWord,
    handleIncorrectAttempt,
    handleNext,
    handlePrevious,
    handleStart,
    handleToggleTimer,
    handleSessionComplete,
    resetScoreboard,
    clearAutoAdvance
  }
}
