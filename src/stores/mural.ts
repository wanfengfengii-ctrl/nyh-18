import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MuralArea,
  ObservationRecord,
  AreaFilterParams,
  DashboardStats,
  FadingLevel,
  ProcessingStatus,
  RiskLevel,
  RiskAlert,
  RiskTrendItem,
} from '@/types'
import { mockAreas, mockObservations, mockAlerts } from '@/utils/mockData'
import { generateId, calculateRiskLevel, getMonthStartDate } from '@/utils'

const AREAS_STORAGE_KEY = 'mural_areas'
const OBSERVATIONS_STORAGE_KEY = 'mural_observations'
const ALERTS_STORAGE_KEY = 'mural_alerts'

function loadAreasFromStorage(): MuralArea[] {
  try {
    const data = localStorage.getItem(AREAS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load areas from storage:', e)
  }
  return [...mockAreas]
}

function loadObservationsFromStorage(): ObservationRecord[] {
  try {
    const data = localStorage.getItem(OBSERVATIONS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load observations from storage:', e)
  }
  return [...mockObservations]
}

function loadAlertsFromStorage(): RiskAlert[] {
  try {
    const data = localStorage.getItem(ALERTS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load alerts from storage:', e)
  }
  return [...mockAlerts]
}

function saveAreasToStorage(areas: MuralArea[]): void {
  try {
    localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(areas))
  } catch (e) {
    console.error('Failed to save areas to storage:', e)
  }
}

function saveObservationsToStorage(observations: ObservationRecord[]): void {
  try {
    localStorage.setItem(OBSERVATIONS_STORAGE_KEY, JSON.stringify(observations))
  } catch (e) {
    console.error('Failed to save observations to storage:', e)
  }
}

function saveAlertsToStorage(alerts: RiskAlert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
  } catch (e) {
    console.error('Failed to save alerts to storage:', e)
  }
}

function calculateOverdueStatus(lastObservationDate: string): { isOverdue: boolean; overdueDays: number } {
  const lastDate = new Date(lastObservationDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = diffDays > 90
  return { isOverdue, overdueDays: diffDays }
}

export const useMuralStore = defineStore('mural', () => {
  const areas = ref<MuralArea[]>(loadAreasFromStorage())
  const observations = ref<ObservationRecord[]>(loadObservationsFromStorage())
  const alerts = ref<RiskAlert[]>(loadAlertsFromStorage())
  const currentArea = ref<MuralArea | null>(null)
  const areaObservations = ref<ObservationRecord[]>([])

  const filterParams = ref<AreaFilterParams>({
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
    dateRange: [],
    isOverdue: null,
  })

  const loading = ref(false)

  const filteredAreas = computed(() => {
    let result = areas.value.filter((area) => {
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

    result.sort((a, b) => {
      const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 }
      const riskDiff = riskOrder[a.currentRiskLevel] - riskOrder[b.currentRiskLevel]
      if (riskDiff !== 0) return riskDiff
      return new Date(b.lastObservationDate).getTime() - new Date(a.lastObservationDate).getTime()
    })

    return result
  })

  const unreadAlerts = computed(() => alerts.value.filter((a) => !a.isRead))

  const highRiskAreas = computed(() => areas.value.filter((a) => a.currentRiskLevel === 'high'))

  const overdueAreas = computed(() => areas.value.filter((a) => a.isOverdue))

  const pendingAreas = computed(() => areas.value.filter((a) => a.currentProcessingStatus === 'pending'))

  const dashboardStats = computed<DashboardStats>(() => {
    const allAreas = areas.value
    const allObservations = observations.value
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

  function getAreaById(id: string): MuralArea | undefined {
    return areas.value.find((a) => a.id === id)
  }

  function getObservationsByAreaId(areaId: string): ObservationRecord[] {
    return observations.value
      .filter((o) => o.areaId === areaId)
      .sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime())
  }

  function getRiskTrendByAreaId(areaId: string): RiskTrendItem[] {
    return getObservationsByAreaId(areaId)
      .sort((a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime())
      .map((o) => ({
        date: o.observationDate,
        riskLevel: o.riskLevel,
        fadingLevel: o.fadingLevel,
        crackLength: o.crackLength,
      }))
  }

  function setCurrentArea(id: string): void {
    currentArea.value = getAreaById(id) || null
    areaObservations.value = getObservationsByAreaId(id)
  }

  function clearCurrentArea(): void {
    currentArea.value = null
    areaObservations.value = []
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
    saveAreasToStorage(areas.value)
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
    saveAreasToStorage(areas.value)

    if (currentArea.value?.id === id) {
      currentArea.value = updatedArea
    }

    return updatedArea
  }

  function deleteArea(id: string): boolean {
    const index = areas.value.findIndex((a) => a.id === id)
    if (index === -1) return false

    areas.value.splice(index, 1)
    observations.value = observations.value.filter((o) => o.areaId !== id)
    alerts.value = alerts.value.filter((a) => a.areaId !== id)

    saveAreasToStorage(areas.value)
    saveObservationsToStorage(observations.value)
    saveAlertsToStorage(alerts.value)

    if (currentArea.value?.id === id) {
      currentArea.value = null
      areaObservations.value = []
    }

    return true
  }

  function addObservation(
    areaId: string,
    data: Omit<ObservationRecord, 'id' | 'areaId' | 'riskLevel' | 'createdAt' | 'updatedAt'>
  ): ObservationRecord | null {
    const area = getAreaById(areaId)
    if (!area) return null

    const now = new Date().toISOString()
    const riskLevel = calculateRiskLevel(data.fadingLevel, data.crackLength)
    const newObservation: ObservationRecord = {
      ...data,
      id: generateId(),
      areaId,
      riskLevel,
      createdAt: now,
      updatedAt: now,
    }

    observations.value.unshift(newObservation)

    const areaObservationsList = getObservationsByAreaId(areaId)
    const { isOverdue, overdueDays } = calculateOverdueStatus(data.observationDate)

    updateArea(areaId, {
      currentRiskLevel: riskLevel,
      currentProcessingStatus: data.processingStatus,
      lastObservationDate: data.observationDate,
      observationCount: areaObservationsList.length,
      isOverdue,
      overdueDays,
    })

    if (riskLevel === 'high') {
      addAlert({
        areaId,
        areaCode: area.areaCode,
        caveName: area.caveName,
        theme: area.theme,
        type: 'highRisk',
        title: '高风险预警',
        description: `检测到高风险：褪变等级${data.fadingLevel}，裂隙${data.crackLength}cm`,
        riskLevel: 'high',
      })
    }

    saveObservationsToStorage(observations.value)

    if (currentArea.value?.id === areaId) {
      areaObservations.value = getObservationsByAreaId(areaId)
    }

    return newObservation
  }

  function updateObservation(
    id: string,
    data: Partial<Omit<ObservationRecord, 'id' | 'areaId' | 'createdAt'>>
  ): ObservationRecord | null {
    const index = observations.value.findIndex((o) => o.id === id)
    if (index === -1) return null

    const existing = observations.value[index]
    const fadingLevel = (data.fadingLevel as FadingLevel) || existing.fadingLevel
    const crackLength = data.crackLength !== undefined ? data.crackLength : existing.crackLength

    const updatedObservation: ObservationRecord = {
      ...existing,
      ...data,
      riskLevel: calculateRiskLevel(fadingLevel, crackLength),
      updatedAt: new Date().toISOString(),
    }

    observations.value[index] = updatedObservation
    saveObservationsToStorage(observations.value)

    const area = getAreaById(existing.areaId)
    if (area) {
      const areaObs = getObservationsByAreaId(existing.areaId)
      if (areaObs.length > 0 && areaObs[0].id === id) {
        updateArea(existing.areaId, {
          currentRiskLevel: updatedObservation.riskLevel,
          currentProcessingStatus: updatedObservation.processingStatus,
        })
      }
    }

    if (currentArea.value?.id === existing.areaId) {
      areaObservations.value = getObservationsByAreaId(existing.areaId)
    }

    return updatedObservation
  }

  function deleteObservation(id: string): boolean {
    const index = observations.value.findIndex((o) => o.id === id)
    if (index === -1) return false

    const observation = observations.value[index]
    observations.value.splice(index, 1)
    saveObservationsToStorage(observations.value)

    const areaObs = getObservationsByAreaId(observation.areaId)
    if (areaObs.length > 0) {
      const latest = areaObs[0]
      updateArea(observation.areaId, {
        currentRiskLevel: latest.riskLevel,
        currentProcessingStatus: latest.processingStatus,
        lastObservationDate: latest.observationDate,
        observationCount: areaObs.length,
      })
    }

    if (currentArea.value?.id === observation.areaId) {
      areaObservations.value = getObservationsByAreaId(observation.areaId)
    }

    return true
  }

  function addAlert(data: Omit<RiskAlert, 'id' | 'createdAt' | 'isRead'>): RiskAlert {
    const now = new Date().toISOString()
    const newAlert: RiskAlert = {
      ...data,
      id: generateId(),
      createdAt: now,
      isRead: false,
    }
    alerts.value.unshift(newAlert)
    saveAlertsToStorage(alerts.value)
    return newAlert
  }

  function markAlertAsRead(id: string): boolean {
    const alert = alerts.value.find((a) => a.id === id)
    if (!alert) return false
    alert.isRead = true
    saveAlertsToStorage(alerts.value)
    return true
  }

  function markAllAlertsAsRead(): void {
    alerts.value.forEach((a) => (a.isRead = true))
    saveAlertsToStorage(alerts.value)
  }

  function updateProcessingStatus(areaId: string, status: ProcessingStatus): boolean {
    const area = getAreaById(areaId)
    if (!area) return false

    updateArea(areaId, { currentProcessingStatus: status })

    const areaObs = getObservationsByAreaId(areaId)
    if (areaObs.length > 0) {
      updateObservation(areaObs[0].id, { processingStatus: status })
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

  function resetData(): void {
    areas.value = [...mockAreas]
    observations.value = [...mockObservations]
    alerts.value = [...mockAlerts]
    saveAreasToStorage(areas.value)
    saveObservationsToStorage(observations.value)
    saveAlertsToStorage(alerts.value)
  }

  function refreshOverdueStatus(): void {
    areas.value.forEach((area) => {
      const { isOverdue, overdueDays } = calculateOverdueStatus(area.lastObservationDate)
      if (area.isOverdue !== isOverdue) {
        updateArea(area.id, { isOverdue, overdueDays })
        if (isOverdue && !area.isOverdue) {
          addAlert({
            areaId: area.id,
            areaCode: area.areaCode,
            caveName: area.caveName,
            theme: area.theme,
            type: 'overdue',
            title: '超期未观察预警',
            description: `该区域已 ${overdueDays} 天未进行观察记录`,
            riskLevel: area.currentRiskLevel,
          })
        }
      }
    })
  }

  return {
    areas,
    observations,
    alerts,
    currentArea,
    areaObservations,
    filterParams,
    loading,
    filteredAreas,
    unreadAlerts,
    highRiskAreas,
    overdueAreas,
    pendingAreas,
    dashboardStats,
    getAreaById,
    getObservationsByAreaId,
    getRiskTrendByAreaId,
    setCurrentArea,
    clearCurrentArea,
    addArea,
    updateArea,
    deleteArea,
    addObservation,
    updateObservation,
    deleteObservation,
    addAlert,
    markAlertAsRead,
    markAllAlertsAsRead,
    updateProcessingStatus,
    setFilterParams,
    resetFilterParams,
    resetData,
    refreshOverdueStatus,
  }
})
