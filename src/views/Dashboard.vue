<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useEvidenceStore } from '@/stores/evidence'
import { useInspectionStore } from '@/stores/inspection'
import StatCard from '@/components/StatCard.vue'
import { useECharts, createPieOption, createBarOption, createLineOption, createRingOption } from '@/composables/useECharts'

const router = useRouter()
const dashboardStore = useDashboardStore()
const evidenceStore = useEvidenceStore()
const inspectionStore = useInspectionStore()

const riskChartRef = ref<HTMLElement | null>(null)
const dynastyChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const progressChartRef = ref<HTMLElement | null>(null)
const caveChartRef = ref<HTMLElement | null>(null)
const riskTrendChartRef = ref<HTMLElement | null>(null)
const evidenceChartRef = ref<HTMLElement | null>(null)

const stats = computed(() => dashboardStore.stats)
const evidenceStats = computed(() => evidenceStore.stats)
const inspectionStats = computed(() => inspectionStore.stats)

const riskPieOption = computed(() =>
  createPieOption(stats.value.riskDistribution, '风险等级分布')
)
const dynastyBarOption = computed(() =>
  createBarOption(stats.value.dynastyDistribution, '各朝代记录分布', '#4682b4')
)
const trendLineOption = computed(() =>
  createLineOption(stats.value.fadingTrend, '月度观察趋势')
)
const progressRingOption = computed(() =>
  createRingOption(stats.value.processingProgress, '处理进度统计')
)
const caveBarOption = computed(() =>
  createBarOption(stats.value.caveDistribution, '各洞窟区域分布', '#c4a76c')
)

const riskTrendChartOption = computed(() => {
  const data = stats.value.riskTrend
  return {
    title: { text: '风险等级变化趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['低风险', '中风险', '高风险'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: data.map((d) => d.date),
    },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: '低风险',
        type: 'line' as const,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.3 },
        data: data.map((d) => d.low),
        itemStyle: { color: '#67C23A' },
      },
      {
        name: '中风险',
        type: 'line' as const,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.3 },
        data: data.map((d) => d.medium),
        itemStyle: { color: '#E6A23C' },
      },
      {
        name: '高风险',
        type: 'line' as const,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.3 },
        data: data.map((d) => d.high),
        itemStyle: { color: '#F56C6C' },
      },
    ],
  } as any
})

const evidenceTrendOption = computed(() =>
  createBarOption(
    evidenceStats.value.monthlyComparisons.map((d) => ({ name: d.date, value: d.count })),
    '月度影像对比趋势',
    '#c4a76c'
  )
)

useECharts(riskChartRef, riskPieOption.value)
useECharts(dynastyChartRef, dynastyBarOption.value)
useECharts(trendChartRef, trendLineOption.value)
useECharts(progressChartRef, progressRingOption.value)
useECharts(caveChartRef, caveBarOption.value)
useECharts(riskTrendChartRef, riskTrendChartOption.value)
useECharts(evidenceChartRef, evidenceTrendOption.value)

function goToAreas() {
  router.push('/areas')
}

function goToAlerts() {
  router.push('/alerts')
}

function goToEvidence() {
  router.push('/evidence')
}

