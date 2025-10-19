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

  const resetAttempts = useCallback(() => {
    setCurrentAttempts(0)
    setCurrentScore(null)
    setShowScoreFeedback(false)
  }, [])

  // ✅ 사운드 재생 헬퍼 함수 (사용자 제스처 내에서 호출)
  const playWordSound = useCallback((word: string) => {
    try {
      // Web Speech API 시도
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel() // 이전 재생 중단
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = 'en-US'
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.warn('사운드 재생 실패:', error)
    }
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

      // ✅ 정답 체크
      if (newValue === current.word && autoAdvanceRef.current == null) {
        const attempts = currentAttempts + 1
        setCurrentAttempts(attempts)
        
        const score = calculateScore(attempts)
        setCurrentScore(score)
        
        if (selectedDayId) {
          recordAttempt(selectedDayId, current.word, attempts)
        }
        
        // ✅ 사용자 입력 이벤트 내에서 즉시 사운드 재생 (모바일 대응)
        playWordSound(current.word)
        
        // ✅ 시도 횟수 초기화
        resetAttempts()
        
        // ✅ 정답 처리 콜백 호출
        onCorrectWord()
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
      playWordSound, // ✅ 추가
    ]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return
      
      const current = sessionWords[queueIndex]
      if (!current || !selectedDayId || !isRunning) return
      
      event.preventDefault()
      
      if (typedValue === current.word) {
        if (autoAdvanceRef.current == null) {
          const attempts = currentAttempts + 1
          setCurrentAttempts(attempts)
          
          const score = calculateScore(attempts)
          setCurrentScore(score)
          
          recordAttempt(selectedDayId, current.word, attempts)
          
          // ✅ Enter 키 이벤트도 사용자 제스처이므로 여기서 사운드 재생
          playWordSound(current.word)
          
          onCorrectWord()
          resetAttempts()
        }
      } else {
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
      playWordSound, // ✅ 추가
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