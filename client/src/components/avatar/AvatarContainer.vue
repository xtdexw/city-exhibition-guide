<template>
  <div class="avatar-container-wrapper">
    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="statusClass">
      <el-icon v-if="connectionStatus === 'connecting'" class="is-loading">
        <Loading />
      </el-icon>
      <el-icon v-else-if="connectionStatus === 'connected'">
        <CircleCheck />
      </el-icon>
      <el-icon v-else-if="connectionStatus === 'error'">
        <CircleClose />
      </el-icon>
      <el-icon v-else>
        <Connection />
      </el-icon>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <!-- 数字人容器 - 简化结构，参考math-tutor-ai -->
    <div class="avatar-canvas-wrapper">
      <!-- SDK渲染容器 - 参考math-tutor-ai使用内联样式 -->
      <div
        :id="containerId"
        class="avatar-canvas"
        style="width: 100%; height: 100%;"
      ></div>

      <!-- 占位符 - 使用v-if完全移除DOM，不遮挡SDK背景 -->
      <div v-if="connectionStatus !== 'connected'" class="avatar-placeholder">
        <!-- 未连接状态 -->
        <div v-if="connectionStatus === 'idle' || connectionStatus === 'disconnected'">
          <el-icon :size="100" color="#909399">
            <User />
          </el-icon>
          <p class="placeholder-text">数字人区域</p>
          <p class="placeholder-hint">请先连接数字人</p>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="connectionStatus === 'connecting'">
          <el-icon :size="80" class="is-loading" color="#409EFF">
            <Loading />
          </el-icon>
          <p class="loading-text">正在连接数字人...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="connectionStatus === 'error'">
          <el-icon :size="80" color="#F56C6C">
            <CircleClose />
          </el-icon>
          <p class="error-text">连接失败</p>
          <p class="error-hint">请检查网络或密钥配置后重试</p>
        </div>
      </div>
    </div>

    <!-- 数字人状态显示 -->
    <div v-if="connectionStatus === 'connected'" class="avatar-state">
      <el-tag :type="stateTagType" size="small">
        {{ avatarStateText }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { avatarConnectionManager } from '@/services/AvatarConnectionManager'
import { ConnectionStatus, AvatarState } from '@/services/AvatarService'
import { ElMessage } from 'element-plus'

const { User, Loading, CircleCheck, CircleClose, Connection } = ElementPlusIcons

interface Props {
  containerId?: string
  autoConnect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  containerId: 'avatar-container',
  autoConnect: false
})

const emit = defineEmits<{
  connected: []
  disconnected: []
  error: [error: Error]
  stateChange: [state: AvatarState]
}>()

// 状态
const connectionStatus = ref<ConnectionStatus>(ConnectionStatus.IDLE)
const avatarState = ref<AvatarState>(AvatarState.IDLE)

// 计算属性
const statusClass = computed(() => {
  return `status-${connectionStatus.value}`
})

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case ConnectionStatus.IDLE:
      return '未连接'
    case ConnectionStatus.CONNECTING:
      return '连接中...'
    case ConnectionStatus.CONNECTED:
      return '已连接'
    case ConnectionStatus.DISCONNECTING:
      return '断开中...'
    case ConnectionStatus.DISCONNECTED:
      return '已断开'
    case ConnectionStatus.ERROR:
      return '连接错误'
    default:
      return '未知状态'
  }
})

const stateTagType = computed(() => {
  switch (avatarState.value) {
    case AvatarState.IDLE:
      return 'info'
    case AvatarState.LISTEN:
      return 'success'
    case AvatarState.THINK:
      return 'warning'
    case AvatarState.SPEAK:
      return 'primary'
    case AvatarState.INTERACTIVE_IDLE:
      return 'success'
    case AvatarState.OFFLINE:
      return 'info'
    case AvatarState.ONLINE:
      return 'success'
    default:
      return 'info'
  }
})

const avatarStateText = computed(() => {
  switch (avatarState.value) {
    case AvatarState.IDLE:
      return '待机'
    case AvatarState.LISTEN:
      return '倾听中'
    case AvatarState.THINK:
      return '思考中'
    case AvatarState.SPEAK:
      return '说话中'
    case AvatarState.INTERACTIVE_IDLE:
      return '交互待机'
    case AvatarState.OFFLINE:
      return '离线模式'
    case AvatarState.ONLINE:
      return '在线模式'
    default:
      // 对于未知状态，尝试直接显示状态字符串
      return typeof avatarState.value === 'string' ? avatarState.value : '未知'
  }
})

