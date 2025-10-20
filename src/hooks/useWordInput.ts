// hooks/useWordInput.ts

import { useState, useCallback, MutableRefObject, useEffect } from "react"
import { recordAttempt, calculateScore } from "../lib/attemptTracking"

type PracticeWord = {
  word: string;
  meaning: string;
  pronunciation: string;
  syllables: string;
  partOfSpeech: string;
  example: string;
  dayId: string;
  orderIndex: number;
}

export function useWordInput(
  sessionWords: PracticeWord[],
  queueIndex: number,
  selectedDayId: string | null,
  isRunning: boolean,
  autoAdvanceRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onCorrectWord: () => void,
  onIncorrectAttempt: () => void,
  clearAutoAdvance?: () => void,
  speak?: (text: string) => void
) {
  const [typedValue, setTypedValue] = useState("")
  const [currentAttempts, setCurrentAttempts] = useState(0)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [showScoreFeedback, setShowScoreFeedback] = useState(false)

  const resetAttempts = useCallback(() => {
    setCurrentAttempts(0)
    setCurrentScore(null)
    setShowScoreFeedback(false)
  }, [])

  // queueIndex가 변경될 때마다 입력값과 시도 횟수 즉시 초기화
  useEffect(() => {
    setTypedValue("")
    setCurrentAttempts(0)
    setCurrentScore(null)
    setShowScoreFeedback(false)
  }, [queueIndex])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      const current = sessionWords[queueIndex]
      
      if (!isRunning || !current) {
        setTypedValue(newValue)
        return
      }

      setTypedValue(newValue)

      // 정답 체크 - autoAdvanceRef가 null일 때만 (중복 방지)
      if (newValue === current.word && autoAdvanceRef.current == null) {
        const attempts = currentAttempts + 1
        setCurrentAttempts(attempts)
        
        const score = calculateScore(attempts)
        setCurrentScore(score)
        
        if (selectedDayId) {
          recordAttempt(selectedDayId, current.word, attempts)
        }
        
        // 사운드 재생
        if (speak) {
          speak(current.word)
        }
        
        // 정답 처리
        onCorrectWord()
        
        // 입력값 초기화는 약간의 지연 후
        setTimeout(() => {
          setTypedValue("")
          resetAttempts()
        }, 100)
      }
    },
    [
      isRunning,
      queueIndex,
      sessionWords,
      autoAdvanceRef,
      onCorrectWord,
      currentAttempts,
      selectedDayId,
      resetAttempts,
      speak
    ]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return
      
      const current = sessionWords[queueIndex]
      if (!current || !selectedDayId || !isRunning) return
      
      event.preventDefault()
      
      // 🔥 중요: 정답일 때는 handleInputChange에서 이미 처리했으므로 여기서는 오답만 처리
      if (typedValue !== current.word) {
        setCurrentAttempts(prev => prev + 1)
        setTypedValue("")
        onIncorrectAttempt()
      }
      // 정답일 때는 아무것도 하지 않음 (handleInputChange에서 이미 처리됨)
    },
    [
      isRunning,
      queueIndex,
      selectedDayId,
      sessionWords,
      typedValue,
      onIncorrectAttempt,
    ]
  )

  return {
    typedValue,
    setTypedValue,
    handleInputChange,
    handleKeyDown,
    currentAttempts,
    currentScore,
    showScoreFeedback,
    resetAttempts,
  }
}