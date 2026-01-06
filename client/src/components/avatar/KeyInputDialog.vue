<template>
  <el-dialog
    v-model="dialogVisible"
    title="密钥配置"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-alert
      v-if="isTestMode"
      title="测试模式"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      当前使用测试密钥，功能受限。请在生产环境使用正式密钥。
    </el-alert>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
    >
      <el-form-item label="星云 App ID" prop="xingyunAppId">
        <el-input
          v-model="formData.xingyunAppId"
          placeholder="请输入星云AppId"
          :disabled="isTestMode"
        />
      </el-form-item>

      <el-form-item label="星云 App Secret" prop="xingyunAppSecret">
        <el-input
          v-model="formData.xingyunAppSecret"
          type="password"
          placeholder="请输入星云AppSecret"
          show-password
          :disabled="isTestMode"
        />
      </el-form-item>

      <el-form-item label="魔搭 API Key" prop="modelscopeApiKey">
        <el-input
          v-model="formData.modelscopeApiKey"
          type="password"
          placeholder="请输入魔搭API Key"
          show-password
          :disabled="isTestMode"
        />
      </el-form-item>

      <el-divider>或</el-divider>

      <el-form-item>
        <el-button
          type="warning"
          style="width: 100%"
          @click="handleUseTestKeys"
        >
          使用测试密钥
        </el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleConfirm"
        >
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import type { KeyConfig } from '@shared/types'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const configStore = useConfigStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 是否测试模式
const isTestMode = computed(() => formData.value.isTestMode)

// 表单数据
const formData = reactive<Partial<KeyConfig>>({
  xingyunAppId: '',
  xingyunAppSecret: '',
  modelscopeApiKey: '',
  isTestMode: false
})

// 表单验证规则
const rules: FormRules = {
  xingyunAppId: [
    { required: true, message: '请输入星云AppId', trigger: 'blur' }
  ],
  xingyunAppSecret: [
    { required: true, message: '请输入星云AppSecret', trigger: 'blur' }
  ],
  modelscopeApiKey: [
    { required: true, message: '请输入魔搭API Key', trigger: 'blur' }
  ]
}

// 监听store中的keys变化，同步到表单
watch(() => configStore.keys, (keys) => {
  if (keys) {
    Object.assign(formData, keys)
  }
}, { immediate: true })

// 使用测试密钥
function handleUseTestKeys() {
  configStore.useTestKeys()
  ElMessage.success('已切换到测试模式')
  emit('success')
  dialogVisible.value = false
}

// 确认保存
async function handleConfirm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    // 保存密钥
    const success = configStore.saveKeys(formData as KeyConfig)

    if (success) {
      ElMessage.success('密钥保存成功')
      emit('success')
      dialogVisible.value = false
    } else {
      ElMessage.error('密钥保存失败')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消
function handleCancel() {
  dialogVisible.value = false
}

// 关闭对话框
function handleClose() {
  // 重置表单到原始值
  if (configStore.keys) {
    Object.assign(formData, configStore.keys)
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-divider__text) {
  color: #909399;
  font-size: 12px;
}
</style>
