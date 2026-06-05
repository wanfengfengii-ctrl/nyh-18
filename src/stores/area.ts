import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MuralArea, AreaFilterParams } from '@/types'
import { mockAreas } from '@/utils/mockData'
import { generateId } from '@/utils'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { sortByRiskAndDate } from '@/composables/useFilter'
import { calculateOverdueStatus } from '@/composables/useStats'

const AREAS_STORAGE_KEY = 'mural_areas'

export const useAreaStore = defineStore('area', () => {
  const areas = ref<MuralArea[]>(loadFromStorage(AREAS_STORAGE_KEY, mockAreas))
  const currentArea = ref<MuralArea | null>(null)
  const loading = ref(false)

  const filterParams = ref<AreaFilterParams>({
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
    dateRange: [],
    isOverdue: null,
  })

  const filteredAreas = computed(() => {
    const result = areas.value.filter((area) => {
      if (filterParams.value.caveName && area.caveName !== filterParams.value.caveName) {
        return false
      }
      if (filterParams.value.dynasty && area.dynasty !== filterParams.value.dynasty) {
        return false
      }
      if (filterParams.value.riskLevel && area.currentRiskLevel !== filterParams.value.riskLevel) {
        return false
      }
      if (filterParams.value.processingStatus && area.currentProcessingStatus !== filterParams.value.processingStatus) {
        return false
      }
      if (filterParams.value.isOverdue !== null && area.isOverdue !== filterParams.value.isOverdue) {
        return false
      }
      if (filterParams.value.dateRange.length === 2) {
        const [start, end] = filterParams.value.dateRange
        if (area.lastObservationDate < start || area.lastObservationDate > end) {
          return false
        }
      }
      if (filterParams.value.keyword) {
        const keyword = filterParams.value.keyword.toLowerCase()
        return (
          area.areaCode.toLowerCase().includes(keyword) ||
          area.theme.toLowerCase().includes(keyword) ||
          area.description.toLowerCase().includes(keyword)
        )
      }
      return true
    })

    return sortByRiskAndDate(result)
  })

  const highRiskAreas = computed(() => areas.value.filter((a) => a.currentRiskLevel === 'high'))
  const overdueAreas = computed(() => areas.value.filter((a) => a.isOverdue))
  const pendingAreas = computed(() => areas.value.filter((a) => a.currentProcessingStatus === 'pending'))

  function getAreaById(id: string): MuralArea | undefined {
    return areas.value.find((a) => a.id === id)
  }

  function setCurrentArea(id: string): void {
    currentArea.value = getAreaById(id) || null
  }

  function clearCurrentArea(): void {
    currentArea.value = null
  }

  function addArea(
    data: Omit<MuralArea, 'id' | 'firstObservationDate' | 'lastObservationDate' | 'observationCount' | 'isOverdue' | 'overdueDays' | 'createdAt' | 'updatedAt' | 'currentRiskLevel' | 'currentProcessingStatus'>
  ): MuralArea {
    const now = new Date().toISOString()
    const newArea: MuralArea = {
      ...data,
      id: generateId(),
      currentRiskLevel: 'low',
      currentProcessingStatus: 'pending',
      firstObservationDate: new Date().toISOString().split('T')[0],
      lastObservationDate: new Date().toISOString().split('T')[0],
      observationCount: 0,
      isOverdue: false,
      overdueDays: 0,
      createdAt: now,
      updatedAt: now,
    }
    areas.value.unshift(newArea)
    saveToStorage(AREAS_STORAGE_KEY, areas.value)
    return newArea
  }

  function updateArea(id: string, data: Partial<Omit<MuralArea, 'id' | 'createdAt'>>): MuralArea | null {
    const index = areas.value.findIndex((a) => a.id === id)
    if (index === -1) return null

    const existing = areas.value[index]
    const updatedArea: MuralArea = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    areas.value[index] = updatedArea
    saveToStorage(AREAS_STORAGE_KEY, areas.value)

    if (currentArea.value?.id === id) {
      currentArea.value = updatedArea
    }

    return updatedArea
  }

  function deleteArea(id: string): boolean {
    const index = areas.value.findIndex((a) => a.id === id)
    if (index === -1) return false

    areas.value.splice(index, 1)
    saveToStorage(AREAS_STORAGE_KEY, areas.value)

    if (currentArea.value?.id === id) {
      currentArea.value = null
    }

    return true
  }

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

  function refreshOverdueStatus(): void {
    areas.value.forEach((area) => {
      const { isOverdue, overdueDays } = calculateOverdueStatus(area.lastObservationDate)
      if (area.isOverdue !== isOverdue) {
        updateArea(area.id, { isOverdue, overdueDays })
      }
    })
  }

  function resetData(): void {
    areas.value = [...mockAreas]
    saveToStorage(AREAS_STORAGE_KEY, areas.value)
  }

  return {
    areas,
    currentArea,
    loading,
    filterParams,
    filteredAreas,
    highRiskAreas,
    overdueAreas,
    pendingAreas,
    getAreaById,
    setCurrentArea,
    clearCurrentArea,
    addArea,
    updateArea,
    deleteArea,
    setFilterParams,
    resetFilterParams,
    refreshOverdueStatus,
    resetData,
  }
})
