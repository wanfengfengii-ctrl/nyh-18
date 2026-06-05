<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DiseasePoint, EvidencePhoto } from '@/types'
import { DISEASE_TYPE_OPTIONS } from '@/types'

interface Props {
  beforeImage: EvidencePhoto
  afterImage: EvidencePhoto
  diseasePoints?: DiseasePoint[]
  showMarkers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  diseasePoints: () => [],
  showMarkers: true,
})

const emit = defineEmits<{
  markerClick: [point: DiseasePoint]
}>()

const containerRef = ref<HTMLElement | null>(null)
const sliderPosition = ref(50)
const isDragging = ref(false)
const imageLoaded = ref({ before: false, after: false })

const containerWidth = ref(0)

function updateWidth() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
  }
}

onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth)
})

function startDrag() {
  isDragging.value = true
}

function stopDrag() {
  isDragging.value = false
}

function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const x = clientX - rect.left
  const percentage = (x / rect.width) * 100
  sliderPosition.value = Math.max(0, Math.min(100, percentage))
}

function getDiseaseTypeColor(type: string): string {
  const option = DISEASE_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.color || '#909399'
}

function getDiseaseTypeLabel(type: string): string {
  const option = DISEASE_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.label || type
}

function handleMarkerClick(point: DiseasePoint) {
  emit('markerClick', point)
}

const allImagesLoaded = computed(() => imageLoaded.value.before && imageLoaded.value.after)
</script>

<template>
  <div class="image-compare">
    <div
      ref="containerRef"
      class="compare-container"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @touchmove="onDrag"
      @touchend="stopDrag"
    >
      <div class="image-layer after-layer">
        <img
          :src="afterImage.fileUrl"
          :alt="afterImage.description"
          @load="imageLoaded.after = true"
        >
        <div class="image-label">
          <span class="label-date">{{ afterImage.photoDate }}</span>
          <span class="label-text">修复后</span>
        </div>
        <div
          v-if="showMarkers"
          class="disease-markers"
        >
          <div
            v-for="point in diseasePoints"
            :key="point.id"
            class="disease-marker"
            :style="{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.width}%`,
              height: `${point.height}%`,
              borderColor: getDiseaseTypeColor(point.type),
            }"
            @click.stop="handleMarkerClick(point)"
          >
            <span
              class="marker-label"
              :style="{ backgroundColor: getDiseaseTypeColor(point.type) }"
            >
              {{ getDiseaseTypeLabel(point.type) }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="image-layer before-layer"
        :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
      >
        <img
          :src="beforeImage.fileUrl"
          :alt="beforeImage.description"
          @load="imageLoaded.before = true"
        >
        <div class="image-label">
          <span class="label-date">{{ beforeImage.photoDate }}</span>
          <span class="label-text">修复前</span>
        </div>
        <div
          v-if="showMarkers"
          class="disease-markers"
        >
          <div
            v-for="point in diseasePoints"
            :key="point.id"
            class="disease-marker"
            :style="{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.width}%`,
              height: `${point.height}%`,
              borderColor: getDiseaseTypeColor(point.type),
            }"
            @click.stop="handleMarkerClick(point)"
          >
            <span
              class="marker-label"
              :style="{ backgroundColor: getDiseaseTypeColor(point.type) }"
            >
              {{ getDiseaseTypeLabel(point.type) }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="slider-line"
        :style="{ left: `${sliderPosition}%` }"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <div class="slider-handle">
          <el-icon><ArrowLeft /></el-icon>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <div
        v-if="!allImagesLoaded"
        class="loading-overlay"
      >
        <el-icon
          class="loading-icon"
          :size="48"
        >
          <Loading />
        </el-icon>
      </div>
    </div>

    <div class="compare-legend">
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #f56c6c"
        />
        <span>裂隙</span>
      </div>
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #e6a23c"
        />
        <span>褪变</span>
      </div>
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #f97316"
        />
        <span>起甲</span>
      </div>
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #67c23a"
        />
        <span>霉斑</span>
      </div>
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #409eff"
        />
        <span>盐析</span>
      </div>
      <div class="legend-item">
        <div
          class="legend-color"
          style="background: #909399"
        />
        <span>破损</span>
      </div>
    </div>

    <div class="compare-hint">
      <el-icon><Tips /></el-icon>
      拖动中间滑块可对比修复前后影像差异，点击标注框可查看病害详情
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image-compare {
  width: 100%;
}

.compare-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--border-radius-base);
  background: var(--color-bg-body);
  user-select: none;
}

.image-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.before-layer {
  z-index: 2;
}

.after-layer {
  z-index: 1;
}

.image-label {
  position: absolute;
  bottom: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label-date {
    font-size: 12px;
    opacity: 0.8;
  }

  .label-text {
    font-size: 14px;
    font-weight: 600;
  }
}

.before-layer .image-label {
  left: 16px;
}

.after-layer .image-label {
  right: 16px;
}

.disease-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.disease-marker {
  position: absolute;
  border: 2px solid;
  border-radius: 4px;
  cursor: pointer;
  pointer-events: auto;
  transition: var(--transition-fast);
  background: rgba(255, 255, 255, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
  }
}

.marker-label {
  position: absolute;
  top: -24px;
  left: 0;
  padding: 2px 8px;
  color: #fff;
  font-size: 11px;
  border-radius: 3px;
  white-space: nowrap;
}

.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #fff;
  z-index: 10;
  cursor: ew-resize;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -8px;
    right: -8px;
    bottom: 0;
  }
}

.slider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  color: var(--color-primary);

  .el-icon {
    font-size: 18px;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-icon {
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.compare-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-regular);
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.compare-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);

  .el-icon {
    color: var(--color-primary);
  }
}
</style>
