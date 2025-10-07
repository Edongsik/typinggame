import { FC, useState } from "react"

type StatsPanelProps = {
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
}

const StatsPanel: FC<StatsPanelProps> = ({
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
}) => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className="stats-panel">
      <div className="stats-panel__header">
        <button onClick={toggleVisibility} className="stats-panel__toggle-button">
          {isVisible ? "통계 숨기기" : "통계 보기"}
        </button>
        
        {/* 단어 카운트 표시 - 클릭 가능 */}
        <button 
          className="stats-panel__word-count"
          onClick={() => {
            console.log("🟢 StatsPanel 버튼 클릭!")
            console.log("onWordCountClick 타입:", typeof onWordCountClick)
            onWordCountClick()
          }}
          title="클릭하여 전체 단어 목록 보기"
        >
          <span className="stats-panel__word-count-current">{currentIndex + 1}</span>
          <span className="stats-panel__word-count-separator">/</span>
          <span className="stats-panel__word-count-total">{totalWords}</span>
          <span className="stats-panel__word-count-label">단어</span>
        </button>
        
        {timerEnabled && <div className="stats-panel__timer">남은 시간: {timeLeft}초</div>}
      </div>

      {isVisible && (
        <div className="stats-panel__grid">
          <div className="stats-panel__item">
            <span className="stats-panel__label">점수</span>
            <span className="stats-panel__value">{score}</span>
          </div>
          <div className="stats-panel__item">
            <span className="stats-panel__label">정확도</span>
            <span className="stats-panel__value">{Math.round(accuracy)}%</span>
          </div>
          <div className="stats-panel__item">
            <span className="stats-panel__label">WPM</span>
            <span className="stats-panel__value">{Math.round(wpm)}</span>
          </div>
          <div className="stats-panel__item">
            <span className="stats-panel__label">연속 성공</span>
            <span className="stats-panel__value">{streak}</span>
          </div>
          <div className="stats-panel__item">
            <span className="stats-panel__label">최대 스트릭</span>
            <span className="stats-panel__value">{maxStreak}</span>
          </div>
        </div>
      )}

      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

export default StatsPanel