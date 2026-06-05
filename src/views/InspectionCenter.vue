<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAreaStore } from '@/stores/area'
import { useInspectionStore } from '@/stores/inspection'
import StatCard from '@/components/StatCard.vue'
import { useECharts, createPieOption, createBarOption } from '@/composables/useECharts'
import type {
  CAVE_OPTIONS,
  InspectionTask,
  InspectionPlan,
  InspectionTaskStatus,
  InspectionPriority,
  InspectionCycleType,
} from '@/types'
import {
  CAVE_OPTIONS as caveOptions,
  INSPECTION_TASK_STATUS_OPTIONS as taskStatusOptions,
  INSPECTION_PRIORITY_OPTIONS as priorityOptions,
  INSPECTION_CYCLE_OPTIONS as cycleOptions,
} from '@/types'

const router = useRouter()
const areaStore = useAreaStore()
const inspectionStore = useInspectionStore()

const activeView = ref<'list' | 'kanban' | 'calendar'>('list')
const activeTab = ref('tasks')

const workloadChartRef = ref<HTMLElement | null>(null)
const caveChartRef = ref<HTMLElement | null>(null)
const completionChartRef = ref<HTMLElement | null>(null)

const showPlanDialog = ref(false)
const showTaskDialog = ref(false)
const showTaskDetailDialog = ref(false)
const selectedTask = ref<InspectionTask | null>(null)
const editingPlan = ref<InspectionPlan | null>(null)

const stats = computed(() => inspectionStore.inspectionStats)
const tasks = computed(() => inspectionStore.filteredInspectionTasks)
const plans = computed(() => inspectionStore.inspectionPlans)
const inspectors = computed(() => inspectionStore.inspectors)
const areas = computed(() => areaStore.areas)

const pendingTasks = computed(() => inspectionStore.pendingInspectionTasks)
const inProgressTasks = computed(() => inspectionStore.inProgressInspectionTasks)
const completedTasks = computed(() => inspectionStore.completedInspectionTasks)
const overdueTasks = computed(() => inspectionStore.overdueInspectionTasks)

const filterForm = ref({
  caveName: '',
  areaId: '',
  assigneeId: '',
  status: '',
  priority: '',
  dateRange: [] as [string, string] | [],
  keyword: '',
})

const planForm = ref({
  planName: '',
  caveName: '',
  areaIds: [] as string[],
  cycleType: 'weekly' as InspectionCycleType,
  customDays: 7,
  startDate: '',
  endDate: '',
  assigneeIds: [] as string[],
  priority: 'medium' as InspectionPriority,
  reminderDays: 1,
  description: '',
})

const taskForm = ref({
  taskName: '',
  caveName: '',
  areaId: '',
  assigneeId: '',
  priority: 'medium' as InspectionPriority,
  scheduledDate: '',
  dueDate: '',
  findings: '',
  hasAbnormality: false,
  abnormalityDescription: '',
})

const currentMonth = ref(new Date())
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: { date: Date; dateStr: string; isCurrentMonth: boolean; tasks: InspectionTask[] }[] = []

  const startPadding = firstDay.getDay()
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      tasks: inspectionStore.getInspectionTasksByDate(date.toISOString().split('T')[0]),
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: true,
      tasks: inspectionStore.getInspectionTasksByDate(date.toISOString().split('T')[0]),
    })
  }

  const endPadding = 42 - days.length
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      tasks: inspectionStore.getInspectionTasksByDate(date.toISOString().split('T')[0]),
    })
  }

  return days
})

const areaOptions = computed(() => {
  if (!filterForm.value.caveName && !planForm.value.caveName) return []
  const caveName = filterForm.value.caveName || planForm.value.caveName
  return areas.value
    .filter((a) => a.caveName === caveName)
    .map((a) => ({ label: `${a.areaCode} - ${a.theme}`, value: a.id }))
})

const inspectorOptions = computed(() => {
  return inspectors.value.map((i) => ({ label: `${i.name} (${i.department})`, value: i.id }))
})

const workloadPieOption = computed(() =>
  createPieOption(stats.value.workloadDistribution, '人员工作量分布')
)

const caveBarOption = computed(() =>
  createBarOption(stats.value.caveTaskDistribution, '各洞窟任务分布', '#c4a76c')
)

const completionBarOption = computed(() => {
  const data = stats.value.monthlyCompletion
  return {
    title: { text: '月度任务完成趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['已完成', '总数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map((d) => d.date),
    },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: '已完成',
        type: 'bar' as const,
        data: data.map((d) => d.completed),
        itemStyle: { color: '#67C23A' },
      },
      {
        name: '总数',
        type: 'bar' as const,
        data: data.map((d) => d.total),
        itemStyle: { color: '#c4a76c' },
      },
    ],
  } as any
})

