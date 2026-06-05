import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MuralRecord, FilterParams, DashboardStats, FadingLevel, ProcessingStatus } from '@/types'
import { mockRecords } from '@/utils/mockData'
import { generateId, calculateRiskLevel, getMonthStartDate } from '@/utils'

const STORAGE_KEY = 'mural_records'

function loadFromStorage(): MuralRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load records from storage:', e)
  }
  return [...mockRecords]
}

function saveToStorage(records: MuralRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('Failed to save records to storage:', e)
  }
}

export const useMuralStore = defineStore('mural', () => {
  const records = ref<MuralRecord[]>(loadFromStorage())
  const currentRecord = ref<MuralRecord | null>(null)
  const filterParams = ref<FilterParams>({
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
  })
  const loading = ref(false)

  const filteredRecords = computed(() => {
    return records.value.filter((record) => {
      if (filterParams.value.caveName && record.caveName !== filterParams.value.caveName) {
        return false
      }
      if (filterParams.value.dynasty && record.dynasty !== filterParams.value.dynasty) {
        return false
      }
      if (filterParams.value.riskLevel && record.riskLevel !== filterParams.value.riskLevel) {
        return false
      }
      if (filterParams.value.processingStatus && record.processingStatus !== filterParams.value.processingStatus) {
        return false
      }
      if (filterParams.value.keyword) {
        const keyword = filterParams.value.keyword.toLowerCase()
        return (
          record.areaCode.toLowerCase().includes(keyword) ||
          record.theme.toLowerCase().includes(keyword) ||
          record.remarks.toLowerCase().includes(keyword)
        )
      }
      return true
    })
  })

  const dashboardStats = computed<DashboardStats>(() => {
    const allRecords = records.value
    const totalRecords = allRecords.length

    const pendingCount = allRecords.filter((r) => r.processingStatus === 'pending').length
    const highRiskCount = allRecords.filter((r) => r.riskLevel === 'high').length

    const monthStart = getMonthStartDate()
    const monthlyNewCount = allRecords.filter((r) => r.observationDate >= monthStart).length

    const riskCounts = { low: 0, medium: 0, high: 0 }
    const dynastyCounts: Record<string, number> = {}
    const statusCounts = { pending: 0, processing: 0, completed: 0 }

    allRecords.forEach((r) => {
      riskCounts[r.riskLevel]++
      dynastyCounts[r.dynasty] = (dynastyCounts[r.dynasty] || 0) + 1
      statusCounts[r.processingStatus]++
    })

    const riskDistribution = [
      { name: '低风险', value: riskCounts.low },
      { name: '中风险', value: riskCounts.medium },
      { name: '高风险', value: riskCounts.high },
    ]

    const dynastyDistribution = Object.entries(dynastyCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const processingProgress = [
      { name: '未处理', value: statusCounts.pending },
      { name: '处理中', value: statusCounts.processing },
      { name: '已完成', value: statusCounts.completed },
    ]

    const last12Months: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
      const count = allRecords.filter((r) => r.observationDate >= monthStr && r.observationDate < nextMonthStr).length
      last12Months.push({ date: monthStr, count })
    }

    return {
      totalRecords,
      pendingCount,
      highRiskCount,
      monthlyNewCount,
      riskDistribution,
      dynastyDistribution,
      fadingTrend: last12Months,
      processingProgress,
    }
  })

  function getRecordById(id: string): MuralRecord | undefined {
    return records.value.find((r) => r.id === id)
  }

  function setCurrentRecord(id: string): void {
    currentRecord.value = getRecordById(id) || null
  }

  function clearCurrentRecord(): void {
    currentRecord.value = null
  }

  function addRecord(data: Omit<MuralRecord, 'id' | 'riskLevel' | 'createdAt' | 'updatedAt'>): MuralRecord {
    const now = new Date().toISOString()
    const newRecord: MuralRecord = {
      ...data,
      id: generateId(),
      riskLevel: calculateRiskLevel(data.fadingLevel, data.crackLength),
      createdAt: now,
      updatedAt: now,
    }
    records.value.unshift(newRecord)
    saveToStorage(records.value)
    return newRecord
  }

  function updateRecord(
    id: string,
    data: Partial<Omit<MuralRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): MuralRecord | null {
    const index = records.value.findIndex((r) => r.id === id)
    if (index === -1) return null

    const existing = records.value[index]
    const fadingLevel = (data.fadingLevel as FadingLevel) || existing.fadingLevel
    const crackLength = data.crackLength !== undefined ? data.crackLength : existing.crackLength

    const updatedRecord: MuralRecord = {
      ...existing,
      ...data,
      riskLevel: calculateRiskLevel(fadingLevel, crackLength),
      updatedAt: new Date().toISOString(),
    }

    records.value[index] = updatedRecord
    saveToStorage(records.value)

    if (currentRecord.value?.id === id) {
      currentRecord.value = updatedRecord
    }

    return updatedRecord
  }

  function deleteRecord(id: string): boolean {
    const index = records.value.findIndex((r) => r.id === id)
    if (index === -1) return false

    records.value.splice(index, 1)
    saveToStorage(records.value)

    if (currentRecord.value?.id === id) {
      currentRecord.value = null
    }

    return true
  }

  function updateProcessingStatus(id: string, status: ProcessingStatus): boolean {
    return updateRecord(id, { processingStatus: status }) !== null
  }

  function setFilterParams(params: Partial<FilterParams>): void {
    filterParams.value = { ...filterParams.value, ...params }
  }

  function resetFilterParams(): void {
    filterParams.value = {
      caveName: '',
      dynasty: '',
      riskLevel: '',
      processingStatus: '',
      keyword: '',
    }
  }

  function resetData(): void {
    records.value = [...mockRecords]
    saveToStorage(records.value)
  }

  return {
    records,
    currentRecord,
    filterParams,
    loading,
    filteredRecords,
    dashboardStats,
    getRecordById,
    setCurrentRecord,
    clearCurrentRecord,
    addRecord,
    updateRecord,
    deleteRecord,
    updateProcessingStatus,
    setFilterParams,
    resetFilterParams,
    resetData,
  }
})
