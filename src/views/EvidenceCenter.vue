<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElUpload } from 'element-plus'
import type { UploadProps, UploadFile } from 'element-plus'
import { useMuralStore } from '@/stores/mural'
import StatCard from '@/components/StatCard.vue'
import ImageCompare from '@/components/ImageCompare.vue'
import ColorAnalyzer from '@/components/ColorAnalyzer.vue'
import { useECharts, createPieOption, createBarOption } from '@/composables/useECharts'
import type {
  CAVE_OPTIONS,
  DISEASE_TYPE_OPTIONS,
  CHANGE_TYPE_OPTIONS,
  TREATMENT_STATUS_OPTIONS,
  DiseaseType,
  ChangeType,
  EvidencePhoto,
  ImageComparison as ImageComparisonType,
} from '@/types'
import {
  CAVE_OPTIONS as caveOptions,
  DISEASE_TYPE_OPTIONS as diseaseTypeOptions,
  CHANGE_TYPE_OPTIONS as changeTypeOptions,
  TREATMENT_STATUS_OPTIONS as treatmentStatusOptions,
} from '@/types'

const router = useRouter()
const store = useMuralStore()

const activeTab = ref('comparisons')
const diseaseChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const colorChartRef = ref<HTMLElement | null>(null)

const showUploadDialog = ref(false)
const showCompareDialog = ref(false)
const showColorDialog = ref(false)
const selectedComparison = ref<ImageComparisonType | null>(null)

const stats = computed(() => store.evidenceStats)
const comparisons = computed(() => store.filteredImageComparisons)
const treatments = computed(() => store.filteredTreatmentRecords)
const diseasePoints = computed(() => store.filteredDiseasePoints)
const areas = computed(() => store.areas)
const photos = computed(() => store.evidencePhotos)

const filterForm = ref({
  caveName: '',
  areaId: '',
  diseaseType: '',
  changeType: '',
  treatmentStatus: '',
  keyword: '',
})

const uploadForm = ref({
  areaId: '',
  observationId: '',
  photoDate: new Date().toISOString().split('T')[0],
  description: '',
})

const compareForm = ref({
  areaId: '',
  beforePhotoId: '',
  afterPhotoId: '',
  changeAnalysis: '',
  changeType: 'stable' as ChangeType,
})

const uploadFiles = ref<UploadFile[]>([])
const uploadLoading = ref(false)

const areaOptions = computed(() => {
  return areas.value.map((a) => ({ label: `${a.areaCode} - ${a.theme} (${a.caveName})`, value: a.id }))
})

const photoOptionsByArea = computed(() => {
  if (!compareForm.value.areaId) return []
  return photos.value
    .filter((p) => p.areaId === compareForm.value.areaId)
    .sort((a, b) => new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime())
    .map((p) => ({ label: `${p.photoDate} - ${p.description}`, value: p.id, photo: p }))
})

const beforePhoto = computed(() => {
  return photos.value.find((p) => p.id === compareForm.value.beforePhotoId)
})

const afterPhoto = computed(() => {
  return photos.value.find((p) => p.id === compareForm.value.afterPhotoId)
})

const diseasePieOption = computed(() =>
  createPieOption(stats.value.diseaseDistribution, '病害类型分布')
)
const trendBarOption = computed(() =>
  createBarOption(stats.value.monthlyComparisons, '月度对比趋势', '#c4a76c')
)

useECharts(diseaseChartRef, diseasePieOption.value)
useECharts(trendChartRef, trendBarOption.value)

onMounted(() => {
  store.resetEvidenceFilterParams()
})

function applyFilter() {
  store.setEvidenceFilterParams({
    caveName: filterForm.value.caveName,
    areaId: filterForm.value.areaId,
    diseaseType: filterForm.value.diseaseType,
    changeType: filterForm.value.changeType,
    treatmentStatus: filterForm.value.treatmentStatus,
    keyword: filterForm.value.keyword,
  })
}