// 监听连接状态变化
const unregisterStatusCallback = avatarConnectionManager.onStatusChange((status) => {
  // 使用nextTick确保在Vue更新周期的合适时机更新
  nextTick(() => {
    connectionStatus.value = status

    if (status === ConnectionStatus.CONNECTED) {
      emit('connected')
    } else if (status === ConnectionStatus.DISCONNECTED) {
      emit('disconnected')
    }
    // 移除 ERROR 状态的自动触发，避免重复提示错误
    // 错误提示由父组件 Home.vue 在 handleConnect 中统一处理
  })
})

// 监听数字人状态变化 - 使用更安全和主动的方式
const stopWatch = watch(() => avatarConnectionManager.isConnected(), (isConnected) => {
  if (isConnected) {
    const service = avatarConnectionManager.getService()
    if (service) {
      avatarState.value = service.getState()
      console.log('[AvatarContainer] 数字人状态更新:', avatarState.value)
      emit('stateChange', avatarState.value)
    }
  }
}, { immediate: true })

// 添加定时检查状态（作为watch的补充）
let stateCheckInterval: number | null = null

// 自动连接
onMounted(() => {
  if (props.autoConnect) {
    connect()
  }

  // 每500ms检查一次状态，确保状态及时更新
  stateCheckInterval = window.setInterval(() => {
    if (connectionStatus.value === ConnectionStatus.CONNECTED) {
      const service = avatarConnectionManager.getService()
      if (service) {
        const newState = service.getState()
        if (newState !== avatarState.value) {
          avatarState.value = newState
          console.log('[AvatarContainer] 定时检查 - 状态更新:', newState)
        }
      }
    }
  }, 500)
})

onUnmounted(() => {
  // 清理状态监听
  unregisterStatusCallback()
  // 清理 watch
  stopWatch()
  // 清理定时器
  if (stateCheckInterval) {
    clearInterval(stateCheckInterval)
  }
})

// 暴露方法给父组件
async function connect() {
  const { useConfigStore } = await import('@/stores/config')
  const configStore = useConfigStore()

  if (!configStore.keys) {
    ElMessage.warning('请先配置密钥')
    return false
  }

  // 不需要在这里注册回调，已经在 setup 中注册了全局回调
  return avatarConnectionManager.connect(configStore.keys, props.containerId)
}

async function disconnect() {
  return avatarConnectionManager.disconnect()
}

function isConnected() {
  return avatarConnectionManager.isConnected()
}

function getConnectionStatus() {
  return avatarConnectionManager.getStatus()
}

defineExpose({
  connect,
  disconnect,
  isConnected,
  getConnectionStatus
})
</script>

<style scoped>
.avatar-container-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.connection-status {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.connection-status.status-idle {
  background: rgba(144, 147, 153, 0.95);
}

.connection-status.status-connecting {
  background: rgba(64, 158, 255, 0.95);
}

.connection-status.status-connected {
  background: rgba(103, 194, 58, 0.95);
}

.connection-status.status-disconnecting {
  background: rgba(230, 162, 60, 0.95);
}

.connection-status.status-disconnected {
  background: rgba(144, 147, 153, 0.95);
}

.connection-status.status-error {
  background: rgba(245, 108, 108, 0.95);
}

.status-text {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* 数字人容器 wrapper */
.avatar-canvas-wrapper {
  flex: 1;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* SDK容器 - 确保完全占满 */
.avatar-canvas {
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 1 !important;
  display: block !important;
}

/* 占位符 */
.avatar-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  width: 100%;
  max-width: 280px;
  pointer-events: none;
}

.placeholder-text,
.error-text {
  margin: 15px 0 8px;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.placeholder-hint,
.error-hint {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.loading-text {
  margin: 15px 0 12px;
  font-size: 16px;
  color: #667eea;
  font-weight: 500;
}

.avatar-state {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 确保SDK背景容器正确显示 */
:deep(#avatar-bg-container) {
  opacity: 1 !important;
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 0 !important;
}

:deep(canvas),
:deep(video) {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
}
</style>
