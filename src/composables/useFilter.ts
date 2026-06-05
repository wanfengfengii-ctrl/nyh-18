import { ref, type Ref, type ComputedRef, computed } from 'vue'
import type { RiskLevel, ProcessingStatus } from '@/types'

export interface BaseFilterParams {
  keyword: string
  dateRange: [string, string] | []
}

export interface AreaFilterParams extends BaseFilterParams {
  caveName: string
  dynasty: string
  riskLevel: RiskLevel | ''
  processingStatus: ProcessingStatus | ''
  isOverdue: boolean | null
}

export function useAreaFilter<T extends { caveName: string; dynasty: string; currentRiskLevel: RiskLevel; currentProcessingStatus: ProcessingStatus; isOverdue: boolean; lastObservationDate: string; areaCode: string; theme: string; description: string }>(
  items: Ref<T[]> | ComputedRef<T[]>,
  initialParams?: Partial<AreaFilterParams>
) {
  const filterParams = ref<AreaFilterParams>({
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
    dateRange: [],
    isOverdue: null,
    ...initialParams,
  })

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (filterParams.value.caveName && item.caveName !== filterParams.value.caveName) {
        return false
      }
      if (filterParams.value.dynasty && item.dynasty !== filterParams.value.dynasty) {
        return false
      }
      if (filterParams.value.riskLevel && item.currentRiskLevel !== filterParams.value.riskLevel) {
        return false
      }
      if (filterParams.value.processingStatus && item.currentProcessingStatus !== filterParams.value.processingStatus) {
        return false
      }
      if (filterParams.value.isOverdue !== null && item.isOverdue !== filterParams.value.isOverdue) {
        return false
      }
      if (filterParams.value.dateRange.length === 2) {
        const [start, end] = filterParams.value.dateRange
        if (item.lastObservationDate < start || item.lastObservationDate > end) {
          return false
        }
      }
      if (filterParams.value.keyword) {
        const keyword = filterParams.value.keyword.toLowerCase()
        return (
          item.areaCode.toLowerCase().includes(keyword) ||
          item.theme.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword)
        )
      }
      return true
    })
  })

  function setFilterParams(params: Partial<AreaFilterParams>): void {
    filterParams.value = { ...filterParams.value, ...params }
  }

  function resetFilterParams(): void {
    filterParams.value = {
      caveName: '',
      dynasty: '',
      riskLevel: '',
      processingStatus: '',
      keyword: '',
      dateRange: [],
      isOverdue: null,
    }
  }

  return {
    filterParams,
    filteredItems,
    setFilterParams,
    resetFilterParams,
  }
}

export function sortByRiskAndDate<T extends { currentRiskLevel: RiskLevel; lastObservationDate: string }>(items: T[]): T[] {
  const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 }
  return [...items].sort((a, b) => {
    const riskDiff = riskOrder[a.currentRiskLevel] - riskOrder[b.currentRiskLevel]
    if (riskDiff !== 0) return riskDiff
    return new Date(b.lastObservationDate).getTime() - new Date(a.lastObservationDate).getTime()
  })
}