useECharts(workloadChartRef, workloadPieOption.value)
useECharts(caveChartRef, caveBarOption.value)
useECharts(completionChartRef, completionBarOption.value)

onMounted(() => {
  inspectionStore.resetInspectionFilterParams()
})

function applyFilter() {
  inspectionStore.setInspectionFilterParams({
    caveName: filterForm.value.caveName,
    areaId: filterForm.value.areaId,
    assigneeId: filterForm.value.assigneeId,
    status: filterForm.value.status as InspectionTaskStatus,
    priority: filterForm.value.priority as InspectionPriority,
    dateRange: filterForm.value.dateRange,
    keyword: filterForm.value.keyword,
  })
}

function resetFilter() {
  filterForm.value = {
    caveName: '',
    areaId: '',
    assigneeId: '',
    status: '',
    priority: '',
    dateRange: [],
    keyword: '',
  }
  inspectionStore.resetInspectionFilterParams()
}

function getTaskStatusColor(status: string): string {
  const option = taskStatusOptions.find((o) => o.value === status)
  return option?.color || '#909399'
}

function getTaskStatusLabel(status: string): string {
  const option = taskStatusOptions.find((o) => o.value === status)
  return option?.label || status
}

function getPriorityColor(priority: string): string {
  const option = priorityOptions.find((o) => o.value === priority)
  return option?.color || '#909399'
}

function getPriorityLabel(priority: string): string {
  const option = priorityOptions.find((o) => o.value === priority)
  return option?.label || priority
}

function openPlanDialog(plan?: InspectionPlan) {
  if (plan) {
    editingPlan.value = plan
    planForm.value = {
      planName: plan.planName,
      caveName: plan.caveName,
      areaIds: plan.areaIds,
      cycleType: plan.cycleType,
      customDays: plan.customDays || 7,
      startDate: plan.startDate,
      endDate: plan.endDate || '',
      assigneeIds: plan.assigneeIds,
      priority: plan.priority,
      reminderDays: plan.reminderDays,
      description: plan.description,
    }
  } else {
    editingPlan.value = null
    planForm.value = {
      planName: '',
      caveName: '',
      areaIds: [],
      cycleType: 'weekly',
      customDays: 7,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      assigneeIds: [],
      priority: 'medium',
      reminderDays: 1,
      description: '',
    }
  }
  showPlanDialog.value = true
}

function savePlan() {
  if (!planForm.value.planName) {
    ElMessage.warning('请输入计划名称')
    return
  }
  if (!planForm.value.caveName) {
    ElMessage.warning('请选择洞窟')
    return
  }
  if (planForm.value.areaIds.length === 0) {
    ElMessage.warning('请选择巡检区域')
    return
  }
  if (planForm.value.assigneeIds.length === 0) {
    ElMessage.warning('请分配巡检人员')
    return
  }

  if (editingPlan.value) {
    inspectionStore.updateInspectionPlan(editingPlan.value.id, {
      ...planForm.value,
      isActive: editingPlan.value.isActive,
      createdBy: editingPlan.value.createdBy,
    })
    ElMessage.success('巡检计划已更新')
  } else {
    inspectionStore.addInspectionPlan({
      ...planForm.value,
      isActive: true,
      createdBy: '当前用户',
    })
    ElMessage.success('巡检计划已创建')
  }

  showPlanDialog.value = false
}

function deletePlan(id: string) {
  ElMessageBox.confirm('确定要删除该巡检计划吗？相关任务也会被删除。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      inspectionStore.deleteInspectionPlan(id)
      ElMessage.success('巡检计划已删除')
    })
    .catch(() => {})
}

function togglePlanStatus(plan: InspectionPlan) {
  inspectionStore.updateInspectionPlan(plan.id, { isActive: !plan.isActive })
  ElMessage.success(plan.isActive ? '计划已暂停' : '计划已激活')
}

function openTaskDialog() {
  taskForm.value = {
    taskName: '',
    caveName: '',
    areaId: '',
    assigneeId: '',
    priority: 'medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    findings: '',
    hasAbnormality: false,
    abnormalityDescription: '',
  }
  showTaskDialog.value = true
}

