<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAreaStore } from '@/stores/area'
import {
  DYNASTY_OPTIONS,
  CAVE_OPTIONS,
} from '@/types'
import type { MuralArea } from '@/types'

const router = useRouter()
const route = useRoute()
const areaStore = useAreaStore()

const areaId = computed(() => route.params.id as string)
const isEdit = computed(() => areaId.value && areaId.value !== 'new')

const formRef = ref()
const form = ref({
  areaCode: '',
  caveName: '',
  theme: '',
  dynasty: '',
  mainColors: '',
  location: '',
  description: '',
})

const rules = {
  areaCode: [
    { required: true, message: '请输入区域编号', trigger: 'blur' },
  ],
  caveName: [
    { required: true, message: '请选择洞窟名称', trigger: 'change' },
  ],
  theme: [
    { required: true, message: '请输入壁画主题', trigger: 'blur' },
  ],
  dynasty: [
    { required: true, message: '请选择年代', trigger: 'change' },
  ],
  location: [
    { required: true, message: '请输入壁画位置', trigger: 'blur' },
  ],
}

onMounted(() => {
  if (isEdit.value) {
    const area = areaStore.getAreaById(areaId.value)
    if (area) {
      form.value = {
        areaCode: area.areaCode,
        caveName: area.caveName,
        theme: area.theme,
        dynasty: area.dynasty,
        mainColors: area.mainColors || '',
        location: area.location || '',
        description: area.description || '',
      }
    }
  }
})

function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        const success = areaStore.updateArea(areaId.value, form.value)
        if (success) {
          ElMessage.success('区域档案更新成功')
          router.push(`/areas/${areaId.value}`)
        } else {
          ElMessage.error('更新失败')
        }
      } else {
        const newArea = areaStore.addArea(form.value)
        if (newArea) {
          ElMessage.success('区域档案创建成功')
          router.push('/areas')
        } else {
          ElMessage.error('创建失败')
        }
      }
    }
  })
}

function handleCancel() {
  if (isEdit.value) {
    router.push(`/areas/${areaId.value}`)
  } else {
    router.push('/areas')
  }
}
</script>

<template>
  <div class="area-form">
    <div class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          circle
          @click="handleCancel"
        />
        <h1 class="page-title">
          {{ isEdit ? '编辑区域档案' : '新增区域档案' }}
        </h1>
      </div>
      <div class="header-right">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存修改' : '创建区域' }}
        </el-button>
      </div>
    </div>

    <div class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="area-form-content"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item
              label="区域编号"
              prop="areaCode"
            >
              <el-input
                v-model="form.areaCode"
                placeholder="例如：MOG-001"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="洞窟名称"
              prop="caveName"
            >
              <el-select
                v-model="form.caveName"
                placeholder="请选择洞窟"
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
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item
              label="壁画主题"
              prop="theme"
            >
              <el-input
                v-model="form.theme"
                placeholder="例如：九色鹿本生"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="年代"
              prop="dynasty"
            >
              <el-select
                v-model="form.dynasty"
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
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="主色调">
              <el-input
                v-model="form.mainColors"
                placeholder="例如：石青、赭石、土红"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="壁画位置"
              prop="location"
            >
              <el-input
                v-model="form.location"
                placeholder="例如：窟内北壁"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入壁画描述..."
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.area-form {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .area-form-content {
    max-width: 800px;
  }
}
</style>
