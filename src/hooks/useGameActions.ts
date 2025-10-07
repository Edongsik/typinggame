// ============================================
// 4. hooks/useGameActions.ts - 게임 액션 관리
// ============================================
import { useCallback, ChangeEvent, KeyboardEvent } from "react"
import { markAnswer, markDayCompleted, resetDay } from "../lib/progress"
import { speak } from "../lib/tts"
import { playPronunciation } from "../lib/pronounce"
import type { PracticeWord } from "../lib/csv"

export function useGameActions(
  sessionWords: PracticeWord[],
  queueIndex: number,
  selectedDayId: string | null,
  isRunning: boolean,
  typedValue: string,
  streak: number,
  isReviewMode: boolean,
  mode: string,
  currentStat: any,
  baseWords: PracticeWord[],
  isInteracted: boolean,
  autoAdvanceRef: any,
  clearAutoAdvance: () => void,
  setScore: (fn: (prev: number) => number) => void,
  setStreak: (fn: (prev: number) => number) => void,
  setMaxStreak: (fn: (prev: number) => number) => void,
  setTypedValue: (value: string) => void,
  setQueueIndex: (index: number) => void,
  setTotalInputs: (fn: (prev: number) => number) => void,
  setCorrectInputs: (fn: (prev: number) => number) => void,
  refreshStat: (dayId: string) => void,
  onSessionComplete: () => void
) {
  const pronounceWord = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      await speak(trimmed, { lang: "en-US", rate: 0.95, voiceHint: "en" })
    } catch (speechError) {
      try {
        await playPronunciation(trimmed)
      } catch (audioError) {
        console.warn(`발음을 재생하지 못했습니다: ${trimmed}`)
      }
    }
  }, [])

  const handleNext = useCallback(() => {
    if (sessionWords.length === 0) return
    if (queueIndex + 1 >= sessionWords.length) {
      onSessionComplete()
      return
    }
    setTypedValue("")
    clearAutoAdvance()
    setQueueIndex(queueIndex + 1)
  }, [clearAutoAdvance, onSessionComplete, queueIndex, sessionWords.length, setQueueIndex, setTypedValue])

  const handleCorrectWord = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) return
    
    clearAutoAdvance()
    
    if (isInteracted) {
      pronounceWord(current.word).catch(() => {})
    }
    
    setScore((previous) => previous + 10 + streak * 2)
    setStreak((previous) => {
      const next = previous + 1
      setMaxStreak((maxValue) => Math.max(maxValue, next))
      return next
    })
    
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? Math.min(current.orderIndex + 1, baseWords.length)
      : currentStat.lastIndex
    
    markAnswer(selectedDayId, current.word, true, nextProgressIndex)
    refreshStat(selectedDayId)
    
    autoAdvanceRef.current = setTimeout(() => {
      handleNext()
    }, 1200)
  }, [
    sessionWords, queueIndex, selectedDayId, clearAutoAdvance, isInteracted,
    pronounceWord, setScore, streak, setStreak, setMaxStreak, isReviewMode,
    mode, currentStat.lastIndex, baseWords.length, refreshStat, autoAdvanceRef, handleNext
  ])

  const handleIncorrectAttempt = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) return
    
    clearAutoAdvance()
    setStreak(0)
    setTypedValue("")
    
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? current.orderIndex
      : currentStat.lastIndex
    
    markAnswer(selectedDayId, current.word, false, nextProgressIndex)
    refreshStat(selectedDayId)
  }, [
    sessionWords, queueIndex, selectedDayId, clearAutoAdvance, setStreak,
    setTypedValue, isReviewMode, mode, currentStat.lastIndex, refreshStat
  ])

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      const current = sessionWords[queueIndex]
      
      if (!isRunning || !current) {
        setTypedValue(newValue)
        return
      }

      setTypedValue((previous) => {
        if (newValue.length > previous.length) {
          const delta = newValue.slice(previous.length)
          const startIndex = previous.length
          let correctDelta = 0
          
          for (let index = 0; index < delta.length; index += 1) {
            if (current.word[startIndex + index] === delta[index]) {
              correctDelta += 1
            }
          }
          
          if (delta.length > 0) {
            setTotalInputs((prev) => prev + delta.length)
          }
          if (correctDelta > 0) {
            setCorrectInputs((prev) => prev + correctDelta)
          }
        }
        return newValue
      })

      if (newValue === current.word && autoAdvanceRef.current == null) {
        handleCorrectWord()
      }
    },
    [handleCorrectWord, isRunning, queueIndex, sessionWords, setCorrectInputs, setTotalInputs, setTypedValue, autoAdvanceRef]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return
      
      const current = sessionWords[queueIndex]
      if (!current || !selectedDayId || !isRunning) return
      
      event.preventDefault()
      
      if (typedValue === current.word) {
        if (autoAdvanceRef.current == null) {
          handleCorrectWord()
        }
      } else {
        handleIncorrectAttempt()
      }
    },
    [handleCorrectWord, handleIncorrectAttempt, isRunning, queueIndex, selectedDayId, sessionWords, typedValue, autoAdvanceRef]
  )

  const handlePlayAudioClick = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current) return
    pronounceWord(current.word).catch(() => {})
  }, [pronounceWord, queueIndex, sessionWords])

  return {
    handleNext,
    handleCorrectWord,
    handleIncorrectAttempt,
    handleInputChange,
    handleKeyDown,
    handlePlayAudioClick,
    pronounceWord,
  }
}