function resetFilter() {
  filterForm.value = {
    caveName: '',
    areaId: '',
    diseaseType: '',
    changeType: '',
    treatmentStatus: '',
    keyword: '',
  }
  store.resetEvidenceFilterParams()
}

function goToAreaDetail(areaId: string) {
  router.push(`/areas/${areaId}`)
}

function getDiseaseTypeColor(type: string): string {
  const option = diseaseTypeOptions.find((o) => o.value === type)
  return option?.color || '#909399'
}

function getDiseaseTypeLabel(type: string): string {
  const option = diseaseTypeOptions.find((o) => o.value === type)
  return option?.label || type
}

function getChangeTypeColor(type: string): string {
  const option = changeTypeOptions.find((o) => o.value === type)
  return option?.color || '#909399'
}

function getChangeTypeLabel(type: string): string {
  const option = changeTypeOptions.find((o) => o.value === type)
  return option?.label || type
}

function getTreatmentStatusColor(status: string): string {
  const option = treatmentStatusOptions.find((o) => o.value === status)
  return option?.color || '#909399'
}

function getTreatmentStatusLabel(status: string): string {
  const option = treatmentStatusOptions.find((o) => o.value === status)
  return option?.label || status
}

function getAreaByAreaId(areaId: string) {
  return areas.value.find((a) => a.id === areaId)
}

function openUploadDialog() {
  uploadForm.value = {
    areaId: '',
    observationId: '',
    photoDate: new Date().toISOString().split('T')[0],
    description: '',
  }
  uploadFiles.value = []
  showUploadDialog.value = true
}

const handleUploadChange: UploadProps['onChange'] = (file, fileList) => {
  uploadFiles.value = fileList
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

function submitUpload() {
  if (!uploadForm.value.areaId) {
    ElMessage.warning('请选择区域')
    return
  }
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请选择要上传的照片')
    return
  }

  uploadLoading.value = true

  setTimeout(() => {
    uploadFiles.value.forEach((file, index) => {
      const area = getAreaByAreaId(uploadForm.value.areaId)
      const photoUrl = URL.createObjectURL(file.raw!)
      store.addEvidencePhoto({
        areaId: uploadForm.value.areaId,
        observationId: uploadForm.value.observationId || `OBS_${Date.now()}_${index}`,
        fileName: file.name,
        fileUrl: photoUrl,
        thumbnailUrl: photoUrl,
        photoDate: uploadForm.value.photoDate,
        uploadedBy: '文保管理员',
        description: uploadForm.value.description || file.name,
        isProcessed: false,
      })
    })

    uploadLoading.value = false
    showUploadDialog.value = false
    ElMessage.success(`成功上传 ${uploadFiles.value.length} 张照片`)
  }, 1000)
}

function openCompareDialog() {
  compareForm.value = {
    areaId: '',
    beforePhotoId: '',
    afterPhotoId: '',
    changeAnalysis: '',
    changeType: 'stable',
  }
  showCompareDialog.value = true
}

function createComparison() {
  if (!compareForm.value.areaId) {
    ElMessage.warning('请选择区域')
    return
  }
  if (!compareForm.value.beforePhotoId || !compareForm.value.afterPhotoId) {
    ElMessage.warning('请选择修复前后照片')
    return
  }
  if (compareForm.value.beforePhotoId === compareForm.value.afterPhotoId) {
    ElMessage.warning('修复前后照片不能相同')
    return
  }

  const before = beforePhoto.value!
  const after = afterPhoto.value!
  const areaDiseasePoints = diseasePoints.value.filter((d) => d.areaId === compareForm.value.areaId)

  store.addImageComparison({
    areaId: compareForm.value.areaId,
    beforeImage: before,
    afterImage: after,
    diseasePoints: areaDiseasePoints,
    changeAnalysis: compareForm.value.changeAnalysis || '影像对比分析',
    changeType: compareForm.value.changeType,
    createdBy: '文保管理员',
  })

  showCompareDialog.value = false
  ElMessage.success('影像对比记录已创建')
}

