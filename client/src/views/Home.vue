<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <h1 class="title">🏛️ 城市展厅智能讲解系统</h1>
      </div>
      <div class="header-right">
        <el-tag v-if="configStore.isTestMode" type="warning">
          测试模式
        </el-tag>
        <el-tag v-else-if="configStore.hasKeys" type="success">
          已配置
        </el-tag>
        <el-tag v-else type="info">
          未配置
        </el-tag>
        <!-- 快捷提问按钮 -->
        <el-tooltip content="快捷提问" placement="bottom">
          <el-button
            type="primary"
            @click="showQuickActions = true"
            :icon="ChatDotRound"
            circle
          >
          </el-button>
        </el-tooltip>
        <!-- 使用说明按钮 -->
        <el-tooltip content="使用说明" placement="bottom">
          <el-button
            type="success"
            @click="showHelp = true"
            :icon="QuestionFilled"
            circle
          >
          </el-button>
        </el-tooltip>
        <el-button @click="router.push('/settings')" circle>
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 - 三栏布局 -->
    <div class="main-content">
      <!-- 左侧：数字人 -->
      <div class="left-panel">
        <div class="avatar-section">
          <div class="section-header">
            <span class="section-title">🤖 智能讲解员</span>
            <el-button
              :type="isAvatarConnected ? 'danger' : 'primary'"
              size="small"
              :disabled="!configStore.hasKeys"
              :loading="isConnecting"
              @click="handleConnect"
            >
              {{ isAvatarConnected ? '断开' : '连接' }}
            </el-button>
          </div>
          <AvatarContainer
            ref="avatarContainerRef"
            container-id="avatar-canvas"
            @connected="handleAvatarConnected"
            @disconnected="handleAvatarDisconnected"
            @error="handleAvatarError"
          />
        </div>
      </div>

      <!-- 中间：内容展示 -->
      <div class="center-panel">
        <el-tabs v-model="activeTab" class="content-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="📚 内容库" name="content">
            <ContentPanel @play-content="handlePlayContent" />
          </el-tab-pane>
          <el-tab-pane label="📊 数据大屏" name="dashboard">
            <DataDashboard ref="dataDashboardRef" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 右侧：对话区域 -->
      <div class="right-panel">
        <div class="chat-section">
          <ChatPanel ref="chatPanelRef" @response-complete="handleChatResponseComplete" />
        </div>
      </div>
    </div>

    <!-- 快捷提问弹窗 -->
    <el-dialog
      v-model="showQuickActions"
      title="⚡ 快捷提问"
      width="700px"
      center
      :close-on-click-modal="true"
    >
      <div class="quick-actions-dialog">
        <el-button
          v-for="action in quickActions"
          :key="action.key"
          :type="action.type"
          class="quick-action-btn"
          @click="handleQuickAction(action); showQuickActions = false"
        >
          <el-icon class="action-icon">
            <component :is="action.icon" />
          </el-icon>
          <span>{{ action.label }}</span>
        </el-button>
      </div>
    </el-dialog>

    <!-- 使用说明弹窗 -->
    <el-dialog
      v-model="showHelp"
      title="📖 使用说明"
      width="500px"
    >
      <div class="help-content">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in helpSteps"
            :key="index"
            :timestamp="item.title"
            placement="top"
          >
            <el-card>
              <p>{{ item.content }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import AvatarContainer from '@/components/avatar/AvatarContainer.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import ContentPanel from '@/components/content/ContentPanel.vue'
import DataDashboard from '@/components/visualization/DataDashboard.vue'
import { avatarConnectionManager } from '@/services/AvatarConnectionManager'
import { AvatarState } from '@/services/AvatarService'
import type { ContentItem } from '@/types/content'
import { optimizeTextForAvatar } from '@/services/ConversationService'

const { Setting, Clock, Star, MapLocation, TrendCharts, ChatDotRound, QuestionFilled } = ElementPlusIcons

const router = useRouter()
const configStore = useConfigStore()

// 组件引用
const avatarContainerRef = ref<InstanceType<typeof AvatarContainer> | null>(null)
const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null)
const dataDashboardRef = ref<InstanceType<typeof DataDashboard> | null>(null)

// 状态
const activeTab = ref('content')
const showQuickActions = ref(false)
const showHelp = ref(false)
const isConnecting = ref(false)
const isAvatarConnected = ref(false)

// Tab 切换处理
function handleTabChange(tabName: string) {
  if (tabName === 'dashboard' && dataDashboardRef.value) {
    // 切换到数据大屏时，触发图表 resize 确保正确渲染
    // 图表已经在组件加载时自动初始化了
    setTimeout(() => {
      dataDashboardRef.value?.initCharts() // 这会触发 resize
    }, 100)
  }
}

