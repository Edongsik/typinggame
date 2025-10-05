import { FC, useState } from "react" // useState를 import 합니다.

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
  // 추가: 통계 패널의 표시 여부를 관리하는 state (기본값은 false로 숨김)
  const [isVisible, setIsVisible] = useState(false)

  // 토글 버튼 클릭 핸들러
  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className="stats-panel">
      {/* 추가: 통계 보기/숨기기 토글 버튼 */}
      <div className="stats-panel__header">
        <button onClick={toggleVisibility} className="stats-panel__toggle-button">
          {isVisible ? "통계 숨기기" : "통계 보기"}
        </button>
        {timerEnabled && <div className="stats-panel__timer">남은 시간: {timeLeft}초</div>}
      </div>

      {/* isVisible 상태에 따라 조건부 렌더링 */}
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

      {/* 진행률 표시줄은 항상 보이도록 유지 */}
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