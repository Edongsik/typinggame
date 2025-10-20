// hooks/useViewNavigation.ts
import { useState, useCallback } from "react"
import type { Word } from "../types"
import { getStat } from "../lib/progress"

type View = "wordbook" | "game" | "addword" | "wordlist" | "stats" | "allwords"

export function useViewNavigation(
  initializeDay: (dayId: string, mode: any, isReview?: boolean) => Promise<void>
) {
  const [view, setView] = useState<View>("wordbook")
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [addWordDayId, setAddWordDayId] = useState<string | null>(null)
  
  // Day 선택 및 게임 시작
  const handleDaySelect = useCallback((dayId: string, mode: any) => {
    const stat = getStat(dayId)
    const today = new Date().toISOString().slice(0, 10)
    const isCompletedToday = stat.completedDates.includes(today)
    
    setSelectedDayId(dayId)
    setView("game")
    
    // 완료 여부와 상관없이 항상 initializeDay 호출
    // 완료한 Day는 복습 모드(true), 아니면 일반 모드(false)
    void initializeDay(dayId, mode, isCompletedToday)
  }, [initializeDay])
  
  // 단어집으로 돌아가기
  const handleBackToWordbook = useCallback(() => {
    setView("wordbook")
  }, [])
  
  // 단어 추가 페이지로 이동
  const handleAddWord = useCallback((dayId: string) => {
    setAddWordDayId(dayId)
    setView("addword")
  }, [])
  
  // 단어 추가에서 돌아가기
  const handleBackFromAddWord = useCallback(() => {
    setView("wordbook")
    setAddWordDayId(null)
  }, [])
  
  // 단어 추가 완료
  const handleWordAdded = useCallback((word: Word) => {
    console.log("단어 추가됨:", word)
    alert(`"${word.word}" 단어가 추가되었습니다!`)
  }, [])
  
  // 단어 목록 페이지로 이동
  const handleWordCountClick = useCallback(() => {
    setView("wordlist")
  }, [])
  
  // 단어 목록에서 돌아가기
  const handleBackFromWordList = useCallback((mode: any, isReviewMode: boolean) => {
    if (selectedDayId) {
      void initializeDay(selectedDayId, mode, isReviewMode)
    }
    setView("game")
  }, [selectedDayId, initializeDay])
  
  // 통계 페이지로 이동
  const handleShowStats = useCallback(() => {
    setView("stats")
  }, [])
  
  // 통계에서 돌아가기
  const handleBackFromStats = useCallback(() => {
    setView("wordbook")
  }, [])
  
  // 🔥 전체 단어집 페이지로 이동
  const handleShowAllWords = useCallback(() => {
    setView("allwords")
  }, [])
  
  // 🔥 전체 단어집에서 돌아가기
  const handleBackFromAllWords = useCallback(() => {
    setView("wordbook")
  }, [])
  
  return {
    view,
    selectedDayId,
    addWordDayId,
    setSelectedDayId,
    handleDaySelect,
    handleBackToWordbook,
    handleAddWord,
    handleBackFromAddWord,
    handleWordAdded,
    handleWordCountClick,
    handleBackFromWordList,
    handleShowStats,
    handleBackFromStats,
    handleShowAllWords,
    handleBackFromAllWords,
  }
}