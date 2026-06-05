import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DiseasePoint,
  EvidencePhoto,
  ImageComparison,
  TreatmentRecord,
  EvidenceStats,
  EvidenceFilterParams,
  DiseaseType,
  ChangeType,
  TreatmentStatus,
} from '@/types'
import {
  mockDiseasePoints,
  mockEvidencePhotos,
  mockImageComparisons,
  mockTreatmentRecords,
} from '@/utils/mockData'
import { generateId } from '@/utils'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { useAreaStore } from './area'

const DISEASE_POINTS_STORAGE_KEY = 'mural_disease_points'
const EVIDENCE_PHOTOS_STORAGE_KEY = 'mural_evidence_photos'
const IMAGE_COMPARISONS_STORAGE_KEY = 'mural_image_comparisons'
const TREATMENT_RECORDS_STORAGE_KEY = 'mural_treatment_records'

export const useEvidenceStore = defineStore('evidence', () => {
  const diseasePoints = ref<DiseasePoint[]>(loadFromStorage(DISEASE_POINTS_STORAGE_KEY, mockDiseasePoints))
  const evidencePhotos = ref<EvidencePhoto[]>(loadFromStorage(EVIDENCE_PHOTOS_STORAGE_KEY, mockEvidencePhotos))
  const imageComparisons = ref<ImageComparison[]>(loadFromStorage(IMAGE_COMPARISONS_STORAGE_KEY, mockImageComparisons))
  const treatmentRecords = ref<TreatmentRecord[]>(loadFromStorage(TREATMENT_RECORDS_STORAGE_KEY, mockTreatmentRecords))

  const filterParams = ref<EvidenceFilterParams>({
    caveName: '',
    areaId: '',
    startDate: '',
    endDate: '',
    diseaseType: '',
    changeType: '',
    treatmentStatus: '',
    keyword: '',
  })

  const filteredImageComparisons = computed(() => {
    const areaStore = useAreaStore()
    let result = [...imageComparisons.value]

    if (filterParams.value.caveName) {
      const areaIds = areaStore.areas
        .filter((a) => a.caveName === filterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((c) => areaIds.includes(c.areaId))
    }

    if (filterParams.value.areaId) {
      result = result.filter((c) => c.areaId === filterParams.value.areaId)
    }

    if (filterParams.value.changeType) {
      result = result.filter((c) => c.changeType === filterParams.value.changeType)
    }

    if (filterParams.value.keyword) {
      const keyword = filterParams.value.keyword.toLowerCase()
      result = result.filter((c) => {
        const area = areaStore.areas.find((a) => a.id === c.areaId)
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
    const areaStore = useAreaStore()
    let result = [...treatmentRecords.value]

    if (filterParams.value.caveName) {
      const areaIds = areaStore.areas
        .filter((a) => a.caveName === filterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((t) => areaIds.includes(t.areaId))
    }

    if (filterParams.value.areaId) {
      result = result.filter((t) => t.areaId === filterParams.value.areaId)
    }

    if (filterParams.value.treatmentStatus) {
      result = result.filter((t) => t.status === filterParams.value.treatmentStatus)
    }

    if (filterParams.value.keyword) {
      const keyword = filterParams.value.keyword.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(keyword) || t.description.toLowerCase().includes(keyword))
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  })

  const filteredDiseasePoints = computed(() => {
    const areaStore = useAreaStore()
    let result = [...diseasePoints.value]

    if (filterParams.value.caveName) {
      const areaIds = areaStore.areas
        .filter((a) => a.caveName === filterParams.value.caveName)
        .map((a) => a.id)
      result = result.filter((d) => areaIds.includes(d.areaId))
    }

    if (filterParams.value.areaId) {
      result = result.filter((d) => d.areaId === filterParams.value.areaId)
    }

    if (filterParams.value.diseaseType) {
      result = result.filter((d) => d.type === filterParams.value.diseaseType)
    }

    return result
  })

  const stats = computed<EvidenceStats>(() => {
    const areaStore = useAreaStore()
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
        const area = areaStore.areas.find((a) => a.id === c.areaId)
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
        const area = areaStore.areas.find((a) => a.id === c.areaId)
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
    saveToStorage(DISEASE_POINTS_STORAGE_KEY, diseasePoints.value)
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
    saveToStorage(DISEASE_POINTS_STORAGE_KEY, diseasePoints.value)
    return updated
  }

  function deleteDiseasePoint(id: string): boolean {
    const index = diseasePoints.value.findIndex((d) => d.id === id)
    if (index === -1) return false
    diseasePoints.value.splice(index, 1)
    saveToStorage(DISEASE_POINTS_STORAGE_KEY, diseasePoints.value)
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
    saveToStorage(EVIDENCE_PHOTOS_STORAGE_KEY, evidencePhotos.value)
    return newPhoto
  }

  function deleteEvidencePhoto(id: string): boolean {
    const index = evidencePhotos.value.findIndex((p) => p.id === id)
    if (index === -1) return false
    evidencePhotos.value.splice(index, 1)
    saveToStorage(EVIDENCE_PHOTOS_STORAGE_KEY, evidencePhotos.value)
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
    saveToStorage(IMAGE_COMPARISONS_STORAGE_KEY, imageComparisons.value)
    return newComparison
  }

  function deleteImageComparison(id: string): boolean {
    const index = imageComparisons.value.findIndex((c) => c.id === id)
    if (index === -1) return false
    imageComparisons.value.splice(index, 1)
    saveToStorage(IMAGE_COMPARISONS_STORAGE_KEY, imageComparisons.value)
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
    saveToStorage(TREATMENT_RECORDS_STORAGE_KEY, treatmentRecords.value)
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
    saveToStorage(TREATMENT_RECORDS_STORAGE_KEY, treatmentRecords.value)
    return updated
  }

  function deleteTreatmentRecord(id: string): boolean {
    const index = treatmentRecords.value.findIndex((t) => t.id === id)
    if (index === -1) return false
    treatmentRecords.value.splice(index, 1)
    saveToStorage(TREATMENT_RECORDS_STORAGE_KEY, treatmentRecords.value)
    return true
  }

  function setFilterParams(params: Partial<EvidenceFilterParams>): void {
    filterParams.value = { ...filterParams.value, ...params }
  }

  function resetFilterParams(): void {
    filterParams.value = {
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

  function resetData(): void {
    diseasePoints.value = [...mockDiseasePoints]
    evidencePhotos.value = [...mockEvidencePhotos]
    imageComparisons.value = [...mockImageComparisons]
    treatmentRecords.value = [...mockTreatmentRecords]
    saveToStorage(DISEASE_POINTS_STORAGE_KEY, diseasePoints.value)
    saveToStorage(EVIDENCE_PHOTOS_STORAGE_KEY, evidencePhotos.value)
    saveToStorage(IMAGE_COMPARISONS_STORAGE_KEY, imageComparisons.value)
    saveToStorage(TREATMENT_RECORDS_STORAGE_KEY, treatmentRecords.value)
  }

  return {
    diseasePoints,
    evidencePhotos,
    imageComparisons,
    treatmentRecords,
    filterParams,
    filteredImageComparisons,
    filteredTreatmentRecords,
    filteredDiseasePoints,
    stats,
    evidenceStats: stats,
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
    setFilterParams,
    resetFilterParams,
    setEvidenceFilterParams: setFilterParams,
    resetEvidenceFilterParams: resetFilterParams,
    resetData,
  }
})
