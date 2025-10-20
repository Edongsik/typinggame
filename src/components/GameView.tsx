import { FC, RefObject } from "react";
import GameCard from "./GameCard";
import Controls from "./Controls";
import type { DayMeta, PracticeMode } from "../types";

type GameViewProps = {
  // Stats & Progress
  currentIndex: number;
  totalWords: number;
  progress: number;
  onWordCountClick: () => void;
  timerEnabled: boolean;
  timeLeft: number;
  score?: number;
  accuracy?: number;
  wpm?: number;
  streak?: number;
  maxStreak?: number;
  
  // Card
  currentWord: any | null;
  typedValue: string;
  isRunning: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPlayAudio: () => void;
  inputRef: RefObject<HTMLInputElement>;
  wordContainerRef: RefObject<HTMLHeadingElement>;
  
  // Controls
  onBackToList: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  onReset: () => void;
  isResetDisabled: boolean;
  onToggleTimer: () => void;
  isLoading: boolean;
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  dayMeta: DayMeta | null;
  onStatsClick: () => void;
  isReviewMode?: boolean;
  autoSoundEnabled?: boolean;
  onToggleAutoSound?: () => void;
};

const GameView: FC<GameViewProps> = (props) => {
  return (
    <>
      {/* 1. Controls 컴포넌트 */}
      <Controls
        onBackToList={props.onBackToList}
        onPrevious={props.onPrevious}
        onNext={props.onNext}
        isPreviousDisabled={props.isPreviousDisabled}
        isNextDisabled={props.isNextDisabled}
        onReset={props.onReset}
        isResetDisabled={props.isResetDisabled}
        mode={props.mode}
        onModeChange={props.onModeChange}
        dayMeta={props.dayMeta}
        isLoading={props.isLoading}
        onToggleTimer={props.onToggleTimer}
        timerEnabled={props.timerEnabled}
        onStatsClick={props.onStatsClick}
        onWordCountClick={props.onWordCountClick}
        currentIndex={props.currentIndex}
        totalWords={props.totalWords}
        progress={props.progress}
        autoSoundEnabled={props.autoSoundEnabled}
        onToggleAutoSound={props.onToggleAutoSound}
      />

      {/* 2. 타이머 */}
      {props.timerEnabled && (
        <div style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: '700',
          color: props.timeLeft <= 10 ? '#ef4444' : '#3b82f6',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: props.timeLeft <= 10 ? '#fee2e2' : '#dbeafe',
          borderRadius: '12px',
        }}>
          ⏱️ {props.timeLeft}초
        </div>
      )}
      
      {/* 3. 게임 카드 */}
      <GameCard
        currentWord={props.currentWord}
        typedValue={props.typedValue}
        isRunning={props.isRunning}
        onInputChange={props.onInputChange}
        onKeyDown={props.onKeyDown}
        onPlayAudio={props.onPlayAudio}
        inputRef={props.inputRef}
        wordContainerRef={props.wordContainerRef}
      />
    </>
  );
};

export default GameView;