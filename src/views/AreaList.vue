<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMuralStore } from '@/stores/mural'
import {
  DYNASTY_OPTIONS,
  CAVE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  PROCESSING_STATUS_OPTIONS,
} from '@/types'
import type { MuralArea, RiskLevel, ProcessingStatus } from '@/types'
import { getRiskLabel, getRiskColor, getProcessingLabel } from '@/utils'

const router = useRouter()
const store = useMuralStore()

const searchForm = ref({
  caveName: '',
  dynasty: '',
  riskLevel: '' as RiskLevel | '',
  processingStatus: '' as ProcessingStatus | '',
  keyword: '',
  dateRange: [] as [string, string] | [],
  isOverdue: null as boolean | null,
})

const loading = ref(false)
const showFilters = ref(true)

onMounted(() => {
  store.refreshOverdueStatus()
})

function handleSearch() {
  loading.value = true
  store.setFilterParams({
    caveName: searchForm.value.caveName,
    dynasty: searchForm.value.dynasty,
    riskLevel: searchForm.value.riskLevel,
    processingStatus: searchForm.value.processingStatus,
    keyword: searchForm.value.keyword,
    dateRange: searchForm.value.dateRange,
    isOverdue: searchForm.value.isOverdue,
  })
  setTimeout(() => {
    loading.value = false
  }, 300)
}

function handleReset() {
  searchForm.value = {
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
    dateRange: [],
    isOverdue: null,
  }
  store.resetFilterParams()
}

function goToDetail(id: string) {
  router.push(`/areas/${id}`)
}

function goToCreate() {
  router.push('/areas/new')
}

async function handleDelete(area: MuralArea) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${area.theme}" 的区域档案吗？此操作将同时删除所有相关观察记录，不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    const success = store.deleteArea(area.id)
    if (success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
  }
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

const stats = computed(() => ({
  total: store.areas.length,
  highRisk: store.highRiskAreas.length,
  overdue: store.overdueAreas.length,
  pending: store.pendingAreas.length,
}))

const displayAreas = computed(() => store.filteredAreas)
</script>

