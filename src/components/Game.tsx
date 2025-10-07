import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import GameModals from "./GameModals"
import GameView from "./GameView"
import Wordbook from "./Wordbook"
import AddWord, { type Word } from "./AddWord"
import WordListPage from "./WordListPage"
import Statistics from "./Statistics"
import { loadDays, loadManifest, type PracticeWord } from "../lib/csv"
import { speak } from "../lib/tts"
import { playPronunciation } from "../lib/pronounce"
import {
  getStat,
  markAnswer,
  markDayCompleted,
  resetDay,
  incrementReviewCount,
} from "../lib/progress"
import { getCustomWords, updateCustomWord } from "../lib/customWords"
import { getCompletedWords } from "../lib/completedWords"
import { useReview } from "../hooks/useReview"
import { useWordInput } from "../hooks/useWordInput"
import type {
  DayMeta,
  DayStat,
  GameSummary,
  PracticeMode,
} from "../types"

const AUTO_ADVANCE_DELAY_MS = 1200
const TIMED_MODE_SECONDS = 60

const emptyDayStat: DayStat = {
  correct: 0,
  wrong: 0,
  lastIndex: 0,
  completedDates: [],
  wrongSet: [],
  reviewCount: 0,
}

function calculateWpm(correct: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  if (minutes === 0) return 0
  return (correct / 5) / minutes
}

