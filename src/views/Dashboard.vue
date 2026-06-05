<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuralStore } from '@/stores/mural'
import StatCard from '@/components/StatCard.vue'
import { useECharts, createPieOption, createBarOption, createLineOption, createRingOption } from '@/composables/useECharts'

const store = useMuralStore()

const riskChartRef = ref<HTMLElement | null>(null)
const dynastyChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const progressChartRef = ref<HTMLElement | null>(null)

const stats = computed(() => store.dashboardStats)

const riskPieOption = computed(() =>
  createPieOption(stats.value.riskDistribution, '风险等级分布')
)
const dynastyBarOption = computed(() =>
  createBarOption(stats.value.dynastyDistribution, '各朝代记录分布', '#4682b4')
)
const trendLineOption = computed(() =>
  createLineOption(stats.value.fadingTrend, '近12个月记录趋势')
)
const progressRingOption = computed(() =>
  createRingOption(stats.value.processingProgress, '处理进度统计')
)

useECharts(riskChartRef, riskPieOption.value)
useECharts(dynastyChartRef, dynastyBarOption.value)
useECharts(trendChartRef, trendLineOption.value)
useECharts(progressChartRef, progressRingOption.value)
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">数据概览</h1>
      <p class="page-subtitle">实时监控石窟壁画保护状况，掌握全局动态</p>
    </div>

    <div class="stat-grid">
      <StatCard
        title="总记录数"
        :value="stats.totalRecords"
        icon="DocumentCopy"
        color="#c4a76c"
        suffix="条"
        trend-label="累计录入"
      />
      <StatCard
        title="待处理"
        :value="stats.pendingCount"
        icon="Clock"
        color="#e6a23c"
        suffix="处"
        :trend="1"
        trend-label="需要关注"
      />
      <StatCard
        title="高风险"
        :value="stats.highRiskCount"
        icon="Warning"
        color="#f56c6c"
        suffix="处"
        :trend="-1"
        trend-label="紧急修复中"
      />
      <StatCard
        title="本月新增"
        :value="stats.monthlyNewCount"
        icon="Plus"
        color="#5f9ea0"
        suffix="条"
        :trend="1"
        trend-label="较上月"
      />
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div ref="riskChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <div ref="progressChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card chart-wide">
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card chart-wide">
        <div ref="dynastyChartRef" class="chart-container"></div>
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
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

@media (max-width: 1400px) {
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
