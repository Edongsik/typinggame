// hooks/useReview.ts

import { useCallback } from "react"
import { getStat, resetDay } from "../lib/progress"
import type { PracticeWord, PracticeMode } from "../types"

export function useReview(
  selectedDayId: string | null,
  baseWords: PracticeWord[],
  resetScoreboard: () => void,
  refreshStat: (dayId: string) => void,
  initializeDay: (dayId: string, mode: PracticeMode) => Promise<void>,
  mode: PracticeMode,
  setIsReviewMode: (value: boolean) => void,
  setSessionWords: (words: PracticeWord[]) => void,
  setQueueIndex: (index: number) => void,
  setAutoStartPending: (value: boolean) => void,
  setShowCompletionModal: (value: boolean) => void,
  setShowReviewChoiceModal: (value: boolean) => void
) {
  const beginReview = useCallback(() => {
    console.log("🔵 복습 시작!")
    
    if (!selectedDayId) {
      console.log("❌ selectedDayId 없음")
      setShowCompletionModal(false)
      return
    }
    
    const stat = getStat(selectedDayId)
    console.log("📊 현재 stat:", stat)
    console.log("❌ 틀린 단어들:", stat.wrongSet)
    
    const wrongWords = baseWords.filter((word) => stat.wrongSet.includes(word.word))
    console.log("📝 복습할 단어 개수:", wrongWords.length)
    
    if (wrongWords.length === 0) {
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
    setSessionWords(wrongWords)
    setQueueIndex(0)
    
    // 통계 새로고침
    refreshStat(selectedDayId)
    
    // 자동 시작
    setAutoStartPending(true)
    
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
      console.log(keepWrongSet ? "📝 wrongSet 유지됨" : "🗑️ wrongSet 비워짐")
      
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