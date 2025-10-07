import type { FC } from "react";
import clsx from "clsx";
import type { DayMeta, PracticeMode } from "../types";

type ControlsProps = {
  onBackToList: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  onReset: () => void; // ⭐ 추가
  isResetDisabled: boolean; // ⭐ 추가
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  dayMeta: DayMeta | null;
  isLoading: boolean;
  onToggleTimer: () => void;
  timerEnabled: boolean;
  onStatsClick: () => void;
  onWordCountClick: () => void;
  currentIndex: number;
  totalWords: number;
  progress: number;
};

const Controls: FC<ControlsProps> = (props) => {
  return (
    <>
      <button className="back-to-list-btn" onClick={props.onBackToList}>
        ← 단어집으로 돌아가기
      </button>
      <div className="controls-panel">
        <div className="controls-panel__header">
          {props.dayMeta && <h3>{props.dayMeta.label}</h3>}
        </div>
        <div className="controls-panel__main">
          <button 
            className={clsx("btn", { "btn--active": props.mode === 'sequence' })}
            onClick={() => props.onModeChange('sequence')}
            disabled={props.isLoading}
          >
            순서
          </button>
          <button 
            className={clsx("btn", { "btn--active": props.mode === 'random' })}
            onClick={() => props.onModeChange('random')}
            disabled={props.isLoading}
          >
            랜덤
          </button>
          <button 
            className="btn btn--primary" 
            onClick={props.onPrevious} 
            disabled={props.isPreviousDisabled}
          >
            이전
          </button>
          <button 
            className="btn btn--primary" 
            onClick={props.onNext} 
            disabled={props.isNextDisabled}
          >
            다음
          </button>
          <button 
            className={clsx("btn btn--icon", { "btn--active": props.timerEnabled })}
            onClick={props.onToggleTimer}
            title={props.timerEnabled ? "타이머 끄기" : "타이머 켜기"}
          >
            ⏱️
          </button>

          {/* ▼▼▼ '초기화' 버튼을 여기에 추가합니다 ▼▼▼ */}
          <button 
            className="btn btn--reset"
            onClick={props.onReset}
            disabled={props.isResetDisabled}
            title="학습 기록 초기화"
          >
            🔄
          </button>

          <button className="btn btn--special" onClick={props.onStatsClick}>
            통계
          </button>
        </div>
        <div className="controls-panel__footer">
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${props.progress}%` }} />
          </div>
          <button 
            className="word-count-badge" 
            onClick={props.onWordCountClick}
            title="전체 단어 목록 보기"
          >
            {props.currentIndex + 1} / {props.totalWords} 단어
          </button>
        </div>
      </div>
    </>
  );
};

export default Controls;