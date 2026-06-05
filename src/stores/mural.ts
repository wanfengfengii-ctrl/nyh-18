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
  DiseasePoint,
  EvidencePhoto,
  ImageComparison,
  TreatmentRecord,
  EvidenceStats,
  EvidenceFilterParams,
  DiseaseType,
  ChangeType,
  TreatmentStatus,
  Inspector,
  InspectionPlan,
  InspectionTask,
  InspectionStats,
  InspectionFilterParams,
  InspectionTaskStatus,
  InspectionPriority,
  InspectionTaskCheckItem,
} from '@/types'
import {
  mockAreas,
  mockObservations,
  mockAlerts,
  mockDiseasePoints,
  mockEvidencePhotos,
  mockImageComparisons,
  mockTreatmentRecords,
  mockInspectors,
  mockInspectionPlans,
  mockInspectionTasks,
} from '@/utils/mockData'
import { generateId, calculateRiskLevel, getMonthStartDate } from '@/utils'

const AREAS_STORAGE_KEY = 'mural_areas'
const OBSERVATIONS_STORAGE_KEY = 'mural_observations'
const ALERTS_STORAGE_KEY = 'mural_alerts'
const DISEASE_POINTS_STORAGE_KEY = 'mural_disease_points'
const EVIDENCE_PHOTOS_STORAGE_KEY = 'mural_evidence_photos'
const IMAGE_COMPARISONS_STORAGE_KEY = 'mural_image_comparisons'
const TREATMENT_RECORDS_STORAGE_KEY = 'mural_treatment_records'
const INSPECTORS_STORAGE_KEY = 'mural_inspectors'
const INSPECTION_PLANS_STORAGE_KEY = 'mural_inspection_plans'
const INSPECTION_TASKS_STORAGE_KEY = 'mural_inspection_tasks'

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

