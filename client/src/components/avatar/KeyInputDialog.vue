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
      title="测试模式 - 密钥已隐藏"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p style="margin: 0 0 8px 0;">当前使用测试密钥，所有密钥信息已隐藏。</p>
        <p style="margin: 0;">如需使用正式密钥，请点击下方的"清除密钥"后重新配置。</p>
      </template>
    </el-alert>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
    >
      <el-form-item label="星云 App ID" prop="xingyunAppId">
        <el-input
          v-if="isTestMode"
          value="*** 测试密钥已隐藏 ***"
          disabled
          placeholder="测试密钥已隐藏"
        />
        <el-input
          v-else
          v-model="formData.xingyunAppId"
          placeholder="请输入星云AppId"
        />
      </el-form-item>

      <el-form-item label="星云 App Secret" prop="xingyunAppSecret">
        <el-input
          v-if="isTestMode"
          value="*** 测试密钥已隐藏 ***"
          disabled
          placeholder="测试密钥已隐藏"
        />
        <el-input
          v-else
          v-model="formData.xingyunAppSecret"
          type="password"
          placeholder="请输入星云AppSecret"
          show-password
        />
      </el-form-item>

      <el-form-item label="魔搭 API Key" prop="modelscopeApiKey">
        <el-input
          v-if="isTestMode"
          value="*** 测试密钥已隐藏 ***"
          disabled
          placeholder="测试密钥已隐藏"
        />
        <el-input
          v-else
          v-model="formData.modelscopeApiKey"
          type="password"
          placeholder="请输入魔搭API Key"
          show-password
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
        <el-button
          v-if="isTestMode"
          type="danger"
          @click="handleClearKeys"
        >
          清除密钥
        </el-button>
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
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

// 是否测试模式 - 使用store的计算属性
const isTestMode = computed(() => configStore.isTestMode)

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
  } else {
    // 清除密钥时，重置表单数据
    formData.xingyunAppId = ''
    formData.xingyunAppSecret = ''
    formData.modelscopeApiKey = ''
    formData.isTestMode = false
  }
}, { immediate: true })

// 监听对话框打开，确保表单状态正确
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && !configStore.keys) {
    // 对话框打开且没有密钥时，确保表单是空的
    formData.xingyunAppId = ''
    formData.xingyunAppSecret = ''
    formData.modelscopeApiKey = ''
    formData.isTestMode = false
  }
})

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

    // 保存密钥 - 确保手动输入时设置 isTestMode 为 false
    const keysToSave: KeyConfig = {
      xingyunAppId: formData.xingyunAppId!,
      xingyunAppSecret: formData.xingyunAppSecret!,
      modelscopeApiKey: formData.modelscopeApiKey!,
      isTestMode: false  // 手动输入的密钥一定是正式密钥
    }

    const success = configStore.saveKeys(keysToSave)

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

// 清除密钥（仅在测试模式下显示）
async function handleClearKeys() {
  try {
    await ElMessageBox.confirm(
      '清除测试密钥后，需要配置正式密钥才能使用系统。确定要清除吗？',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    configStore.clearKeys()

    // 清除后重置表单
    formData.xingyunAppId = ''
    formData.xingyunAppSecret = ''
    formData.modelscopeApiKey = ''
    formData.isTestMode = false

    ElMessage.success('测试密钥已清除')
    emit('success')
    dialogVisible.value = false
  } catch {
    // 用户取消
  }
}

// 关闭对话框
function handleClose() {
  // 如果没有密钥，清空表单
  if (!configStore.keys) {
    formData.xingyunAppId = ''
    formData.xingyunAppSecret = ''
    formData.modelscopeApiKey = ''
    formData.isTestMode = false
  } else {
    // 重置表单到store中的值
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
