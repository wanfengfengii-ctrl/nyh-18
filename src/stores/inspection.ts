import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Inspector,
  InspectionPlan,
  InspectionTask,
  InspectionStats,
  InspectionFilterParams,
  InspectionTaskStatus,
  InspectionPriority,
} from '@/types'
import { mockInspectors, mockInspectionPlans, mockInspectionTasks } from '@/utils/mockData'
import { generateId } from '@/utils'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { useAreaStore } from './area'
import { useAlertStore } from './alert'

const INSPECTORS_STORAGE_KEY = 'mural_inspectors'
const INSPECTION_PLANS_STORAGE_KEY = 'mural_inspection_plans'
const INSPECTION_TASKS_STORAGE_KEY = 'mural_inspection_tasks'

export const useInspectionStore = defineStore('inspection', () => {
  const inspectors = ref<Inspector[]>(loadFromStorage(INSPECTORS_STORAGE_KEY, mockInspectors))
  const inspectionPlans = ref<InspectionPlan[]>(loadFromStorage(INSPECTION_PLANS_STORAGE_KEY, mockInspectionPlans))
  const inspectionTasks = ref<InspectionTask[]>(loadFromStorage(INSPECTION_TASKS_STORAGE_KEY, mockInspectionTasks))

  const filterParams = ref<InspectionFilterParams>({
    caveName: '',
    areaId: '',
    assigneeId: '',
    status: '',
    priority: '',
    dateRange: [],
    keyword: '',
  })

  const filteredTasks = computed(() => {
    let result = [...inspectionTasks.value]

    if (filterParams.value.caveName) {
      result = result.filter((t) => t.caveName === filterParams.value.caveName)
    }

    if (filterParams.value.areaId) {
      result = result.filter((t) => t.areaId === filterParams.value.areaId)
    }

    if (filterParams.value.assigneeId) {
      result = result.filter((t) => t.assigneeId === filterParams.value.assigneeId)
    }

    if (filterParams.value.status) {
      result = result.filter((t) => t.status === filterParams.value.status)
    }

    if (filterParams.value.priority) {
      result = result.filter((t) => t.priority === filterParams.value.priority)
    }

    if (filterParams.value.dateRange.length === 2) {
      const [start, end] = filterParams.value.dateRange
      result = result.filter((t) => t.scheduledDate >= start && t.scheduledDate <= end)
    }

    if (filterParams.value.keyword) {
      const keyword = filterParams.value.keyword.toLowerCase()
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

  const stats = computed<InspectionStats>(() => {
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
      .map(([date, s]) => ({ date, ...s }))
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

  const pendingTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'pending'))
  const inProgressTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'inProgress'))
  const completedTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'completed'))
  const overdueTasks = computed(() => inspectionTasks.value.filter((t) => t.status === 'overdue'))

  function getTasksByDate(date: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.scheduledDate === date)
  }

  function getTasksByPlanId(planId: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.planId === planId)
  }

  function getTasksByAssigneeId(assigneeId: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.assigneeId === assigneeId)
  }

  function getTasksByCaveName(caveName: string): InspectionTask[] {
    return inspectionTasks.value.filter((t) => t.caveName === caveName)
  }

  function addPlan(data: Omit<InspectionPlan, 'id' | 'createdAt' | 'updatedAt'>): InspectionPlan {
    const now = new Date().toISOString()
    const newPlan: InspectionPlan = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    inspectionPlans.value.unshift(newPlan)
    saveToStorage(INSPECTION_PLANS_STORAGE_KEY, inspectionPlans.value)
    return newPlan
  }

  function updatePlan(id: string, data: Partial<Omit<InspectionPlan, 'id' | 'createdAt'>>): InspectionPlan | null {
    const index = inspectionPlans.value.findIndex((p) => p.id === id)
    if (index === -1) return null

    const updated: InspectionPlan = {
      ...inspectionPlans.value[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    inspectionPlans.value[index] = updated
    saveToStorage(INSPECTION_PLANS_STORAGE_KEY, inspectionPlans.value)
    return updated
  }

  function deletePlan(id: string): boolean {
    const index = inspectionPlans.value.findIndex((p) => p.id === id)
    if (index === -1) return false
    inspectionPlans.value.splice(index, 1)
    inspectionTasks.value = inspectionTasks.value.filter((t) => t.planId !== id)
    saveToStorage(INSPECTION_PLANS_STORAGE_KEY, inspectionPlans.value)
    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)
    return true
  }

  function addTask(data: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): InspectionTask {
    const now = new Date().toISOString()
    const newTask: InspectionTask = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    inspectionTasks.value.unshift(newTask)
    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)
    return newTask
  }

  function updateTask(id: string, data: Partial<Omit<InspectionTask, 'id' | 'createdAt'>>): InspectionTask | null {
    const index = inspectionTasks.value.findIndex((t) => t.id === id)
    if (index === -1) return null

    const areaStore = useAreaStore()
    const alertStore = useAlertStore()
    const existing = inspectionTasks.value[index]
    const updated: InspectionTask = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    inspectionTasks.value[index] = updated
    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)

    if (updated.hasAbnormality && data.hasAbnormality) {
      const area = areaStore.getAreaById(updated.areaId)
      if (area) {
        alertStore.addAlert({
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

  function startTask(id: string): InspectionTask | null {
    return updateTask(id, {
      status: 'inProgress',
      startedAt: new Date().toISOString().split('T')[0],
    })
  }

  function completeTask(
    id: string,
    findings: string,
    hasAbnormality: boolean,
    abnormalityDescription?: string
  ): InspectionTask | null {
    return updateTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString().split('T')[0],
      findings,
      hasAbnormality,
      abnormalityDescription,
    })
  }

  function deleteTask(id: string): boolean {
    const index = inspectionTasks.value.findIndex((t) => t.id === id)
    if (index === -1) return false
    inspectionTasks.value.splice(index, 1)
    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)
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

    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)
    return true
  }

  function setFilterParams(params: Partial<InspectionFilterParams>): void {
    filterParams.value = { ...filterParams.value, ...params }
  }

  function resetFilterParams(): void {
    filterParams.value = {
      caveName: '',
      areaId: '',
      assigneeId: '',
      status: '',
      priority: '',
      dateRange: [],
      keyword: '',
    }
  }

  function resetData(): void {
    inspectors.value = [...mockInspectors]
    inspectionPlans.value = [...mockInspectionPlans]
    inspectionTasks.value = [...mockInspectionTasks]
    saveToStorage(INSPECTORS_STORAGE_KEY, inspectors.value)
    saveToStorage(INSPECTION_PLANS_STORAGE_KEY, inspectionPlans.value)
    saveToStorage(INSPECTION_TASKS_STORAGE_KEY, inspectionTasks.value)
  }

  return {
    inspectors,
    inspectionPlans,
    inspectionTasks,
    filterParams,
    filteredTasks,
    filteredInspectionTasks: filteredTasks,
    pendingTasks,
    pendingInspectionTasks: pendingTasks,
    inProgressTasks,
    inProgressInspectionTasks: inProgressTasks,
    completedTasks,
    completedInspectionTasks: completedTasks,
    overdueTasks,
    overdueInspectionTasks: overdueTasks,
    stats,
    inspectionStats: stats,
    getTasksByDate,
    getInspectionTasksByDate: getTasksByDate,
    getTasksByPlanId,
    getTasksByAssigneeId,
    getTasksByCaveName,
    addPlan,
    updatePlan,
    deletePlan,
    addInspectionPlan: addPlan,
    updateInspectionPlan: updatePlan,
    deleteInspectionPlan: deletePlan,
    addTask,
    updateTask,
    startTask,
    completeTask,
    deleteTask,
    addInspectionTask: addTask,
    startInspectionTask: startTask,
    completeInspectionTask: completeTask,
    deleteInspectionTask: deleteTask,
    updateCheckItem,
    setFilterParams,
    resetFilterParams,
    setInspectionFilterParams: setFilterParams,
    resetInspectionFilterParams: resetFilterParams,
    resetData,
  }
})
