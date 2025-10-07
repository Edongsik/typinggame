// hooks/useWordInput.ts

import { useState, useCallback, MutableRefObject } from "react"
import type { PracticeWord } from "../types"

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
        onCorrectWord()
      }
    },
    [
      isRunning,
      queueIndex,
      sessionWords,
      autoAdvanceRef,
      onCorrectWord
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
          onCorrectWord()
        }
      } else {
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
      onIncorrectAttempt
    ]
  )

  return {
    typedValue,
    setTypedValue,
    handleInputChange,
    handleKeyDown
  }
}