// ============================================
// 2. hooks/useWordData.ts - 단어 데이터 관리
// ============================================
import { useState, useCallback, useEffect } from "react"
import { loadDays, loadManifest, type PracticeWord } from "../lib/csv"
import { getStat } from "../lib/progress"
import type { DayMeta, PracticeMode } from "../types"

export function useWordData() {
  const [manifest, setManifest] = useState<DayMeta[]>([])
  const [isManifestLoading, setIsManifestLoading] = useState(true)
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [mode, setMode] = useState<PracticeMode>("sequence")
  const [baseWords, setBaseWords] = useState<PracticeWord[]>([])
  const [sessionWords, setSessionWords] = useState<PracticeWord[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const [wordsError, setWordsError] = useState<string | null>(null)
  const [progressKey, setProgressKey] = useState(0)

  const refreshStat = useCallback((dayId: string) => {
    getStat(dayId)
    setProgressKey((value) => value + 1)
  }, [])

  const initializeDay = useCallback(
    async (dayId: string, selectedMode: PracticeMode, resetScoreboard: () => void) => {
      resetScoreboard()
      setIsReviewMode(false)
      setIsLoadingWords(true)
      setWordsError(null)
      try {
        const loaded = await loadDays([dayId], selectedMode)
        if (!loaded.length) {
          setBaseWords([])
          setSessionWords([])
          setWordsError("선택한 Day에 단어가 없습니다.")
          return
        }
        setBaseWords(loaded)
        setSessionWords(loaded)
        const stat = getStat(dayId)
        const startIndex = selectedMode === "sequence" ? Math.min(stat.lastIndex, Math.max(loaded.length - 1, 0)) : 0
        setQueueIndex(startIndex)
        return { loaded, stat }
      } catch (error) {
        const message = error instanceof Error ? error.message : "단어를 불러오지 못했습니다."
        setBaseWords([])
        setSessionWords([])
        setWordsError(message)
      } finally {
        setIsLoadingWords(false)
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    setIsManifestLoading(true)
    loadManifest()
      .then((days) => {
        if (cancelled) return
        setManifest(days)
      })
      .catch((error) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Day 정보를 불러오지 못했습니다."
        setManifestError(message)
      })
      .finally(() => {
        if (!cancelled) setIsManifestLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    manifest,
    isManifestLoading,
    manifestError,
    selectedDayId,
    setSelectedDayId,
    mode,
    setMode,
    baseWords,
    sessionWords,
    setSessionWords,
    queueIndex,
    setQueueIndex,
    isReviewMode,
    setIsReviewMode,
    isLoadingWords,
    wordsError,
    progressKey,
    refreshStat,
    initializeDay,
  }
}