<template>
  <div class="area-list">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">壁画区域档案</h1>
        <p class="page-subtitle">
          共 {{ displayAreas.length }} 个区域 |
          <span class="stat-highlight">高风险 {{ stats.highRisk }}</span> |
          <span class="stat-overdue">超期 {{ stats.overdue }}</span> |
          <span class="stat-pending">待处理 {{ stats.pending }}</span>
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          新增区域
        </el-button>
      </div>
    </div>

    <div class="filter-card">
      <div class="filter-header" @click="showFilters = !showFilters">
        <span class="filter-title">
          <el-icon><Filter /></el-icon>
          筛选条件
        </span>
        <el-icon class="toggle-icon" :class="{ expanded: showFilters }">
          <ArrowDown />
        </el-icon>
      </div>
      <div v-show="showFilters" class="filter-content">
        <el-form :model="searchForm" inline @submit.prevent>
          <el-form-item label="洞窟名称">
            <el-select
              v-model="searchForm.caveName"
              placeholder="全部洞窟"
              clearable
              style="width: 160px"
            >
              <el-option
                v-for="cave in CAVE_OPTIONS"
                :key="cave"
                :label="cave"
                :value="cave"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="年代">
            <el-select
              v-model="searchForm.dynasty"
              placeholder="全部年代"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="dynasty in DYNASTY_OPTIONS"
                :key="dynasty"
                :label="dynasty"
                :value="dynasty"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select
              v-model="searchForm.riskLevel"
              placeholder="全部等级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in RISK_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select
              v-model="searchForm.processingStatus"
              placeholder="全部状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in PROCESSING_STATUS_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="超期状态">
            <el-select
              v-model="searchForm.isOverdue"
              placeholder="全部"
              clearable
              style="width: 120px"
            >
              <el-option label="已超期" :value="true" />
              <el-option label="未超期" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="观察时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 280px"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="区域编号/主题"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              筛选
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="area-cards">
      <div
        v-loading="loading"
        class="card-container"
        :class="{ 'no-data': displayAreas.length === 0 }"
      >
        <div
          v-for="area in displayAreas"
          :key="area.id"
          class="area-card"
          :class="{
            'risk-high': area.currentRiskLevel === 'high',
            'risk-medium': area.currentRiskLevel === 'medium',
            'is-overdue': area.isOverdue,
          }"
          @click="goToDetail(area.id)"
        >
          <div class="card-header">
            <div class="card-title">
              <span class="area-code">{{ area.areaCode }}</span>
              <span class="area-theme">{{ area.theme }}</span>
            </div>
            <div class="card-tags">
              <el-tag
                v-if="area.isOverdue"
                type="danger"
                size="small"
                effect="dark"
                class="tag-overdue"
              >
                <el-icon><Warning /></el-icon>
                超期{{ area.overdueDays }}天
              </el-tag>
              <el-tag
                :type="riskTagType(area.currentRiskLevel)"
                size="small"
                effect="dark"
                :style="{ backgroundColor: getRiskColor(area.currentRiskLevel) }"
              >
                {{ getRiskLabel(area.currentRiskLevel) }}
              </el-tag>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">
                <el-icon><Location /></el-icon>
                位置
              </span>
              <span class="info-value">{{ area.caveName }} · {{ area.location }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon><Calendar /></el-icon>
                年代
              </span>
              <span class="info-value">{{ area.dynasty }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon><Clock /></el-icon>
                最近观察
              </span>
              <span class="info-value">{{ area.lastObservationDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon><View /></el-icon>
                观察次数
              </span>
              <span class="info-value">{{ area.observationCount }} 次</span>
            </div>
          </div>

          <div class="card-footer">
            <el-tag
              :type="statusTagType(area.currentProcessingStatus)"
              size="small"
              effect="light"
            >
              {{ getProcessingLabel(area.currentProcessingStatus) }}
            </el-tag>
            <div class="card-actions" @click.stop>
              <el-button type="primary" link size="small" @click="goToDetail(area.id)">
                查看详情
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(area)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-if="displayAreas.length === 0" description="暂无符合条件的区域" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.area-list {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  .page-title {
    font-size: var(--font-size-2xl);
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .stat-highlight {
    color: var(--color-danger);
    font-weight: 600;
  }

  .stat-overdue {
    color: #f97316;
    font-weight: 600;
  }

  .stat-pending {
    color: var(--color-warning);
    font-weight: 600;
  }
}

.filter-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  margin-bottom: 16px;
  overflow: hidden;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-lighter);
  transition: var(--transition-fast);

  &:hover {
    background: var(--color-bg-body);
  }

  .filter-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .toggle-icon {
    transition: transform 0.3s ease;

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.filter-content {
  padding: 16px 20px 0;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.area-cards {
  .card-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;

    &.no-data {
      grid-template-columns: 1fr;
    }
  }
}

.area-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  cursor: pointer;
  transition: var(--transition-base);
  border: 2px solid transparent;

  &:hover {
    box-shadow: var(--color-shadow-base);
    transform: translateY(-2px);
  }

  &.risk-high {
    border-left: 4px solid var(--color-danger);

    &:hover {
      border-color: var(--color-danger);
    }
  }

  &.risk-medium {
    border-left: 4px solid var(--color-warning);
  }

  &.is-overdue {
    animation: pulse-danger 2s ease-in-out infinite;
  }
}

.card-header {
  margin-bottom: 16px;

  .card-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }

  .area-code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: var(--color-secondary);
    background: var(--color-bg-body);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .area-theme {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .card-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .tag-overdue {
      animation: blink 1s ease-in-out infinite;
    }
  }
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;

  .info-label {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 80px;
    color: var(--color-text-secondary);
    flex-shrink: 0;

    .el-icon {
      font-size: 14px;
    }
  }

  .info-value {
    color: var(--color-text-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-lighter);
}

.card-actions {
  display: flex;
  gap: 8px;
}

@keyframes pulse-danger {
  0%,
  100% {
    box-shadow: var(--color-shadow-light);
  }
  50% {
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
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

@media (max-width: 768px) {
  .card-container {
    grid-template-columns: 1fr !important;
  }
}
</style>
