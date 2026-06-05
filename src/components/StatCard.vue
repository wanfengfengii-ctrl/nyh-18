<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  icon: string
  color: string
  suffix?: string
  trend?: number
  trendLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  suffix: '',
  trend: 0,
  trendLabel: '',
})

const gradientStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.color}15, ${props.color}05)`,
  borderLeft: `4px solid ${props.color}`,
}))

const iconColor = computed(() => ({
  color: props.color,
  background: `${props.color}20`,
}))
</script>

<template>
  <div class="stat-card" :style="gradientStyle">
    <div class="card-content">
      <div class="card-left">
        <div class="card-title">{{ title }}</div>
        <div class="card-value">
          <span class="value-number">{{ value }}</span>
          <span v-if="suffix" class="value-suffix">{{ suffix }}</span>
        </div>
        <div v-if="trendLabel" class="card-trend">
          <el-icon :class="trend >= 0 ? 'trend-up' : 'trend-down'">
            <TrendCharts v-if="trend >= 0" />
            <TrendCharts v-else style="transform: rotate(180deg)" />
          </el-icon>
          <span>{{ trendLabel }}</span>
        </div>
      </div>
      <div class="card-icon" :style="iconColor">
        <el-icon :size="28">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stat-card {
  border-radius: var(--border-radius-lg);
  padding: 20px;
  transition: var(--transition-base);
  background: #fff;
  box-shadow: var(--color-shadow-light);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--color-shadow-base);
  }
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-left {
  flex: 1;
}

.card-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.value-number {
  font-family: var(--font-family-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.value-suffix {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  .trend-up {
    color: var(--color-success);
  }

  .trend-down {
    color: var(--color-danger);
  }
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
}

.stat-card:hover .card-icon {
  transform: scale(1.1);
}
</style>
