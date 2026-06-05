<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMuralStore } from '@/stores/mural'
import type { RiskLevel, ProcessingStatus } from '@/types'
import {
  getRiskLabel,
  getRiskColor,
  getFadingLabel,
  getProcessingLabel,
} from '@/utils'

const router = useRouter()
const route = useRoute()
const store = useMuralStore()

const recordId = computed(() => route.params.id as string)
const record = computed(() => store.getRecordById(recordId.value))

if (!record.value) {
  ElMessage.error('记录不存在')
  router.replace('/records')
}

function goBack() {
  router.push('/records')
}

function goToEdit() {
  router.push(`/records/${recordId.value}/edit`)
}

function updateStatus(status: ProcessingStatus) {
  const success = store.updateProcessingStatus(recordId.value, status)
  if (success) {
    ElMessage.success('状态已更新')
  } else {
    ElMessage.error('更新失败')
  }
}

async function handleDelete() {
  if (!record.value) return
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${record.value.theme}" 的记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    const success = store.deleteRecord(recordId.value)
    if (success) {
      ElMessage.success('删除成功')
      router.push('/records')
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
    // 用户取消
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
</script>

<template>
  <div class="record-detail" v-if="record">
    <div class="page-header">
      <el-page-header @back="goBack" content="记录详情">
        <template #extra>
          <el-button @click="goToEdit">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-page-header>
    </div>

    <div class="detail-header">
      <div class="header-info">
        <div class="title-row">
          <h1 class="record-title">{{ record.theme }}</h1>
          <el-tag
            :type="riskTagType(record.riskLevel)"
            size="large"
            effect="dark"
            :style="{ backgroundColor: getRiskColor(record.riskLevel) }"
          >
            {{ getRiskLabel(record.riskLevel) }}
          </el-tag>
        </div>
        <div class="meta-row">
          <span class="meta-item">
            <el-icon><Collection /></el-icon>
            {{ record.caveName }}
          </span>
          <span class="meta-item">
            <el-icon><Tickets /></el-icon>
            {{ record.areaCode }}
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            {{ record.observationDate }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ record.dynasty }}
          </span>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <div class="info-card">
          <h3 class="card-title">
            <el-icon><InfoFilled /></el-icon>
            基本信息
          </h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="区域编号">
              <code class="code-text">{{ record.areaCode }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="洞窟名称">
              {{ record.caveName }}
            </el-descriptions-item>
            <el-descriptions-item label="壁画主题">
              {{ record.theme }}
            </el-descriptions-item>
            <el-descriptions-item label="年代">
              {{ record.dynasty }}
            </el-descriptions-item>
            <el-descriptions-item label="观察日期">
              {{ record.observationDate }}
            </el-descriptions-item>
            <el-descriptions-item label="主要颜色">
              {{ record.mainColors || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Warning /></el-icon>
            病害观察
          </h3>
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="status-item">
                <div class="status-label">褪变等级</div>
                <div class="status-value">
                  <el-tag
                    :type="record.fadingLevel === 'severe' ? 'danger' : record.fadingLevel === 'moderate' ? 'warning' : record.fadingLevel === 'mild' ? 'info' : 'success'"
                    size="large"
                    effect="light"
                  >
                    {{ getFadingLabel(record.fadingLevel) }}
                  </el-tag>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="status-item">
                <div class="status-label">裂隙长度</div>
                <div class="status-value">
                  <span class="number-value" :class="{ 'text-danger': record.crackLength > 50 }">
                    {{ record.crackLength > 0 ? record.crackLength : '无' }}
                  </span>
                  <span v-if="record.crackLength > 0" class="unit">厘米</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Document /></el-icon>
            备注信息
          </h3>
          <div class="remarks-content">
            {{ record.remarks || '暂无备注信息' }}
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
              :type="statusTagType(record.processingStatus)"
              size="large"
              effect="dark"
              class="main-status-tag"
            >
              {{ getProcessingLabel(record.processingStatus) }}
            </el-tag>
          </div>
          <div class="status-actions">
            <div class="action-label">快速更新状态：</div>
            <div class="action-buttons">
              <el-button
                type="info"
                :disabled="record.processingStatus === 'pending'"
                @click="updateStatus('pending')"
              >
                设为未处理
              </el-button>
              <el-button
                type="warning"
                :disabled="record.processingStatus === 'processing'"
                @click="updateStatus('processing')"
              >
                设为处理中
              </el-button>
              <el-button
                type="success"
                :disabled="record.processingStatus === 'completed'"
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
            风险评估
          </h3>
          <div class="risk-display">
            <div class="risk-circle" :class="`risk-${record.riskLevel}`">
              <span class="risk-text">{{ getRiskLabel(record.riskLevel) }}</span>
            </div>
          </div>
          <div class="risk-info">
            <div class="info-item">
              <span class="info-label">评估依据：</span>
            </div>
            <ul class="risk-rules">
              <li :class="{ active: record.fadingLevel === 'severe' || record.crackLength > 50 }">
                <el-icon v-if="record.fadingLevel === 'severe' || record.crackLength > 50">
                  <CircleCheck
                  /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                高风险：褪变严重 或 裂隙 > 50cm
              </li>
              <li
                :class="{
                  active:
                    (record.fadingLevel === 'moderate' ||
                      (record.crackLength >= 20 && record.crackLength <= 50)) &&
                    record.riskLevel !== 'high',
                }"
              >
                <el-icon
                  v-if="(record.fadingLevel === 'moderate' ||
                      (record.crackLength >= 20 && record.crackLength <= 50)) &&
                    record.riskLevel !== 'high'"
                ><CircleCheck
                  /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                中风险：褪变中度 或 裂隙 20-50cm
              </li>
              <li :class="{ active: record.riskLevel === 'low' }">
                <el-icon v-if="record.riskLevel === 'low'"><CircleCheck
                  /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                低风险：其他情况
              </li>
            </ul>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">
            <el-icon><Time /></el-icon>
            系统信息
          </h3>
          <div class="system-info">
            <div class="info-row">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatDateTime(record.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ formatDateTime(record.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.record-detail {
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
  gap: 16px;
  margin-bottom: 12px;
}

.record-title {
  font-family: var(--font-family-display);
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #fff;
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
  margin: 0 0 16px;
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

.status-item {
  padding: 16px;
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
  text-align: center;
}

.status-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.status-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.number-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);

  &.text-danger {
    color: var(--color-danger);
  }
}

.unit {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.remarks-content {
  padding: 16px;
  background: var(--color-bg-body);
  border-radius: var(--border-radius-base);
  min-height: 80px;
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

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.system-info {
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
    font-family: 'Courier New', monospace;
  }
}

@media (max-width: 1200px) {
  .el-col {
    width: 100% !important;
  }
}
</style>
