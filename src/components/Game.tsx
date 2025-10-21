// components/Game.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import GameModals from "./GameModals"
import GameView from "./GameView"
import Wordbook from "./Wordbook"
import AddWord from "./AddWord"
import WordListPage from "./WordListPage"
import Statistics from "./Statistics"
import { loadDays, loadManifest, type PracticeWord } from "../lib/csv"
import { getCompletedWords } from "../lib/completedWords"
import { getStat, resetDay, setLastIndex } from "../lib/progress"
import { updateCustomWord } from "../lib/customWords"
import { useReview } from "../hooks/useReview"
import { useWordInput } from "../hooks/useWordInput"
import { useGameLogic } from "../hooks/useGameLogic"
import { useModalState } from "../hooks/useModalState"
import { useViewNavigation } from "../hooks/useViewNavigation"
import { useSpeech } from "../hooks/useSpeech"
import type { DayMeta, PracticeMode, Word as AddWordType } from "../types"
import { getPendingTarget, clearPendingTarget } from "../lib/pendingTarget"
import { getLastWord, setLastWord } from "../lib/lastPosition"

function calculateWpm(correct: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  if (minutes === 0) return 0
  return (correct / 5) / minutes
}

const Game = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const wordContainerRef = useRef<HTMLHeadingElement>(null)
  
  const { speak, cancel } = useSpeech()
  
  const [manifest, setManifest] = useState<DayMeta[]>([])
  const [isManifestLoading, setIsManifestLoading] = useState(true)
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [mode, setMode] = useState<PracticeMode>("sequence")
  const [baseWords, setBaseWords] = useState<PracticeWord[]>([])
  const [sessionWords, setSessionWords] = useState<PracticeWord[]>([])
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const [wordsError, setWordsError] = useState<string | null>(null)
  const [progressKey, setProgressKey] = useState(0)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const [autoSoundEnabled, setAutoSoundEnabled] = useState(true)
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({})
  const [pendingWord, setPendingWord] = useState<string | null>(null)
  const pendingWordRef = useRef<string | null>(null)
  const resetOnNextEnterRef = useRef(false)
  const [pendingStartIndex, setPendingStartIndex] = useState<number | null>(null)
  
  const initializeDay = useCallback(
    async (dayId: string, selectedMode: PracticeMode, isReviewSession: boolean = false) => {
      setIsReviewMode(isReviewSession)
      setIsLoadingWords(true)
      setWordsError(null)
      
      try {
        const loaded = await loadDays([dayId], selectedMode)
        if (!loaded.length) {
          setBaseWords([])
          setSessionWords([])
          setWordsError("선택한 Day에 단어가 없습니다.")
          setIsLoadingWords(false)
          return
        }
        
        setBaseWords(loaded)
        // 완료 체크된 단어 제외 목록 생성 (게임 입력 화면에서 숨김)
        const completedList = getCompletedWords(dayId)
        const filteredLoaded = completedList.length
          ? loaded.filter(w => !completedList.includes(w.word))
          : loaded
        
        const stat = getStat(dayId)
        let startIndex = 0
        // Determine resume target by explicit pending target (from WordList) or saved lastIndex
        const pending = getPendingTarget()
        const safeLast = Math.max(0, Math.min(stat.lastIndex, Math.max(loaded.length - 1, 0)))
        const lastSavedWord = getLastWord(dayId)
        const lastWord = loaded[safeLast]?.word
        const desiredWord = (pending && pending.dayId === dayId)
          ? pending.word
          : (pendingWordRef.current || lastSavedWord || lastWord || null)
        if (pending && pending.dayId === dayId) {
          pendingWordRef.current = pending.word
          clearPendingTarget()
        }
        if (isReviewSession) {
          const wrongWords = loaded.filter(w => stat.wrongSet.includes(w.word))
          const wrongFiltered = completedList.length
            ? wrongWords.filter(w => !completedList.includes(w.word))
            : wrongWords
          let workingList = wrongFiltered.length === 0 ? filteredLoaded : wrongFiltered

          // Ensure desired target exists in session when resuming or starting at a specific word
          if (desiredWord && !workingList.some(w => w.word === desiredWord)) {
            const targetItem = loaded.find(w => w.word === desiredWord)
            if (targetItem) {
              workingList = [targetItem, ...workingList]
            }
          }
          setSessionWords(workingList)

          if (resetOnNextEnterRef.current) {
            startIndex = 0
            resetOnNextEnterRef.current = false
          } else {
            const last = Math.max(0, stat.lastIndex)
            if (last >= loaded.length) {
              startIndex = 0
            } else {
              if (desiredWord) {
                const idx = workingList.findIndex(w => w.word === desiredWord)
                startIndex = idx >= 0 ? idx : 0
              } else {
                const candidate = workingList.findIndex(w => (w as any).orderIndex >= last)
                startIndex = candidate >= 0 ? candidate : 0
              }
            }
          }
        } else {
          let workingList = filteredLoaded
          if (desiredWord && !workingList.some(w => w.word === desiredWord)) {
            const targetItem = loaded.find(w => w.word === desiredWord)
            if (targetItem) {
              workingList = [targetItem, ...workingList]
            }
          }
          setSessionWords(workingList)
          // resume from lastIndex unless we just completed a session
          if (resetOnNextEnterRef.current) {
            startIndex = 0
            resetOnNextEnterRef.current = false
          } else {
            const last = Math.max(0, stat.lastIndex)
            if (last >= loaded.length) {
              startIndex = 0
            } else if (desiredWord) {
              const idx = workingList.findIndex(w => w.word === desiredWord)
              startIndex = idx >= 0 ? idx : 0
            } else {
              const candidate = workingList.findIndex(w => (w as any).orderIndex >= last)
              startIndex = candidate >= 0 ? candidate : 0
            }
          }
        }

        // defer applying starting index until words are set
        setPendingStartIndex(startIndex)
        setAutoStartPending(true)
      } catch (error) {
        setWordsError(error instanceof Error ? error.message : "단어를 불러오지 못했습니다.")
      } finally {
        setIsLoadingWords(false)
      }
    },
    []
  )
  
  const modalState = useModalState()
  const viewNav = useViewNavigation(initializeDay)
  const gameLogic = useGameLogic(
    sessionWords,
    viewNav.selectedDayId,
    isReviewMode,
    mode,
    baseWords
  )
  
  // Apply pending start index once sessionWords are ready
  useEffect(() => {
    if (pendingStartIndex != null && sessionWords.length > 0) {
      gameLogic.setQueueIndex(Math.max(0, Math.min(pendingStartIndex, sessionWords.length - 1)))
      gameLogic.resetScoreboard()
      setPendingStartIndex(null)
    }
  }, [pendingStartIndex, sessionWords.length, gameLogic])

  // Persist current position to resume exactly on the same word
  useEffect(() => {
    if (!viewNav.selectedDayId) return
    const current = sessionWords[gameLogic.queueIndex]
    if (!current) return
    setLastIndex(viewNav.selectedDayId, current.orderIndex)
    setLastWord(viewNav.selectedDayId, current.word)
  }, [gameLogic.queueIndex, viewNav.selectedDayId, sessionWords])
  
  // 🔥 새로운 Day를 선택할 때마다 queueIndex와 점수 초기화
  // initializeDay sets start index and resets scoreboard
  
  const dayMeta = useMemo(
    () => manifest.find(d => d.id === viewNav.selectedDayId) ?? null,
    [manifest, viewNav.selectedDayId]
  )
  
  const refreshStat = useCallback((dayId: string) => {
    if (!dayId) return
    setProgressKey(prev => prev + 1)
  }, [])
  
  const { beginReview, finalizeReview } = useReview({
    selectedDayId: viewNav.selectedDayId,
    baseWords,
    resetScoreboard: gameLogic.resetScoreboard,
    refreshStat,
    initializeDay,
    mode,
    setIsReviewMode,
    setSessionWords,
    setQueueIndex: gameLogic.setQueueIndex,
    setAutoStartPending,
    setShowCompletionModal: modalState.openCompletionModal,
    setShowReviewChoiceModal: modalState.openReviewChoiceModal,
  })
  
  const restartFromSummary = useCallback(() => {
    modalState.closeSummary()
    gameLogic.handleStart()
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [modalState, gameLogic])
  
  const accuracy = useMemo(() => {
    if (gameLogic.totalInputs === 0) return 0
    return Math.round((gameLogic.correctInputs / gameLogic.totalInputs) * 100)
  }, [gameLogic.correctInputs, gameLogic.totalInputs])
  
  const wpm = useMemo(
    () => calculateWpm(gameLogic.correctInputs, gameLogic.elapsedMs),
    [gameLogic.correctInputs, gameLogic.elapsedMs]
  )
  
  const progress = useMemo(() => {
    if (sessionWords.length === 0) return 0
    return Math.round(((gameLogic.queueIndex + 1) / sessionWords.length) * 100)
  }, [gameLogic.queueIndex, sessionWords.length])
  
  const isNextDisabled = gameLogic.queueIndex >= sessionWords.length - 1
  const isResetDisabled = !viewNav.selectedDayId
  
  const handleSessionComplete = useCallback(() => {
    const result = gameLogic.handleSessionComplete(refreshStat)
    
    if (result?.type === 'review' || result?.type === 'completion') {
      setTimeout(() => modalState.openCompletionModal(), 100)
    }
    
    // Next entry should start from first word (post-completion)
    resetOnNextEnterRef.current = true

    setIsReviewMode(false)
  }, [gameLogic, refreshStat, modalState])
  
  const handleCorrectWordCallback = useCallback(() => {
    const result = gameLogic.handleCorrectWord(refreshStat)
    
    if (result?.isComplete) {
      setTimeout(() => {
        handleSessionComplete()
      }, 1300)
    }
  }, [gameLogic, refreshStat, handleSessionComplete])
  
  const handleIncorrectAttemptCallback = useCallback(() => {
    gameLogic.handleIncorrectAttempt(refreshStat)
  }, [gameLogic, refreshStat])
  
  const { 
    typedValue, 
    handleInputChange, 
    handleKeyDown
  } = useWordInput(
    sessionWords,
    gameLogic.queueIndex,
    viewNav.selectedDayId,
    gameLogic.isRunning,
    gameLogic.autoAdvanceRef,
    handleCorrectWordCallback,
    handleIncorrectAttemptCallback,
    gameLogic.clearAutoAdvance,
    speak
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
        setManifestError(error instanceof Error ? error.message : "Day 정보를 불러오지 못했습니다.")
      })
      .finally(() => {
        if (!cancelled) setIsManifestLoading(false)
      })
    return () => { cancelled = true }
  }, [])
  
  useEffect(() => {
    if (manifest.length === 0) return
    
    async function loadAllWordCounts() {
      const counts: Record<string, number> = {}
      const completedMap: Record<string, number> = {}
      for (const day of manifest) {
        try {
          const words = await loadDays([day.id], 'sequence')
          const completed = getCompletedWords(day.id)
          counts[day.id] = words.length
          completedMap[day.id] = completed.length
        } catch {
          counts[day.id] = day.total
          completedMap[day.id] = 0
        }
      }
      setWordCounts(counts)
      setCompletedCounts(completedMap)
    }
    
    loadAllWordCounts()
  }, [manifest])
  
  useEffect(() => {
    if (
      autoStartPending &&
      !isLoadingWords &&
      wordsError == null &&
      sessionWords.length > 0 &&
      !modalState.summary &&
      !modalState.showCompletionModal &&
      !modalState.showReviewChoiceModal
    ) {
      gameLogic.handleStart()
      setAutoStartPending(false)
      
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [
    autoStartPending,
    gameLogic,
    isLoadingWords,
    sessionWords.length,
    modalState.showCompletionModal,
    modalState.showReviewChoiceModal,
    modalState.summary,
    wordsError,
  ])
  
  useEffect(() => {
    if (
      gameLogic.isRunning && 
      sessionWords.length > 0 && 
      autoSoundEnabled &&
      !modalState.showCompletionModal &&
      !modalState.showReviewChoiceModal &&
      !modalState.summary &&
      !isLoadingWords
    ) {
      const current = sessionWords[gameLogic.queueIndex]
      if (!current) return
      
      cancel()
      
      const soundTimer = setTimeout(() => {
        if (gameLogic.isRunning && !modalState.showCompletionModal && !modalState.showReviewChoiceModal && !modalState.summary) {
          speak(current.word)
        }
      }, 400)

      return () => {
        clearTimeout(soundTimer)
        cancel()
      }
    }
  }, [gameLogic.queueIndex, gameLogic.isRunning, sessionWords, autoSoundEnabled, modalState, isLoadingWords, speak, cancel])
  
  const handlePlayAudioClick = useCallback(() => {
    const current = sessionWords[gameLogic.queueIndex]
    if (!current) return
    speak(current.word)
  }, [gameLogic.queueIndex, sessionWords, speak])
  
  const handleToggleAutoSound = useCallback(() => {
    setAutoSoundEnabled(prev => !prev)
  }, [])
  
  const handleNext = useCallback(() => {
    const isComplete = gameLogic.handleNext()
    if (isComplete) {
      if (!isReviewMode && mode === "sequence") {
        handleSessionComplete()
      }
    }
  }, [gameLogic, handleSessionComplete, isReviewMode, mode])
  
  const handleRetry = useCallback(() => {
    if (!viewNav.selectedDayId) return
    void initializeDay(viewNav.selectedDayId, mode, isReviewMode)
  }, [initializeDay, mode, viewNav.selectedDayId, isReviewMode])
  
  const handleRetryFromCompletion = useCallback(() => {
    if (!viewNav.selectedDayId) return
    
    cancel()
    
    modalState.closeCompletionModal()
    gameLogic.setQueueIndex(0)
    gameLogic.resetScoreboard()
    
    setTimeout(() => {
      gameLogic.handleStart()
      
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }, 300)
  }, [viewNav.selectedDayId, gameLogic, modalState, cancel])
  
  const handleCloseCompletion = useCallback(() => {
    modalState.closeCompletionModal()
    viewNav.handleBackToWordbook()
  }, [modalState, viewNav])
  
  const handleReset = useCallback(() => {
    if (!viewNav.selectedDayId) return
    
    const confirmed = window.confirm(
      "현재 Day의 학습 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
    )
    
    if (confirmed) {
      resetDay(viewNav.selectedDayId)
      refreshStat(viewNav.selectedDayId)
      void initializeDay(viewNav.selectedDayId, mode, false)
    }
  }, [viewNav.selectedDayId, refreshStat, initializeDay, mode])
  
  const handleJumpToWord = useCallback(
    (index: number) => {
      const target = baseWords[index]
      if (target) {
        const mapped = sessionWords.findIndex(w => w.word === target.word)
        const nextIndex = mapped >= 0 ? mapped : 0
        gameLogic.setQueueIndex(nextIndex)
      } else {
        gameLogic.setQueueIndex(0)
      }
      viewNav.handleBackFromWordList(mode, isReviewMode)
      
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    },
    [baseWords, sessionWords, gameLogic, viewNav, mode, isReviewMode]
  )
  
  const handleEditWord = useCallback(
    (word: AddWordType) => {
      if (!viewNav.selectedDayId) return
      updateCustomWord(viewNav.selectedDayId, word.word, word)
      void initializeDay(viewNav.selectedDayId, mode, isReviewMode)
    },
    [viewNav.selectedDayId, initializeDay, mode, isReviewMode]
  )
  
  // 🔥 전체 단어집용 편집 핸들러 (dayId 자동 선택)
  const handleEditWordForAllWords = useCallback(
    (word: AddWordType) => {
      // word.dayId를 사용하여 어떤 Day의 단어인지 알 수 있음
      if (!word.dayId) return
      updateCustomWord(word.dayId, word.word, word)
      // 전체 단어집에서는 initializeDay 호출하지 않음
    },
    []
  )

  // 전체 단어 목록에서 특정 단어로 시작: 완료 단어 제외 세션에서의 실제 인덱스로 매핑
  const handleStartGameAtWordMapped = useCallback(
    async (dayId: string, wordIndex: number) => {
      try {
        const words = await loadDays([dayId], 'sequence')
        const target = words[wordIndex]?.word
        if (target) {
          setPendingWord(target)
          pendingWordRef.current = target
        }
      } catch {}
      // Day 선택 후 게임 화면으로 이동 (initializeDay가 세션을 준비)
      viewNav.handleDaySelect(dayId, "sequence")
    },
    [viewNav]
  )

  // 세션 로드 후 보류된 단어를 실제 인덱스로 이동
  useEffect(() => {
    if (pendingWord && sessionWords.length > 0) {
      const idx = sessionWords.findIndex(w => w.word === pendingWord)
      if (idx >= 0) {
        gameLogic.setQueueIndex(idx)
      }
      setPendingWord(null)
      pendingWordRef.current = null
    }
  }, [pendingWord, sessionWords, gameLogic])

  // 🔥 전체 단어집에서 특정 단어로 게임 시작
  const handleStartGameAtWord = useCallback(
    async (dayId: string, wordIndex: number) => {
      // Day 선택하고 게임 시작
      viewNav.handleDaySelect(dayId, "sequence")
      
      // 게임이 초기화된 후 해당 단어로 이동
      setTimeout(() => {
        gameLogic.setQueueIndex(wordIndex)
      }, 1000)
    },
    [viewNav, gameLogic]
  )
  
  return (
    <div className="game-container">
      {isManifestLoading ? (
        <div className="game__loading">
          <p>단어집을 불러오는 중...</p>
        </div>
      ) : viewNav.view === "wordbook" ? (
        <Wordbook
          days={manifest}
          wordCounts={wordCounts}
          completedCounts={completedCounts}
          onDaySelect={viewNav.handleDaySelect}
          onAddWord={viewNav.handleAddWord}
          onShowStats={viewNav.handleShowStats}
          onShowAllWords={viewNav.handleShowAllWords}
        />
      ) : viewNav.view === "stats" ? (
        <Statistics 
          days={manifest} 
          wordCounts={wordCounts}
          onBack={viewNav.handleBackFromStats}
        />
      ) : viewNav.view === "allwords" ? (
        <WordListPage
          headerType="standalone"
          days={manifest}
          initialDayId={manifest[0]?.id}
          onBackToWordbook={viewNav.handleBackFromAllWords}
          onJumpTo={() => {}}
          onEdit={handleEditWordForAllWords}
          onStartGameAtWord={handleStartGameAtWordMapped}
        />
      ) : viewNav.view === "addword" ? (
        <AddWord
          dayId={viewNav.addWordDayId || ""}
          dayLabel={manifest.find(d => d.id === viewNav.addWordDayId)?.label || ""}
          onBack={viewNav.handleBackFromAddWord}
          onWordAdded={viewNav.handleWordAdded}
        />
      ) : viewNav.view === "wordlist" ? (
        <WordListPage
          headerType="game"
          words={baseWords}
          currentIndex={gameLogic.queueIndex}
          dayLabel={dayMeta?.label || "단어 목록"}
          dayId={viewNav.selectedDayId || ""}
          onBack={() => viewNav.handleBackFromWordList(mode, isReviewMode)}
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
                score={gameLogic.score}
                accuracy={accuracy}
                wpm={wpm}
                streak={gameLogic.streak}
                maxStreak={gameLogic.maxStreak}
                progress={progress}
                timerEnabled={gameLogic.timerEnabled}
                timeLeft={gameLogic.timeLeft}
                currentIndex={gameLogic.queueIndex}
                totalWords={sessionWords.length}
                onWordCountClick={viewNav.handleWordCountClick}
                currentWord={gameLogic.currentWord}
                typedValue={typedValue}
                isRunning={gameLogic.isRunning}
                onInputChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPlayAudio={handlePlayAudioClick}
                inputRef={inputRef}
                wordContainerRef={wordContainerRef}
                onNext={handleNext}
                onReset={handleReset}
                isNextDisabled={isNextDisabled}
                isResetDisabled={isResetDisabled}
                onToggleTimer={gameLogic.handleToggleTimer}
                isLoading={isLoadingWords}
                mode={mode}
                onModeChange={setMode}
                dayMeta={dayMeta}
                isReviewMode={isReviewMode}
                onBackToList={viewNav.handleBackToWordbook}
                onPrevious={gameLogic.handlePrevious}
                isPreviousDisabled={gameLogic.queueIndex === 0}
                onStatsClick={viewNav.handleShowStats}
                autoSoundEnabled={autoSoundEnabled}
                onToggleAutoSound={handleToggleAutoSound}
              />
            )}

            <GameModals
              summary={modalState.summary}
              onCloseSummary={modalState.closeSummary}
              onRestartFromSummary={restartFromSummary}
              showCompletionModal={modalState.showCompletionModal}
              currentStat={gameLogic.currentStat}
              onCloseCompletion={handleCloseCompletion}
              onBeginReview={beginReview}
              onRetryFromCompletion={handleRetryFromCompletion}
              showReviewChoiceModal={modalState.showReviewChoiceModal}
              onFinalizeReview={finalizeReview}
              onOpenWordList={viewNav.handleWordCountClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
