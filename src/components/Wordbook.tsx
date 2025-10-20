import { FC, useMemo, useState } from "react"
import { getStat } from "../lib/progress"
import type { DayMeta } from "../types"

const todayKey = () => new Date().toISOString().slice(0, 10)

// Day별 품사 매핑 (수정 가능)
const DAY_PARTS_OF_SPEECH: Record<number, string> = {
  1: "형용사",
  2: "형용사",
  3: "형용사",
  4: "형용사",
  5: "형용사",
  6: "동사",
  7: "동사",
  8: "동사",
  9: "동사",
  10: "동사",
  11: "동사",
  12: "동사",
  13: "동사",
  14: "동사",
  15: "동사",
  // 필요에 따라 추가
}

type WordbookProps = {
  days: DayMeta[]
  wordCounts: Record<string, number> // 전체 단어 수
  completedCounts?: Record<string, number> // 완료 단어 수
  onDaySelect: (dayId: string, mode: string) => void
  onAddWord: (dayId: string) => void
  onShowStats?: () => void
  onShowAllWords?: () => void
}

const Wordbook: FC<WordbookProps> = ({ days, wordCounts, completedCounts, onDaySelect, onShowStats, onShowAllWords }) => {
  const today = todayKey()
  const [hovered, setHovered] = useState<number | null>(null)

  const overall = useMemo(() => {
    const totals = days.reduce((acc, d) => {
      const total = wordCounts[d.id] || d.total
      const completed = (completedCounts?.[d.id] ?? 0)
      return { total: acc.total + total, completed: acc.completed + completed }
    }, { total: 0, completed: 0 })
    const percent = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0
    return { ...totals, percent }
  }, [days, wordCounts, completedCounts])

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Typing TOEIC</h1>
          <p style={styles.subtitle}>하루 10분, 단어를 빠르게 익혀보세요</p>
        </div>
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, ...styles.buttonPrimary}}
            onClick={onShowAllWords}
          >
            📚 암기장
          </button>
          <button 
            style={{...styles.button, ...styles.buttonSecondary}}
            onClick={onShowStats}
          >
            📊 통계
          </button>
        </div>
      </div>

      {/* 진행률 바 */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${overall.percent}%` }} />
        </div>
      </div>

      {/* Day 그리드 */}
      <div style={styles.grid}>
        {days.map((day, index) => {
          const stat = getStat(day.id)
          const completedToday = stat.completedDates.includes(today)
          const totalWords = wordCounts[day.id] || day.total
          const completed = completedCounts?.[day.id] ?? 0
          const progressCurrent = Math.min(completed, totalWords)
          const progressPercent = totalWords > 0 ? (progressCurrent / totalWords) * 100 : 0
          const dayNumber = index + 1
          const partOfSpeech = DAY_PARTS_OF_SPEECH[dayNumber] || "단어"

          return (
            <button
              key={day.id}
              onClick={() => onDaySelect(day.id, "sequence")}
              style={{
                ...styles.card,
                ...(hovered === index ? styles.cardHover : {}),
                ...(completedToday ? styles.cardCompleted : {})
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={styles.percentBadge}>{Math.round(progressPercent)}%</div>
              {/* 완료 칩 제거 */}
              <div style={styles.cardContent}>
                {/* Day 라벨 */}
                <div style={styles.dayLabel}>{day.label}</div>
                
                {/* 품사 */}
                <div style={styles.partOfSpeech}>{partOfSpeech}</div>
                
                {/* 진행률 바 */}
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFillSmall,
                      width: `${progressPercent}%`
                    }}
                  />
                </div>
                
                {/* 완료/전체 표시 */}
                <div style={styles.progressText}>
                  {progressCurrent}/{totalWords}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1a1a1a'
  },
  subtitle: {
    marginTop: '6px',
    color: '#6b7280',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white'
  },
  buttonSecondary: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white'
  },
  progressContainer: {
    marginBottom: '32px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  progressFill: {
    width: '8%',
    height: '100%',
    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    borderRadius: '999px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px'
  },
  card: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    aspectRatio: '1',
    transition: 'all 0.2s',
    cursor: 'pointer',
    position: 'relative',
    width: '100%',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
  },
  cardHover: {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 10px 16px rgba(0,0,0,0.10)'
  },
  cardCompleted: {
    background: 'linear-gradient(180deg, #ecfdf5 0%, #f6fffa 100%)',
    borderColor: '#86efac'
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
  },
  dayLabel: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px'
  },
  partOfSpeech: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '8px'
  },
  progressFillSmall: {
    height: '100%',
    background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
    borderRadius: '2px',
    transition: 'width 0.4s ease'
  },
  progressText: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  percentBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(17,24,39,0.8)',
    color: 'white',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '999px'
  },
  completedChip: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: '#22c55e',
    color: 'white',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '999px'
  }
}

export default Wordbook