function saveTask() {
  if (!taskForm.value.taskName) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!taskForm.value.caveName) {
    ElMessage.warning('请选择洞窟')
    return
  }
  if (!taskForm.value.areaId) {
    ElMessage.warning('请选择区域')
    return
  }
  if (!taskForm.value.assigneeId) {
    ElMessage.warning('请分配巡检人员')
    return
  }

  const area = areas.value.find((a) => a.id === taskForm.value.areaId)
  const inspector = inspectors.value.find((i) => i.id === taskForm.value.assigneeId)

  inspectionStore.addInspectionTask({
    planId: '',
    taskName: taskForm.value.taskName,
    caveName: taskForm.value.caveName,
    areaId: taskForm.value.areaId,
    areaCode: area?.areaCode || '',
    assigneeId: taskForm.value.assigneeId,
    assigneeName: inspector?.name || '',
    status: 'pending',
    priority: taskForm.value.priority,
    scheduledDate: taskForm.value.scheduledDate,
    dueDate: taskForm.value.dueDate || taskForm.value.scheduledDate,
    checkItems: [],
    findings: '',
    hasAbnormality: false,
    photos: [],
    createdBy: '当前用户',
  })

  ElMessage.success('巡检任务已创建')
  showTaskDialog.value = false
}

function openTaskDetail(task: InspectionTask) {
  selectedTask.value = task
  showTaskDetailDialog.value = true
}

function startTask(task: InspectionTask) {
  inspectionStore.startInspectionTask(task.id)
  ElMessage.success('任务已开始')
}

function completeTask(task: InspectionTask) {
  selectedTask.value = task
  showTaskDetailDialog.value = true
}

function submitTaskCompletion() {
  if (!selectedTask.value) return

  if (!taskForm.value.findings) {
    ElMessage.warning('请填写巡检结果')
    return
  }

  inspectionStore.completeInspectionTask(
    selectedTask.value.id,
    taskForm.value.findings,
    taskForm.value.hasAbnormality,
    taskForm.value.hasAbnormality ? taskForm.value.abnormalityDescription : undefined
  )

  ElMessage.success('任务已完成')
  showTaskDetailDialog.value = false
  selectedTask.value = null
}

function deleteTask(id: string) {
  ElMessageBox.confirm('确定要删除该巡检任务吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      inspectionStore.deleteInspectionTask(id)
      ElMessage.success('巡检任务已删除')
    })
    .catch(() => {})
}

function goToPrevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function goToNextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToToday() {
  currentMonth.value = new Date()
}

function getInspectorName(id: string): string {
  return inspectors.value.find((i) => i.id === id)?.name || id
}

function getAreaCode(areaId: string): string {
  return areas.value.find((a) => a.id === areaId)?.areaCode || areaId
}
</script>

