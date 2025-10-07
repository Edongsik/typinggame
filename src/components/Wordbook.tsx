// Wordbook.tsx 수정

import type { FC } from "react"
import { getStat } from "../lib/progress"
import type { DayMeta } from "../types"

const todayKey = () => new Date().toISOString().slice(0, 10)

type WordbookProps = {
  days: DayMeta[]
  wordCounts: Record<string, number>  // ⭐ 추가
  onSelect: (dayId: string) => void
  onAddWord: (dayId: string) => void
}

const Wordbook: FC<WordbookProps> = ({ days, wordCounts, onSelect, onAddWord }) => {
  const today = todayKey()

  return (
    <div className="wordbook">
      <h2 className="wordbook__title">단어집</h2>
      <ul className="wordbook__list">
        {days.map((day) => {
          const stat = getStat(day.id)
          const completedToday = stat.completedDates.includes(today)
          const totalWords = wordCounts[day.id] || day.total
          const progressCurrent = Math.min(stat.lastIndex, totalWords)
          const progressLabel = `${progressCurrent}/${totalWords}`
          const progressPercent = totalWords > 0 ? (progressCurrent / totalWords) * 100 : 0

          return (
            <li key={day.id} className="day-card">
              <div className="day-card__content">
                <button
                  type="button"
                  className="day-card__button"
                  onClick={() => onSelect(day.id)}
                >
                  <div className="day-card__header">
                    <span className="day-card__label">{day.label}</span>
                    {completedToday && <span className="day-card__badge" aria-label="오늘 완료">✅</span>}
                  </div>
                  <div className="day-card__description">
                    {day.description}
                    {stat.reviewCount > 0 && (
                      <span style={{ 
                        display: 'block', 
                        marginTop: '0.25rem', 
                        color: '#3b82f6',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        🔄 복습 {stat.reviewCount}회
                      </span>
                    )}
                  </div>
                  <div className="day-card__progress-bar">
                    <div 
                      className="day-card__progress-fill" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="day-card__progress-label">{progressLabel}</div>
                </button>
                
                <button
                  type="button"
                  className="day-card__add-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddWord(day.id)
                  }}
                  title="단어 추가"
                >
                  ➕ 단어 추가
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Wordbook