import { FC, useMemo } from 'react'
import DayStatCard from './DayStatCard'
import { calculateDayStatistics, calculateOverallStatistics } from '../lib/statistics'
import { getOverallAttemptStats, getTodayStats } from '../lib/attemptTracking'
import type { DayMeta } from '../types'

type StatisticsProps = {
  days: DayMeta[]
  wordCounts: Record<string, number>
  onBack: () => void
}

const Statistics: FC<StatisticsProps> = ({ days, wordCounts, onBack }) => {
  // 기존 전체 통계 계산
  const overallStats = useMemo(() => {
    return calculateOverallStatistics(days)
  }, [days])

  // 시도 기반 통계 계산
  const attemptStats = useMemo(() => {
    return getOverallAttemptStats()
  }, [])

  // 오늘의 시도 통계
  const todayAttemptStats = useMemo(() => {
    return getTodayStats()
  }, [])

  // Day별 통계 계산
  const dayStats = useMemo(() => {
    return days.map((day) => {
      const totalWords = wordCounts[day.id] || day.total
      return calculateDayStatistics(day.id, day.label, totalWords)
    })
  }, [days, wordCounts])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      {/* 헤더 */}
      <button onClick={onBack} className="back-to-list-button">
        ← 단어집으로 돌아가기
      </button>

      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '2rem', 
        color: '#1f2937',
        fontWeight: '700',
      }}>
        📊 나의 학습 통계
      </h1>

      {/* 🆕 오늘의 점수 통계 */}
      {todayAttemptStats.totalWords > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: 'white',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '700',
          }}>
            🎯 오늘의 점수
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>평균 점수</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
                {todayAttemptStats.averageScore}
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Perfect 🎯</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
                {todayAttemptStats.perfectCount}
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Good 👍</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
                {todayAttemptStats.goodCount}
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Try Again 💪</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
                {todayAttemptStats.poorCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 오늘의 학습 */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '2px solid #fbbf24',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#92400e',
          fontWeight: '700',
        }}>
          📚 오늘의 학습
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              학습한 Day
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {overallStats.todayDaysCompleted}개
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              연습한 단어
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {todayAttemptStats.totalWords || overallStats.todayWordsCount}개
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              정답률
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {overallStats.todayAccuracy}%
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 전체 점수 통계 */}
      {attemptStats.totalWords > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '2px solid #0ea5e9',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#0c4a6e',
            fontWeight: '700',
          }}>
            🏆 전체 점수 통계
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                평균 점수
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0ea5e9' }}>
                {attemptStats.averageScore}점
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                평균 시도
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                {attemptStats.averageAttempts}회
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Perfect 🎯
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {attemptStats.perfectCount}개
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Good 👍
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {attemptStats.goodCount}개
              </div>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Try Again 💪
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                {attemptStats.poorCount}개
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 통계 */}
      <div style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '2px solid #3b82f6',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#1e3a8a',
          fontWeight: '700',
        }}>
          📈 전체 통계
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              총 학습 단어
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
              {overallStats.totalWordsLearned}개
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              총 복습 횟수
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
              {overallStats.totalReviews}회
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              평균 정답률
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {overallStats.averageAccuracy}%
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              연속 학습
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
              {overallStats.consecutiveDays}일
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              완료한 Day
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#06b6d4' }}>
              {overallStats.totalDaysCompleted}개
            </div>
          </div>
        </div>
      </div>

      {/* Day별 상세 통계 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#1f2937',
          fontWeight: '700',
        }}>
          📚 Day별 상세 통계
        </h2>
        {dayStats.map((stat) => (
          <DayStatCard key={stat.dayId} stat={stat} />
        ))}
      </div>
    </div>
  )
}

export default Statistics