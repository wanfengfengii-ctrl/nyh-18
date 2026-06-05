import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export function useECharts(
  chartRef: ReturnType<typeof ref<HTMLElement | null>>,
  option: EChartsOption,
  theme?: string
) {
  let chartInstance: echarts.ECharts | null = null

  const initChart = () => {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value, theme)
    chartInstance.setOption(option)
  }

  const resizeHandler = () => {
    chartInstance?.resize()
  }

  const updateOption = (newOption: EChartsOption) => {
    chartInstance?.setOption(newOption)
  }

  onMounted(() => {
    initChart()
    window.addEventListener('resize', resizeHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler)
    chartInstance?.dispose()
    chartInstance = null
  })

  watch(
    () => option,
    (newOption) => {
      updateOption(newOption)
    },
    { deep: true }
  )

  return {
    updateOption,
  }
}

export const chartColors = ['#c4a76c', '#a0522d', '#4682b4', '#5f9ea0', '#67c23a', '#e6a23c', '#f56c6c']

export function createPieOption(data: { name: string; value: number }[], title?: string): EChartsOption {
  return {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#303133',
          },
        }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#606266',
      },
    },
    color: chartColors,
    series: [
      {
        name: '分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 600,
            formatter: '{b}\n{c}',
          },
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
  }
}

export function createBarOption(
  data: { name: string; value: number }[],
  title?: string,
  color?: string
): EChartsOption {
  return {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#303133',
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c}',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: {
        fontSize: 11,
        color: '#606266',
        rotate: 30,
        interval: 0,
      },
      axisLine: {
        lineStyle: {
          color: '#dcdfe6',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#606266',
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color || '#c4a76c' },
            { offset: 1, color: color ? `${color}80` : '#d8c49a' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        data: data.map((d) => d.value),
      },
    ],
  }
}

export function createLineOption(
  data: { date: string; count: number }[],
  title?: string
): EChartsOption {
  return {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#303133',
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 条记录',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.date),
      axisLabel: {
        fontSize: 11,
        color: '#606266',
      },
      axisLine: {
        lineStyle: {
          color: '#dcdfe6',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#606266',
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '记录数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#a0522d',
        },
        itemStyle: {
          color: '#a0522d',
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(160, 82, 45, 0.3)' },
            { offset: 1, color: 'rgba(160, 82, 45, 0.05)' },
          ]),
        },
        data: data.map((d) => d.count),
      },
    ],
  }
}

export function createRingOption(
  data: { name: string; value: number }[],
  title?: string
): EChartsOption {
  return {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#303133',
          },
        }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#606266',
      },
    },
    color: ['#67c23a', '#e6a23c', '#f56c6c'],
    series: [
      {
        name: '处理进度',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const total = data.reduce((sum, d) => sum + d.value, 0)
            const completed = data.find((d) => d.name === '已完成')?.value || 0
            return total > 0 ? `{a|${Math.round((completed / total) * 100)}%}\n{b|完成率}` : '{a|0%}\n{b|完成率}'
          },
          rich: {
            a: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#303133',
              lineHeight: 30,
            },
            b: {
              fontSize: 12,
              color: '#909399',
            },
          },
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
  }
}
