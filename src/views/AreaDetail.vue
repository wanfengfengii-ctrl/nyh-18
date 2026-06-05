<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useMuralStore } from '@/stores/mural'
import { useECharts } from '@/composables/useECharts'
import type { RiskLevel, ProcessingStatus, FadingLevel, ObservationRecord } from '@/types'
import {
  FADING_LEVEL_OPTIONS,
  PROCESSING_STATUS_OPTIONS,
} from '@/types'
import {
  getRiskLabel,
  getRiskColor,
  getFadingLabel,
  getProcessingLabel,
} from '@/utils'

const router = useRouter()
const route = useRoute()
const store = useMuralStore()

const areaId = computed(() => route.params.id as string)
const area = computed(() => store.getAreaById(areaId.value))
const observations = computed(() => store.areaObservations)
const riskTrend = computed(() => store.getRiskTrendByAreaId(areaId.value))

const showAddObservation = ref(false)
const showEditObservation = ref(false)
const activeTab = ref('timeline')
const selectedObservation = ref<ObservationRecord | null>(null)
const showObservationDetail = ref(false)

const newObservationFormRef = ref()
const newObservation = ref({
  observationDate: new Date().toISOString().split('T')[0],
  fadingLevel: 'mild' as FadingLevel,
  crackLength: 0,
  processingStatus: 'pending' as ProcessingStatus,
  remarks: '',
  images: [] as string[],
})

const editObservationFormRef = ref()
const editObservation = ref({
  id: '',
  observationDate: '',
  fadingLevel: 'mild' as FadingLevel,
  crackLength: 0,
  processingStatus: 'pending' as ProcessingStatus,
  remarks: '',
  images: [] as string[],
})

const observationFormRules = {
  observationDate: [
    { required: true, message: '请选择观察日期', trigger: 'change' },
  ],
  fadingLevel: [
    { required: true, message: '请选择褪变等级', trigger: 'change' },
  ],
  crackLength: [
    { required: true, message: '请输入裂隙长度', trigger: 'blur' },
    { type: 'number', min: 0, message: '裂隙长度不能为负数', trigger: 'blur' },
  ],
  processingStatus: [
    { required: true, message: '请选择处理状态', trigger: 'change' },
  ],
}

const trendChartRef = ref<HTMLElement | null>(null)

const trendChartOption = computed(() => {
  const data = riskTrend.value
  const dates = data.map((d) => d.date)
  const riskValues = data.map((d) => {
    const map: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
    return map[d.riskLevel]
  })
  const crackValues = data.map((d) => d.crackLength)

  return {
    title: { text: '风险变化趋势', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const date = params[0].axisValue
        const riskItem = params.find((p: any) => p.seriesName === '风险等级')
        const crackItem = params.find((p: any) => p.seriesName === '裂隙长度')
        const riskLabels: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险' }
        return `
          <div style="font-weight: 600; margin-bottom: 4px">${date}</div>
          <div>风险等级: ${riskLabels[riskItem.value] || '-'}</div>
          <div>裂隙长度: ${crackItem.value} cm</div>
        `
      },
    },
    legend: { data: ['风险等级', '裂隙长度'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: { type: 'category' as const, data: dates, boundaryGap: false },
    yAxis: [
      {
        type: 'value' as const,
        name: '风险等级',
        min: 0,
        max: 4,
        interval: 1,
        axisLabel: {
          formatter: (value: number) => {
            const labels: Record<number, string> = { 1: '低', 2: '中', 3: '高' }
            return labels[value] || ''
          },
        },
      },
      {
        type: 'value' as const,
        name: '裂隙长度(cm)',
        min: 0,
        position: 'right',
      },
    ],
    series: [
      {
        name: '风险等级',
        type: 'line' as const,
        smooth: true,
        data: riskValues,
        itemStyle: { color: '#f56c6c' },
        lineStyle: { color: '#f56c6c', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' },
            ],
          },
        },
      },
      {
        name: '裂隙长度',
        type: 'line' as const,
        smooth: true,
        yAxisIndex: 1,
        data: crackValues,
        itemStyle: { color: '#e6a23c' },
        lineStyle: { color: '#e6a23c', width: 2 },
      },
    ],
  } as any
})

useECharts(trendChartRef, trendChartOption.value)

onMounted(() => {
  if (areaId.value) {
    store.setCurrentArea(areaId.value)
  }
})

watch(areaId, (newId) => {
  if (newId) {
    store.setCurrentArea(newId as string)
  }
})

