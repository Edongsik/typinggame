import type { FC } from "react"

type ControlsProps = {
  onNext: () => void
  onReset: () => void
  isNextDisabled: boolean
  isResetDisabled: boolean
  timerEnabled: boolean
  onToggleTimer: () => void
  isLoading: boolean
}

const Controls: FC<ControlsProps> = ({
  onNext,
  onReset,
  isNextDisabled,
  isResetDisabled,
  timerEnabled,
  onToggleTimer,
  isLoading,
}) => {
  return (
    <section className="controls">
      <div className="controls__actions">
        <button type="button" onClick={onNext} disabled={isNextDisabled} className="controls__button">
          다음단어
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isResetDisabled}
          className="controls__button controls__button--reset"
        >
          리셋
        </button>
      </div>
      <div className="controls__options">
        <label className="controls__toggle">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={onToggleTimer}
            disabled={isLoading}
          />
          <span>60초제한</span>
        </label>
      </div>
    </section>
  )
}

export default Controls