<template>
  <div class="inspection-center">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">
            多洞窟联合巡检排期与任务协同中心
          </h1>
          <p class="page-subtitle">
            支持按洞窟/区域生成巡检计划、分配文保人员、设置巡检周期、记录执行过程与结果
          </p>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            @click="openPlanDialog"
          >
            <el-icon><Calendar /></el-icon>
            创建巡检计划
          </el-button>
          <el-button @click="openTaskDialog">
            <el-icon><Plus /></el-icon>
            新增任务
          </el-button>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <StatCard
        title="巡检任务总数"
        :value="stats.totalTasks"
        icon="DocumentCopy"
        color="#c4a76c"
        suffix="个"
        trend-label="累计创建"
      />
      <StatCard
        title="巡检完成率"
        :value="stats.completionRate"
        icon="CircleCheck"
        color="#67c23a"
        suffix="%"
        trend-label="任务完成"
      />
      <StatCard
        title="进行中任务"
        :value="stats.inProgressTasks"
        icon="Loading"
        color="#409eff"
        suffix="个"
        trend-label="正在执行"
      />
      <StatCard
        title="逾期任务"
        :value="stats.overdueTasks"
        icon="Warning"
        color="#f56c6c"
        suffix="个"
        trend-label="需要关注"
      />
      <StatCard
        title="巡检计划"
        :value="stats.activePlans"
        icon="Calendar"
        color="#5f9ea0"
        suffix="个"
        trend-label="进行中"
      />
      <StatCard
        title="文保人员"
        :value="stats.inspectors.length"
        icon="User"
        color="#9b59b6"
        suffix="人"
        trend-label="参与巡检"
      />
    </div>

    <el-row
      :gutter="16"
      class="chart-row"
    >
      <el-col :span="8">
        <div class="chart-card">
          <div
            ref="workloadChartRef"
            class="chart-container"
          />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div
            ref="caveChartRef"
            class="chart-container"
          />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div
            ref="completionChartRef"
            class="chart-container"
          />
        </div>
      </el-col>
    </el-row>

    <div class="view-switch-card">
      <div class="view-switch">
        <el-radio-group
          v-model="activeView"
          size="large"
        >
          <el-radio-button value="list">
            <el-icon><List /></el-icon>
            列表视图
          </el-radio-button>
          <el-radio-button value="kanban">
            <el-icon><Grid /></el-icon>
            任务看板
          </el-radio-button>
          <el-radio-button value="calendar">
            <el-icon><Calendar /></el-icon>
            日历视图
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="filter-section">
        <el-form
          :inline="true"
          :model="filterForm"
          class="filter-form"
        >
          <el-form-item label="洞窟">
            <el-select
              v-model="filterForm.caveName"
              placeholder="选择洞窟"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="cave in caveOptions"
                :key="cave"
                :label="cave"
                :value="cave"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="区域">
            <el-select
              v-model="filterForm.areaId"
              placeholder="选择区域"
              clearable
              style="width: 180px"
              :disabled="!filterForm.caveName"
            >
              <el-option
                v-for="area in areaOptions"
                :key="area.value"
                :label="area.label"
                :value="area.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="执行人">
            <el-select
              v-model="filterForm.assigneeId"
              placeholder="选择人员"
              clearable
              style="width: 160px"
            >
              <el-option
                v-for="inspector in inspectorOptions"
                :key="inspector.value"
                :label="inspector.label"
                :value="inspector.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filterForm.status"
              placeholder="选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="opt in taskStatusOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select
              v-model="filterForm.priority"
              placeholder="选择优先级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="opt in priorityOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索任务"
              clearable
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="small"
              @click="applyFilter"
            >
              <el-icon><Search /></el-icon>
              筛选
            </el-button>
            <el-button
              size="small"
              @click="resetFilter"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="content-card">
      <template v-if="activeView === 'list'">
        <el-tabs v-model="activeTab">
          <el-tab-pane
            label="全部任务"
            name="tasks"
          >
            <div class="task-list">
              <div
                v-for="task in tasks"
                :key="task.id"
                class="task-item"
                @click="openTaskDetail(task)"
              >
                <div class="task-header">
                  <div class="task-info">
                    <el-tag
                      :style="{ backgroundColor: getPriorityColor(task.priority), borderColor: getPriorityColor(task.priority) }"
                      effect="dark"
                      size="small"
                    >
                      {{ getPriorityLabel(task.priority) }}
                    </el-tag>
                    <span class="task-name">{{ task.taskName }}</span>
                    <el-tag
                      :style="{ backgroundColor: getTaskStatusColor(task.status), borderColor: getTaskStatusColor(task.status) }"
                      effect="dark"
                      size="small"
                    >
                      {{ getTaskStatusLabel(task.status) }}
                    </el-tag>
                    <el-tag
                      v-if="task.hasAbnormality"
                      type="danger"
                      size="small"
                      effect="light"
                    >
                      发现异常
                    </el-tag>
                  </div>
                  <div class="task-actions">
                    <el-button
                      v-if="task.status === 'pending'"
                      size="small"
                      type="primary"
                      @click.stop="startTask(task)"
                    >
                      开始执行
                    </el-button>
                    <el-button
                      v-if="task.status === 'inProgress'"
                      size="small"
                      type="success"
                      @click.stop="completeTask(task)"
                    >
                      完成任务
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      @click.stop="deleteTask(task.id)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="task-body">
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><Location /></el-icon>
                      {{ task.caveName }} / {{ task.areaCode }}
                    </span>
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ task.assigneeName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      计划: {{ task.scheduledDate }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      截止: {{ task.dueDate }}
                    </span>
                  </div>
                  <div
                    v-if="task.findings"
                    class="task-findings"
                  >
                    <strong>巡检结果:</strong> {{ task.findings }}
                  </div>
                </div>
              </div>
              <el-empty
                v-if="tasks.length === 0"
                description="暂无巡检任务"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane
            label="巡检计划"
            name="plans"
          >
            <div class="plan-list">
              <div
                v-for="plan in plans"
                :key="plan.id"
                class="plan-item"
                :class="{ disabled: !plan.isActive }"
              >
                <div class="plan-header">
                  <div class="plan-info">
                    <span class="plan-name">{{ plan.planName }}</span>
                    <el-tag
                      :type="plan.isActive ? 'success' : 'info'"
                      size="small"
                      effect="light"
                    >
                      {{ plan.isActive ? '进行中' : '已暂停' }}
                    </el-tag>
                    <el-tag
                      :style="{ backgroundColor: getPriorityColor(plan.priority), borderColor: getPriorityColor(plan.priority) }"
                      effect="dark"
                      size="small"
                    >
                      {{ getPriorityLabel(plan.priority) }}
                    </el-tag>
                  </div>
                  <div class="plan-actions">
                    <el-button
                      size="small"
                      @click="togglePlanStatus(plan)"
                    >
                      {{ plan.isActive ? '暂停' : '激活' }}
                    </el-button>
                    <el-button
                      size="small"
                      @click="openPlanDialog(plan)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      @click="deletePlan(plan.id)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="plan-body">
                  <div class="plan-meta">
                    <span class="meta-item">
                      <el-icon><Location /></el-icon>
                      {{ plan.caveName }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Refresh /></el-icon>
                      {{ cycleOptions.find((c) => c.value === plan.cycleType)?.label }}
                    </span>
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ plan.assigneeIds.map((id) => getInspectorName(id)).join(', ') }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      开始: {{ plan.startDate }}
                    </span>
                    <span
                      v-if="plan.endDate"
                      class="meta-item"
                    >
                      <el-icon><Clock /></el-icon>
                      结束: {{ plan.endDate }}
                    </span>
                  </div>
                  <div class="plan-areas">
                    <strong>巡检区域:</strong>
                    <el-tag
                      v-for="areaId in plan.areaIds"
                      :key="areaId"
                      size="small"
                      effect="light"
                    >
                      {{ getAreaCode(areaId) }}
                    </el-tag>
                  </div>
                  <div
                    v-if="plan.description"
                    class="plan-description"
                  >
                    {{ plan.description }}
                  </div>
                </div>
              </div>
              <el-empty
                v-if="plans.length === 0"
                description="暂无巡检计划，点击右上角「创建巡检计划」开始"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane
            label="人员工作量"
            name="workload"
          >
            <div class="workload-grid">
              <div
                v-for="inspector in stats.inspectors"
                :key="inspector.id"
                class="workload-card"
              >
                <div class="workload-header">
                  <div class="avatar">
                    <el-icon :size="32">
                      <User />
                    </el-icon>
                  </div>
                  <div class="info">
                    <div class="name">
                      {{ inspector.name }}
                    </div>
                    <div class="dept">
                      {{ inspector.department }}
                    </div>
                  </div>
                </div>
                <div class="workload-stats">
                  <div class="stat-item">
                    <div class="stat-value">
                      {{ inspector.taskCount }}
                    </div>
                    <div class="stat-label">
                      总任务数
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">
                      {{ inspector.completedCount }}
                    </div>
                    <div class="stat-label">
                      已完成
                    </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">
                      {{ inspector.workload }}%
                    </div>
                    <div class="stat-label">
                      工作负荷
                    </div>
                  </div>
                </div>
                <div class="workload-progress">
                  <el-progress
                    :percentage="inspector.workload"
                    :color="inspector.workload > 90 ? '#f56c6c' : inspector.workload > 70 ? '#e6a23c' : '#67c23a'"
                  />
                </div>
                <div class="specialties">
                  <el-tag
                    v-for="s in inspector.specialty"
                    :key="s"
                    size="small"
                    effect="light"
                  >
                    {{ s }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>

      <template v-else-if="activeView === 'kanban'">
        <div class="kanban-board">
          <div class="kanban-column">
            <div class="column-header pending">
              <span class="column-title">待执行</span>
              <el-badge
                :value="pendingTasks.length"
                class="item"
              />
            </div>
            <div class="column-content">
              <div
                v-for="task in pendingTasks"
                :key="task.id"
                class="kanban-card"
                @click="openTaskDetail(task)"
              >
                <div class="card-title">
                  {{ task.taskName }}
                </div>
                <div class="card-meta">
                  <span>{{ task.areaCode }}</span>
                  <span>{{ task.assigneeName }}</span>
                </div>
                <div class="card-footer">
                  <el-tag
                    :style="{ backgroundColor: getPriorityColor(task.priority) }"
                    size="small"
                    effect="dark"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </el-tag>
                  <span class="date">{{ task.scheduledDate }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="column-header in-progress">
              <span class="column-title">进行中</span>
              <el-badge
                :value="inProgressTasks.length"
                class="item"
              />
            </div>
            <div class="column-content">
              <div
                v-for="task in inProgressTasks"
                :key="task.id"
                class="kanban-card"
                @click="openTaskDetail(task)"
              >
                <div class="card-title">
                  {{ task.taskName }}
                </div>
                <div class="card-meta">
                  <span>{{ task.areaCode }}</span>
                  <span>{{ task.assigneeName }}</span>
                </div>
                <div class="card-footer">
                  <el-tag
                    :style="{ backgroundColor: getPriorityColor(task.priority) }"
                    size="small"
                    effect="dark"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </el-tag>
                  <span class="date">{{ task.scheduledDate }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="column-header completed">
              <span class="column-title">已完成</span>
              <el-badge
                :value="completedTasks.length"
                class="item"
              />
            </div>
            <div class="column-content">
              <div
                v-for="task in completedTasks"
                :key="task.id"
                class="kanban-card completed"
                @click="openTaskDetail(task)"
              >
                <div class="card-title">
                  {{ task.taskName }}
                </div>
                <div class="card-meta">
                  <span>{{ task.areaCode }}</span>
                  <span>{{ task.assigneeName }}</span>
                </div>
                <div class="card-footer">
                  <el-tag
                    v-if="task.hasAbnormality"
                    type="danger"
                    size="small"
                    effect="light"
                  >
                    发现异常
                  </el-tag>
                  <span class="date">{{ task.completedAt }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="column-header overdue">
              <span class="column-title">已逾期</span>
              <el-badge
                :value="overdueTasks.length"
                type="danger"
                class="item"
              />
            </div>
            <div class="column-content">
              <div
                v-for="task in overdueTasks"
                :key="task.id"
                class="kanban-card overdue"
                @click="openTaskDetail(task)"
              >
                <div class="card-title">
                  {{ task.taskName }}
                </div>
                <div class="card-meta">
                  <span>{{ task.areaCode }}</span>
                  <span>{{ task.assigneeName }}</span>
                </div>
                <div class="card-footer">
                  <el-tag
                    :style="{ backgroundColor: getPriorityColor(task.priority) }"
                    size="small"
                    effect="dark"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </el-tag>
                  <span class="date overdue-date">逾期: {{ task.dueDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="activeView === 'calendar'">
        <div class="calendar-view">
          <div class="calendar-header">
            <el-button-group>
              <el-button @click="goToPrevMonth">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <el-button @click="goToToday">
                今天
              </el-button>
              <el-button @click="goToNextMonth">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-button-group>
            <div class="month-title">
              {{ currentMonth.getFullYear() }}年{{ currentMonth.getMonth() + 1 }}月
            </div>
          </div>

          <div class="calendar-weekdays">
            <div
              v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
              :key="day"
              class="weekday"
            >
              {{ day }}
            </div>
          </div>

          <div class="calendar-grid">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.dateStr === new Date().toISOString().split('T')[0],
              }"
            >
              <div class="day-number">
                {{ day.date.getDate() }}
              </div>
              <div class="day-tasks">
                <div
                  v-for="task in day.tasks.slice(0, 3)"
                  :key="task.id"
                  class="day-task"
                  :class="task.status"
                  @click.stop="openTaskDetail(task)"
                >
                  <span
                    class="task-dot"
                    :style="{ backgroundColor: getTaskStatusColor(task.status) }"
                  />
                  <span class="task-text">{{ task.taskName }}</span>
                </div>
                <div
                  v-if="day.tasks.length > 3"
                  class="more-tasks"
                >
                  +{{ day.tasks.length - 3 }} 更多
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <el-dialog
      v-model="showPlanDialog"
      :title="editingPlan ? '编辑巡检计划' : '创建巡检计划'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="planForm"
        label-width="100px"
      >
        <el-form-item
          label="计划名称"
          required
        >
          <el-input
            v-model="planForm.planName"
            placeholder="请输入计划名称"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              label="选择洞窟"
              required
            >
              <el-select
                v-model="planForm.caveName"
                placeholder="请选择洞窟"
                style="width: 100%"
                @change="planForm.areaIds = []"
              >
                <el-option
                  v-for="cave in caveOptions"
                  :key="cave"
                  :label="cave"
                  :value="cave"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="巡检周期"
              required
            >
              <el-select
                v-model="planForm.cycleType"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in cycleOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item
          v-if="planForm.cycleType === 'custom'"
          label="自定义天数"
        >
          <el-input-number
            v-model="planForm.customDays"
            :min="1"
            :max="365"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item
          label="巡检区域"
          required
        >
          <el-select
            v-model="planForm.areaIds"
            multiple
            placeholder="请选择巡检区域"
            style="width: 100%"
            :disabled="!planForm.caveName"
          >
            <el-option
              v-for="area in areaOptions"
              :key="area.value"
              :label="area.label"
              :value="area.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="分配人员"
          required
        >
          <el-select
            v-model="planForm.assigneeIds"
            multiple
            placeholder="请分配巡检人员"
            style="width: 100%"
          >
            <el-option
              v-for="inspector in inspectorOptions"
              :key="inspector.value"
              :label="inspector.label"
              :value="inspector.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              label="开始日期"
              required
            >
              <el-date-picker
                v-model="planForm.startDate"
                type="date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="planForm.endDate"
                type="date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select
                v-model="planForm.priority"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提前提醒">
              <el-input-number
                v-model="planForm.reminderDays"
                :min="0"
                :max="7"
                style="width: 200px"
              />
              <span style="margin-left: 8px">天</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="计划描述">
          <el-input
            v-model="planForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入计划描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPlanDialog = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="savePlan"
        >
          {{ editingPlan ? '保存修改' : '创建计划' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTaskDialog"
      title="新增巡检任务"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="taskForm"
        label-width="100px"
      >
        <el-form-item
          label="任务名称"
          required
        >
          <el-input
            v-model="taskForm.taskName"
            placeholder="请输入任务名称"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              label="选择洞窟"
              required
            >
              <el-select
                v-model="taskForm.caveName"
                placeholder="请选择洞窟"
                style="width: 100%"
                @change="taskForm.areaId = ''"
              >
                <el-option
                  v-for="cave in caveOptions"
                  :key="cave"
                  :label="cave"
                  :value="cave"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="选择区域"
              required
            >
              <el-select
                v-model="taskForm.areaId"
                placeholder="请选择区域"
                style="width: 100%"
                :disabled="!taskForm.caveName"
              >
                <el-option
                  v-for="area in areaOptions"
                  :key="area.value"
                  :label="area.label"
                  :value="area.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item
          label="执行人"
          required
        >
          <el-select
            v-model="taskForm.assigneeId"
            placeholder="请选择执行人"
            style="width: 100%"
          >
            <el-option
              v-for="inspector in inspectorOptions"
              :key="inspector.value"
              :label="inspector.label"
              :value="inspector.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              label="计划日期"
              required
            >
              <el-date-picker
                v-model="taskForm.scheduledDate"
                type="date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="taskForm.dueDate"
                type="date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="优先级">
          <el-select
            v-model="taskForm.priority"
            style="width: 100%"
          >
            <el-option
              v-for="opt in priorityOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDialog = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="saveTask"
        >
          创建任务
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTaskDetailDialog"
      title="任务详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div
        v-if="selectedTask"
        class="task-detail"
      >
        <div class="detail-header">
          <h3>{{ selectedTask.taskName }}</h3>
          <div class="detail-tags">
            <el-tag
              :style="{ backgroundColor: getTaskStatusColor(selectedTask.status), borderColor: getTaskStatusColor(selectedTask.status) }"
              effect="dark"
            >
              {{ getTaskStatusLabel(selectedTask.status) }}
            </el-tag>
            <el-tag
              :style="{ backgroundColor: getPriorityColor(selectedTask.priority), borderColor: getPriorityColor(selectedTask.priority) }"
              effect="dark"
            >
              {{ getPriorityLabel(selectedTask.priority) }}
            </el-tag>
            <el-tag
              v-if="selectedTask.hasAbnormality"
              type="danger"
              effect="light"
            >
              发现异常
            </el-tag>
          </div>
        </div>

        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="洞窟">
            {{ selectedTask.caveName }}
          </el-descriptions-item>
          <el-descriptions-item label="区域">
            {{ selectedTask.areaCode }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ selectedTask.assigneeName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ selectedTask.createdBy }}
          </el-descriptions-item>
          <el-descriptions-item label="计划日期">
            {{ selectedTask.scheduledDate }}
          </el-descriptions-item>
          <el-descriptions-item label="截止日期">
            {{ selectedTask.dueDate }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedTask.startedAt"
            label="开始时间"
          >
            {{ selectedTask.startedAt }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedTask.completedAt"
            label="完成时间"
          >
            {{ selectedTask.completedAt }}
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="selectedTask.checkItems.length > 0"
          class="checklist-section"
        >
          <h4>检查清单</h4>
          <div class="checklist">
            <div
              v-for="item in selectedTask.checkItems"
              :key="item.id"
              class="check-item"
            >
              <el-checkbox
                :model-value="item.isChecked"
                disabled
              />
              <span :class="{ checked: item.isChecked }">{{ item.name }}</span>
              <el-tag
                v-if="item.isRequired"
                type="warning"
                size="small"
              >
                必填
              </el-tag>
            </div>
          </div>
        </div>

        <div
          v-if="selectedTask.status === 'inProgress'"
          class="complete-section"
        >
          <h4>完成任务</h4>
          <el-form
            :model="taskForm"
            label-width="100px"
          >
            <el-form-item
              label="巡检结果"
              required
            >
              <el-input
                v-model="taskForm.findings"
                type="textarea"
                :rows="3"
                placeholder="请输入巡检结果说明"
              />
            </el-form-item>
            <el-form-item label="是否异常">
              <el-switch v-model="taskForm.hasAbnormality" />
            </el-form-item>
            <el-form-item
              v-if="taskForm.hasAbnormality"
              label="异常描述"
              required
            >
              <el-input
                v-model="taskForm.abnormalityDescription"
                type="textarea"
                :rows="2"
                placeholder="请描述发现的异常情况"
              />
            </el-form-item>
          </el-form>
        </div>

        <div
          v-if="selectedTask.findings"
          class="findings-section"
        >
          <h4>巡检结果</h4>
          <p>{{ selectedTask.findings }}</p>
          <div
            v-if="selectedTask.abnormalityDescription"
            class="abnormality"
          >
            <el-icon color="#f56c6c">
              <WarningFilled />
            </el-icon>
            <span>异常说明: {{ selectedTask.abnormalityDescription }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTaskDetailDialog = false; selectedTask = null">
          关闭
        </el-button>
        <el-button
          v-if="selectedTask?.status === 'inProgress'"
          type="primary"
          @click="submitTaskCompletion"
        >
          提交完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.inspection-center {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-title {
  font-size: var(--font-size-2xl);
  margin-bottom: 4px;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.view-switch-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  margin-bottom: 16px;
}

.view-switch {
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.content-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;

  :deep(.el-tabs__header) {
    margin: 0 0 20px 0;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text-primary);
}

.task-actions {
  display: flex;
  gap: 8px;
}

.task-body {
  .task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .task-findings {
    font-size: 14px;
    color: var(--color-text-regular);
    padding-top: 8px;
    border-top: 1px solid var(--color-border-lighter);
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-item {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }

  &.disabled {
    opacity: 0.6;
  }
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text-primary);
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.plan-body {
  .plan-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .plan-areas {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .plan-description {
    font-size: 13px;
    color: var(--color-text-regular);
    padding-top: 8px;
    border-top: 1px solid var(--color-border-lighter);
  }
}

.workload-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.workload-card {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }
}

.workload-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .avatar {
    width: 48px;
    height: 48px;
    background: var(--color-bg-body);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-placeholder);
  }

  .info {
    .name {
      font-weight: 600;
      font-size: 16px;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }

    .dept {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  }
}

.workload-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  }
}

.workload-progress {
  margin-bottom: 12px;
}

.specialties {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-height: 500px;
}

.kanban-column {
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
  padding: 12px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: var(--border-radius-base);
  font-weight: 600;

  &.pending {
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
  }

  &.in-progress {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }

  &.completed {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }

  &.overdue {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 400px;
}

.kanban-card {
  background: #fff;
  border-radius: var(--border-radius-base);
  padding: 12px;
  cursor: pointer;
  box-shadow: var(--color-shadow-light);
  transition: var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--color-shadow-base);
  }

  &.completed {
    opacity: 0.8;
  }

  &.overdue {
    border-left: 3px solid #f56c6c;
  }

  .card-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .date {
      font-size: 12px;
      color: var(--color-text-placeholder);
    }

    .overdue-date {
      color: #f56c6c;
    }
  }
}

.calendar-view {
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .month-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;

    .weekday {
      text-align: center;
      font-weight: 600;
      color: var(--color-text-secondary);
      padding: 8px;
    }
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .calendar-day {
    min-height: 120px;
    border: 1px solid var(--color-border-lighter);
    border-radius: var(--border-radius-base);
    padding: 8px;
    background: #fff;
    transition: var(--transition-fast);

    &:hover {
      border-color: var(--color-primary);
    }

    &.other-month {
      background: var(--color-bg-body);
      opacity: 0.5;
    }

    &.today {
      border-color: var(--color-primary);
      background: rgba(196, 167, 108, 0.05);

      .day-number {
        background: var(--color-primary);
        color: #fff;
      }
    }

    .day-number {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .day-tasks {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .day-task {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        background: var(--color-bg-body);
        transition: var(--transition-fast);

        &:hover {
          background: rgba(196, 167, 108, 0.1);
        }

        .task-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .more-tasks {
        font-size: 11px;
        color: var(--color-text-placeholder);
        padding-left: 10px;
      }
    }
  }
}

.task-detail {
  .detail-header {
    margin-bottom: 20px;

    h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
      color: var(--color-text-primary);
    }

    .detail-tags {
      display: flex;
      gap: 8px;
    }
  }

  .checklist-section,
  .complete-section,
  .findings-section {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--color-text-primary);
    }
  }

  .checklist {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .checked {
        text-decoration: line-through;
        color: var(--color-text-placeholder);
      }
    }
  }

  .findings-section {
    p {
      margin: 0;
      padding: 12px;
      background: var(--color-bg-body);
      border-radius: var(--border-radius-base);
      line-height: 1.6;
    }

    .abnormality {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 12px;
      padding: 12px;
      background: rgba(245, 108, 108, 0.05);
      border: 1px solid rgba(245, 108, 108, 0.2);
      border-radius: var(--border-radius-base);
      color: #f56c6c;
    }
  }
}

@media (max-width: 1600px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .workload-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row .el-col {
    width: 100% !important;
    margin-bottom: 16px;
  }

  .kanban-board {
    grid-template-columns: repeat(2, 1fr);
  }

  .workload-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .kanban-board {
    grid-template-columns: 1fr;
  }

  .calendar-grid {
    gap: 2px;
  }

  .calendar-day {
    min-height: 80px;
    padding: 4px;

    .day-tasks {
      .day-task {
        font-size: 10px;
        padding: 2px 4px;
      }
    }
  }
}
</style>