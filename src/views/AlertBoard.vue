<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAreaStore } from '@/stores/area'
import { useAlertStore } from '@/stores/alert'
import { useDashboardStore } from '@/stores/dashboard'
import StatCard from '@/components/StatCard.vue'
import { useECharts, createPieOption, createBarOption } from '@/composables/useECharts'
import type { RiskAlert, RiskLevel } from '@/types'
import { getRiskLabel, getRiskColor } from '@/utils'

const router = useRouter()
const areaStore = useAreaStore()
const alertStore = useAlertStore()
const dashboardStore = useDashboardStore()

const activeTab = ref('all')
const alertTypeFilter = ref('all')

const riskChartRef = ref<HTMLElement | null>(null)
const caveChartRef = ref<HTMLElement | null>(null)

const stats = computed(() => ({
  total: alertStore.alerts.length,
  unread: alertStore.unreadAlerts.length,
  highRisk: areaStore.highRiskAreas.length,
  overdue: areaStore.overdueAreas.length,
}))

const filteredAlerts = computed(() => {
  let result = alertStore.alerts
  if (activeTab.value === 'unread') {
    result = result.filter((a) => !a.isRead)
  }
  if (alertTypeFilter.value !== 'all') {
    result = result.filter((a) => a.type === alertTypeFilter.value)
  }
  return result
})

const highRiskAreas = computed(() => areaStore.highRiskAreas)
const overdueAreas = computed(() => areaStore.overdueAreas)

const riskPieOption = computed(() =>
  createPieOption(dashboardStore.dashboardStats.riskDistribution, '风险等级分布')
)
const caveBarOption = computed(() =>
  createBarOption(dashboardStore.dashboardStats.caveDistribution, '各洞窟风险区域分布', '#f56c6c')
)

useECharts(riskChartRef, riskPieOption.value)
useECharts(caveChartRef, caveBarOption.value)

onMounted(() => {
  areaStore.refreshOverdueStatus()
})

function getAlertTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    highRisk: 'Warning',
    overdue: 'Clock',
    newRisk: 'Bell',
  }
  return icons[type] || 'InfoFilled'
}

function getAlertTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    highRisk: '高风险',
    overdue: '超期未观察',
    newRisk: '新增风险',
  }
  return labels[type] || type
}

function getAlertTypeColor(type: string): string {
  const colors: Record<string, string> = {
    highRisk: '#f56c6c',
    overdue: '#f97316',
    newRisk: '#e6a23c',
  }
  return colors[type] || '#909399'
}

function alertTagType(level: RiskLevel): 'success' | 'warning' | 'danger' {
  const types: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  }
  return types[level]
}

function handleAlertClick(alert: RiskAlert) {
  if (!alert.isRead) {
    alertStore.markAlertAsRead(alert.id)
  }
  router.push(`/areas/${alert.areaId}`)
}

function markAllAsRead() {
  alertStore.markAllAlertsAsRead()
  ElMessage.success('已全部标记为已读')
}

