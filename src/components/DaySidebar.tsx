import type { FC } from "react"
import { getStat } from "../lib/progress"
import type { DayMeta } from "../types"

const todayKey = () => new Date().toISOString().slice(0, 10)

type DaySidebarProps = {
  days: DayMeta[]
  selectedDayId: string | null
  onSelect: (dayId: string) => void
  refreshKey: number
}

const DaySidebar: FC<DaySidebarProps> = ({ days, selectedDayId, onSelect, refreshKey: _refreshKey }) => {
  const today = todayKey()

  return (
    <aside className="sidebar" aria-label="Day selection">
      <div className="sidebar__header">
        <h2>Day 루틴</h2>
      </div>
      <ul className="sidebar__list">
        {days.map((day) => {
          const stat = getStat(day.id)
          const completedToday = stat.completedDates.includes(today)
          const progressCurrent = Math.min(stat.lastIndex, day.total)
          const progressLabel = `${progressCurrent}/${day.total}`
          const isSelected = day.id === selectedDayId

          return (
            <li key={day.id} className="sidebar__item">
              <button
                type="button"
                className={`sidebar__button${isSelected ? " sidebar__button--active" : ""}`}
                onClick={() => onSelect(day.id)}
              >
                <div className="sidebar__title-row">
                  <span className="sidebar__label">{day.label}</span>
                  {completedToday && <span className="sidebar__badge" aria-label="오늘 완료">✅</span>}
                </div>
                <div className="sidebar__meta">
                  <span className="sidebar__progress">{progressLabel}</span>
                  {day.description && <span className="sidebar__description">{day.description}</span>}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default DaySidebar
