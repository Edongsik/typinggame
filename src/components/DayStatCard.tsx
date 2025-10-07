import { FC } from 'react'
import type { DayStatistics } from '../lib/statistics'

type DayStatCardProps = {
  stat: DayStatistics
}

const DayStatCard: FC<DayStatCardProps> = ({ stat }) => {
  return (
    <div style={{
      background: stat.isCompleted ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : '#f9fafb',
      border: `2px solid ${stat.isCompleted ? '#0ea5e9' : '#e5e7eb'}`,
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.25rem',
          color: '#1f2937',
          fontWeight: '700',
        }}>
          {stat.dayLabel}
        </h3>
        {stat.isCompleted && (
          <span style={{
            background: '#10b981',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}>
            ✅ 완료
          </span>
        )}
      </div>

      {/* 통계 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          background: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            정답률
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
            {stat.accuracy}%
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            복습 횟수
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
            {stat.reviewCount}회
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            정답
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
            {stat.correctCount}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            오답
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
            {stat.wrongCount}
          </div>
        </div>
      </div>

      {/* 취약 단어 */}
      {stat.topWrongWords.length > 0 && (
        <div style={{
          background: '#fef2f2',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #fecaca',
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: '#991b1b',
            fontWeight: '600',
            marginBottom: '0.5rem',
          }}>
            ⚠️ 취약 단어
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            {stat.topWrongWords.map((word, index) => (
              <span
                key={index}
                style={{
                  background: 'white',
                  color: '#991b1b',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 완료일 */}
      {stat.completedDate && (
        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: '#6b7280',
          textAlign: 'right',
        }}>
          완료일: {stat.completedDate}
        </div>
      )}
    </div>
  )
}

export default DayStatCard