function goToInspection() {
  router.push('/inspection')
}
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">
        数据概览
      </h1>
      <p class="page-subtitle">
        实时监控石窟壁画保护状况，掌握全局动态
      </p>
    </div>

    <div class="section-title">
      <h2>基础数据统计</h2>
    </div>

    <div class="stat-grid">
      <StatCard
        title="监测区域"
        :value="stats.totalAreas"
        icon="Picture"
        color="#c4a76c"
        suffix="处"
        trend-label="累计建档"
        @click="goToAreas"
      />
      <StatCard
        title="观察记录"
        :value="stats.totalObservations"
        icon="DocumentCopy"
        color="#5f9ea0"
        suffix="条"
        trend-label="累计记录"
      />
      <StatCard
        title="高风险区域"
        :value="stats.highRiskCount"
        icon="Warning"
        color="#f56c6c"
        suffix="处"
        :trend="1"
        trend-label="紧急处理"
        @click="goToAlerts"
      />
      <StatCard
        title="超期未观察"
        :value="stats.overdueCount"
        icon="Clock"
        color="#f97316"
        suffix="处"
        :trend="1"
        trend-label="需复查"
        @click="goToAlerts"
      />
      <StatCard
        title="待处理"
        :value="stats.pendingCount"
        icon="Timer"
        color="#e6a23c"
        suffix="处"
        :trend="1"
        trend-label="需要关注"
      />
      <StatCard
        title="本月新增观察"
        :value="stats.monthlyNewCount"
        icon="Plus"
        color="#4682b4"
        suffix="条"
        :trend="1"
        trend-label="较上月"
      />
    </div>

    <div class="section-title">
      <h2>影像取证统计</h2>
      <el-button
        type="primary"
        link
        @click="goToEvidence"
      >
        查看详情 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="stat-grid">
      <StatCard
        title="取证照片"
        :value="evidenceStats.totalPhotos"
        icon="Camera"
        color="#c4a76c"
        suffix="张"
        trend-label="累计上传"
        @click="goToEvidence"
      />
      <StatCard
        title="影像对比"
        :value="evidenceStats.totalComparisons"
        icon="Comparison"
        color="#4682b4"
        suffix="次"
        trend-label="累计对比"
        @click="goToEvidence"
      />
      <StatCard
        title="病害点位"
        :value="evidenceStats.totalDiseasePoints"
        icon="Location"
        color="#f56c6c"
        suffix="个"
        trend-label="累计标注"
        @click="goToEvidence"
      />
      <StatCard
        title="修复方案"
        :value="evidenceStats.totalTreatments"
        icon="Document"
        color="#67c23a"
        suffix="份"
        trend-label="累计制定"
        @click="goToEvidence"
      />
      <StatCard
        title="待处理"
        :value="evidenceStats.pendingTreatments"
        icon="Timer"
        color="#e6a23c"
        suffix="份"
        trend-label="进行中"
        @click="goToEvidence"
      />
      <StatCard
        title="已完成"
        :value="evidenceStats.completedTreatments"
        icon="CircleCheck"
        color="#5f9ea0"
        suffix="份"
        trend-label="已验收"
        @click="goToEvidence"
      />
    </div>

    <div
      v-if="evidenceStats.abnormalChanges.length > 0"
      class="section-title"
    >
      <h2 class="warning-title">
        <el-icon><WarningFilled /></el-icon>
        异常变化预警
      </h2>
      <el-badge
        :value="evidenceStats.abnormalChanges.length"
        type="danger"
      >
        <el-button
          type="primary"
          link
          @click="goToEvidence"
        >
          查看全部
        </el-button>
      </el-badge>
    </div>

    <div
      v-if="evidenceStats.abnormalChanges.length > 0"
      class="alert-section"
    >
      <div
        v-for="alert in evidenceStats.abnormalChanges.slice(0, 5)"
        :key="alert.areaId + alert.detectedAt"
        class="alert-item"
        @click="goToAreas()"
      >
        <div class="alert-icon">
          <el-icon
            :size="28"
            color="#f56c6c"
          >
            <WarningFilled />
          </el-icon>
        </div>
        <div class="alert-content">
          <div class="alert-header">
            <span class="alert-area">{{ alert.areaCode }}</span>
            <span class="alert-theme">{{ alert.theme }}</span>
            <el-tag
              type="danger"
              size="small"
              effect="dark"
            >
              {{ alert.changeType }}
            </el-tag>
          </div>
          <div class="alert-cave">
            洞窟: {{ alert.caveName }}
          </div>
          <div class="alert-desc">
            {{ alert.description }}
          </div>
        </div>
        <div class="alert-time">
          {{ alert.detectedAt }}
        </div>
      </div>
    </div>

    <div class="section-title">
      <h2>巡检任务统计</h2>
      <el-button
        type="primary"
        link
        @click="goToInspection"
      >
        查看详情 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="stat-grid">
      <StatCard
        title="巡检完成率"
        :value="inspectionStats.completionRate"
        icon="CircleCheck"
        color="#67c23a"
        suffix="%"
        trend-label="任务完成"
        @click="goToInspection"
      />
      <StatCard
        title="逾期任务"
        :value="inspectionStats.overdueTasks"
        icon="Warning"
        color="#f56c6c"
        suffix="个"
        :trend="1"
        trend-label="需紧急处理"
        @click="goToInspection"
      />
      <StatCard
        title="进行中任务"
        :value="inspectionStats.inProgressTasks"
        icon="Loading"
        color="#409eff"
        suffix="个"
        trend-label="正在执行"
        @click="goToInspection"
      />
      <StatCard
        title="巡检计划"
        :value="inspectionStats.activePlans"
        icon="Calendar"
        color="#5f9ea0"
        suffix="个"
        trend-label="进行中"
        @click="goToInspection"
      />
      <StatCard
        title="文保人员"
        :value="inspectionStats.inspectors.length"
        icon="User"
        color="#9b59b6"
        suffix="人"
        trend-label="参与巡检"
        @click="goToInspection"
      />
      <StatCard
        title="总任务数"
        :value="inspectionStats.totalTasks"
        icon="DocumentCopy"
        color="#c4a76c"
        suffix="个"
        trend-label="累计创建"
        @click="goToInspection"
      />
    </div>

    <div
      v-if="inspectionStats.overdueTaskList.length > 0"
      class="section-title"
    >
      <h2 class="warning-title">
        <el-icon><WarningFilled /></el-icon>
        逾期巡检任务
      </h2>
      <el-badge
        :value="inspectionStats.overdueTaskList.length"
        type="danger"
      >
        <el-button
          type="primary"
          link
          @click="goToInspection"
        >
          查看全部
        </el-button>
      </el-badge>
    </div>

    <div
      v-if="inspectionStats.overdueTaskList.length > 0"
      class="overdue-section"
    >
      <div
        v-for="task in inspectionStats.overdueTaskList.slice(0, 5)"
        :key="task.id"
        class="overdue-item"
        @click="goToInspection()"
      >
        <div class="overdue-icon">
          <el-icon
            :size="28"
            color="#f56c6c"
          >
            <Clock />
          </el-icon>
        </div>
        <div class="overdue-content">
          <div class="overdue-header">
            <span class="overdue-area">{{ task.areaCode }}</span>
            <span class="overdue-name">{{ task.taskName }}</span>
            <el-tag
              type="danger"
              size="small"
              effect="dark"
            >
              已逾期
            </el-tag>
          </div>
          <div class="overdue-cave">
            洞窟: {{ task.caveName }}
          </div>
          <div class="overdue-assignee">
            执行人: {{ task.assigneeName }}
          </div>
        </div>
        <div class="overdue-time">
          截止: {{ task.dueDate }}
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div
          ref="riskChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card">
        <div
          ref="progressChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card chart-wide">
        <div
          ref="riskTrendChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card chart-wide">
        <div
          ref="trendChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card chart-wide">
        <div
          ref="evidenceChartRef"
          class="chart-container"
        />
      </div>
      <div class="chart-card">
        <div
          ref="dynastyChartRef"
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
.dashboard {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
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

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  margin-top: 32px;

  h2 {
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 600;
  }

  &:first-of-type {
    margin-top: 0;
  }
}

