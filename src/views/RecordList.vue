<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMuralStore } from '@/stores/mural'
import {
  DYNASTY_OPTIONS,
  CAVE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  PROCESSING_STATUS_OPTIONS,
  FADING_LEVEL_OPTIONS,
} from '@/types'
import type { MuralRecord, RiskLevel, ProcessingStatus } from '@/types'
import { getRiskLabel, getRiskColor, getFadingLabel, getProcessingLabel } from '@/utils'

const router = useRouter()
const store = useMuralStore()

const searchForm = ref({
  caveName: '',
  dynasty: '',
  riskLevel: '' as RiskLevel | '',
  processingStatus: '' as ProcessingStatus | '',
  keyword: '',
})

const loading = ref(false)

function handleSearch() {
  loading.value = true
  store.setFilterParams({
    caveName: searchForm.value.caveName,
    dynasty: searchForm.value.dynasty,
    riskLevel: searchForm.value.riskLevel,
    processingStatus: searchForm.value.processingStatus,
    keyword: searchForm.value.keyword,
  })
  setTimeout(() => {
    loading.value = false
  }, 300)
}

function handleReset() {
  searchForm.value = {
    caveName: '',
    dynasty: '',
    riskLevel: '',
    processingStatus: '',
    keyword: '',
  }
  store.resetFilterParams()
}

function goToDetail(id: string) {
  router.push(`/records/${id}`)
}

function goToEdit(id: string) {
  router.push(`/records/${id}/edit`)
}

function goToCreate() {
  router.push('/records/new')
}

async function handleDelete(record: MuralRecord) {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${record.theme}" 的记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    const success = store.deleteRecord(record.id)
    if (success) {
      ElMessage.success('删除成功')
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

const columns = [
  { prop: 'areaCode', label: '区域编号', width: 120, fixed: 'left' as const },
  { prop: 'caveName', label: '洞窟名称', width: 100 },
  { prop: 'theme', label: '壁画主题', minWidth: 140 },
  { prop: 'dynasty', label: '年代', width: 80 },
  { prop: 'observationDate', label: '观察日期', width: 120 },
  { prop: 'mainColors', label: '主要颜色', width: 140 },
  {
    prop: 'fadingLevel',
    label: '褪变等级',
    width: 100,
    formatter: (_row: MuralRecord, _col: unknown, value: string) =>
      FADING_LEVEL_OPTIONS.find((o) => o.value === value)?.label || value,
  },
  {
    prop: 'crackLength',
    label: '裂隙长度(cm)',
    width: 120,
    formatter: (_row: MuralRecord, _col: unknown, value: number) => (value > 0 ? value : '-'),
  },
  {
    prop: 'riskLevel',
    label: '风险等级',
    width: 100,
    formatter: (row: MuralRecord) => getRiskLabel(row.riskLevel),
  },
  {
    prop: 'processingStatus',
    label: '处理状态',
    width: 100,
    formatter: (row: MuralRecord) => getProcessingLabel(row.processingStatus),
  },
  {
    label: '操作',
    width: 220,
    fixed: 'right' as const,
  },
]

const displayRecords = computed(() => store.filteredRecords)
</script>

<template>
  <div class="record-list">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">壁画记录</h1>
        <p class="page-subtitle">共 {{ displayRecords.length }} 条记录</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
      </div>
    </div>

    <div class="filter-card">
      <el-form :model="searchForm" inline @submit.prevent>
        <el-form-item label="洞窟名称">
          <el-select
            v-model="searchForm.caveName"
            placeholder="全部洞窟"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="cave in CAVE_OPTIONS"
              :key="cave"
              :label="cave"
              :value="cave"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年代">
          <el-select
            v-model="searchForm.dynasty"
            placeholder="全部年代"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="dynasty in DYNASTY_OPTIONS"
              :key="dynasty"
              :label="dynasty"
              :value="dynasty"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="searchForm.riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in RISK_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="searchForm.processingStatus"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in PROCESSING_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="区域编号/主题"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="displayRecords"
        border
        stripe
        style="width: 100%"
        :row-style="{ cursor: 'pointer' }"
        @row-click="goToDetail"
      >
        <el-table-column
          v-for="col in columns"
          :key="col.prop || col.label"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
        >
          <template #default="scope" v-if="col.prop === 'riskLevel'">
            <el-tag
              :type="riskTagType(scope.row.riskLevel)"
              effect="light"
              :style="{ borderColor: getRiskColor(scope.row.riskLevel) }"
            >
              {{ getRiskLabel(scope.row.riskLevel) }}
            </el-tag>
          </template>
          <template #default="scope" v-else-if="col.prop === 'processingStatus'">
            <el-tag :type="statusTagType(scope.row.processingStatus)" effect="light">
              {{ getProcessingLabel(scope.row.processingStatus) }}
            </el-tag>
          </template>
          <template #default="scope" v-else-if="col.prop === 'fadingLevel'">
            <span>{{ getFadingLabel(scope.row.fadingLevel) }}</span>
          </template>
          <template #default="scope" v-else-if="col.label === '操作'">
            <div class="action-buttons" @click.stop>
              <el-button type="primary" link size="small" @click="goToDetail(scope.row.id)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button type="primary" link size="small" @click="goToEdit(scope.row.id)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
          <template #default="scope" v-else-if="col.formatter">
            {{ col.formatter!(scope.row, col, scope.row[col.prop as keyof MuralRecord] as never) }}
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.record-list {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  .page-title {
    font-size: var(--font-size-2xl);
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.filter-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 16px 24px 0;
  margin-bottom: 16px;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.table-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--color-shadow-light);
  padding: 16px;

  :deep(.el-table) {
    border-radius: var(--border-radius-base);

    th.el-table__cell {
      background-color: #fafafa;
      color: var(--color-text-primary);
      font-weight: 600;
    }

    tr:hover > td {
      background-color: rgba(196, 167, 108, 0.05) !important;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;

  .el-button {
    padding: 4px 8px;
  }
}
</style>
