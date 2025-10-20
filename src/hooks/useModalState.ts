// hooks/useModalState.ts
import { useState, useCallback } from "react"
import type { GameSummary } from "../types"

export function useModalState() {
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showReviewChoiceModal, setShowReviewChoiceModal] = useState(false)
  
  const closeSummary = useCallback(() => {
    setSummary(null)
  }, [])
  
  const openCompletionModal = useCallback(() => {
    setShowCompletionModal(true)
  }, [])
  
  const closeCompletionModal = useCallback(() => {
    setShowCompletionModal(false)
  }, [])
  
  const openReviewChoiceModal = useCallback(() => {
    setShowReviewChoiceModal(true)
  }, [])
  
  const closeReviewChoiceModal = useCallback(() => {
    setShowReviewChoiceModal(false)
  }, [])
  
  return {
    summary,
    setSummary,
    showCompletionModal,
    showReviewChoiceModal,
    closeSummary,
    openCompletionModal,
    closeCompletionModal,
    openReviewChoiceModal,
    closeReviewChoiceModal
  }
}