function goToAreaDetail(areaId: string) {
  router.push(`/areas/${areaId}`)
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<template>
  <div class="alert-board">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          风险预警看板
        </h1>
        <p class="page-subtitle">
          实时监控风险区域，及时处理预警信息
        </p>
      </div>
      <div class="header-right">
        <el-button
          :disabled="stats.unread === 0"
          @click="markAllAsRead"
        >
          <el-icon><Check /></el-icon>
          全部标记已读
        </el-button>
      </div>
    </div>

    <div class="stat-grid">
      <StatCard
        title="预警总数"
        :value="stats.total"
        icon="Bell"
        color="#909399"
        suffix="条"
        trend-label="累计预警"
      />
      <StatCard
        title="未读预警"
        :value="stats.unread"
        icon="Message"
        color="#e6a23c"
        suffix="条"
        :trend="1"
        trend-label="待处理"
      />
      <StatCard
        title="高风险区域"
        :value="stats.highRisk"
        icon="Warning"
        color="#f56c6c"
        suffix="处"
        :trend="1"
        trend-label="紧急处理"
      />
      <StatCard
        title="超期未观察"
        :value="stats.overdue"
        icon="Clock"
        color="#f97316"
        suffix="处"
        :trend="1"
        trend-label="需复查"
      />
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <div class="alert-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><List /></el-icon>
              预警列表
            </h3>
            <div class="section-filters">
              <el-tabs
                v-model="activeTab"
                class="inline-tabs"
              >
                <el-tab-pane
                  label="全部"
                  name="all"
                />
                <el-tab-pane
                  :label="`未读 (${stats.unread})`"
                  name="unread"
                />
              </el-tabs>
              <el-select
                v-model="alertTypeFilter"
                placeholder="筛选类型"
                clearable
                size="small"
                style="width: 140px"
              >
                <el-option
                  label="高风险"
                  value="highRisk"
                />
                <el-option
                  label="超期未观察"
                  value="overdue"
                />
                <el-option
                  label="新增风险"
                  value="newRisk"
                />
              </el-select>
            </div>
          </div>

          <div class="alert-list">
            <div
              v-for="alert in filteredAlerts"
              :key="alert.id"
              class="alert-item"
              :class="{ unread: !alert.isRead }"
              @click="handleAlertClick(alert)"
            >
              <div
                class="alert-icon"
                :style="{ backgroundColor: getAlertTypeColor(alert.type) }"
              >
                <el-icon>
                  <component :is="getAlertTypeIcon(alert.type)" />
                </el-icon>
              </div>
              <div class="alert-content">
                <div class="alert-header">
                  <span
                    class="alert-type"
                    :style="{ color: getAlertTypeColor(alert.type) }"
                  >
                    {{ getAlertTypeLabel(alert.type) }}
                  </span>
                  <span class="alert-time">{{ formatDateTime(alert.createdAt) }}</span>
                </div>
                <div class="alert-title">
                  {{ alert.title }}
                </div>
                <div class="alert-desc">
                  {{ alert.description }}
                </div>
                <div class="alert-meta">
                  <span class="meta-item">
                    <el-icon><Tickets /></el-icon>
                    {{ alert.areaCode }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Collection /></el-icon>
                    {{ alert.caveName }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Picture /></el-icon>
                    {{ alert.theme }}
                  </span>
                  <el-tag
                    :type="alertTagType(alert.riskLevel)"
                    size="small"
                    effect="light"
                    :style="{ borderColor: getRiskColor(alert.riskLevel) }"
                  >
                    {{ getRiskLabel(alert.riskLevel) }}
                  </el-tag>
                </div>
              </div>
              <div class="alert-status">
                <span
                  v-if="!alert.isRead"
                  class="unread-dot"
                />
              </div>
            </div>
            <el-empty
              v-if="filteredAlerts.length === 0"
              description="暂无预警信息"
            />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Warning /></el-icon>
            高风险区域
          </h3>
          <div class="area-list">
            <div
              v-for="area in highRiskAreas"
              :key="area.id"
              class="area-item high-risk"
              @click="goToAreaDetail(area.id)"
            >
              <div class="area-info">
                <div class="area-code">
                  {{ area.areaCode }}
                </div>
                <div class="area-name">
                  {{ area.theme }}
                </div>
                <div class="area-location">
                  {{ area.caveName }}
                </div>
              </div>
              <div class="area-status">
                <el-tag
                  type="danger"
                  effect="dark"
                  size="small"
                >
                  高风险
                </el-tag>
                <span
                  v-if="area.isOverdue"
                  class="overdue-badge"
                >
                  超期{{ area.overdueDays }}天
                </span>
              </div>
            </div>
            <el-empty
              v-if="highRiskAreas.length === 0"
              description="暂无高风险区域"
              :image-size="60"
            />
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Clock /></el-icon>
            超期未观察
          </h3>
          <div class="area-list">
            <div
              v-for="area in overdueAreas"
              :key="area.id"
              class="area-item overdue"
              @click="goToAreaDetail(area.id)"
            >
              <div class="area-info">
                <div class="area-code">
                  {{ area.areaCode }}
                </div>
                <div class="area-name">
                  {{ area.theme }}
                </div>
                <div class="area-location">
                  {{ area.caveName }}
                </div>
              </div>
              <div class="area-status">
                <span class="overdue-days">
                  {{ area.overdueDays }}天
                </span>
                <el-tag
                  :type="alertTagType(area.currentRiskLevel)"
                  size="small"
                  effect="light"
                >
                  {{ getRiskLabel(area.currentRiskLevel) }}
                </el-tag>
              </div>
            </div>
            <el-empty
              v-if="overdueAreas.length === 0"
              description="暂无超期区域"
              :image-size="60"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="chart-section">
      <div class="chart-card">
        <div
          ref="riskChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card">
        <div
          ref="caveChartRef"
          class="chart-container"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alert-board {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
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
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.alert-section {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-lighter);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;

  .el-icon {
    color: var(--color-primary);
  }
}

.section-filters {
  display: flex;
  align-items: center;
  gap: 16px;

  .inline-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      padding: 0 12px;
      height: 32px;
      line-height: 32px;
      font-size: 13px;
    }
  }
}

.alert-list {
  max-height: 600px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  border-left: 3px solid transparent;

  &:hover {
    background: var(--color-bg-body);
  }

  &.unread {
    background: rgba(245, 108, 108, 0.03);
    border-left-color: var(--color-danger);
  }
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 20px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.alert-type {
  font-size: 12px;
  font-weight: 600;
}

.alert-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.alert-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);

  .el-icon {
    font-size: 12px;
  }
}

.alert-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  animation: pulse 2s ease-in-out infinite;
}

.info-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: var(--color-primary);
  }
}

.area-list {
  max-height: 300px;
  overflow-y: auto;
}

.area-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-bottom: 8px;
  border: 1px solid var(--color-border-lighter);

  &:hover {
    background: var(--color-bg-body);
  }

  &:last-child {
    margin-bottom: 0;
  }

  &.high-risk {
    border-color: rgba(245, 108, 108, 0.3);
    background: rgba(245, 108, 108, 0.05);
  }

  &.overdue {
    border-color: rgba(249, 115, 22, 0.3);
    background: rgba(249, 115, 22, 0.05);
  }
}

.area-info {
  .area-code {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: var(--color-secondary);
    margin-bottom: 2px;
  }

  .area-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .area-location {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.area-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.overdue-badge {
  font-size: 11px;
  color: #f97316;
  font-weight: 500;
}

.overdue-days {
  font-size: 18px;
  font-weight: 700;
  color: #f97316;
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
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

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-filters {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
