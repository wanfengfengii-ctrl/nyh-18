import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { DashboardStats } from '@/types'
import { getMonthStartDate } from '@/utils'
import { useAreaStore } from './area'
import { useObservationStore } from './observation'

export const useDashboardStore = defineStore('dashboard', () => {
  const areaStore = useAreaStore()
  const observationStore = useObservationStore()

  const stats = computed<DashboardStats>(() => {
    const allAreas = areaStore.areas
    const allObservations = observationStore.observations
    const totalAreas = allAreas.length
    const totalObservations = allObservations.length

    const pendingCount = allAreas.filter((r) => r.currentProcessingStatus === 'pending').length
    const highRiskCount = allAreas.filter((r) => r.currentRiskLevel === 'high').length
    const overdueCount = allAreas.filter((r) => r.isOverdue).length

    const monthStart = getMonthStartDate()
    const monthlyNewCount = allObservations.filter((r) => r.observationDate >= monthStart).length

    const riskCounts = { low: 0, medium: 0, high: 0 }
    const dynastyCounts: Record<string, number> = {}
    const caveCounts: Record<string, number> = {}
    const statusCounts = { pending: 0, processing: 0, completed: 0 }

    allAreas.forEach((r) => {
      riskCounts[r.currentRiskLevel]++
      dynastyCounts[r.dynasty] = (dynastyCounts[r.dynasty] || 0) + 1
      caveCounts[r.caveName] = (caveCounts[r.caveName] || 0) + 1
      statusCounts[r.currentProcessingStatus]++
    })

    const riskDistribution = [
      { name: '低风险', value: riskCounts.low },
      { name: '中风险', value: riskCounts.medium },
      { name: '高风险', value: riskCounts.high },
    ]

    const dynastyDistribution = Object.entries(dynastyCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const caveDistribution = Object.entries(caveCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const processingProgress = [
      { name: '未处理', value: statusCounts.pending },
      { name: '处理中', value: statusCounts.processing },
      { name: '已完成', value: statusCounts.completed },
    ]

    const last12Months: { date: string; count: number }[] = []
    const riskTrendData: { date: string; low: number; medium: number; high: number }[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

      const monthObservations = allObservations.filter(
        (r) => r.observationDate >= monthStr && r.observationDate < nextMonthStr
      )
      last12Months.push({ date: monthStr, count: monthObservations.length })

      const monthAreaStats = { low: 0, medium: 0, high: 0 }
      allAreas.forEach((area) => {
        const areaObs = allObservations.filter(
          (o) => o.areaId === area.id && o.observationDate >= monthStr && o.observationDate < nextMonthStr
        )
        if (areaObs.length > 0) {
          const latestObs = areaObs.sort(
            (a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime()
          )[0]
          monthAreaStats[latestObs.riskLevel]++
        }
      })
      riskTrendData.push({ date: monthStr, ...monthAreaStats })
    }

    return {
      totalAreas,
      totalObservations,
      pendingCount,
      highRiskCount,
      overdueCount,
      monthlyNewCount,
      riskDistribution,
      dynastyDistribution,
      fadingTrend: last12Months,
      processingProgress,
      caveDistribution,
      riskTrend: riskTrendData,
    }
  })

  return {
    stats,
    dashboardStats: stats,
  }
})