// 快捷操作按钮
const quickActions = [
  {
    key: 'history',
    label: '历史介绍',
    type: 'primary',
    icon: Clock,
    question: '请简要介绍一下这座城市的历史'
  },
  {
    key: 'culture',
    label: '文化特色',
    type: 'success',
    icon: Star,
    question: '这座城市有哪些独特的文化特色？'
  },
  {
    key: 'planning',
    label: '未来规划',
    type: 'warning',
    icon: MapLocation,
    question: '这座城市未来的发展规划是什么？'
  },
  {
    key: 'data',
    label: '经济数据',
    type: 'info',
    icon: TrendCharts,
    question: '介绍一下这座城市的经济发展情况'
  }
]

// 使用说明步骤
const helpSteps = [
  {
    title: '步骤 1',
    content: '点击"连接"按钮启动数字人，等待连接成功'
  },
  {
    title: '步骤 2',
    content: '在对话框中输入问题，或点击快捷提问按钮'
  },
  {
    title: '步骤 3',
    content: '数字人会语音回答您的问题'
  },
  {
    title: '步骤 4',
    content: '可以在内容库中选择讲解主题，让数字人详细讲解'
  },
  {
    title: '步骤 5',
    content: '查看数据大屏了解城市的各项数据指标'
  }
]

// 连接数字人
async function handleConnect() {
  if (!configStore.hasKeys) {
    ElMessage.warning('请先配置密钥')
    router.push('/settings')
    return
  }

  if (isAvatarConnected.value) {
    // 断开连接
    await avatarConnectionManager.disconnect()
    isAvatarConnected.value = false
    ElMessage.info('数字人已断开')
  } else {
    // 连接
    isConnecting.value = true

    // 设置字幕回调，让连接管理器也能更新字幕
    avatarConnectionManager.setSubtitleCallback((text: string) => {
      if (avatarContainerRef.value) {
        if (text) {
          avatarContainerRef.value.updateSubtitle(text)
        } else {
          avatarContainerRef.value.clearSubtitle()
        }
      }
    })

    const success = await avatarConnectionManager.connect(configStore.keys, 'avatar-canvas')
    isConnecting.value = false
    if (success) {
      isAvatarConnected.value = true
      ElMessage.success('数字人连接成功！')
    } else {
      ElMessage.error('数字人连接失败')
    }
  }
}

// 数字人连接成功
function handleAvatarConnected() {
  isAvatarConnected.value = true
  configStore.setConnectionStatus(true)
}

// 数字人断开连接
function handleAvatarDisconnected() {
  isAvatarConnected.value = false
  configStore.setConnectionStatus(false)
}

// 数字人连接错误
function handleAvatarError(error: Error) {
  isConnecting.value = false
  ElMessage.error(`数字人错误: ${error.message}`)
}

// 数字人说话（根据 SDK 文档优化）
async function speakText(text: string) {
  console.log('[语音播报] 原始文本长度:', text?.length)

  const avatarService = avatarConnectionManager.getService()
  if (!avatarService) {
    console.error('[语音播报] AvatarService不存在')
    return
  }

  if (!text) {
    console.log('[语音播报] 没有有效内容')
    return
  }

  // 优化文本以适应数字人语音播报
  const optimizedText = optimizeTextForAvatar(text)
  console.log('[语音播报] 优化后文本长度:', optimizedText.length)

  // 分段字幕显示
  const sentences = optimizedText.split(/([。！？.!?])/).filter(s => s.trim())
  console.log('[语音播报] 分段数量:', sentences.length)

  if (sentences.length === 0) {
    console.log('[语音播报] 没有有效段落')
    return
  }

  // 计算字幕间隔（根据句子平均长度动态调整）
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
  // 每个字符约需 150ms，加上基础时间 500ms
  const subtitleInterval = Math.max(2000, avgSentenceLength * 150 + 500)
  console.log('[语音播报] 字幕间隔:', subtitleInterval, 'ms')

  // 使用连接管理器的队列方式播放字幕
  avatarConnectionManager.playSubtitles(sentences, subtitleInterval)

  // 根据 SDK 文档：一次性传入完整文本给SDK（保证语音流畅）
  // isStart = true, isEnd = true 表示这是完整的一段话
  avatarService.speak(optimizedText, true, true)

  console.log('[语音播报] 已发送文本到数字人')

  // 等待播报完成（根据文本长度估算时间）
  const estimatedDuration = Math.max(5000, optimizedText.length * 150)
  await new Promise(resolve => setTimeout(resolve, estimatedDuration))

  // 清除字幕
  avatarConnectionManager.clearSubtitle()

  console.log('[语音播报] 播报完成')
}

