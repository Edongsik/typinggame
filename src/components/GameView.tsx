import { FC, RefObject } from "react"
import StatsPanel from "./StatsPanel"
import GameCard from "./GameCard"
import Controls from "./Controls"
import type { PracticeWord } from "../lib/csv"
import type { DayMeta, PracticeMode } from "../types"

type GameViewProps = {
  // Stats
  score: number
  accuracy: number
  wpm: number
  streak: number
  maxStreak: number
  progress: number
  timerEnabled: boolean
  timeLeft: number
  currentIndex: number
  totalWords: number
  onWordCountClick: () => void
  
  // Card
  currentWord: PracticeWord | null
  typedValue: string
  isRunning: boolean
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onPlayAudio: () => void
  inputRef: RefObject<HTMLInputElement>
  wordContainerRef: RefObject<HTMLHeadingElement>
  
  // Controls
  onNext: () => void
  onReset: () => void
  isNextDisabled: boolean
  isResetDisabled: boolean
  onToggleTimer: () => void
  isLoading: boolean
  mode: PracticeMode
  onModeChange: (mode: PracticeMode) => void
  dayMeta: DayMeta | null
  isReviewMode: boolean
}

const GameView: FC<GameViewProps> = ({
  score,
  accuracy,
  wpm,
  streak,
  maxStreak,
  progress,
  timerEnabled,
  timeLeft,
  currentIndex,
  totalWords,
  onWordCountClick,
  currentWord,
  typedValue,
  isRunning,
  onInputChange,
  onKeyDown,
  onPlayAudio,
  inputRef,
  wordContainerRef,
  onNext,
  onReset,
  isNextDisabled,
  isResetDisabled,
  onToggleTimer,
  isLoading,
  mode,
  onModeChange,
  dayMeta,
  isReviewMode
}) => {
  return (
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
        currentIndex={currentIndex}
        totalWords={totalWords}
        onWordCountClick={onWordCountClick}
      />
      
      <GameCard
        currentWord={currentWord}
        typedValue={typedValue}
        isRunning={isRunning}
        onInputChange={onInputChange}
        onKeyDown={onKeyDown}
        onPlayAudio={onPlayAudio}
        inputRef={inputRef}
        wordContainerRef={wordContainerRef}
      />
      
      <Controls
        onNext={onNext}
        onReset={onReset}
        isNextDisabled={isNextDisabled}
        isResetDisabled={isResetDisabled}
        timerEnabled={timerEnabled}
        onToggleTimer={onToggleTimer}
        isLoading={isLoading}
        mode={mode}
        onModeChange={onModeChange}
        dayMeta={dayMeta}
        isReviewMode={isReviewMode}
      />
    </>
  )
}

export default GameView