import { FC } from "react"

type StatsPanelProps = {
  currentIndex: number
  totalWords: number
  progress: number
  onWordCountClick: () => void
}

const StatsPanel: FC<StatsPanelProps> = ({
  currentIndex,
  totalWords,
  progress,
  onWordCountClick,
}) => {
  return (
    <div className="stats-panel">
      <div className="stats-panel__header">
        {/* 단어 카운트 표시 - 클릭 가능 */}
        <button 
          className="stats-panel__word-count"
          onClick={onWordCountClick}
          title="클릭하여 전체 단어 목록 보기"
        >
          <span className="stats-panel__word-count-current">{currentIndex + 1}</span>
          <span className="stats-panel__word-count-separator">/</span>
          <span className="stats-panel__word-count-total">{totalWords}</span>
          <span className="stats-panel__word-count-label">단어</span>
        </button>
      </div>

      {/* 프로그레스 바 */}
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