// 播放内容
async function handlePlayContent(content: ContentItem) {
  // 检查是否配置了密钥
  if (!configStore.hasKeys) {
    ElMessage.warning('请先配置API密钥才能使用对话功能')
    return
  }

  if (!isAvatarConnected.value) {
    ElMessage.warning('请先连接数字人')
    return
  }

  // 不切换Tab，保持在当前页面

  // 设置数字人为倾听状态
  const avatarService = avatarConnectionManager.getService()
  if (avatarService) {
    avatarService.setState(AvatarState.LISTEN)
  }

  try {
    const { conversationService } = await import('@/services/ConversationService')

    let currentResponse = ''

    await conversationService.sendMessage(
      `请详细讲解一下${content.title}，包括${content.summary}`,
      (chunk: string) => {
        currentResponse += chunk
      },
      (fullText: string) => {
        currentResponse = fullText
      },
      (error: Error) => {
        ElMessage.error(`对话失败: ${error.message}`)
        avatarService?.setState(AvatarState.IDLE)
      }
    )

    if (avatarService && currentResponse) {
      await speakText(currentResponse)
      avatarService.setState(AvatarState.INTERACTIVE_IDLE)
    }
  } catch (error) {
    console.error('对话失败:', error)
    ElMessage.error('对话失败，请重试')
  }
}

// 对话完成处理
async function handleChatResponseComplete(text: string) {
  console.log('[对话完成] 收到文本:', text?.substring(0, 50) + '...')
  console.log('[对话完成] 数字人连接状态:', isAvatarConnected.value)

  if (!isAvatarConnected.value) {
    console.log('[对话完成] 数字人未连接，跳过语音播报')
    return
  }

  if (!text || text.trim().length === 0) {
    console.log('[对话完成] 文本为空，跳过语音播报')
    return
  }

  const avatarService = avatarConnectionManager.getService()
  if (!avatarService) {
    console.log('[对话完成] 无法获取AvatarService')
    return
  }

  console.log('[对话完成] 开始语音播报...')
  try {
    avatarService.setState(AvatarState.LISTEN)
    await speakText(text)
    avatarService.setState(AvatarState.INTERACTIVE_IDLE)
    console.log('[对话完成] 语音播报完成')
  } catch (error) {
    console.error('[对话完成] 语音播报失败:', error)
  }
}

// 快捷操作
async function handleQuickAction(action: any) {
  // 检查是否配置了密钥
  if (!configStore.hasKeys) {
    ElMessage.warning('请先配置API密钥才能使用对话功能')
    return
  }

  if (!isAvatarConnected.value) {
    ElMessage.warning('请先连接数字人')
    return
  }

  // 不切换Tab，保持在当前页面

  // 设置数字人为倾听状态
  const avatarService = avatarConnectionManager.getService()
  if (avatarService) {
    avatarService.setState(AvatarState.LISTEN)
  }

  try {
    const { conversationService } = await import('@/services/ConversationService')

    let currentResponse = ''

    await conversationService.sendMessage(
      action.question,
      (chunk: string) => {
        currentResponse += chunk
      },
      (fullText: string) => {
        currentResponse = fullText
      },
      (error: Error) => {
        ElMessage.error(`对话失败: ${error.message}`)
        avatarService?.setState(AvatarState.IDLE)
      }
    )

    if (avatarService && currentResponse) {
      await speakText(currentResponse)
      avatarService.setState(AvatarState.INTERACTIVE_IDLE)
    }
  } catch (error) {
    console.error('对话失败:', error)
    ElMessage.error('对话失败，请重试')
  }
}
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 50%, #e1f5fe 100%);
  overflow: hidden;
}

.header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

/* 左侧面板 - 数字人 */
.left-panel {
  flex: 0 0 450px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.avatar-section {
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 中间面板 - 内容展示 */
.center-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
}

/* 右侧面板 - 对话 */
.right-panel {
  flex: 0 0 380px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat-section {
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-tabs {
  height: 100%;
}

.content-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
}

.content-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.content-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
  color: #666;
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
}

.content-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
}

.content-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 3px;
}

.content-tabs :deep(.el-tabs__content) {
  height: calc(100% - 48px);
  padding: 0;
}

.content-tabs :deep(.el-tab-pane) {
  height: 100%;
}

/* 快捷提问弹窗样式 */
.quick-actions-dialog {
  display: flex;
  gap: 10px;
  padding: 0;
}

.quick-action-btn {
  flex: 1;
  min-width: 0;
  height: 40px !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  font-weight: 500;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  transition: all 0.2s ease;
}

/* 覆盖 Element Plus 按钮内部样式 */
.quick-action-btn :deep(.el-icon) {
  font-size: 18px;
  flex-shrink: 0;
}

.quick-action-btn :deep(span) {
  font-size: 14px;
  white-space: nowrap;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 使用说明样式 */
.help-content {
  padding: 8px 0;
}

.help-content :deep(.el-timeline-item__timestamp) {
  font-weight: 600;
  color: #667eea;
}

.help-content :deep(.el-card) {
  margin-bottom: 0;
}

.help-content p {
  margin: 0;
  line-height: 1.8;
  color: #555;
}
</style>