.warning-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger) !important;

  .el-icon {
    animation: pulse 2s ease-in-out infinite;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.alert-section {
  background: rgba(245, 108, 108, 0.03);
  border: 1px solid rgba(245, 108, 108, 0.15);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  margin-bottom: 24px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.15);
  }
}

.alert-icon {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.alert-area {
  background: var(--color-danger);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.alert-theme {
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-cave {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 13px;
  color: var(--color-text-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-time {
  font-size: 12px;
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}

.overdue-section {
  background: rgba(245, 108, 108, 0.03);
  border: 1px solid rgba(245, 108, 108, 0.15);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  margin-bottom: 24px;
}

.overdue-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.15);
  }
}

.overdue-icon {
  flex-shrink: 0;
}

.overdue-content {
  flex: 1;
  min-width: 0;
}

.overdue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.overdue-area {
  background: var(--color-danger);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.overdue-name {
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overdue-cave {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.overdue-assignee {
  font-size: 13px;
  color: var(--color-text-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overdue-time {
  font-size: 12px;
  color: var(--color-danger);
  flex-shrink: 0;
  font-weight: 500;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  transition: var(--transition-base);

  &:hover {
    box-shadow: var(--color-shadow-base);
  }

  &.chart-wide {
    grid-column: span 1;
  }
}

.chart-container {
  width: 100%;
  height: 320px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 1600px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
