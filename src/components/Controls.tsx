import type { FC } from "react"
import type { DayMeta, PracticeMode } from "../types" // types에서 DayMeta, PracticeMode import

// Props 타입 정의를 확장합니다.
type ControlsProps = {
  onNext: () => void
  onReset: () => void
  isNextDisabled: boolean
  isResetDisabled: boolean
  timerEnabled: boolean
  onToggleTimer: () => void
  isLoading: boolean
  
  // ▼▼▼ 아래 props들을 추가합니다 ▼▼▼
  mode: PracticeMode
  onModeChange: (mode: PracticeMode) => void
  dayMeta: DayMeta | null
  isReviewMode: boolean
}

const Controls: FC<ControlsProps> = ({
  onNext,
  onReset,
  isNextDisabled,
  isResetDisabled,
  timerEnabled,
  onToggleTimer,
  isLoading,
  // ▼▼▼ props를 받습니다 ▼▼▼
  mode,
  onModeChange,
  dayMeta,
  isReviewMode,
}) => {
  return (
    <div className="controls">
      {/* 순서/랜덤 버튼 */}
      <div className="mode-toggle" role="group" aria-label="출제 모드">
        <button
          type="button"
          className={`mode-toggle__button${mode === "sequence" ? " mode-toggle__button--active" : ""}`}
          onClick={() => onModeChange("sequence")}
          disabled={isLoading}
        >
          순서
        </button>
        <button
          type="button"
          className={`mode-toggle__button${mode === "random" ? " mode-toggle__button--active" : ""}`}
          onClick={() => onModeChange("random")}
          disabled={isLoading}
        >
          랜덤
        </button>
      </div>

      {/* 중앙 컨트롤 버튼들 */}
      <div className="controls__main">
        <button type="button" onClick={onReset} disabled={isResetDisabled} className="controls__button">
          {isLoading ? "로딩중..." : "리셋"}
        </button>
        <button type="button" onClick={onNext} disabled={isNextDisabled} className="controls__button controls__button--primary">
          다음 단어
        </button>
        <button type="button" onClick={onToggleTimer} className={`controls__button ${timerEnabled ? 'controls__button--timer-on' : ''}`}>
          {timerEnabled ? "타이머 끄기" : "타이머 켜기"}
        </button>
      </div>

      {/* Day 정보 및 복습 모드 배지 */}
      <div className="controls__meta">
        {isReviewMode && <span className="mode-toggle__badge">복습 모드</span>}
        {dayMeta && (
          <span className="mode-toggle__meta">{dayMeta.label}</span>
        )}
      </div>
    </div>
  )
}

export default Controls