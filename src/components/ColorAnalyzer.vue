<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import type { EChartsOption } from 'echarts'

const selectedArea = ref('')
const selectedPeriod = ref('6m')
const heatmapChartRef = ref<HTMLElement | null>(null)
const timelineChartRef = ref<HTMLElement | null>(null)
const diffChartRef = ref<HTMLElement | null>(null)

const colorAnalysisData = ref([
  { name: '第1窟 - 东壁', brightness: -12, saturation: -8, hue: 3, deltaE: 15.2 },
  { name: '第1窟 - 西壁', brightness: -5, saturation: -3, hue: 1, deltaE: 6.8 },
  { name: '第1窟 - 南壁', brightness: -18, saturation: -12, hue: 5, deltaE: 22.4 },
  { name: '第2窟 - 北壁', brightness: -8, saturation: -6, hue: 2, deltaE: 11.3 },
  { name: '第2窟 - 主室', brightness: -3, saturation: -2, hue: 0, deltaE: 4.1 },
  { name: '第3窟 - 东壁', brightness: -22, saturation: -15, hue: 7, deltaE: 28.6 },
  { name: '第3窟 - 西壁', brightness: -10, saturation: -7, hue: 2, deltaE: 13.5 },
  { name: '第4窟 - 南壁', brightness: -6, saturation: -4, hue: 1, deltaE: 8.2 },
  { name: '第5窟 - 北壁', brightness: -14, saturation: -10, hue: 4, deltaE: 17.8 },
  { name: '第5窟 - 甬道', brightness: -4, saturation: -3, hue: 1, deltaE: 5.6 },
  { name: '第6窟 - 东壁', brightness: -16, saturation: -11, hue: 5, deltaE: 19.9 },
  { name: '第7窟 - 主室', brightness: -7, saturation: -5, hue: 2, deltaE: 9.4 },
])

const timelineData = ref([
  { month: '2025-01', avgDeltaE: 8.2, severity: '正常' },
  { month: '2025-02', avgDeltaE: 8.5, severity: '正常' },
  { month: '2025-03', avgDeltaE: 9.1, severity: '正常' },
  { month: '2025-04', avgDeltaE: 9.8, severity: '注意' },
  { month: '2025-05', avgDeltaE: 10.5, severity: '注意' },
  { month: '2025-06', avgDeltaE: 11.2, severity: '注意' },
  { month: '2025-07', avgDeltaE: 12.8, severity: '警戒' },
  { month: '2025-08', avgDeltaE: 13.5, severity: '警戒' },
  { month: '2025-09', avgDeltaE: 14.2, severity: '警戒' },
  { month: '2025-10', avgDeltaE: 15.1, severity: '严重' },
  { month: '2025-11', avgDeltaE: 15.8, severity: '严重' },
  { month: '2025-12', avgDeltaE: 16.5, severity: '严重' },
])

const heatmapData = computed(() => {
  const months = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
  const areas = colorAnalysisData.value.slice(0, 8)
  const data: any[] = []
  
  areas.forEach((area, ai) => {
    months.forEach((month, mi) => {
      const baseValue = area.deltaE
      const variation = (Math.random() - 0.5) * 5
      data.push([mi, ai, Math.max(0, baseValue + variation)])
    })
  })
  
  return {
    xAxis: months,
    yAxis: areas.map(a => a.name),
    data,
  }
})

const getSeverityColor = (deltaE: number): string => {
  if (deltaE < 6) return '#67c23a'
  if (deltaE < 12) return '#e6a23c'
  if (deltaE < 20) return '#f56c6c'
  return '#dc143c'
}

const getSeverityLabel = (deltaE: number): string => {
  if (deltaE < 6) return '轻微'
  if (deltaE < 12) return '中等'
  if (deltaE < 20) return '显著'
  return '严重'
}

const heatmapOption = computed<EChartsOption>(() => ({
  tooltip: {
    position: 'top',
    formatter: (params: any) => {
      const area = heatmapData.value.yAxis[params.data[1]]
      const month = heatmapData.value.xAxis[params.data[0]]
      const value = params.data[2].toFixed(1)
      return `${area}<br/>${month}<br/>色差 ΔE: ${value}`
    },
  },
  grid: {
    left: '15%',
    right: '10%',
    top: '10%',
    bottom: '15%',
  },
  xAxis: {
    type: 'category',
    data: heatmapData.value.xAxis,
    splitArea: { show: true },
    axisLabel: { rotate: 45 },
  },
  yAxis: {
    type: 'category',
    data: heatmapData.value.yAxis,
    splitArea: { show: true },
  },
  visualMap: {
    min: 0,
    max: 30,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
    inRange: {
      color: ['#67c23a', '#e6a23c', '#f56c6c', '#dc143c'],
    },
    text: ['色差高', '色差低'],
  },
  series: [
    {
      name: '色差 ΔE',
      type: 'heatmap',
      data: heatmapData.value.data,
      label: {
        show: true,
        formatter: (params: any) => params.data[2].toFixed(1),
        fontSize: 10,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))

const timelineOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const p = params[0]
      return `${p.name}<br/>平均色差 ΔE: ${p.value}`
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: timelineData.value.map((d) => d.month),
  },
  yAxis: {
    type: 'value',
    name: '色差 ΔE',
    min: 0,
    max: 20,
  },
  series: [
    {
      name: '平均色差',
      type: 'line',
      smooth: true,
      data: timelineData.value.map((d) => d.avgDeltaE),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 108, 108, 0.4)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' },
          ],
        },
      },
      lineStyle: {
        color: '#f56c6c',
        width: 3,
      },
      itemStyle: {
        color: '#f56c6c',
      },
      markLine: {
        silent: true,
        lineStyle: {
          type: 'dashed',
        },
        data: [
          { yAxis: 6, label: { formatter: '轻微', position: 'end' } },
          { yAxis: 12, label: { formatter: '显著', position: 'end' } },
        ],
      },
    },
  ],
}))

const diffOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },
  legend: {
    data: ['亮度变化', '饱和度变化', '色相偏移'],
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: colorAnalysisData.value.map((d) => d.name),
    axisLabel: { rotate: 45, interval: 0 },
  },
  yAxis: {
    type: 'value',
    name: '变化率 (%)',
  },
  series: [
    {
      name: '亮度变化',
      type: 'bar',
      data: colorAnalysisData.value.map((d) => d.brightness),
      itemStyle: { color: '#f56c6c' },
    },
    {
      name: '饱和度变化',
      type: 'bar',
      data: colorAnalysisData.value.map((d) => d.saturation),
      itemStyle: { color: '#409eff' },
    },
    {
      name: '色相偏移',
      type: 'bar',
      data: colorAnalysisData.value.map((d) => d.hue),
      itemStyle: { color: '#67c23a' },
    },
  ],
}))

onMounted(() => {
  useECharts(heatmapChartRef, heatmapOption.value)
  useECharts(timelineChartRef, timelineOption.value)
  useECharts(diffChartRef, diffOption.value)
})
</script>

<template>
  <div class="color-analyzer">
    <div class="analyzer-header">
      <div class="header-info">
        <h3 class="title">壁画颜色变化分析</h3>
        <p class="subtitle">通过色差分析监测壁画褪色、变色情况，ΔE 值表示颜色差异程度</p>
      </div>
      <div class="header-actions">
        <el-select v-model="selectedPeriod" size="small" style="width: 120px">
          <el-option label="近3个月" value="3m" />
          <el-option label="近6个月" value="6m" />
          <el-option label="近12个月" value="12m" />
        </el-select>
        <el-button type="primary" size="small">
          <el-icon><Refresh /></el-icon>
          重新分析
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-icon" style="background: #67c23a">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">8</div>
          <div class="stat-label">正常区域</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" style="background: #e6a23c">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">7</div>
          <div class="stat-label">需要关注</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" style="background: #f56c6c">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">5</div>
          <div class="stat-label">显著变化</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" style="background: #dc143c">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">2</div>
          <div class="stat-label">严重褪色</div>
        </div>
      </div>
    </div>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-title">区域色差热力图</div>
          <div ref="heatmapChartRef" class="chart-container" style="height: 400px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">色差趋势</div>
          <div ref="timelineChartRef" class="chart-container" style="height: 400px"></div>
        </div>
      </el-col>
    </el-row>

    <div class="chart-card">
      <div class="chart-title">颜色分量变化分析</div>
      <div ref="diffChartRef" class="chart-container" style="height: 350px"></div>
    </div>

    <div class="detail-table">
      <div class="table-title">详细分析报告</div>
      <el-table :data="colorAnalysisData" stripe border>
        <el-table-column prop="name" label="区域" width="150" />
        <el-table-column label="色差 ΔE" width="120">
          <template #default="{ row }">
            <span class="delta-value" :style="{ color: getSeverityColor(row.deltaE) }">
              {{ row.deltaE.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deltaE < 12 ? (row.deltaE < 6 ? 'success' : 'warning') : 'danger'" size="small">
              {{ getSeverityLabel(row.deltaE) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brightness" label="亮度变化" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.brightness < -10 ? '#f56c6c' : '#e6a23c' }">
              {{ row.brightness }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="saturation" label="饱和度变化" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.saturation < -8 ? '#f56c6c' : '#e6a23c' }">
              {{ row.saturation }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="hue" label="色相偏移" width="80" />
        <el-table-column label="建议" width="200">
          <template #default="{ row }">
            <span v-if="row.deltaE < 6" style="color: #67c23a">继续监测</span>
            <span v-else-if="row.deltaE < 12" style="color: #e6a23c">加强巡查频次</span>
            <span v-else-if="row.deltaE < 20" style="color: #f56c6c">制定修复方案</span>
            <span v-else style="color: #dc143c">紧急修复处理</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default>
            <el-button type="primary" link size="small">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="color-legend">
      <div class="legend-title">色差说明 (ΔE)</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color" style="background: #67c23a"></span>
          <span class="legend-text">0-6: 轻微差异，人眼几乎无法察觉</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #e6a23c"></span>
          <span class="legend-text">6-12: 中等差异，专业人员可识别</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f56c6c"></span>
          <span class="legend-text">12-20: 显著差异，肉眼明显可见</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #dc143c"></span>
          <span class="legend-text">20+: 严重差异，颜色大幅改变</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-analyzer {
  padding: 0;
}

.analyzer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
  }

  .subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stat-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
}

.charts-row {
  margin-bottom: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.chart-container {
  width: 100%;
}

.detail-table {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;

  .table-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }
}

.delta-value {
  font-weight: 600;
  font-size: 15px;
}

.color-legend {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .legend-color {
    width: 24px;
    height: 16px;
    border-radius: 3px;
  }

  .legend-text {
    font-size: 13px;
    color: var(--color-text-regular);
  }
}
</style>