function openCompareDetail(comp: ImageComparisonType) {
  selectedComparison.value = comp
  showCompareDialog.value = true
}

function openColorAnalysis() {
  showColorDialog.value = true
}

function handleMarkerClick(point: any) {
  ElMessage.info(`点击了病害点位: ${point.name}`)
}
</script>

<template>
  <div class="evidence-center">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">壁画病害影像比对与修复取证中心</h1>
          <p class="page-subtitle">
            支持同一区域上传不同时期现场照片，提供修复前后影像对比、病害点位标注、颜色变化可视化、裂隙扩展轨迹记录、处理方案与执行留痕
          </p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="openUploadDialog">
            <el-icon><Upload /></el-icon>
            上传照片
          </el-button>
          <el-button @click="openCompareDialog">
            <el-icon><Comparison /></el-icon>
            创建对比
          </el-button>
          <el-button @click="openColorAnalysis">
            <el-icon><Brush /></el-icon>
            颜色分析
          </el-button>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <StatCard
        title="取证照片"
        :value="stats.totalPhotos"
        icon="Camera"
        color="#c4a76c"
        suffix="张"
        trend-label="累计上传"
      />
      <StatCard
        title="影像对比"
        :value="stats.totalComparisons"
        icon="Comparison"
        color="#4682b4"
        suffix="次"
        trend-label="累计对比"
      />
      <StatCard
        title="病害点位"
        :value="stats.totalDiseasePoints"
        icon="Warning"
        color="#f56c6c"
        suffix="个"
        trend-label="累计标注"
      />
      <StatCard
        title="修复方案"
        :value="stats.totalTreatments"
        icon="Document"
        color="#67c23a"
        suffix="份"
        trend-label="累计制定"
      />
      <StatCard
        title="待处理"
        :value="stats.pendingTreatments"
        icon="Timer"
        color="#e6a23c"
        suffix="份"
        trend-label="进行中"
      />
      <StatCard
        title="已完成"
        :value="stats.completedTreatments"
        icon="CircleCheck"
        color="#5f9ea0"
        suffix="份"
        trend-label="已验收"
      />
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <div ref="diseaseChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="洞窟">
          <el-select
            v-model="filterForm.caveName"
            placeholder="选择洞窟"
            clearable
            style="width: 150px"
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
            style="width: 200px"
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
        <el-form-item label="病害类型">
          <el-select
            v-model="filterForm.diseaseType"
            placeholder="选择类型"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in diseaseTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变化类型">
          <el-select
            v-model="filterForm.changeType"
            placeholder="选择类型"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in changeTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索关键词"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="tabs-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="影像对比" name="comparisons">
          <div class="list-container">
            <div
              v-for="comp in comparisons"
              :key="comp.id"
              class="comparison-item"
            >
              <div class="comparison-header">
                <div class="comparison-info">
                  <span
                    class="area-badge"
                    @click="goToAreaDetail(comp.areaId)"
                  >
                    {{ getAreaByAreaId(comp.areaId)?.areaCode }}
                  </span>
                  <span class="theme-text">
                    {{ getAreaByAreaId(comp.areaId)?.theme }}
                  </span>
                  <el-tag
                    :style="{ backgroundColor: getChangeTypeColor(comp.changeType), borderColor: getChangeTypeColor(comp.changeType) }"
                    effect="dark"
                    size="small"
                  >
                    {{ getChangeTypeLabel(comp.changeType) }}
                  </el-tag>
                </div>
                <div class="comparison-meta">
                  <span>创建人: {{ comp.createdBy }}</span>
                  <span>{{ comp.createdAt }}</span>
                </div>
              </div>
              
              <div class="slider-compare-section" v-if="comp.beforeImage && comp.afterImage">
                <ImageCompare
                  :before-image="comp.beforeImage"
                  :after-image="comp.afterImage"
                  :disease-points="comp.diseasePoints"
                  :show-markers="true"
                  @marker-click="handleMarkerClick"
                />
              </div>
              
              <div class="comparison-analysis">
                <span class="analysis-label">变化分析:</span>
                {{ comp.changeAnalysis }}
              </div>
              <div class="disease-tags" v-if="comp.diseasePoints.length > 0">
                <el-tag
                  v-for="point in comp.diseasePoints.slice(0, 5)"
                  :key="point.id"
                  size="small"
                  effect="light"
                  :style="{ borderColor: getDiseaseTypeColor(point.type) }"
                >
                  {{ point.name }}
                </el-tag>
                <el-tag
                  v-if="comp.diseasePoints.length > 5"
                  size="small"
                  effect="light"
                >
                  +{{ comp.diseasePoints.length - 5 }}
                </el-tag>
              </div>
              <div class="comparison-actions">
                <el-button size="small" @click="openCompareDetail(comp)">
                  <el-icon><ZoomIn /></el-icon>
                  查看大图
                </el-button>
                <el-button size="small" type="primary">
                  <el-icon><Edit /></el-icon>
                  编辑标注
                </el-button>
              </div>
            </div>
            <el-empty v-if="comparisons.length === 0" description="暂无影像对比记录，点击右上角「创建对比」开始" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="修复方案" name="treatments">
          <div class="list-container">
            <div
              v-for="treatment in treatments"
              :key="treatment.id"
              class="treatment-item"
            >
              <div class="treatment-header">
                <div class="treatment-title">
                  <span
                    class="area-badge"
                    @click="goToAreaDetail(treatment.areaId)"
                  >
                    {{ getAreaByAreaId(treatment.areaId)?.areaCode }}
                  </span>
                  <span class="title-text">{{ treatment.title }}</span>
                  <el-tag
                    :style="{ backgroundColor: getTreatmentStatusColor(treatment.status), borderColor: getTreatmentStatusColor(treatment.status) }"
                    effect="dark"
                    size="small"
                  >
                    {{ getTreatmentStatusLabel(treatment.status) }}
                  </el-tag>
                </div>
                <div class="treatment-meta">
                  <span>提出人: {{ treatment.proposedBy }}</span>
                  <span v-if="treatment.approvedBy">审批人: {{ treatment.approvedBy }}</span>
                </div>
              </div>
              <div class="treatment-dates">
                <span v-if="treatment.startDate">开始: {{ treatment.startDate }}</span>
                <span v-if="treatment.completedDate">完成: {{ treatment.completedDate }}</span>
              </div>
              <div class="treatment-description">
                {{ treatment.description }}
              </div>
              <div class="treatment-materials">
                <span class="materials-label">使用材料:</span>
                {{ treatment.materials }}
              </div>
              <div class="treatment-steps">
                <div
                  v-for="step in treatment.steps"
                  :key="step.id"
                  class="step-item"
                >
                  <div class="step-number">{{ step.step }}</div>
                  <div class="step-content">
                    <div class="step-desc">{{ step.description }}</div>
                    <div class="step-meta">
                      <span>操作人: {{ step.operator }}</span>
                      <span v-if="step.completedAt">完成: {{ step.completedAt }}</span>
                    </div>
                    <div v-if="step.remarks" class="step-remarks">
                      备注: {{ step.remarks }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="treatments.length === 0" description="暂无修复方案记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="病害点位" name="diseases">
          <div class="diseases-grid">
            <div
              v-for="point in diseasePoints"
              :key="point.id"
              class="disease-card"
            >
              <div class="disease-header">
                <div
                  class="disease-type-badge"
                  :style="{ backgroundColor: getDiseaseTypeColor(point.type) }"
                >
                  {{ getDiseaseTypeLabel(point.type) }}
                </div>
                <el-tag size="small" effect="light">
                  {{ point.severity === 'mild' ? '轻微' : point.severity === 'moderate' ? '中度' : '严重' }}
                </el-tag>
              </div>
              <div class="disease-name">{{ point.name }}</div>
              <div class="disease-area">
                区域:
                <span @click="goToAreaDetail(point.areaId)">
                  {{ getAreaByAreaId(point.areaId)?.areaCode }}
                </span>
              </div>
              <div class="disease-position">
                位置: ({{ point.x }}%, {{ point.y }}%)
              </div>
              <div class="disease-description">
                {{ point.description }}
              </div>
            </div>
            <el-empty v-if="diseasePoints.length === 0" description="暂无病害点位记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="异常变化预警" name="alerts">
          <div class="alerts-list">
            <div
              v-for="alert in stats.abnormalChanges"
              :key="alert.areaId + alert.detectedAt"
              class="alert-item"
            >
              <div class="alert-icon">
                <el-icon :size="32" color="#f56c6c">
                  <WarningFilled />
                </el-icon>
              </div>
              <div class="alert-content">
                <div class="alert-header">
                  <span class="alert-area">{{ alert.areaCode }}</span>
                  <span class="alert-theme">{{ alert.theme }}</span>
                  <el-tag type="danger" size="small" effect="dark">
                    {{ alert.changeType }}
                  </el-tag>
                </div>
                <div class="alert-cave">洞窟: {{ alert.caveName }}</div>
                <div class="alert-desc">{{ alert.description }}</div>
                <div class="alert-time">检测时间: {{ alert.detectedAt }}</div>
              </div>
              <div class="alert-action">
                <el-button type="primary" size="small" @click="goToAreaDetail(alert.areaId)">
                  查看详情
                </el-button>
              </div>
            </div>
            <el-empty v-if="stats.abnormalChanges.length === 0" description="暂无异常变化预警" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="showUploadDialog"
      title="上传现场照片"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="选择区域" required>
          <el-select
            v-model="uploadForm.areaId"
            placeholder="请选择壁画区域"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="area in areaOptions"
              :key="area.value"
              :label="area.label"
              :value="area.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="观测记录">
          <el-input
            v-model="uploadForm.observationId"
            placeholder="关联观测记录ID（可选）"
          />
        </el-form-item>
        <el-form-item label="拍摄日期">
          <el-date-picker
            v-model="uploadForm.photoDate"
            type="date"
            placeholder="选择拍摄日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="照片描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入照片描述"
          />
        </el-form-item>
        <el-form-item label="选择照片">
          <el-upload
            :auto-upload="false"
            :on-change="handleUploadChange"
            :before-upload="beforeUpload"
            :file-list="uploadFiles"
            multiple
            list-type="picture-card"
            accept="image/*"
            class="uploader"
          >
            <el-icon class="uploader-icon"><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png 格式，单张不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="submitUpload">
          确认上传
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showCompareDialog"
      :title="selectedComparison ? '影像对比详情' : '创建影像对比'"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="!selectedComparison">
        <el-form :model="compareForm" label-width="100px">
          <el-form-item label="选择区域" required>
            <el-select
              v-model="compareForm.areaId"
              placeholder="请选择壁画区域"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="area in areaOptions"
                :key="area.value"
                :label="area.label"
                :value="area.value"
              />
            </el-select>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="修复前照片" required>
                <el-select
                  v-model="compareForm.beforePhotoId"
                  placeholder="选择较早的照片"
                  style="width: 100%"
                  :disabled="!compareForm.areaId"
                >
                  <el-option
                    v-for="opt in photoOptionsByArea"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="修复后照片" required>
                <el-select
                  v-model="compareForm.afterPhotoId"
                  placeholder="选择较新的照片"
                  style="width: 100%"
                  :disabled="!compareForm.areaId"
                >
                  <el-option
                    v-for="opt in photoOptionsByArea"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="变化类型">
            <el-select v-model="compareForm.changeType" style="width: 100%">
              <el-option
                v-for="opt in changeTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="变化分析">
            <el-input
              v-model="compareForm.changeAnalysis"
              type="textarea"
              :rows="3"
              placeholder="请输入变化分析说明"
            />
          </el-form-item>
        </el-form>
      </div>
      <div v-else class="compare-detail">
        <ImageCompare
          :before-image="selectedComparison.beforeImage"
          :after-image="selectedComparison.afterImage"
          :disease-points="selectedComparison.diseasePoints"
          :show-markers="true"
          @marker-click="handleMarkerClick"
        />
        <div class="detail-info">
          <h4>变化分析</h4>
          <p>{{ selectedComparison.changeAnalysis }}</p>
        </div>
      </div>
      <template #footer>
        <template v-if="!selectedComparison">
          <el-button @click="showCompareDialog = false">取消</el-button>
          <el-button type="primary" @click="createComparison">
            创建对比
          </el-button>
        </template>
        <template v-else>
          <el-button @click="selectedComparison = null; showCompareDialog = false">
            关闭
          </el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showColorDialog"
      title="颜色变化分析"
      width="1000px"
      :close-on-click-modal="false"
    >
      <ColorAnalyzer />
      <template #footer>
        <el-button @click="showColorDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.evidence-center {
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

.slider-compare-section {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-lighter);
}

