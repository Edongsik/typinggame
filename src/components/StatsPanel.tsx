import type { FC } from "react"

type StatsPanelProps = {
  score: number
  accuracy: number
  wpm: number
  streak: number
  maxStreak: number
  progress: number
  timerEnabled: boolean
  timeLeft: number
}

const formatNumber = (value: number) => Math.round(value * 10) / 10

const StatsPanel: FC<StatsPanelProps> = ({
  score,
  accuracy,
  wpm,
  streak,
  maxStreak,
  progress,
  timerEnabled,
  timeLeft,
}) => {
  return (
    <section className="stats" aria-live="polite">
      <div className="stats__grid">
        <div className="stats__item">
          <span className="stats__label">점수</span>
          <span className="stats__value">{score}</span>
        </div>
        <div className="stats__item">
          <span className="stats__label">정확도</span>
          <span className="stats__value">{formatNumber(isFinite(accuracy) ? accuracy : 0)}%</span>
        </div>
        <div className="stats__item">
          <span className="stats__label">WPM</span>
          <span className="stats__value">{formatNumber(isFinite(wpm) ? wpm : 0)}</span>
        </div>
        <div className="stats__item">
          <span className="stats__label">연속 성공</span>
          <span className="stats__value">{streak}</span>
        </div>
        <div className="stats__item">
          <span className="stats__label">최대 스테이크</span>
          <span className="stats__value">{maxStreak}</span>
        </div>
        {timerEnabled && (
          <div className="stats__item">
            <span className="stats__label">남은 시간</span>
            <span className="stats__value">{timeLeft}s</span>
          </div>
        )}
      </div>
      <div className="stats__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, Math.round(progress)))}>
        <div
          className="stats__progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </section>
  )
}

export default StatsPanel

