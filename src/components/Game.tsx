import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Controls from "./Controls"
import StatsPanel from "./StatsPanel"
import TextDisplay from "./TextDisplay"
import DaySidebar from "./DaySidebar"
import { loadDays, loadManifest, type PracticeWord } from "../lib/csv"
import { speak } from "../lib/tts"
import { playPronunciation } from "../lib/pronounce"
import {
  getStat,
  markAnswer,
  markDayCompleted,
  resetDay,
} from "../lib/progress"
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
}

function calculateWpm(correct: number, elapsedMs: number): number {
  if (elapsedMs <= 0) {
    return 0
  }
  const minutes = elapsedMs / 60000
  if (minutes === 0) {
    return 0
  }
  return (correct / 5) / minutes
}

const Game = () => {
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
  const [typedValue, setTypedValue] = useState("")
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
    if (!trimmed) {
      return
    }
    try {
      await speak(trimmed, { lang: "en-US", rate: 0.95, voiceHint: "en" })
    } catch (speechError) {
      try {
        await playPronunciation(trimmed)
      } catch (audioError) {
        console.warn(`발음을 재생하지 못했습니다: ${trimmed}`, speechError, audioError)
      }
    }
  }, [])

  const resetScoreboard = useCallback(() => {
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setCorrectInputs(0)
    setTotalInputs(0)
    setTypedValue("")
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
  }, [clearAutoAdvance, clearElapsedTicker, clearTimedMode])

  const handleStart = useCallback(() => {
    if (isLoadingWords || wordsError || sessionWords.length === 0) {
      return
    }
    clearAutoAdvance()
    clearElapsedTicker()
    setTypedValue("")
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
    async (dayId: string, selectedMode: PracticeMode) => {
      resetScoreboard()
      setIsReviewMode(false)
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
        setBaseWords(loaded)
        setSessionWords(loaded)
        const stat = getStat(dayId)
        setCurrentStat(stat)
        setProgressKey((value) => value + 1)
        const startIndex = selectedMode === "sequence" ? Math.min(stat.lastIndex, Math.max(loaded.length - 1, 0)) : 0
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

  useEffect(() => {
    let cancelled = false
    setIsManifestLoading(true)
    loadManifest()
      .then((days) => {
        if (cancelled) {
          return
        }
        setManifest(days)
        if (!selectedDayId && days.length > 0) {
          setSelectedDayId(days[0].id)
        }
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        const message = error instanceof Error ? error.message : "Day 정보를 불러오지 못했습니다."
        setManifestError(message)
      })
      .finally(() => {
        if (!cancelled) {
          setIsManifestLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedDayId])

  useEffect(() => {
    if (!selectedDayId) {
      return
    }
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

  const handleModeChange = useCallback((next: PracticeMode) => {
    setMode(next)
  }, [])

  const handlePlayAudioClick = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current) {
      return
    }
    pronounceWord(current.word).catch(() => {})
  }, [pronounceWord, queueIndex, sessionWords])

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
    if (!selectedDayId) {
      return
    }
    if (isReviewMode) {
      setShowReviewChoiceModal(true)
      setIsReviewMode(false)
      refreshStat(selectedDayId)
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
    if (sessionWords.length === 0) {
      return
    }
    if (queueIndex + 1 >= sessionWords.length) {
      handleSessionComplete()
      return
    }
    setTypedValue("")
    clearAutoAdvance()
    setQueueIndex(queueIndex + 1)
  }, [clearAutoAdvance, handleSessionComplete, queueIndex, sessionWords.length])

  const handleCorrectWord = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) {
      return
    }
    clearAutoAdvance()
    pronounceWord(current.word).catch(() => {})
    setScore((previous) => previous + 10 + streak * 2)
    setStreak((previous) => {
      const next = previous + 1
      setMaxStreak((maxValue) => Math.max(maxValue, next))
      return next
    })
    const nextProgressIndex = !isReviewMode && mode === "sequence"
      ? Math.min(current.orderIndex + 1, baseWords.length)
      : currentStat.lastIndex
    markAnswer(selectedDayId, current.word, true, nextProgressIndex)
    refreshStat(selectedDayId)
    autoAdvanceRef.current = window.setTimeout(() => {
      if (isRunningRef.current) {
        handleNext()
      }
    }, AUTO_ADVANCE_DELAY_MS)
  }, [
    baseWords.length,
    clearAutoAdvance,
    currentStat.lastIndex,
    handleNext,
    isReviewMode,
    mode,
    pronounceWord,
    queueIndex,
    refreshStat,
    selectedDayId,
    sessionWords,
    streak,
  ])

  const handleIncorrectAttempt = useCallback(() => {
    const current = sessionWords[queueIndex]
    if (!current || !selectedDayId) {
      return
    }
    clearAutoAdvance()
    setStreak(0)
    setTypedValue("")
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

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      const current = sessionWords[queueIndex]
      if (!isRunning || !current) {
        setTypedValue(value)
        return
      }

      const previous = typedValue
      if (value.length > previous.length) {
        const delta = value.slice(previous.length)
        const startIndex = previous.length
        let correctDelta = 0
        for (let index = 0; index < delta.length; index += 1) {
          if (current.word[startIndex + index] === delta[index]) {
            correctDelta += 1
          }
        }
        if (delta.length > 0) {
          setTotalInputs((prev) => prev + delta.length)
        }
        if (correctDelta > 0) {
          setCorrectInputs((prev) => prev + correctDelta)
        }
      }
      setTypedValue(value)

      if (value === current.word && autoAdvanceRef.current == null) {
        handleCorrectWord()
      }
    },
    [
            handleCorrectWord,
      isRunning,
      queueIndex,
      sessionWords,
      typedValue,
    ]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return
      }
      const current = sessionWords[queueIndex]
      if (!current || !selectedDayId) {
        return
      }
      if (!isRunning) {
        return
      }
      event.preventDefault()
      if (typedValue === current.word) {
        if (autoAdvanceRef.current == null) {
          handleCorrectWord()
        }
      } else {
        handleIncorrectAttempt()
      }
    },
    [
            handleCorrectWord,
      handleIncorrectAttempt,
      isRunning,
      queueIndex,
      selectedDayId,
      sessionWords,
      typedValue,
    ]
  )

  const handleRetry = useCallback(() => {
    if (!selectedDayId) {
      return
    }
    void initializeDay(selectedDayId, mode)
  }, [initializeDay, mode, selectedDayId])

  const beginReview = useCallback(() => {
    if (!selectedDayId) {
      setShowCompletionModal(false)
      return
    }
    const stat = getStat(selectedDayId)
    const wrongWords = baseWords.filter((word) => stat.wrongSet.includes(word.word))
    if (wrongWords.length === 0) {
      setShowCompletionModal(false)
      return
    }
    resetScoreboard()
    setIsReviewMode(true)
    setSessionWords(wrongWords)
    setQueueIndex(0)
    setAutoStartPending(true)
    setShowCompletionModal(false)
    refreshStat(selectedDayId)
  }, [baseWords, refreshStat, resetScoreboard, selectedDayId])

  const finalizeReview = useCallback(
    (keepWrongSet: boolean) => {
      if (!selectedDayId) {
        setShowReviewChoiceModal(false)
        return
      }
      resetDay(selectedDayId, { keepWrongSet })
      refreshStat(selectedDayId)
      setShowReviewChoiceModal(false)
      setIsReviewMode(false)
      void initializeDay(selectedDayId, mode)
    },
    [initializeDay, mode, refreshStat, selectedDayId]
  )

  const handleReset = useCallback(() => {
    if (!selectedDayId) {
      return
    }
    resetDay(selectedDayId)
    refreshStat(selectedDayId)
    void initializeDay(selectedDayId, mode)
  }, [initializeDay, mode, refreshStat, selectedDayId])

  const closeSummary = useCallback(() => {
    setSummary(null)
  }, [])

  const restartFromSummary = useCallback(() => {
    closeSummary()
    handleStart()
  }, [closeSummary, handleStart])

  const accuracy = useMemo(() => {
    if (totalInputs === 0) {
      return 0
    }
    return (correctInputs / totalInputs) * 100
  }, [correctInputs, totalInputs])

  const wpm = useMemo(() => calculateWpm(correctInputs, elapsedMs), [correctInputs, elapsedMs])

  const progress = useMemo(() => {
    if (sessionWords.length === 0) {
      return 0
    }
    if (isReviewMode) {
      return (queueIndex / sessionWords.length) * 100
    }
    if (mode === "sequence") {
      return (Math.min(currentStat.lastIndex, sessionWords.length) / sessionWords.length) * 100
    }
    return (queueIndex / sessionWords.length) * 100
  }, [currentStat.lastIndex, isReviewMode, mode, queueIndex, sessionWords.length])

  const currentWord = sessionWords[queueIndex] ?? null
  const dayMeta = manifest.find((day) => day.id === selectedDayId) ?? null

  const isNextDisabled = !isRunning || sessionWords.length === 0
  const isResetDisabled = isLoadingWords

  return (
    <div className="game-layout">
      <DaySidebar
        days={manifest}
        selectedDayId={selectedDayId}
        onSelect={setSelectedDayId}
        refreshKey={progressKey}
      />
      <div className="game">
        <h1 className="game__title">토익 단어 타자 게임</h1>

        <div className="game__status-bar">
          <div className="mode-toggle" role="group" aria-label="출제 모드">
            <button
              type="button"
              className={`mode-toggle__button${mode === "sequence" ? " mode-toggle__button--active" : ""}`}
              onClick={() => handleModeChange("sequence")}
              disabled={isLoadingWords}
            >
              순서
            </button>
            <button
              type="button"
              className={`mode-toggle__button${mode === "random" ? " mode-toggle__button--active" : ""}`}
              onClick={() => handleModeChange("random")}
              disabled={isLoadingWords}
            >
              랜덤
            </button>
          </div>
          {isReviewMode && <span className="mode-toggle__badge">복습 모드</span>}
          {dayMeta && (
            <span className="mode-toggle__meta">{dayMeta.label}</span>
          )}
        </div>

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
          <>
            <StatsPanel
              score={score}
              accuracy={accuracy}
              wpm={wpm}
              streak={streak}
              maxStreak={maxStreak}
              progress={progress}
              timerEnabled={timerEnabled}
              timeLeft={timeLeft}
            />



 <div className="game__card">
              {/* ▼▼▼▼▼▼▼ 아래의 새로운 코드를 적용하세요 ▼▼▼▼▼▼▼ */}
              <div className="game__word">
                {/* 스크린샷 레이아웃에 맞게 순서 및 구조 변경 */}
                <p className="game__meaning">{currentWord?.meaning ?? "뜻"}</p>
                

                {/* 변경점 1: 타이핑 여부에 따라 단어 표시를 다르게 함 */}
            <div className="game__target-word-display">
                  <h2 className="game__target-word--static">
                    {/* 단어를 글자 배열로 변환하여 map으로 처리합니다.
                      각 글자는 <span> 태그로 감싸지고, 타이핑 상태에 따라 다른 클래스를 가집니다.
                    */}
                    {currentWord?.word.split('').map((char, index) => {
                      // 현재 인덱스의 클래스 결정 로직
                      let className = 'char-neutral'; // 기본 상태 (아직 타이핑 안 한 글자)
                      if (index < typedValue.length) {
                        // 사용자가 타이핑한 부분
                        className = typedValue[index] === char ? 'char-correct' : 'char-incorrect';
                      }
                      return (
                        <span key={index} className={className}>
                          {char}
                        </span>
                      );
                    })}
                  </h2>
                  <button
                    type="button"
                    className="game__audio-button"
                    onClick={handlePlayAudioClick}
                    disabled={!currentWord}
                  >
                    🔊<span className="sr-only">발음 듣기</span>
                  </button>
                </div>


                <div className="game__pronunciation">
                  {currentWord?.pronunciation && `[${currentWord.pronunciation}]`}
                </div>
                <div className="game__syllables">
                  {currentWord?.syllables}
                </div>

                {/* 변경점 2: 품사를 배지(badge) 형태로 표시 */}
                {currentWord?.partOfSpeech && (
                  <span className="game__pos-badge">{currentWord.partOfSpeech}</span>
                )}
                
                {/* 변경점 3: 예문과 입력 필드 순서 변경 */}
                <div className="game__example-box">
                  <p className="game__example">{currentWord?.example ?? "-"}</p>
                </div>
                
                <input
                  ref={inputRef}
                  className="game__input"
                  type="text"
                  value={typedValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={!isRunning}
                  placeholder={isRunning ? "여기에 단어를 입력 하세요..." : "단어를 불러오는 중입니다"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </div>
              {/* ▲▲▲▲▲▲▲ 여기까지가 새로운 코드입니다 ▲▲▲▲▲▲▲ */}
            </div>




            <Controls
              onNext={handleNext}
              onReset={handleReset}
              isNextDisabled={isNextDisabled}
              isResetDisabled={isResetDisabled}
              timerEnabled={timerEnabled}
              onToggleTimer={handleToggleTimer}
              isLoading={isLoadingWords}
            />
          </>
        )}

        {summary && (
          <div className="game__overlay">
            <div className="game__summary">
              <h2>결과 요약</h2>
              <p>점수: {summary.score}</p>
              <p>정확도: {Math.round(summary.accuracy)}%</p>
              <p>최대 스테이크: {summary.maxStreak}</p>
              <div className="game__summary-actions">
                <button type="button" onClick={closeSummary} className="game__summary-button">
                  닫기
                </button>
                <button type="button" onClick={restartFromSummary} className="game__summary-button game__summary-button--primary">
                  다시 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {showCompletionModal && (
          <div className="game__overlay">
            <div className="game__summary">
              <h2>오늘의 연습 완료</h2>
              <p>오늘의 연습을 끝냈습니다. 복습하시겠습니까?</p>
              <div className="game__summary-actions">
                <button type="button" onClick={() => setShowCompletionModal(false)} className="game__summary-button">
                  나중에
                </button>
                <button
                  type="button"
                  onClick={beginReview}
                  className="game__summary-button game__summary-button--primary"
                >
                  복습하기
                </button>
              </div>
            </div>
          </div>
        )}

        {showReviewChoiceModal && (
          <div className="game__overlay">
            <div className="game__summary">
              <h2>복습 완료</h2>
              <p>wrongSet을 비울까요, 아니면 유지할까요?</p>
              <div className="game__summary-actions">
                <button
                  type="button"
                  onClick={() => finalizeReview(false)}
                  className="game__summary-button game__summary-button--primary"
                >
                  비우기
                </button>
                <button
                  type="button"
                  onClick={() => finalizeReview(true)}
                  className="game__summary-button"
                >
                  유지하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Game
