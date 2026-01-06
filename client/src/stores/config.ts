import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KeyConfig } from '@shared/types'

const STORAGE_KEY = 'city_exhibition_keys'

// 测试密钥
const TEST_KEYS: KeyConfig = {
  xingyunAppId: 'd0e50f1b79104ff2985279f094fca361',
  xingyunAppSecret: '93e84bcfebbc468e94f41611b4127899',
  modelscopeApiKey: 'ms-110b80f9-ae5a-4590-91d4-08bc8e54603a',
  isTestMode: true
}

export const useConfigStore = defineStore('config', () => {
  // 状态
  const keys = ref<KeyConfig | null>(null)
  const isConnected = ref(false)
  const loading = ref(false)

  // 计算属性
  const hasKeys = computed(() => keys.value !== null)
  const isTestMode = computed(() => keys.value?.isTestMode ?? false)

  /**
   * 从localStorage加载密钥
   */
  function loadKeys() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        keys.value = JSON.parse(stored)
        return true
      }
    } catch (error) {
      console.error('加载密钥失败:', error)
    }
    return false
  }

  /**
   * 保存密钥到localStorage
   */
  function saveKeys(config: KeyConfig) {
    try {
      keys.value = config
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      return true
    } catch (error) {
      console.error('保存密钥失败:', error)
      return false
    }
  }

  /**
   * 清除密钥
   */
  function clearKeys() {
    keys.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 使用测试密钥
   */
  function useTestKeys() {
    saveKeys(TEST_KEYS)
  }

  /**
   * 验证密钥配置
   */
  function validateKeys(config: Partial<KeyConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.xingyunAppId || config.xingyunAppId.trim() === '') {
      errors.push('星云AppId不能为空')
    }

    if (!config.xingyunAppSecret || config.xingyunAppSecret.trim() === '') {
      errors.push('星云AppSecret不能为空')
    }

    if (!config.modelscopeApiKey || config.modelscopeApiKey.trim() === '') {
      errors.push('魔搭API Key不能为空')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 设置连接状态
   */
  function setConnectionStatus(connected: boolean) {
    isConnected.value = connected
  }

  // 初始化时加载密钥
  loadKeys()

  return {
    // 状态
    keys,
    isConnected,
    loading,
    // 计算属性
    hasKeys,
    isTestMode,
    // 方法
    loadKeys,
    saveKeys,
    clearKeys,
    useTestKeys,
    validateKeys,
    setConnectionStatus
  }
})