function loadDiseasePointsFromStorage(): DiseasePoint[] {
  try {
    const data = localStorage.getItem(DISEASE_POINTS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load disease points from storage:', e)
  }
  return [...mockDiseasePoints]
}

function loadEvidencePhotosFromStorage(): EvidencePhoto[] {
  try {
    const data = localStorage.getItem(EVIDENCE_PHOTOS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load evidence photos from storage:', e)
  }
  return [...mockEvidencePhotos]
}

function loadImageComparisonsFromStorage(): ImageComparison[] {
  try {
    const data = localStorage.getItem(IMAGE_COMPARISONS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load image comparisons from storage:', e)
  }
  return [...mockImageComparisons]
}

function loadTreatmentRecordsFromStorage(): TreatmentRecord[] {
  try {
    const data = localStorage.getItem(TREATMENT_RECORDS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load treatment records from storage:', e)
  }
  return [...mockTreatmentRecords]
}

function saveDiseasePointsToStorage(diseasePoints: DiseasePoint[]): void {
  try {
    localStorage.setItem(DISEASE_POINTS_STORAGE_KEY, JSON.stringify(diseasePoints))
  } catch (e) {
    console.error('Failed to save disease points to storage:', e)
  }
}

function saveEvidencePhotosToStorage(photos: EvidencePhoto[]): void {
  try {
    localStorage.setItem(EVIDENCE_PHOTOS_STORAGE_KEY, JSON.stringify(photos))
  } catch (e) {
    console.error('Failed to save evidence photos to storage:', e)
  }
}

function saveImageComparisonsToStorage(comparisons: ImageComparison[]): void {
  try {
    localStorage.setItem(IMAGE_COMPARISONS_STORAGE_KEY, JSON.stringify(comparisons))
  } catch (e) {
    console.error('Failed to save image comparisons to storage:', e)
  }
}

function saveTreatmentRecordsToStorage(records: TreatmentRecord[]): void {
  try {
    localStorage.setItem(TREATMENT_RECORDS_STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('Failed to save treatment records to storage:', e)
  }
}

function loadInspectorsFromStorage(): Inspector[] {
  try {
    const data = localStorage.getItem(INSPECTORS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load inspectors from storage:', e)
  }
  return [...mockInspectors]
}

function saveInspectorsToStorage(inspectors: Inspector[]): void {
  try {
    localStorage.setItem(INSPECTORS_STORAGE_KEY, JSON.stringify(inspectors))
  } catch (e) {
    console.error('Failed to save inspectors to storage:', e)
  }
}

function loadInspectionPlansFromStorage(): InspectionPlan[] {
  try {
    const data = localStorage.getItem(INSPECTION_PLANS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load inspection plans from storage:', e)
  }
  return [...mockInspectionPlans]
}

function saveInspectionPlansToStorage(plans: InspectionPlan[]): void {
  try {
    localStorage.setItem(INSPECTION_PLANS_STORAGE_KEY, JSON.stringify(plans))
  } catch (e) {
    console.error('Failed to save inspection plans to storage:', e)
  }
}

function loadInspectionTasksFromStorage(): InspectionTask[] {
  try {
    const data = localStorage.getItem(INSPECTION_TASKS_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load inspection tasks from storage:', e)
  }
  return [...mockInspectionTasks]
}

function saveInspectionTasksToStorage(tasks: InspectionTask[]): void {
  try {
    localStorage.setItem(INSPECTION_TASKS_STORAGE_KEY, JSON.stringify(tasks))
  } catch (e) {
    console.error('Failed to save inspection tasks to storage:', e)
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

  const diseasePoints = ref<DiseasePoint[]>(loadDiseasePointsFromStorage())
  const evidencePhotos = ref<EvidencePhoto[]>(loadEvidencePhotosFromStorage())
  const imageComparisons = ref<ImageComparison[]>(loadImageComparisonsFromStorage())
  const treatmentRecords = ref<TreatmentRecord[]>(loadTreatmentRecordsFromStorage())

  const filterParams = ref<AreaFilterParams>({
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
    dateRange: [],
    isOverdue: null,
  })

  const evidenceFilterParams = ref<EvidenceFilterParams>({
    caveName: '',
    areaId: '',
    startDate: '',
    endDate: '',
    diseaseType: '',
    changeType: '',
    treatmentStatus: '',
    keyword: '',
  })

  const inspectors = ref<Inspector[]>(loadInspectorsFromStorage())
  const inspectionPlans = ref<InspectionPlan[]>(loadInspectionPlansFromStorage())
  const inspectionTasks = ref<InspectionTask[]>(loadInspectionTasksFromStorage())

  const inspectionFilterParams = ref<InspectionFilterParams>({
    caveName: '',
    areaId: '',
    assigneeId: '',
    status: '',
    priority: '',
    dateRange: [],
    keyword: '',
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

  const filteredImageComparisons = computed(() => {
    let result = [...imageComparisons.value]

    if (evidenceFilterParams.value.caveName) {
      const areaIds = areas.value
        .filter((a) => a.caveName === evidenceFilterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((c) => areaIds.includes(c.areaId))
    }

    if (evidenceFilterParams.value.areaId) {
      result = result.filter((c) => c.areaId === evidenceFilterParams.value.areaId)
    }

    if (evidenceFilterParams.value.changeType) {
      result = result.filter((c) => c.changeType === evidenceFilterParams.value.changeType)
    }

    if (evidenceFilterParams.value.keyword) {
      const keyword = evidenceFilterParams.value.keyword.toLowerCase()
      result = result.filter((c) => {
        const area = areas.value.find((a) => a.id === c.areaId)
        return (
          c.changeAnalysis.toLowerCase().includes(keyword) ||
          area?.theme.toLowerCase().includes(keyword) ||
          area?.areaCode.toLowerCase().includes(keyword)
        )
      })
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  })

  const filteredTreatmentRecords = computed(() => {
    let result = [...treatmentRecords.value]

    if (evidenceFilterParams.value.caveName) {
      const areaIds = areas.value
        .filter((a) => a.caveName === evidenceFilterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((t) => areaIds.includes(t.areaId))
    }

    if (evidenceFilterParams.value.areaId) {
      result = result.filter((t) => t.areaId === evidenceFilterParams.value.areaId)
    }

    if (evidenceFilterParams.value.treatmentStatus) {
      result = result.filter((t) => t.status === evidenceFilterParams.value.treatmentStatus)
    }

    if (evidenceFilterParams.value.keyword) {
      const keyword = evidenceFilterParams.value.keyword.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(keyword) || t.description.toLowerCase().includes(keyword))
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  })

  const filteredDiseasePoints = computed(() => {
    let result = [...diseasePoints.value]

    if (evidenceFilterParams.value.caveName) {
      const areaIds = areas.value
        .filter((a) => a.caveName === evidenceFilterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((d) => areaIds.includes(d.areaId))
    }

    if (evidenceFilterParams.value.areaId) {
      result = result.filter((d) => d.areaId === evidenceFilterParams.value.areaId)
    }

    if (evidenceFilterParams.value.diseaseType) {
      result = result.filter((d) => d.type === evidenceFilterParams.value.diseaseType)
    }

    return result
  })

  const evidenceStats = computed<EvidenceStats>(() => {
    const totalPhotos = evidencePhotos.value.length
    const totalComparisons = imageComparisons.value.length
    const totalDiseasePoints = diseasePoints.value.length
    const totalTreatments = treatmentRecords.value.length
    const completedTreatments = treatmentRecords.value.filter((t) => t.status === 'completed' || t.status === 'verified').length
    const pendingTreatments = treatmentRecords.value.filter((t) => t.status === 'proposed' || t.status === 'inProgress').length

    const diseaseCounts: Record<string, number> = {}
    diseasePoints.value.forEach((d) => {
      diseaseCounts[d.type] = (diseaseCounts[d.type] || 0) + 1
    })

    const diseaseDistribution = Object.entries(diseaseCounts).map(([name, value]) => ({
      name: diseaseTypeToLabel(name),
      value,
    }))

    const abnormalChanges = imageComparisons.value
      .filter((c) => c.changeType === 'worsened' || c.changeType === 'new')
      .map((c) => {
        const area = areas.value.find((a) => a.id === c.areaId)
        return {
          areaId: c.areaId,
          areaCode: area?.areaCode || '',
          caveName: area?.caveName || '',
          theme: area?.theme || '',
          changeType: c.changeType === 'worsened' ? '病害恶化' : '新增病害',
          description: c.changeAnalysis,
          detectedAt: c.createdAt,
        }
      })
      .slice(0, 10)

    const recentComparisons = imageComparisons.value
      .slice(0, 10)
      .map((c) => {
        const area = areas.value.find((a) => a.id === c.areaId)
        return {
          id: c.id,
          areaCode: area?.areaCode || '',
          caveName: area?.caveName || '',
          theme: area?.theme || '',
          beforeDate: c.beforeImage?.photoDate || '',
          afterDate: c.afterImage?.photoDate || '',
          changeType: c.changeType,
        }
      })

    const monthlyMap: Record<string, number> = {}
    imageComparisons.value.forEach((c) => {
      const month = c.createdAt.substring(0, 7)
      monthlyMap[month] = (monthlyMap[month] || 0) + 1
    })

    const monthlyComparisons = Object.entries(monthlyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalPhotos,
      totalComparisons,
      totalDiseasePoints,
      totalTreatments,
      completedTreatments,
      pendingTreatments,
      colorChanges: [],
      crackExtensions: [],
      abnormalChanges,
      recentComparisons,
      monthlyComparisons,
      diseaseDistribution,
    }
  })

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

  function diseaseTypeToLabel(type: string): string {
    const map: Record<string, string> = {
      crack: '裂隙',
      fading: '褪变',
      peeling: '起甲',
      mold: '霉斑',
      salt: '盐析',
      damage: '破损',
      other: '其他',
    }
    return map[type] || type
  }

  function getDiseasePointsByAreaId(areaId: string): DiseasePoint[] {
    return diseasePoints.value.filter((d) => d.areaId === areaId)
  }

  function getDiseasePointsByObservationId(observationId: string): DiseasePoint[] {
    return diseasePoints.value.filter((d) => d.observationId === observationId)
  }

  function addDiseasePoint(data: Omit<DiseasePoint, 'id' | 'createdAt' | 'updatedAt'>): DiseasePoint {
    const now = new Date().toISOString()
    const newPoint: DiseasePoint = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    diseasePoints.value.unshift(newPoint)
    saveDiseasePointsToStorage(diseasePoints.value)
    return newPoint
  }

  function updateDiseasePoint(id: string, data: Partial<Omit<DiseasePoint, 'id' | 'createdAt'>>): DiseasePoint | null {
    const index = diseasePoints.value.findIndex((d) => d.id === id)
    if (index === -1) return null

    const updated: DiseasePoint = {
      ...diseasePoints.value[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    diseasePoints.value[index] = updated
    saveDiseasePointsToStorage(diseasePoints.value)
    return updated
  }

  function deleteDiseasePoint(id: string): boolean {
    const index = diseasePoints.value.findIndex((d) => d.id === id)
    if (index === -1) return false
    diseasePoints.value.splice(index, 1)
    saveDiseasePointsToStorage(diseasePoints.value)
    return true
  }

  function getEvidencePhotosByAreaId(areaId: string): EvidencePhoto[] {
    return evidencePhotos.value.filter((p) => p.areaId === areaId)
  }

  function getEvidencePhotosByObservationId(observationId: string): EvidencePhoto[] {
    return evidencePhotos.value.filter((p) => p.observationId === observationId)
  }

  function addEvidencePhoto(data: Omit<EvidencePhoto, 'id' | 'uploadDate'>): EvidencePhoto {
    const now = new Date().toISOString()
    const newPhoto: EvidencePhoto = {
      ...data,
      id: generateId(),
      uploadDate: now.split('T')[0],
    }
    evidencePhotos.value.unshift(newPhoto)
    saveEvidencePhotosToStorage(evidencePhotos.value)
    return newPhoto
  }

  function deleteEvidencePhoto(id: string): boolean {
    const index = evidencePhotos.value.findIndex((p) => p.id === id)
    if (index === -1) return false
    evidencePhotos.value.splice(index, 1)
    saveEvidencePhotosToStorage(evidencePhotos.value)
    return true
  }

  function getImageComparisonsByAreaId(areaId: string): ImageComparison[] {
    return imageComparisons.value.filter((c) => c.areaId === areaId)
  }

  function addImageComparison(data: Omit<ImageComparison, 'id' | 'createdAt'>): ImageComparison {
    const now = new Date().toISOString()
    const newComparison: ImageComparison = {
      ...data,
      id: generateId(),
      createdAt: now,
    }
    imageComparisons.value.unshift(newComparison)
    saveImageComparisonsToStorage(imageComparisons.value)
    return newComparison
  }

  function deleteImageComparison(id: string): boolean {
    const index = imageComparisons.value.findIndex((c) => c.id === id)
    if (index === -1) return false
    imageComparisons.value.splice(index, 1)
    saveImageComparisonsToStorage(imageComparisons.value)
    return true
  }

  function getTreatmentRecordsByAreaId(areaId: string): TreatmentRecord[] {
    return treatmentRecords.value.filter((t) => t.areaId === areaId)
  }

  function addTreatmentRecord(data: Omit<TreatmentRecord, 'id' | 'createdAt' | 'updatedAt'>): TreatmentRecord {
    const now = new Date().toISOString()
    const newRecord: TreatmentRecord = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    treatmentRecords.value.unshift(newRecord)
    saveTreatmentRecordsToStorage(treatmentRecords.value)
    return newRecord
  }

  function updateTreatmentRecord(id: string, data: Partial<Omit<TreatmentRecord, 'id' | 'createdAt'>>): TreatmentRecord | null {
    const index = treatmentRecords.value.findIndex((t) => t.id === id)
    if (index === -1) return null

    const updated: TreatmentRecord = {
      ...treatmentRecords.value[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    treatmentRecords.value[index] = updated
    saveTreatmentRecordsToStorage(treatmentRecords.value)
    return updated
  }

  function deleteTreatmentRecord(id: string): boolean {
    const index = treatmentRecords.value.findIndex((t) => t.id === id)
    if (index === -1) return false
    treatmentRecords.value.splice(index, 1)
    saveTreatmentRecordsToStorage(treatmentRecords.value)
    return true
  }

  function setEvidenceFilterParams(params: Partial<EvidenceFilterParams>): void {
    evidenceFilterParams.value = { ...evidenceFilterParams.value, ...params }
  }

  function resetEvidenceFilterParams(): void {
    evidenceFilterParams.value = {
      caveName: '',
      areaId: '',
      startDate: '',
      endDate: '',
      diseaseType: '',
      changeType: '',
      treatmentStatus: '',
      keyword: '',
    }
  }

  const filteredInspectionTasks = computed(() => {
    let result = [...inspectionTasks.value]

    if (inspectionFilterParams.value.caveName) {
      result = result.filter((t) => t.caveName === inspectionFilterParams.value.caveName)
    }

    if (inspectionFilterParams.value.areaId) {
      result = result.filter((t) => t.areaId === inspectionFilterParams.value.areaId)
    }

    if (inspectionFilterParams.value.assigneeId) {
      result = result.filter((t) => t.assigneeId === inspectionFilterParams.value.assigneeId)
    }

    if (inspectionFilterParams.value.status) {
      result = result.filter((t) => t.status === inspectionFilterParams.value.status)
    }

    if (inspectionFilterParams.value.priority) {
      result = result.filter((t) => t.priority === inspectionFilterParams.value.priority)
    }

    if (inspectionFilterParams.value.dateRange.length === 2) {
      const [start, end] = inspectionFilterParams.value.dateRange
      result = result.filter((t) => t.scheduledDate >= start && t.scheduledDate <= end)
    }

    if (inspectionFilterParams.value.keyword) {
      const keyword = inspectionFilterParams.value.keyword.toLowerCase()
      result = result.filter(
        (t) =>
          t.taskName.toLowerCase().includes(keyword) ||
          t.assigneeName.toLowerCase().includes(keyword) ||
          t.areaCode.toLowerCase().includes(keyword)
      )
    }

    result.sort((a, b) => {
      const priorityOrder: Record<InspectionPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    })

    return result
  })

  const inspectionStats = computed<InspectionStats>(() => {
    const totalTasks = inspectionTasks.value.length
    const completedTasks = inspectionTasks.value.filter((t) => t.status === 'completed').length
    const pendingTasks = inspectionTasks.value.filter((t) => t.status === 'pending').length
    const inProgressTasks = inspectionTasks.value.filter((t) => t.status === 'inProgress').length
    const overdueTasks = inspectionTasks.value.filter((t) => t.status === 'overdue').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const totalPlans = inspectionPlans.value.length
    const activePlans = inspectionPlans.value.filter((p) => p.isActive).length

    const workloadMap: Record<string, number> = {}
    inspectors.value.forEach((i) => {
      workloadMap[i.name] = i.workload
    })
    const workloadDistribution = Object.entries(workloadMap).map(([name, value]) => ({ name, value }))

    const caveTaskMap: Record<string, number> = {}
    inspectionTasks.value.forEach((t) => {
      caveTaskMap[t.caveName] = (caveTaskMap[t.caveName] || 0) + 1
    })
    const caveTaskDistribution = Object.entries(caveTaskMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const monthlyMap: Record<string, { completed: number; total: number }> = {}
    inspectionTasks.value.forEach((t) => {
      const month = t.scheduledDate.substring(0, 7)
      if (!monthlyMap[month]) {
        monthlyMap[month] = { completed: 0, total: 0 }
      }
      monthlyMap[month].total++
      if (t.status === 'completed') {
        monthlyMap[month].completed++
      }
    })
    const monthlyCompletion = Object.entries(monthlyMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const recentTasks = [...inspectionTasks.value]
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
      .slice(0, 10)

    const overdueTaskList = inspectionTasks.value
      .filter((t) => t.status === 'overdue')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      totalPlans,
      activePlans,
      inspectors: inspectors.value,
      workloadDistribution,
      caveTaskDistribution,
      monthlyCompletion,
      recentTasks,
      overdueTaskList,
    }
  })

  const pendingInspectionTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'pending'))
  const inProgressInspectionTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'inProgress'))
  const completedInspectionTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'completed'))
  const overdueInspectionTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'overdue'))

  function getInspectionTasksByDate(date: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.scheduledDate === date)
  }

  function getInspectionTasksByPlanId(planId: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.planId === planId)
  }

  function getInspectionTasksByAssigneeId(assigneeId: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.assigneeId === assigneeId)
  }

  function getInspectionTasksByCaveName(caveName: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.caveName === caveName)
  }

  function addInspectionPlan(data: Omit<InspectionPlan, 'id' | 'createdAt' | 'updatedAt'>): InspectionPlan {
    const now = new Date().toISOString()
    const newPlan: InspectionPlan = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    inspectionPlans.value.unshift(newPlan)
    saveInspectionPlansToStorage(inspectionPlans.value)
    return newPlan
  }

  function updateInspectionPlan(id: string, data: Partial<Omit<InspectionPlan, 'id' | 'createdAt'>>): InspectionPlan | null {
    const index = inspectionPlans.value.findIndex((p) => p.id === id)
    if (index === -1) return null

    const updated: InspectionPlan = {
      ...inspectionPlans.value[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    inspectionPlans.value[index] = updated
    saveInspectionPlansToStorage(inspectionPlans.value)
    return updated
  }

  function deleteInspectionPlan(id: string): boolean {
    const index = inspectionPlans.value.findIndex((p) => p.id === id)
    if (index === -1) return false
    inspectionPlans.value.splice(index, 1)
    inspectionTasks.value = inspectionTasks.value.filter((t) => t.planId !== id)
    saveInspectionPlansToStorage(inspectionPlans.value)
    saveInspectionTasksToStorage(inspectionTasks.value)
    return true
  }

  function addInspectionTask(data: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): InspectionTask {
    const now = new Date().toISOString()
    const newTask: InspectionTask = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    inspectionTasks.value.unshift(newTask)
    saveInspectionTasksToStorage(inspectionTasks.value)
    return newTask
  }

  function updateInspectionTask(id: string, data: Partial<Omit<InspectionTask, 'id' | 'createdAt'>>): InspectionTask | null {
    const index = inspectionTasks.value.findIndex((t) => t.id === id)
    if (index === -1) return null

    const updated: InspectionTask = {
      ...inspectionTasks.value[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    inspectionTasks.value[index] = updated
    saveInspectionTasksToStorage(inspectionTasks.value)

    if (updated.hasAbnormality && data.hasAbnormality) {
      const area = areas.value.find((a) => a.id === updated.areaId)
      if (area) {
        addAlert({
          areaId: updated.areaId,
          areaCode: updated.areaCode,
          caveName: updated.caveName,
          theme: area.theme,
          type: 'newRisk',
          title: '巡检发现异常',
          description: updated.abnormalityDescription || '巡检中发现异常情况，需要关注',
          riskLevel: 'medium',
        })
      }
    }

    return updated
  }

  function startInspectionTask(id: string): InspectionTask | null {
    return updateInspectionTask(id, {
      status: 'inProgress',
      startedAt: new Date().toISOString().split('T')[0],
    })
  }

  function completeInspectionTask(
    id: string,
    findings: string,
    hasAbnormality: boolean,
    abnormalityDescription?: string
  ): InspectionTask | null {
    return updateInspectionTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString().split('T')[0],
      findings,
      hasAbnormality,
      abnormalityDescription,
    })
  }

  function deleteInspectionTask(id: string): boolean {
    const index = inspectionTasks.value.findIndex((t) => t.id === id)
    if (index === -1) return false
    inspectionTasks.value.splice(index, 1)
    saveInspectionTasksToStorage(inspectionTasks.value)
    return true
  }

  function updateCheckItem(taskId: string, checkItemId: string, isChecked: boolean, remark?: string): boolean {
    const task = inspectionTasks.value.find((t) => t.id === taskId)
    if (!task) return false

    const checkItem = task.checkItems.find((ci) => ci.id === checkItemId)
    if (!checkItem) return false

    checkItem.isChecked = isChecked
    if (remark !== undefined) {
      checkItem.remark = remark
    }

    saveInspectionTasksToStorage(inspectionTasks.value)
    return true
  }

  function setInspectionFilterParams(params: Partial<InspectionFilterParams>): void {
    inspectionFilterParams.value = { ...inspectionFilterParams.value, ...params }
  }

  function resetInspectionFilterParams(): void {
    inspectionFilterParams.value = {
      caveName: '',
      areaId: '',
      assigneeId: '',
      status: '',
      priority: '',
      dateRange: [],
      keyword: '',
    }
  }

  return {
    areas,
    observations,
    alerts,
    currentArea,
    areaObservations,
    filterParams,
    loading,
    diseasePoints,
    evidencePhotos,
    imageComparisons,
    treatmentRecords,
    evidenceFilterParams,
    inspectors,
    inspectionPlans,
    inspectionTasks,
    inspectionFilterParams,
    filteredAreas,
    unreadAlerts,
    highRiskAreas,
    overdueAreas,
    pendingAreas,
    filteredImageComparisons,
    filteredTreatmentRecords,
    filteredDiseasePoints,
    filteredInspectionTasks,
    pendingInspectionTasks,
    inProgressInspectionTasks,
    completedInspectionTasks,
    overdueInspectionTasks,
    dashboardStats,
    evidenceStats,
    inspectionStats,
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
    getDiseasePointsByAreaId,
    getDiseasePointsByObservationId,
    addDiseasePoint,
    updateDiseasePoint,
    deleteDiseasePoint,
    getEvidencePhotosByAreaId,
    getEvidencePhotosByObservationId,
    addEvidencePhoto,
    deleteEvidencePhoto,
    getImageComparisonsByAreaId,
    addImageComparison,
    deleteImageComparison,
    getTreatmentRecordsByAreaId,
    addTreatmentRecord,
    updateTreatmentRecord,
    deleteTreatmentRecord,
    setEvidenceFilterParams,
    resetEvidenceFilterParams,
    getInspectionTasksByDate,
    getInspectionTasksByPlanId,
    getInspectionTasksByAssigneeId,
    getInspectionTasksByCaveName,
    addInspectionPlan,
    updateInspectionPlan,
    deleteInspectionPlan,
    addInspectionTask,
    updateInspectionTask,
    deleteInspectionTask,
    startInspectionTask,
    completeInspectionTask,
    updateCheckItem,
    setInspectionFilterParams,
    resetInspectionFilterParams,
  }
})