const Game = () => {
  const wordContainerRef = useRef<HTMLHeadingElement>(null)
  const timerIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const elapsedIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const isRunningRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
  const [currentStat, setCurrentStat] = useState<DayStat>(emptyDayStat)

  const [isRunning, setIsRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctInputs, setCorrectInputs] = useState(0)
  const [totalInputs, setTotalInputs] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMED_MODE_SECONDS)
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showReviewChoiceModal, setShowReviewChoiceModal] = useState(false)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const [isInteracted, setIsInteracted] = useState(false)
  const [view, setView] = useState<"wordbook" | "game" | "addword" | "wordlist" | "stats">("wordbook")
  const [addWordDayId, setAddWordDayId] = useState<string | null>(null)
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})

  // 단어 개수 로드
  useEffect(() => {
    if (manifest.length === 0) return
    
    async function loadAllWordCounts() {
      const counts: Record<string, number> = {}
      
      for (const day of manifest) {
        try {
          const words = await loadDays([day.id], 'sequence')
          counts[day.id] = words.length
        } catch (error) {
          console.error(`${day.id} 단어 개수 로드 실패:`, error)
          counts[day.id] = day.total
        }
      }
      
      setWordCounts(counts)
    }

    loadAllWordCounts()
  }, [manifest])

  // View 핸들러들
  const handleDaySelect = (dayId: string) => {
    const stat = getStat(dayId)
    const today = new Date().toISOString().slice(0, 10)
    const isCompletedToday = stat.completedDates.includes(today)
    
    setSelectedDayId(dayId)
    setView("game")
    
    if (isCompletedToday) {
      void initializeDay(dayId, mode, true)
    }
  }
  
  const handleBackToWordbook = () => {
    setView("wordbook")
  }

  const handleAddWord = (dayId: string) => {
    const day = manifest.find(d => d.id === dayId)
    if (day) {
      setAddWordDayId(dayId)
      setView("addword")
    }
  }

  const handleBackFromAddWord = () => {
    setView("wordbook")
    setAddWordDayId(null)
  }

  const handleWordAdded = (word: Word) => {
    console.log("단어 추가됨:", word)
    alert(`"${word.word}" 단어가 추가되었습니다!`)
  }

  const handleWordCountClick = () => {
    setView("wordlist")
  }

  const handleBackFromWordList = () => {
    if (selectedDayId) {
      void initializeDay(selectedDayId, mode, isReviewMode)
    }
    setView("game")
  }

  const handleShowStats = () => {
    setView("stats")
  }

  const handleBackFromStats = () => {
    setView("wordbook")
  }

  const handleJumpToWord = (index: number) => {
    setQueueIndex(index)
    clearAutoAdvance()
  }

  const handleEditWord = (index: number, updatedWord: Partial<PracticeWord>) => {
    const word = sessionWords[index]
    
    const newWords = [...sessionWords]
    newWords[index] = { ...newWords[index], ...updatedWord }
    setSessionWords(newWords)
    
    const baseIndex = baseWords.findIndex(w => w.word === word.word)
    if (baseIndex !== -1) {
      const newBaseWords = [...baseWords]
      newBaseWords[baseIndex] = { ...newBaseWords[baseIndex], ...updatedWord }
      setBaseWords(newBaseWords)
    }
    
    if (selectedDayId) {
      const customWords = getCustomWords(selectedDayId)
      const isCustomWord = customWords.some(w => w.word === word.word)
      
      if (isCustomWord) {
        updateCustomWord(selectedDayId, word.word, updatedWord)
      }
    }
    
    alert("단어가 수정되었습니다!")
  }

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  const clearTimedMode = useCallback(() => {
    if (timerIntervalRef.current != null) {
      window.clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const clearElapsedTicker = useCallback(() => {
    if (elapsedIntervalRef.current != null) {
      window.clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }
  }, [])

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current != null) {
      window.clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  const refreshStat = useCallback((dayId: string) => {
    const stat = getStat(dayId)
    setCurrentStat(stat)
    setProgressKey((value) => value + 1)
  }, [])

  const startElapsedTicker = useCallback(
    (startedAtMs: number) => {
      clearElapsedTicker()
      setElapsedMs(0)
      elapsedIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtMs)
      }, 200)
    },
    [clearElapsedTicker]
  )

  const handleTimeUp = useCallback(() => {
    clearElapsedTicker()
    clearAutoAdvance()
    isRunningRef.current = false
    setIsRunning(false)
    setSummary({
      score,
      accuracy: totalInputs === 0 ? 0 : (correctInputs / totalInputs) * 100,
      maxStreak,
    })
  }, [
    clearAutoAdvance,
    clearElapsedTicker,
    correctInputs,
    maxStreak,
    score,
    totalInputs,
  ])

  const startTimedMode = useCallback(() => {
    clearTimedMode()
    setTimeLeft(TIMED_MODE_SECONDS)
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearTimedMode()
          handleTimeUp()
          return 0
        }
        return previous - 1
      })
    }, 1000)
  }, [clearTimedMode, handleTimeUp])

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

  const resetScoreboard = useCallback(() => {
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setCorrectInputs(0)
    setTotalInputs(0)
    setStartedAt(null)
    setElapsedMs(0)
    setSummary(null)
    setAutoStartPending(false)
    clearElapsedTicker()
    clearAutoAdvance()
    clearTimedMode()
    setIsRunning(false)
    isRunningRef.current = false
    setTimeLeft(TIMED_MODE_SECONDS)
    setIsInteracted(false)
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode])

  const handleStart = useCallback(() => {
    if (isLoadingWords || wordsError || sessionWords.length === 0) return
    
    clearAutoAdvance()
    clearElapsedTicker()
    setIsRunning(true)
    isRunningRef.current = true
    const startedAtMs = Date.now()
    setStartedAt(startedAtMs)
    startElapsedTicker(startedAtMs)
    
    if (timerEnabled) {
      startTimedMode()
    } else {
      clearTimedMode()
      setTimeLeft(TIMED_MODE_SECONDS)
    }
    
    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [
    clearAutoAdvance,
    clearElapsedTicker,
    clearTimedMode,
    isLoadingWords,
    sessionWords.length,
    startElapsedTicker,
    startTimedMode,
    timerEnabled,
    wordsError,
  ])

  const initializeDay = useCallback(
    async (dayId: string, selectedMode: PracticeMode, isReviewSession: boolean = false) => {
      resetScoreboard()
      setIsReviewMode(isReviewSession)
      setShowCompletionModal(false)
      setShowReviewChoiceModal(false)
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
        
        let filteredWords = loaded
        if (!isReviewSession) {
          const completedWords = getCompletedWords(dayId)
          filteredWords = loaded.filter(word => !completedWords.includes(word.word))
          
          if (filteredWords.length === 0) {
            setBaseWords(loaded)
            setSessionWords([])
            setWordsError("모든 단어를 학습 완료했습니다! 🎉\n완료 체크를 해제하거나 새로운 단어를 추가하세요.")
            return
          }
        }
        
        setBaseWords(loaded)
        setSessionWords(filteredWords)
        const stat = getStat(dayId)
        setCurrentStat(stat)
        setProgressKey((value) => value + 1)
        
        const startIndex = isReviewSession 
          ? 0 
          : (selectedMode === "sequence" 
              ? Math.min(stat.lastIndex, Math.max(filteredWords.length - 1, 0)) 
              : 0)
        
        setQueueIndex(startIndex)
        setAutoStartPending(true)
      } catch (error) {
        const message = error instanceof Error ? error.message : "단어를 불러오지 못했습니다."
        setBaseWords([])
        setSessionWords([])
        setWordsError(message)
      } finally {
        setIsLoadingWords(false)
      }
    },
    [resetScoreboard]
  )

  const { beginReview, finalizeReview } = useReview(
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
    setShowReviewChoiceModal
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

  useEffect(() => {
    if (!selectedDayId) return
    void initializeDay(selectedDayId, mode)
    refreshStat(selectedDayId)
  }, [initializeDay, mode, refreshStat, selectedDayId])

  useEffect(() => {
    return () => {
      clearElapsedTicker()
      clearTimedMode()
      clearAutoAdvance()
    }
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode])

  useEffect(() => {
    if (
      autoStartPending &&
      !isLoadingWords &&
      wordsError == null &&
      sessionWords.length > 0 &&
      !summary &&
      !showCompletionModal &&
      !showReviewChoiceModal
    ) {
      handleStart()
      setAutoStartPending(false)
    }
  }, [
    autoStartPending,
    handleStart,
    isLoadingWords,
    sessionWords.length,
    showCompletionModal,
    showReviewChoiceModal,
    summary,
    wordsError,
  ])

  const currentWord = sessionWords[queueIndex] ?? null

  const handleModeChange = useCallback((next: PracticeMode) => {
    setMode(next)
  }, [])

  const handlePlayAudioClick = useCallback(() => {
    if (!isInteracted) {
      setIsInteracted(true)
    }
    const current = sessionWords[queueIndex]
    if (!current) return
    pronounceWord(current.word).catch(() => {})
  }, [isInteracted, pronounceWord, queueIndex, sessionWords])

  const handleToggleTimer = useCallback(() => {
    setTimerEnabled((previous) => {
      const next = !previous
      if (!next) {
        clearTimedMode()
        setTimeLeft(TIMED_MODE_SECONDS)
      } else if (isRunningRef.current) {
        startTimedMode()
      }
      return next
    })
  }, [clearTimedMode, startTimedMode])

  const handleSessionComplete = useCallback(() => {
    clearElapsedTicker()
    clearTimedMode()
    clearAutoAdvance()
    isRunningRef.current = false
    setIsRunning(false)
    if (!selectedDayId) return
    
    if (isReviewMode) {
      incrementReviewCount(selectedDayId)
      refreshStat(selectedDayId)
      setShowCompletionModal(true)
      setIsReviewMode(false)
      return
    }
    
    if (mode === "sequence") {
      markDayCompleted(selectedDayId)
      refreshStat(selectedDayId)
      setShowCompletionModal(true)
    }
  }, [
    clearAutoAdvance,
    clearElapsedTicker,
    clearTimedMode,
    isReviewMode,
    mode,
    refreshStat,
    selectedDayId,
  ])

  const handleNext = useCallback(() => {
    if (sessionWords.length === 0) return
    
    if (queueIndex + 1 >= sessionWords.length) {
      if (!isReviewMode && mode === "sequence") {
        handleSessionComplete()
        return
      }
      setTypedValue("")
      clearAutoAdvance()
      setQueueIndex(0)
      return
    }
    
    setTypedValue("")
    clearAutoAdvance()
    setQueueIndex(queueIndex + 1)
  }, [clearAutoAdvance, handleSessionComplete, isReviewMode, mode, queueIndex, sessionWords.length])

  const handlePrevious = useCallback(() => {
    if (sessionWords.length === 0 || queueIndex === 0) return;
    
    setTypedValue("");
    clearAutoAdvance();
    setQueueIndex(queueIndex - 1);
  }, [clearAutoAdvance, queueIndex, sessionWords.length]);

 const handleCorrectWord = useCallback(async () => { // 1. async 추가
    const current = sessionWords[queueIndex];
    if (!current || !selectedDayId) return;

    // 기존 타이머 로직을 모두 제거합니다.
    clearAutoAdvance();

    // 2. 사운드 재생이 끝날 때까지 기다립니다.
    if (isInteracted) {
      try {
        await pronounceWord(current.word);
      } catch (e) {
        console.error("사운드 재생 실패:", e);
      }
    }

    // 3. 마지막 글자가 초록색으로 보이는 것을 인지할 수 있도록 짧은 지연시간을 줍니다.
    await new Promise(resolve => setTimeout(resolve, 300)); // 0.3초 대기

    // 4. 모든 작업이 끝난 후, 다음 단어로 넘어갑니다.
    if (isRunningRef.current) {
      handleNext();
    }
  }, [
    clearAutoAdvance,
    handleNext,
    isInteracted,
    pronounceWord,
    queueIndex,
    selectedDayId,
    sessionWords,
  ]);

  const handleIncorrectAttempt = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) return
    
    clearAutoAdvance()
    setStreak(0)
    
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? current.orderIndex
      : currentStat.lastIndex
    
    markAnswer(selectedDayId, current.word, false, nextProgressIndex)
    refreshStat(selectedDayId)
  }, [
    clearAutoAdvance,
    currentStat.lastIndex,
    isReviewMode,
    mode,
    queueIndex,
    refreshStat,
    selectedDayId,
    sessionWords,
  ])

  const { typedValue, setTypedValue, handleInputChange, handleKeyDown } = useWordInput(
    sessionWords,
    queueIndex,
    selectedDayId,
    isRunning,
    autoAdvanceRef,
    handleCorrectWord,
    handleIncorrectAttempt
  )

  const handleRetry = useCallback(() => {
    if (!selectedDayId) return
    void initializeDay(selectedDayId, mode, isReviewMode)
  }, [initializeDay, mode, selectedDayId, isReviewMode])

  const handleRetryFromCompletion = useCallback(() => {
    if (!selectedDayId) return
    setShowCompletionModal(false)
    setTypedValue("")
    setQueueIndex(0)
    resetScoreboard()
    setTimeout(() => {
      handleStart()
    }, 100)
  }, [selectedDayId, resetScoreboard, handleStart])

  const handleCloseCompletion = useCallback(() => {
    setShowCompletionModal(false)
    setView("wordbook")
  }, [])

  const handleReset = useCallback(() => {
    if (!selectedDayId) return
    
    resetDay(selectedDayId)
    refreshStat(selectedDayId)
    
    setTypedValue("")
    setQueueIndex(0)
    resetScoreboard()
    
    void initializeDay(selectedDayId, mode, isReviewMode)
  }, [initializeDay, mode, refreshStat, selectedDayId, isReviewMode, resetScoreboard])

  const closeSummary = useCallback(() => {
    setSummary(null)
  }, [])

  const restartFromSummary = useCallback(() => {
    closeSummary()
    handleStart()
  }, [closeSummary, handleStart])

  const accuracy = useMemo(() => {
    if (totalInputs === 0) return 0
    return (correctInputs / totalInputs) * 100
  }, [correctInputs, totalInputs])

  const wpm = useMemo(() => calculateWpm(correctInputs, elapsedMs), [correctInputs, elapsedMs])

  const progress = useMemo(() => {
    if (sessionWords.length === 0) return 0
    if (isReviewMode) return (queueIndex / sessionWords.length) * 100
    if (mode === "sequence") {
      return (Math.min(currentStat.lastIndex, sessionWords.length) / sessionWords.length) * 100
    }
    return (queueIndex / sessionWords.length) * 100
  }, [currentStat.lastIndex, isReviewMode, mode, queueIndex, sessionWords.length])

  const dayMeta = manifest.find((day) => day.id === selectedDayId) ?? null
  const isNextDisabled = !isRunning || sessionWords.length === 0
  const isResetDisabled = isLoadingWords

  return (
    <div className="app-layout">
      {view === "wordbook" ? (
        <>
        <h1 className="app-title">토익 단어 타자 게임</h1>
        
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            marginTop: '2rem',
          }}>
            <button
              onClick={() => setView("wordbook")}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              📚 단어집
            </button>
            <button
              onClick={handleShowStats}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
            >
              📊 통계
            </button>
          </div>
          <Wordbook 
            days={manifest} 
            wordCounts={wordCounts}
            onSelect={handleDaySelect} 
            onAddWord={handleAddWord} 
          />
        </>
      ) : view === "stats" ? (
        <Statistics 
          days={manifest} 
          wordCounts={wordCounts}
          onBack={handleBackFromStats}
        />
      ) : view === "addword" ? (
        <AddWord
          dayId={addWordDayId || ""}
          dayLabel={manifest.find(d => d.id === addWordDayId)?.label || ""}
          onBack={handleBackFromAddWord}
          onWordAdded={handleWordAdded}
        />
      ) : view === "wordlist" ? (
        <WordListPage
          words={baseWords}
          currentIndex={queueIndex}
          dayLabel={dayMeta?.label || "단어 목록"}
          dayId={selectedDayId || ""}
          onBack={handleBackFromWordList}
          onJumpTo={handleJumpToWord}
          onEdit={handleEditWord}
        />
      ) : (
        <div className="game-layout" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="game">
            {manifestError && (
              <div className="game__error">
                <p>Day 정보를 불러오지 못했습니다.</p>
                <p className="game__error-message">{manifestError}</p>
              </div>
            )}

            {wordsError ? (
              <div className="game__error">
                <p>단어를 불러오지 못했습니다.</p>
                <p className="game__error-message">{wordsError}</p>
                <button type="button" onClick={handleRetry} className="game__error-button">
                  재시도
                </button>
              </div>
            ) : (
              <GameView
                score={score}
                accuracy={accuracy}
                wpm={wpm}
                streak={streak}
                maxStreak={maxStreak}
                progress={progress}
                timerEnabled={timerEnabled}
                timeLeft={timeLeft}
                currentIndex={queueIndex}
                totalWords={sessionWords.length}
                onWordCountClick={handleWordCountClick}
                currentWord={currentWord}
                typedValue={typedValue}
                isRunning={isRunning}
                onInputChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPlayAudio={handlePlayAudioClick}
                inputRef={inputRef}
                wordContainerRef={wordContainerRef}
                onNext={handleNext}
                onReset={handleReset}
                isNextDisabled={isNextDisabled}
                isResetDisabled={isResetDisabled}
                onToggleTimer={handleToggleTimer}
                isLoading={isLoadingWords}
                mode={mode}
                onModeChange={handleModeChange}
                dayMeta={dayMeta}
                isReviewMode={isReviewMode}

                  onBackToList={handleBackToWordbook} // 기존 onBack을 onBackToList로 이름 변경
                onPrevious={handlePrevious}          // 새로 만든 '이전' 함수 전달
                 isPreviousDisabled={queueIndex === 0}  // '이전' 버튼 비활성화 조건
                  onStatsClick={handleShowStats}       // '통계' 버튼 클릭 함수 전달


              />
            )}

            <GameModals
              summary={summary}
              onCloseSummary={closeSummary}
              onRestartFromSummary={restartFromSummary}
              showCompletionModal={showCompletionModal}
              currentStat={currentStat}
              onCloseCompletion={handleCloseCompletion}
              onBeginReview={beginReview}
              onRetryFromCompletion={handleRetryFromCompletion}
              showReviewChoiceModal={showReviewChoiceModal}
              onFinalizeReview={finalizeReview}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Game