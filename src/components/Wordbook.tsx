import type { FC } from "react"
import { useState, useEffect } from "react"
import { getStat } from "../lib/progress"
import { loadDays } from "../lib/csv"
import type { DayMeta } from "../types"

const todayKey = () => new Date().toISOString().slice(0, 10)

type WordbookProps = {
  days: DayMeta[]
  onSelect: (dayId: string) => void
  onAddWord: (dayId: string) => void
}

const Wordbook: FC<WordbookProps> = ({ days, onSelect, onAddWord }) => {
  const today = todayKey()
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAllWordCounts() {
      const counts: Record<string, number> = {}
      
      for (const day of days) {
        try {
          // loadDays가 이미 커스텀 단어를 포함해서 반환함
          const words = await loadDays([day.id], 'sequence')
          counts[day.id] = words.length
        } catch (error) {
          console.error(`${day.id} 단어 개수 로드 실패:`, error)
          // 에러 시 manifest의 값 사용
          counts[day.id] = day.total
        }
      }
      
      setWordCounts(counts)
      setLoading(false)
    }

    loadAllWordCounts()
  }, [days])

  return (
    <div className="wordbook">
      <h2 className="wordbook__title">단어집</h2>
      <ul className="wordbook__list">
        {days.map((day) => {
          const stat = getStat(day.id)
          const completedToday = stat.completedDates.includes(today)
          const totalWords = wordCounts[day.id] || day.total
          const progressCurrent = Math.min(stat.lastIndex, totalWords)
          const progressLabel = loading ? "로딩중..." : `${progressCurrent}/${totalWords}`
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
                  <div className="day-card__description">{day.description}</div>
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