if (!area.value && areaId.value) {
  ElMessage.error('区域不存在')
  router.replace('/areas')
}

function goBack() {
  router.push('/areas')
}

function riskTagType(level: RiskLevel): 'success' | 'warning' | 'danger' {
  const types: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  }
  return types[level]
}

function statusTagType(status: ProcessingStatus): 'info' | 'warning' | 'success' {
  const types: Record<ProcessingStatus, 'info' | 'warning' | 'success'> = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
  }
  return types[status]
}

function fadingTagType(level: FadingLevel): 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<FadingLevel, 'success' | 'info' | 'warning' | 'danger'> = {
    none: 'success',
    mild: 'info',
    moderate: 'warning',
    severe: 'danger',
  }
  return types[level]
}

function goToEdit() {
  router.push(`/areas/${areaId.value}/edit`)
}

function handleAddObservation() {
  showAddObservation.value = true
}

function submitObservation() {
  newObservationFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const success = store.addObservation(areaId.value, newObservation.value)
      if (success) {
        ElMessage.success('观察记录已添加')
        showAddObservation.value = false
        newObservationFormRef.value.resetFields()
        newObservation.value = {
          observationDate: new Date().toISOString().split('T')[0],
          fadingLevel: 'mild' as FadingLevel,
          crackLength: 0,
          processingStatus: 'pending' as ProcessingStatus,
          remarks: '',
          images: [],
        }
      } else {
        ElMessage.error('添加失败')
      }
    }
  })
}

function handleEditObservation(obs: ObservationRecord) {
  editObservation.value = {
    id: obs.id,
    observationDate: obs.observationDate,
    fadingLevel: obs.fadingLevel,
    crackLength: obs.crackLength,
    processingStatus: obs.processingStatus,
    remarks: obs.remarks,
    images: obs.images || [],
  }
  showEditObservation.value = true
}

function submitEditObservation() {
  editObservationFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const success = store.updateObservation(editObservation.value.id, {
        observationDate: editObservation.value.observationDate,
        fadingLevel: editObservation.value.fadingLevel,
        crackLength: editObservation.value.crackLength,
        processingStatus: editObservation.value.processingStatus,
        remarks: editObservation.value.remarks,
        images: editObservation.value.images,
      })
      if (success) {
        ElMessage.success('观察记录已更新')
        showEditObservation.value = false
      } else {
        ElMessage.error('更新失败')
      }
    }
  })
}

function viewObservationDetail(obs: ObservationRecord) {
  selectedObservation.value = obs
  showObservationDetail.value = true
}

function editObservationFromDetail() {
  if (selectedObservation.value) {
    showObservationDetail.value = false
    handleEditObservation(selectedObservation.value)
  }
}

