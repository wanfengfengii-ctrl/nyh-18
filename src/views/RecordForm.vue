<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useMuralStore } from '@/stores/mural'
import {
  DYNASTY_OPTIONS,
  CAVE_OPTIONS,
  FADING_LEVEL_OPTIONS,
  PROCESSING_STATUS_OPTIONS,
  COLOR_OPTIONS,
} from '@/types'
import type { MuralRecord, FadingLevel, ProcessingStatus } from '@/types'
import { getCurrentDate, calculateRiskLevel, getRiskLabel, getRiskColor } from '@/utils'

const router = useRouter()
const route = useRoute()
const store = useMuralStore()
const formRef = ref<FormInstance>()

const isEdit = computed(() => route.name === 'RecordEdit')
const recordId = computed(() => route.params.id as string)

const formData = ref({
  areaCode: '',
  caveName: '',
  theme: '',
  dynasty: '',
  observationDate: getCurrentDate(),
  mainColors: '',
  fadingLevel: 'none' as FadingLevel,
  crackLength: 0,
  processingStatus: 'pending' as ProcessingStatus,
  remarks: '',
})

const currentRiskLevel = computed(() =>
  calculateRiskLevel(formData.value.fadingLevel, formData.value.crackLength)
)

const areaCodeValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入区域编号'))
  } else if (!/^[A-Z]{2,5}-\d{3,}$/.test(value)) {
    callback(new Error('格式错误，如 MOG-001'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  areaCode: [{ required: true, validator: areaCodeValidator, trigger: 'blur' }],
  caveName: [{ required: true, message: '请选择洞窟名称', trigger: 'change' }],
  theme: [
    { required: true, message: '请输入壁画主题', trigger: 'blur' },
    { max: 100, message: '最多100个字符', trigger: 'blur' },
  ],
  dynasty: [{ required: true, message: '请选择年代', trigger: 'change' }],
  observationDate: [{ required: true, message: '请选择观察日期', trigger: 'change' }],
  fadingLevel: [{ required: true, message: '请选择褪变等级', trigger: 'change' }],
  processingStatus: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  crackLength: [
    { type: 'number', min: 0, message: '裂隙长度不能为负数', trigger: 'blur' },
  ],
  mainColors: [{ max: 100, message: '最多100个字符', trigger: 'blur' }],
  remarks: [{ max: 1000, message: '最多1000个字符', trigger: 'blur' }],
}

onMounted(() => {
  if (isEdit.value) {
    const record = store.getRecordById(recordId.value)
    if (record) {
      formData.value = {
        areaCode: record.areaCode,
        caveName: record.caveName,
        theme: record.theme,
        dynasty: record.dynasty,
        observationDate: record.observationDate,
        mainColors: record.mainColors,
        fadingLevel: record.fadingLevel,
        crackLength: record.crackLength,
        processingStatus: record.processingStatus,
        remarks: record.remarks,
      }
    } else {
      ElMessage.error('记录不存在')
      router.push('/records')
    }
  }
})

function handleSubmit() {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const updated = store.updateRecord(recordId.value, {
          ...formData.value,
        })
        if (updated) {
          ElMessage.success('更新成功')
          router.push(`/records/${recordId.value}`)
        } else {
          ElMessage.error('更新失败')
        }
      } else {
        const newRecord = store.addRecord({
          ...formData.value,
        })
        ElMessage.success('创建成功')
        router.push(`/records/${newRecord.id}`)
      }
    }
  })
}

function handleCancel() {
  if (isEdit.value) {
    router.push(`/records/${recordId.value}`)
  } else {
    router.push('/records')
  }
}

function handleColorSelect(color: string) {
  const colors = formData.value.mainColors ? formData.value.mainColors.split('、') : []
  const index = colors.indexOf(color)
  if (index > -1) {
    colors.splice(index, 1)
  } else {
    colors.push(color)
  }
  formData.value.mainColors = colors.join('、')
}

function isColorSelected(color: string): boolean {
  return formData.value.mainColors?.split('、').includes(color) || false
}
</script>