.comparison-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-lighter);
}

.compare-detail {
  .detail-info {
    margin-top: 16px;
    padding: 16px;
    background: var(--color-bg-body);
    border-radius: 8px;

    h4 {
      margin: 0 0 8px 0;
      color: var(--color-text-primary);
    }

    p {
      margin: 0;
      color: var(--color-text-regular);
      line-height: 1.6;
    }
  }
}

.uploader {
  :deep(.el-upload-list--picture-card) {
    .el-upload-list__item {
      width: 100px;
      height: 100px;
    }
  }

  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }
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
  height: 300px;
}

.filter-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tabs-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 20px;

  :deep(.el-tabs__header) {
    margin: 0 0 20px 0;
  }
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-item {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comparison-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.area-badge {
  background: var(--color-primary);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    opacity: 0.85;
  }
}

.theme-text {
  font-weight: 600;
  color: var(--color-text-primary);
}

.comparison-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.comparison-images {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.image-wrapper {
  flex: 1;
  text-align: center;
}

.image-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.image-wrapper img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.image-placeholder {
  width: 100%;
  height: 150px;
  background: var(--color-bg-body);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
}

.image-date {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.compare-arrow {
  font-size: 24px;
  color: var(--color-primary);
}

.comparison-analysis {
  font-size: 14px;
  color: var(--color-text-regular);
  line-height: 1.6;
  margin-bottom: 12px;

  .analysis-label {
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.disease-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.treatment-item {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }
}

.treatment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.treatment-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text-primary);
}

.treatment-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.treatment-dates {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.treatment-description {
  font-size: 14px;
  color: var(--color-text-regular);
  line-height: 1.6;
  margin-bottom: 12px;
}

.treatment-materials {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;

  .materials-label {
    font-weight: 500;
    color: var(--color-text-regular);
  }
}

.treatment-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-lighter);
}

.step-item {
  display: flex;
  gap: 12px;
}

.step-number {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-desc {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
  margin-bottom: 4px;
}

.step-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.step-remarks {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

.diseases-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.disease-card {
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-base);
  padding: 16px;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(196, 167, 108, 0.15);
  }
}

.disease-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.disease-type-badge {
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.disease-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.disease-area,
.disease-position {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;

  span {
    color: var(--color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.disease-description {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.5;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-lighter);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(245, 108, 108, 0.05);
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: var(--border-radius-base);
}

.alert-icon {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.alert-area {
  background: var(--color-danger);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.alert-theme {
  font-weight: 600;
  color: var(--color-text-primary);
}

.alert-cave,
.alert-time {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 14px;
  color: var(--color-text-regular);
  margin-top: 8px;
  line-height: 1.6;
}

.alert-action {
  flex-shrink: 0;
}

@media (max-width: 1600px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .diseases-grid {
    grid-template-columns: repeat(3, 1fr);
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

  .diseases-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .comparison-images {
    flex-direction: column;
  }

  .compare-arrow {
    transform: rotate(90deg);
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .diseases-grid {
    grid-template-columns: 1fr;
  }

  .comparison-header,
  .treatment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
