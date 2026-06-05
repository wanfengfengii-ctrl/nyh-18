import type { ComputedRef } from 'vue'
import type { RiskLevel, ProcessingStatus } from '@/types'
import { getMonthStartDate } from '@/utils'

export interface DistributionItem {
  name: string
  value: number
}

export interface TrendItem {
  date: string
  count: number
}

export interface RiskTrendItem {
  date: string
  low: number
  medium: number
  high: number
}

export function calculateDistribution<T>(items: T[], key: keyof T): DistributionItem[] {
  const counts: Record<string, number> = {}
  items.forEach((item) => {
    const value = String(item[key])
    counts[value] = (counts[value] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export function calculateSortedDistribution<T>(items: T[], key: keyof T, limit?: number): DistributionItem[] {
  const distribution = calculateDistribution(items, key).sort((a, b) => b.value - a.value)
  return limit ? distribution.slice(0, limit) : distribution
}

export function calculateMonthlyTrend<T extends Record<string, unknown>>(
  items: T[],
  dateKey: keyof T,
  months = 12
): TrendItem[] {
  const result: TrendItem[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

    const count = items.filter((item) => {
      const itemDate = String(item[dateKey])
      return itemDate >= monthStr && itemDate < nextMonthStr
    }).length

    result.push({ date: monthStr, count })
  }

  return result
}

export function calculateRiskDistribution<T extends { currentRiskLevel: RiskLevel }>(items: T[]): DistributionItem[] {
  const counts = { low: 0, medium: 0, high: 0 }
  items.forEach((item) => counts[item.currentRiskLevel]++)
  return [
    { name: '低风险', value: counts.low },
    { name: '中风险', value: counts.medium },
    { name: '高风险', value: counts.high },
  ]
}

export function calculateProcessingProgress<T extends { currentProcessingStatus: ProcessingStatus }>(items: T[]): DistributionItem[] {
  const counts = { pending: 0, processing: 0, completed: 0 }
  items.forEach((item) => counts[item.currentProcessingStatus]++)
  return [
    { name: '未处理', value: counts.pending },
    { name: '处理中', value: counts.processing },
    { name: '已完成', value: counts.completed },
  ]
}

export function calculateMonthlyNewCount<T extends Record<string, unknown>>(items: T[], dateKey: keyof T): number {
  const monthStart = getMonthStartDate()
  return items.filter((item) => String(item[dateKey]) >= monthStart).length
}

export interface AreaStats {
  total: number
  pending: number
  highRisk: number
  overdue: number
  monthlyNew: number
}

export function getAreaStats<
  T extends {
    currentRiskLevel: RiskLevel
    currentProcessingStatus: ProcessingStatus
    isOverdue: boolean
  },
  O extends { observationDate: string }
>(areas: ComputedRef<T[]> | T[], observations: ComputedRef<O[]> | O[]): AreaStats {
  const areaList = 'value' in areas ? areas.value : areas
  const obsList = 'value' in observations ? observations.value : observations

  return {
    total: areaList.length,
    pending: areaList.filter((a) => a.currentProcessingStatus === 'pending').length,
    highRisk: areaList.filter((a) => a.currentRiskLevel === 'high').length,
    overdue: areaList.filter((a) => a.isOverdue).length,
    monthlyNew: calculateMonthlyNewCount(obsList, 'observationDate'),
  }
}

export function calculateOverdueStatus(lastObservationDate: string): { isOverdue: boolean; overdueDays: number } {
  const lastDate = new Date(lastObservationDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = diffDays > 90
  return { isOverdue, overdueDays: diffDays }
}
