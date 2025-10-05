import type { FC } from "react"
import { getStat } from "../lib/progress"
import type { DayMeta } from "../types"

const todayKey = () => new Date().toISOString().slice(0, 10)

type WordbookProps = {
  days: DayMeta[]
  onSelect: (dayId: string) => void
}

const Wordbook: FC<WordbookProps> = ({ days, onSelect }) => {
  const today = todayKey()

  return (
    <div className="wordbook">
      <h2 className="wordbook__title">단어집</h2>
      <ul className="wordbook__list">
        {days.map((day) => {
          const stat = getStat(day.id)
          const completedToday = stat.completedDates.includes(today)
          const progressCurrent = Math.min(stat.lastIndex, day.total)
          const progressLabel = `${progressCurrent}/${day.total}`
          const progressPercent = day.total > 0 ? (progressCurrent / day.total) * 100 : 0

          return (
            <li key={day.id} className="day-card">
              <button
                type="button"
                className="day-card__button"
                onClick={() => onSelect(day.id)}
              >
                <div className="day-card__header">
                  <span className="day-card__label">{day.label}</span>
                  {completedToday && <span className="day-card__badge" aria-label="오늘 완료">✅</span>}
                </div>
                <div className="day-card__description">{day.description}</div>
                <div className="day-card__progress-bar">
                  <div 
                    className="day-card__progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="day-card__progress-label">{progressLabel}</div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Wordbook