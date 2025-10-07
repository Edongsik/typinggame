import { FC, RefObject } from "react";
import GameCard from "./GameCard";
import Controls from "./Controls"; // 이제 Controls 하나만 사용합니다.
import type { PracticeWord } from "../lib/csv";
import type { DayMeta, PracticeMode } from "../types";

// Controls와 GameCard에 필요한 모든 props를 한 번에 정의합니다.
type GameViewProps = {
  // Stats & Progress
  currentIndex: number;
  totalWords: number;
  progress: number;
  onWordCountClick: () => void;
  timerEnabled: boolean;
  timeLeft: number;
  
  // Card
  currentWord: PracticeWord | null;
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
  onReset: () => void; // ⭐ 추가
  isResetDisabled: boolean; // ⭐ 추가
  onToggleTimer: () => void;
  isLoading: boolean;
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  dayMeta: DayMeta | null;
  onStatsClick: () => void;
};

const GameView: FC<GameViewProps> = (props) => {
  return (
    <>
      {/* 1. 모든 기능이 통합된 Controls 컴포넌트 */}
      <Controls
        {...props} // 필요한 모든 props를 한 번에 전달합니다.
      />

      {/* 2. 타이머 (이전과 동일) */}
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