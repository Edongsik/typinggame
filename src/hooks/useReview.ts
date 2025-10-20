// hooks/useReview.ts

import { useCallback } from "react"
import { getStat, resetDay } from "../lib/progress"
import { getCompletedWords } from "../lib/completedWords"
import type { PracticeWord } from "../lib/csv"

type PracticeMode = 'sequence' | 'random'

type UseReviewParams = {
  selectedDayId: string | null
  baseWords: PracticeWord[]
  resetScoreboard: () => void
  refreshStat: (dayId: string) => void
  initializeDay: (dayId: string, mode: PracticeMode, isReviewSession?: boolean) => Promise<void>
  mode: PracticeMode
  setIsReviewMode: (value: boolean) => void
  setSessionWords: (words: PracticeWord[]) => void
  setQueueIndex: (index: number) => void
  setAutoStartPending: (value: boolean) => void
  setShowCompletionModal: (value: boolean) => void
  setShowReviewChoiceModal: (value: boolean) => void
}

export function useReview({
  selectedDayId,
  baseWords,
  resetScoreboard,
  refreshStat,
  initializeDay,
  mode,
  setIsReviewMode,
  setSessionWords,
  setQueueIndex,
  setAutoStartPending,
  setShowCompletionModal,
  setShowReviewChoiceModal,
}: UseReviewParams) {
  const beginReview = useCallback(() => {
    console.log("🔵 복습 시작!")
    
    if (!selectedDayId) {
      console.log("❌ selectedDayId 없음")
      setShowCompletionModal(false)
      return
    }
    
    const currentStat = getStat(selectedDayId)
    console.log("📊 현재 stat:", currentStat)
    console.log("❌ 틀린 단어들:", currentStat.wrongSet)
    
    const wrongWords = baseWords.filter((word) => currentStat.wrongSet.includes(word.word))
    const completedList = selectedDayId ? getCompletedWords(selectedDayId) : []
    const wrongFiltered = completedList.length
      ? wrongWords.filter(w => !completedList.includes(w.word))
      : wrongWords
    console.log("🔍 복습할 단어 개수:", wrongWords.length)
    
    if (wrongFiltered.length === 0) {
      console.log("✅ 틀린 단어가 없음 - 복습 불필요")
      alert("틀린 단어가 없습니다! 완벽하게 학습했습니다! 🎉")
      setShowCompletionModal(false)
      return
    }
    
    // 모달 닫기
    setShowCompletionModal(false)
    
    // 게임 상태 초기화
    resetScoreboard()
    
    // 복습 모드 설정
    setIsReviewMode(true)
    setSessionWords(wrongFiltered)
    setQueueIndex(0)
    
    // 통계 새로고침
    refreshStat(selectedDayId)
    
    // 자동 시작 (약간의 지연)
    setTimeout(() => {
      setAutoStartPending(true)
    }, 100)
    
    console.log("✅ 복습 모드 설정 완료!")
  }, [
    baseWords,
    refreshStat,
    resetScoreboard,
    selectedDayId,
    setAutoStartPending,
    setIsReviewMode,
    setQueueIndex,
    setSessionWords,
    setShowCompletionModal
  ])

  const finalizeReview = useCallback(
    (keepWrongSet: boolean) => {
      console.log("🔵 복습 완료 처리!")
      console.log("wrongSet 유지?", keepWrongSet)
      
      if (!selectedDayId) {
        console.log("❌ selectedDayId 없음")
        setShowReviewChoiceModal(false)
        return
      }
      
      // wrongSet 처리
      resetDay(selectedDayId, { keepWrongSet })
      console.log(keepWrongSet ? "📌 wrongSet 유지됨" : "🗑️ wrongSet 비워짐")
      
      // 통계 새로고침
      refreshStat(selectedDayId)
      
      // 모달 닫기
      setShowReviewChoiceModal(false)
      
      // 복습 모드 해제
      setIsReviewMode(false)
      
      // Day 다시 초기화 (처음부터 시작)
      console.log("🔄 Day 재초기화 중...")
      void initializeDay(selectedDayId, mode)
      
      console.log("✅ 복습 완료 처리 끝!")
    },
    [initializeDay, mode, refreshStat, selectedDayId, setIsReviewMode, setShowReviewChoiceModal]
  )

  return {
    beginReview,
    finalizeReview
  }
}
