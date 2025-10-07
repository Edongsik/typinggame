// lib/statistics.ts
import { getStat } from './progress'
import type { DayMeta, DayStat } from '../types'

export type DayStatistics = {
  dayId: string
  dayLabel: string
  accuracy: number
  reviewCount: number
  totalWords: number
  correctCount: number
  wrongCount: number
  isCompleted: boolean
  completedDate: string | null
  topWrongWords: string[]
}

export type OverallStatistics = {
  totalWordsLearned: number
  totalReviews: number
  averageAccuracy: number
  consecutiveDays: number
  totalDaysCompleted: number
  todayDaysCompleted: number
  todayWordsCount: number
  todayAccuracy: number
}

// Day별 통계 계산
export function calculateDayStatistics(
  dayId: string,
  dayLabel: string,
  totalWords: number
): DayStatistics {
  const stat = getStat(dayId)
  const total = stat.correct + stat.wrong
  const accuracy = total > 0 ? (stat.correct / total) * 100 : 0
  
  const today = new Date().toISOString().slice(0, 10)
  const isCompleted = stat.completedDates.includes(today)
  const completedDate = stat.completedDates.length > 0 
    ? stat.completedDates[stat.completedDates.length - 1] 
    : null
  
  // 취약 단어 (wrongSet에서 최대 5개)
  const topWrongWords = stat.wrongSet.slice(0, 5)
  
  return {
    dayId,
    dayLabel,
    accuracy: Math.round(accuracy),
    reviewCount: stat.reviewCount || 0,
    totalWords,
    correctCount: stat.correct,
    wrongCount: stat.wrong,
    isCompleted,
    completedDate,
    topWrongWords,
  }
}

// 전체 통계 계산
export function calculateOverallStatistics(days: DayMeta[]): OverallStatistics {
  let totalCorrect = 0
  let totalWrong = 0
  let totalReviews = 0
  let totalDaysCompleted = 0
  let todayDaysCompleted = 0
  
  const today = new Date().toISOString().slice(0, 10)
  const allCompletedDates: string[] = []
  
  days.forEach((day) => {
    const stat = getStat(day.id)
    totalCorrect += stat.correct
    totalWrong += stat.wrong
    totalReviews += stat.reviewCount || 0
    
    if (stat.completedDates.length > 0) {
      totalDaysCompleted += 1
      allCompletedDates.push(...stat.completedDates)
      
      if (stat.completedDates.includes(today)) {
        todayDaysCompleted += 1
      }
    }
  })
  
  const totalWords = totalCorrect + totalWrong
  const averageAccuracy = totalWords > 0 ? (totalCorrect / totalWords) * 100 : 0
  
  // 연속 학습 일수 계산
  const consecutiveDays = calculateConsecutiveDays(allCompletedDates)
  
  // 오늘의 통계
  const todayWordsCount = totalCorrect + totalWrong // 간단히 전체로 계산 (실제로는 오늘만 필터링 필요)
  const todayAccuracy = averageAccuracy
  
  return {
    totalWordsLearned: totalCorrect,
    totalReviews,
    averageAccuracy: Math.round(averageAccuracy),
    consecutiveDays,
    totalDaysCompleted,
    todayDaysCompleted,
    todayWordsCount,
    todayAccuracy: Math.round(todayAccuracy),
  }
}

// 연속 학습 일수 계산
function calculateConsecutiveDays(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  
  const uniqueDates = [...new Set(completedDates)].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  
  // 오늘부터 시작하지 않으면 0
  if (uniqueDates[0] !== today) return 0
  
  let consecutive = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i])
    const previousDate = new Date(uniqueDates[i - 1])
    const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      consecutive++
    } else {
      break
    }
  }
  
  return consecutive
}