async function deleteObservation(obs: ObservationRecord) {
  try {
    await ElMessageBox.confirm(
      `确定要删除该观察记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    const success = store.deleteObservation(obs.id)
    if (success) {
      ElMessage.success('删除成功')
      showObservationDetail.value = false
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
  }
}

function updateStatus(status: ProcessingStatus) {
  const success = store.updateProcessingStatus(areaId.value, status)
  if (success) {
    ElMessage.success('状态已更新')
  } else {
    ElMessage.error('更新失败')
  }
}

async function handleDelete() {
  if (!area.value) return
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${area.value.theme}" 的区域档案吗？此操作将同时删除所有相关观察记录，不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    const success = store.deleteArea(areaId.value)
    if (success) {
      ElMessage.success('删除成功')
      router.push('/areas')
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
  }
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const compareObservations = computed(() => {
  if (observations.value.length < 2) return null
  const latest = observations.value[0]
  const first = observations.value[observations.value.length - 1]
  return { latest, first }
})
</script>

<template>
  <div class="area-detail" v-if="area">
    <div class="page-header">
      <el-page-header @back="goBack" content="区域详情">
        <template #extra>
          <el-button @click="goToEdit">
            <el-icon><Edit /></el-icon>
            编辑区域
          </el-button>
          <el-button type="primary" @click="handleAddObservation">
            <el-icon><Plus /></el-icon>
            新增观察
          </el-button>
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除区域
          </el-button>
        </template>
      </el-page-header>
    </div>

    <div class="detail-header">
      <div class="header-info">
        <div class="title-row">
          <h1 class="area-title">{{ area.theme }}</h1>
          <el-tag
            v-if="area.isOverdue"
            type="danger"
            effect="dark"
            class="tag-overdue"
          >
            <el-icon><Warning /></el-icon>
            超期{{ area.overdueDays }}天
          </el-tag>
          <el-tag
            :type="riskTagType(area.currentRiskLevel)"
            size="large"
            effect="dark"
            :style="{ backgroundColor: getRiskColor(area.currentRiskLevel) }"
          >
            {{ getRiskLabel(area.currentRiskLevel) }}
          </el-tag>
        </div>
        <div class="meta-row">
          <span class="meta-item">
            <el-icon><Collection /></el-icon>
            {{ area.caveName }}
          </span>
          <span class="meta-item">
            <el-icon><Tickets /></el-icon>
            {{ area.areaCode }}
          </span>
          <span class="meta-item">
            <el-icon><Location /></el-icon>
            {{ area.location }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ area.dynasty }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            观察 {{ area.observationCount }} 次
          </span>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="观察时间轴" name="timeline">
            <div class="info-card">
              <h3 class="card-title">
                <el-icon><Time /></el-icon>
                观察历史记录
              </h3>
              <div class="timeline">
                <div
                v-for="(obs, index) in observations"
                :key="obs.id"
                class="timeline-item"
                :class="{ first: index === 0 }"
              >
                <div class="timeline-marker" @click="viewObservationDetail(obs)">
                  <div
                    class="marker-dot"
                    :class="`risk-${obs.riskLevel}`"
                  ></div>
                  <div v-if="index < observations.length - 1" class="marker-line"></div>
                </div>
                <div class="timeline-content" @click="viewObservationDetail(obs)">
                  <div class="timeline-date">
                    <span class="date-text">{{ obs.observationDate }}</span>
                    <span v-if="index === 0" class="badge-latest">最新</span>
                  </div>
                  <div class="timeline-tags">
                    <el-tag
                      :type="riskTagType(obs.riskLevel)"
                      size="small"
                      effect="light"
                    >
                      {{ getRiskLabel(obs.riskLevel) }}
                    </el-tag>
                    <el-tag
                      :type="fadingTagType(obs.fadingLevel)"
                      size="small"
                      effect="light"
                    >
                      褪变: {{ getFadingLabel(obs.fadingLevel) }}
                    </el-tag>
                    <el-tag size="small" effect="light">
                      裂隙: {{ obs.crackLength }}cm
                    </el-tag>
                    <el-tag
                      :type="statusTagType(obs.processingStatus)"
                      size="small"
                      effect="light"
                    >
                      {{ getProcessingLabel(obs.processingStatus) }}
                    </el-tag>
                  </div>
                  <div class="timeline-remarks" v-if="obs.remarks">
                    {{ obs.remarks }}
                  </div>
                </div>
                <div class="timeline-actions">
                  <el-button
                    type="primary"
                    size="small"
                    :icon="Edit"
                    text
                    @click.stop="handleEditObservation(obs)"
                  >
                    编辑
                  </el-button>
                </div>
              </div>
                <el-empty v-if="observations.length === 0" description="暂无观察记录" />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="风险趋势" name="trend">
            <div class="info-card">
              <div ref="trendChartRef" class="chart-container"></div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="前后对比" name="compare">
            <div class="info-card">
              <h3 class="card-title">
                <el-icon><Comparison /></el-icon>
                首次与最新观察对比
              </h3>
              <div v-if="compareObservations" class="compare-grid">
                <div class="compare-card">
                  <div class="compare-label">首次观察</div>
                  <div class="compare-date">{{ compareObservations.first.observationDate }}</div>
                  <div class="compare-stats">
                    <div class="stat-item">
                      <span class="stat-label">风险等级</span>
                      <el-tag
                        :type="riskTagType(compareObservations.first.riskLevel)"
                        effect="dark"
                      >
                        {{ getRiskLabel(compareObservations.first.riskLevel) }}
                      </el-tag>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">褪变等级</span>
                      <el-tag
                        :type="fadingTagType(compareObservations.first.fadingLevel)"
                        effect="light"
                      >
                        {{ getFadingLabel(compareObservations.first.fadingLevel) }}
                      </el-tag>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">裂隙长度</span>
                      <span class="stat-value">{{ compareObservations.first.crackLength }} cm</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">处理状态</span>
                      <el-tag
                        :type="statusTagType(compareObservations.first.processingStatus)"
                        effect="light"
                      >
                        {{ getProcessingLabel(compareObservations.first.processingStatus) }}
                      </el-tag>
                    </div>
                  </div>
                </div>

                <div class="compare-arrow">
                  <el-icon><ArrowRightBold /></el-icon>
                </div>

                <div class="compare-card latest">
                  <div class="compare-label">最新观察</div>
                  <div class="compare-date">{{ compareObservations.latest.observationDate }}</div>
                  <div class="compare-stats">
                    <div class="stat-item">
                      <span class="stat-label">风险等级</span>
                      <el-tag
                        :type="riskTagType(compareObservations.latest.riskLevel)"
                        effect="dark"
                      >
                        {{ getRiskLabel(compareObservations.latest.riskLevel) }}
                      </el-tag>
                      <span
                        class="change-badge"
                        :class="{
                          up: compareObservations.latest.riskLevel === 'high' && compareObservations.first.riskLevel !== 'high',
                          down: compareObservations.latest.riskLevel === 'low' && compareObservations.first.riskLevel !== 'low',
                        }"
                        v-if="compareObservations.latest.riskLevel !== compareObservations.first.riskLevel"
                      >
                        <el-icon>
                          <TrendCharts v-if="compareObservations.latest.riskLevel === 'high' && compareObservations.first.riskLevel !== 'high'" />
                          <Bottom v-else />
                        </el-icon>
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">褪变等级</span>
                      <el-tag
                        :type="fadingTagType(compareObservations.latest.fadingLevel)"
                        effect="light"
                      >
                        {{ getFadingLabel(compareObservations.latest.fadingLevel) }}
                      </el-tag>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">裂隙长度</span>
                      <span class="stat-value">{{ compareObservations.latest.crackLength }} cm</span>
                      <span
                        class="change-badge up"
                        v-if="compareObservations.latest.crackLength > compareObservations.first.crackLength"
                      >
                        +{{ compareObservations.latest.crackLength - compareObservations.first.crackLength }}
                      </span>
                      <span
                        class="change-badge down"
                        v-else-if="compareObservations.latest.crackLength < compareObservations.first.crackLength"
                      >
                        {{ compareObservations.latest.crackLength - compareObservations.first.crackLength }}
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">处理状态</span>
                      <el-tag
                        :type="statusTagType(compareObservations.latest.processingStatus)"
                        effect="light"
                      >
                        {{ getProcessingLabel(compareObservations.latest.processingStatus) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="需要至少2条观察记录才能进行对比" />
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><InfoFilled /></el-icon>
            区域描述
          </h3>
          <div class="description-content">
            {{ area.description }}
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Operation /></el-icon>
            处理状态
          </h3>
          <div class="status-display">
            <el-tag
              :type="statusTagType(area.currentProcessingStatus)"
              size="large"
              effect="dark"
              class="main-status-tag"
            >
              {{ getProcessingLabel(area.currentProcessingStatus) }}
            </el-tag>
          </div>
          <div class="status-actions">
            <div class="action-label">快速更新状态：</div>
            <div class="action-buttons">
              <el-button
                type="info"
                :disabled="area.currentProcessingStatus === 'pending'"
                @click="updateStatus('pending')"
              >
                设为未处理
              </el-button>
              <el-button
                type="warning"
                :disabled="area.currentProcessingStatus === 'processing'"
                @click="updateStatus('processing')"
              >
                设为处理中
              </el-button>
              <el-button
                type="success"
                :disabled="area.currentProcessingStatus === 'completed'"
                @click="updateStatus('completed')"
              >
                设为已完成
              </el-button>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><DataLine /></el-icon>
            当前风险评估
          </h3>
          <div class="risk-display">
            <div class="risk-circle" :class="`risk-${area.currentRiskLevel}`">
              <span class="risk-text">{{ getRiskLabel(area.currentRiskLevel) }}</span>
            </div>
          </div>
          <div class="risk-info">
            <div class="info-item">
              <span class="info-label">评估依据：</span>
            </div>
            <ul class="risk-rules">
              <li
                :class="{
                  active:
                    observations.length > 0 &&
                    (observations[0].fadingLevel === 'severe' || observations[0].crackLength > 50),
                }"
              >
                <el-icon v-if="observations.length > 0 && (observations[0].fadingLevel === 'severe' || observations[0].crackLength > 50)">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                高风险：褪变严重 或 裂隙 > 50cm
              </li>
              <li
                :class="{
                  active:
                    observations.length > 0 &&
                    ((observations[0].fadingLevel === 'moderate' ||
                      (observations[0].crackLength >= 20 && observations[0].crackLength <= 50)) &&
                      observations[0].riskLevel !== 'high'),
                }"
              >
                <el-icon
                  v-if="observations.length > 0 &&
                    ((observations[0].fadingLevel === 'moderate' ||
                      (observations[0].crackLength >= 20 && observations[0].crackLength <= 50)) &&
                      observations[0].riskLevel !== 'high')"
                ><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                中风险：褪变中度 或 裂隙 20-50cm
              </li>
              <li :class="{ active: observations.length > 0 && area.currentRiskLevel === 'low' }">
                <el-icon v-if="observations.length > 0 && area.currentRiskLevel === 'low'">
                  <CircleCheck
                /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                低风险：其他情况
              </li>
            </ul>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Collection /></el-icon>
            基本信息
          </h3>
          <div class="basic-info">
            <div class="info-row">
              <span class="info-label">区域编号</span>
              <code class="code-text">{{ area.areaCode }}</code>
            </div>
            <div class="info-row">
              <span class="info-label">洞窟名称</span>
              <span class="info-value">{{ area.caveName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">具体位置</span>
              <span class="info-value">{{ area.location }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">壁画主题</span>
              <span class="info-value">{{ area.theme }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">所属年代</span>
              <span class="info-value">{{ area.dynasty }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">主要颜色</span>
              <span class="info-value">{{ area.mainColors }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">首次观察</span>
              <span class="info-value">{{ area.firstObservationDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">最近观察</span>
              <span class="info-value">{{ area.lastObservationDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">观察次数</span>
              <span class="info-value">{{ area.observationCount }} 次</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showAddObservation"
      title="新增观察记录"
      width="600px"
      :close-on-click-modal="false"
      @close="newObservationFormRef?.resetFields()"
    >
      <el-form
        ref="newObservationFormRef"
        :model="newObservation"
        :rules="observationFormRules"
        label-width="100px"
      >
        <el-form-item label="观察日期" prop="observationDate">
          <el-date-picker
            v-model="newObservation.observationDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="请选择观察日期"
          />
        </el-form-item>
        <el-form-item label="褪变等级" prop="fadingLevel">
          <el-select v-model="newObservation.fadingLevel" style="width: 100%" placeholder="请选择褪变等级">
            <el-option
              v-for="item in FADING_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="裂隙长度(cm)" prop="crackLength">
          <el-input-number
            v-model="newObservation.crackLength"
            :min="0"
            :max="500"
            :step="1"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="处理状态" prop="processingStatus">
          <el-select v-model="newObservation.processingStatus" style="width: 100%" placeholder="请选择处理状态">
            <el-option
              v-for="item in PROCESSING_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="newObservation.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入观察备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddObservation = false">取消</el-button>
        <el-button type="primary" @click="submitObservation">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showObservationDetail"
      title="观察记录详情"
      width="600px"
      v-if="selectedObservation"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="观察日期">
          {{ selectedObservation.observationDate }}
        </el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag
            :type="riskTagType(selectedObservation.riskLevel)"
            effect="dark"
          >
            {{ getRiskLabel(selectedObservation.riskLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="褪变等级">
          <el-tag
            :type="fadingTagType(selectedObservation.fadingLevel)"
            effect="light"
          >
            {{ getFadingLabel(selectedObservation.fadingLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="裂隙长度">
          {{ selectedObservation.crackLength }} 厘米
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag
            :type="statusTagType(selectedObservation.processingStatus)"
            effect="light"
          >
            {{ getProcessingLabel(selectedObservation.processingStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" v-if="selectedObservation.remarks">
          <div style="white-space: pre-wrap">{{ selectedObservation.remarks }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="记录时间">
          {{ formatDateTime(selectedObservation.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="danger" @click="deleteObservation(selectedObservation)">
          删除记录
        </el-button>
        <el-button @click="showObservationDetail = false">关闭</el-button>
        <el-button type="primary" @click="editObservationFromDetail">
          编辑记录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showEditObservation"
      title="编辑观察记录"
      width="600px"
      :close-on-click-modal="false"
      @close="editObservationFormRef?.resetFields()"
    >
      <el-form
        ref="editObservationFormRef"
        :model="editObservation"
        :rules="observationFormRules"
        label-width="100px"
      >
        <el-form-item label="观察日期" prop="observationDate">
          <el-date-picker
            v-model="editObservation.observationDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="请选择观察日期"
          />
        </el-form-item>
        <el-form-item label="褪变等级" prop="fadingLevel">
          <el-select v-model="editObservation.fadingLevel" style="width: 100%" placeholder="请选择褪变等级">
            <el-option
              v-for="item in FADING_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="裂隙长度(cm)" prop="crackLength">
          <el-input-number
            v-model="editObservation.crackLength"
            :min="0"
            :max="500"
            :step="1"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="处理状态" prop="processingStatus">
          <el-select v-model="editObservation.processingStatus" style="width: 100%" placeholder="请选择处理状态">
            <el-option
              v-for="item in PROCESSING_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editObservation.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入观察备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditObservation = false">取消</el-button>
        <el-button type="primary" @click="submitEditObservation">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.area-detail {
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;

  :deep(.el-page-header__content) {
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: 600;
  }
}

.detail-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--border-radius-lg);
  padding: 32px;
  margin-bottom: 24px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(196, 167, 108, 0.3);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.area-title {
  font-family: var(--font-family-display);
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.tag-overdue {
  animation: blink 1s ease-in-out infinite;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.95;

  .el-icon {
    font-size: 16px;
  }
}

.info-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 24px;
  margin-bottom: 16px;
}

.card-title {
  font-family: var(--font-family-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: var(--color-primary);
  }
}

.code-text {
  background: var(--color-bg-body);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--color-secondary);
}

.detail-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.timeline {
  padding-left: 8px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  cursor: pointer;
  transition: var(--transition-fast);
  padding: 8px;
  border-radius: 8px;

  &:hover {
    background: var(--color-bg-body);
  }

  &.first .marker-dot {
    transform: scale(1.2);
  }
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  &.risk-high {
    background: var(--color-danger);
  }

  &.risk-medium {
    background: var(--color-warning);
  }

  &.risk-low {
    background: var(--color-success);
  }
}

.marker-line {
  flex: 1;
  width: 2px;
  background: var(--color-border-lighter);
  margin-top: 4px;
  min-height: 40px;
}

.timeline-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: var(--transition-fast);
  align-self: flex-start;
}

.timeline-item:hover .timeline-actions {
  opacity: 1;
}

.timeline-content {
  flex: 1;
  padding-bottom: 16px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .date-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .badge-latest {
    background: var(--color-primary);
    color: #fff;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.timeline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.timeline-remarks {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.compare-grid {
  display: flex;
  align-items: center;
  gap: 24px;
}

.compare-card {
  flex: 1;
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
  padding: 20px;

  &.latest {
    background: linear-gradient(135deg, rgba(196, 167, 108, 0.1), rgba(196, 167, 108, 0.05));
    border: 1px solid var(--color-primary);
  }
}

.compare-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.compare-date {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.compare-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .stat-label {
    font-size: 13px;
    color: var(--color-text-secondary);
    width: 80px;
    flex-shrink: 0;
  }

  .stat-value {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .change-badge {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;

    &.up {
      color: var(--color-danger);
      background: rgba(245, 108, 108, 0.1);
    }

    &.down {
      color: var(--color-success);
      background: rgba(103, 194, 58, 0.1);
    }
  }
}

.compare-arrow {
  font-size: 32px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.description-content {
  padding: 16px;
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
  line-height: 1.8;
  color: var(--color-text-regular);
  white-space: pre-wrap;
}

.status-display {
  text-align: center;
  margin-bottom: 20px;
}

.main-status-tag {
  font-size: 16px;
  padding: 8px 24px;
}

.status-actions {
  border-top: 1px solid var(--color-border-lighter);
  padding-top: 16px;
}

.action-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .el-button {
    width: 100%;
  }
}

.risk-display {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.risk-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid;
  animation: pulse 2s ease-in-out infinite;

  &.risk-low {
    border-color: var(--color-success);
    background: rgba(103, 194, 58, 0.1);
  }

  &.risk-medium {
    border-color: var(--color-warning);
    background: rgba(230, 162, 60, 0.1);
  }

  &.risk-high {
    border-color: var(--color-danger);
    background: rgba(245, 108, 108, 0.1);
  }
}

.risk-text {
  font-family: var(--font-family-display);
  font-size: 18px;
  font-weight: 700;
}

.risk-info {
  border-top: 1px solid var(--color-border-lighter);
  padding-top: 16px;
}

.risk-rules {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    transition: var(--transition-fast);

    .el-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    &.active {
      color: var(--color-text-primary);
      font-weight: 500;
    }
  }
}

.basic-info {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .info-label {
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  .info-value {
    color: var(--color-text-regular);
    font-size: 13px;
    text-align: right;
    max-width: 60%;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 1200px) {
  .el-col {
    width: 100% !important;
  }

  .compare-grid {
    flex-direction: column;

    .compare-arrow {
      transform: rotate(90deg);
    }
  }
}
</style>