<template>
  <div class="record-form">
    <div class="page-header">
      <el-page-header @back="handleCancel" :content="isEdit ? '编辑记录' : '新增记录'" />
    </div>

    <div class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="right"
        @submit.prevent="handleSubmit"
      >
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="区域编号" prop="areaCode">
                <el-input
                  v-model="formData.areaCode"
                  placeholder="如 MOG-001"
                  maxlength="20"
                />
                <div class="form-tip">格式：洞窟缩写-编号，如 MOG-001</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="洞窟名称" prop="caveName">
                <el-select
                  v-model="formData.caveName"
                  placeholder="请选择洞窟"
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="cave in CAVE_OPTIONS"
                    :key="cave"
                    :label="cave"
                    :value="cave"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="壁画主题" prop="theme">
                <el-input
                  v-model="formData.theme"
                  placeholder="请输入壁画主题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年代" prop="dynasty">
                <el-select
                  v-model="formData.dynasty"
                  placeholder="请选择年代"
                  style="width: 100%"
                >
                  <el-option
                    v-for="dynasty in DYNASTY_OPTIONS"
                    :key="dynasty"
                    :label="dynasty"
                    :value="dynasty"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="观察日期" prop="observationDate">
                <el-date-picker
                  v-model="formData.observationDate"
                  type="date"
                  placeholder="选择观察日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="处理状态" prop="processingStatus">
                <el-select
                  v-model="formData.processingStatus"
                  placeholder="请选择处理状态"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in PROCESSING_STATUS_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">病害观察</h3>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="褪变等级" prop="fadingLevel">
                <el-radio-group v-model="formData.fadingLevel">
                  <el-radio-button
                    v-for="item in FADING_LEVEL_OPTIONS"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="裂隙长度" prop="crackLength">
                <el-input-number
                  v-model="formData.crackLength"
                  :min="0"
                  :max="999"
                  :precision="1"
                  :step="1"
                  style="width: 100%"
                />
                <span class="form-unit">厘米</span>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="主要颜色">
                <div class="color-selector">
                  <span
                    v-for="color in COLOR_OPTIONS"
                    :key="color"
                    class="color-tag"
                    :class="{ active: isColorSelected(color) }"
                    @click="handleColorSelect(color)"
                  >
                    {{ color }}
                  </span>
                </div>
                <el-input
                  v-model="formData.mainColors"
                  placeholder="可手动输入，用顿号分隔"
                  style="margin-top: 8px"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3 class="section-title">风险评估</h3>
          <div class="risk-assessment">
            <div class="risk-display">
              <span class="risk-label">自动评估风险等级：</span>
              <el-tag
                :type="currentRiskLevel === 'high' ? 'danger' : currentRiskLevel === 'medium' ? 'warning' : 'success'"
                size="large"
                effect="dark"
                :style="{ backgroundColor: getRiskColor(currentRiskLevel) }"
              >
                {{ getRiskLabel(currentRiskLevel) }}
              </el-tag>
            </div>
            <div class="risk-rules">
              <p>评估规则：</p>
              <ul>
                <li><el-tag type="danger" size="small">高风险</el-tag> 褪变等级为"严重" 或 裂隙长度 > 50cm</li>
                <li><el-tag type="warning" size="small">中风险</el-tag> 褪变等级为"中度" 或 裂隙长度 20-50cm</li>
                <li><el-tag type="success" size="small">低风险</el-tag> 其他情况</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">备注信息</h3>
          <el-form-item label="备注" prop="remarks">
            <el-input
              v-model="formData.remarks"
              type="textarea"
              :rows="4"
              placeholder="请输入详细观察描述和保护建议..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </div>

        <div class="form-actions">
          <el-button size="large" @click="handleCancel">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button type="primary" size="large" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            {{ isEdit ? '保存修改' : '提交记录' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.record-form {
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

.form-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 32px;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-lighter);

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.section-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 20px;
  padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}

.form-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.form-unit {
  margin-left: 8px;
  color: var(--color-text-secondary);
}

.color-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-tag {
  padding: 4px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }
}

.risk-assessment {
  background: linear-gradient(135deg, rgba(196, 167, 108, 0.05), rgba(160, 82, 45, 0.05));
  border-radius: var(--border-radius-lg);
  padding: 24px;
  border: 1px dashed var(--color-primary-light);
}

.risk-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .risk-label {
    font-size: var(--font-size-base);
    color: var(--color-text-regular);
  }
}

.risk-rules {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  p {
    margin: 0 0 8px;
    font-weight: 500;
    color: var(--color-text-regular);
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-lighter);
}
</style>
