// hooks/useWordInput.ts

import { useState, useCallback, MutableRefObject } from "react"
import type { PracticeWord } from "../types"
import { recordAttempt, calculateScore } from "../lib/attemptTracking"

export function useWordInput(
  sessionWords: PracticeWord[],
  queueIndex: number,
  selectedDayId: string | null,
  isRunning: boolean,
  autoAdvanceRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onCorrectWord: () => void,
  onIncorrectAttempt: () => void
) {
  const [typedValue, setTypedValue] = useState("")
  const [currentAttempts, setCurrentAttempts] = useState(0)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [showScoreFeedback, setShowScoreFeedback] = useState(false)

  // 새 단어로 넘어갈 때 시도 횟수 초기화
  const resetAttempts = useCallback(() => {
    setCurrentAttempts(0)
    setCurrentScore(null)
    setShowScoreFeedback(false)
  }, [])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      const current = sessionWords[queueIndex]
      
      if (!isRunning || !current) {
        setTypedValue(newValue)
        return
      }

      setTypedValue(newValue)

      // 정답 체크
      if (newValue === current.word && autoAdvanceRef.current == null) {
        // 시도 횟수 증가
        const attempts = currentAttempts + 1
        setCurrentAttempts(attempts)
        
        // 점수 계산
        const score = calculateScore(attempts)
        setCurrentScore(score)
        
        // 시도 기록 저장
        if (selectedDayId) {
          recordAttempt(selectedDayId, current.word, attempts)
        }
        
        // 점수 피드백 표시
        
        
        // 점수 피드백을 잠깐 보여준 후 다음 단어로
        onCorrectWord()
        resetAttempts()
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
    ]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return
      
      const current = sessionWords[queueIndex]
      if (!current || !selectedDayId || !isRunning) return
      
      event.preventDefault()
      
      if (typedValue === current.word) {
        // 정답 - handleInputChange에서 이미 처리됨
        if (autoAdvanceRef.current == null) {
          const attempts = currentAttempts + 1
          setCurrentAttempts(attempts)
          
          const score = calculateScore(attempts)
          setCurrentScore(score)
          
          recordAttempt(selectedDayId, current.word, attempts)
          
          
          
          onCorrectWord()
          resetAttempts()
        }
      } else {
        // 오답 - 시도 횟수만 증가하고 입력창 초기화
        setCurrentAttempts(prev => prev + 1)
        onIncorrectAttempt()
      }
    },
    [
      isRunning,
      queueIndex,
      selectedDayId,
      sessionWords,
      typedValue,
      autoAdvanceRef,
      onCorrectWord,
      onIncorrectAttempt,
      currentAttempts,
      resetAttempts,
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
