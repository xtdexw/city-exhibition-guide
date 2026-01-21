<template>
  <div class="chat-panel">
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="`message-${msg.role}`"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'user'" :size="24">
            <User />
          </el-icon>
          <el-icon v-else :size="24" color="#409EFF">
            <Avatar />
          </el-icon>
        </div>
        <div class="message-content">
          <!-- 停止标记的特殊显示 -->
          <div v-if="msg.role === 'assistant' && msg.content === '__STOPPED__'" class="message-stopped">
            <el-icon class="stopped-icon"><CircleClose /></el-icon>
            <span>已停止生成</span>
          </div>
          <!-- 普通消息 -->
          <div v-else class="message-bubble">
            {{ msg.content }}
          </div>
          <div class="message-time">
            {{ formatTime(msg.timestamp) }}
          </div>
        </div>
      </div>

      <!-- 正在输入的回复 -->
      <div v-if="isStreaming && currentResponse" class="message-item message-assistant">
        <div class="message-avatar">
          <el-icon :size="24" color="#409EFF">
            <Avatar />
          </el-icon>
        </div>
        <div class="message-content">
          <div class="message-bubble streaming">
            {{ currentResponse }}
            <span class="cursor">|</span>
          </div>
        </div>
      </div>

      <!-- 正在思考 -->
      <div v-if="isStreaming && !currentResponse" class="message-item message-assistant">
        <div class="message-avatar">
          <el-icon :size="24" color="#409EFF">
            <Avatar />
          </el-icon>
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <span class="thinking-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="2"
        :placeholder="configStore.hasKeys ? '向小星提问关于这座城市的问题...' : '请先配置API密钥才能使用对话功能'"
        :disabled="isStreaming || !configStore.hasKeys"
        @keydown.enter.exact="handleSend"
        @keydown.enter.shift.prevent="inputMessage += '\n'"
        class="message-input"
      />
      <div class="input-actions">
        <el-button
          type="primary"
          :loading="isStreaming"
          :disabled="!inputMessage.trim() || !configStore.hasKeys"
          @click="handleSend"
          class="send-button"
        >
          <span v-if="!isStreaming">发送</span>
          <span v-else>生成中...</span>
        </el-button>
        <el-button
          v-if="isStreaming"
          @click="handleStop"
          class="stop-button"
        >
          停止
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { conversationService, type ChatMessage } from '@/services/ConversationService'
import { ElMessage } from 'element-plus'
import { useConfigStore } from '@/stores/config'

const { User, Avatar, CircleClose } = ElementPlusIcons

const emit = defineEmits<{
  responseComplete: [text: string]
}>()

const configStore = useConfigStore()
const inputMessage = ref('')
const messages = ref<ChatMessage[]>([])
const isStreaming = ref(false)
const currentResponse = ref('')
const messageListRef = ref<HTMLElement>()

// 监听对话服务状态
watch(() => conversationService.getMessages(), (newMessages) => {
  messages.value = newMessages.filter(m => m.role !== 'system') // 隐藏系统消息
  scrollToBottom()
}, { deep: true })

watch(() => conversationService.getIsStreaming(), (streaming) => {
  isStreaming.value = streaming
  if (!streaming) {
    currentResponse.value = ''
  }
})

// 发送消息
async function handleSend() {
  const message = inputMessage.value.trim()
  if (!message) return

  // 检查是否配置了密钥
  if (!configStore.hasKeys) {
    ElMessage.warning('请先配置API密钥才能使用对话功能')
    return
  }

  if (isStreaming.value) {
    ElMessage.warning('请等待当前对话完成')
    return
  }

  inputMessage.value = ''
  currentResponse.value = ''

  try {
    await conversationService.sendMessage(
      message,
      // onChunk: 流式回调
      (chunk: string) => {
        currentResponse.value += chunk
        scrollToBottom()
      },
      // onComplete: 完成回调
      (fullText: string) => {
        currentResponse.value = fullText
        scrollToBottom()
        // 通知父组件对话完成，触发数字人语音播报
        emit('responseComplete', fullText)
      },
      // onError: 错误回调
      (error: Error) => {
        // 过滤掉 AbortError，这是用户主动停止的正常行为
        if (error.name === 'AbortError') {
          console.log('用户停止了对话生成')
          return
        }
        ElMessage.error(`对话失败: ${error.message}`)
      }
    )
  } catch (error) {
    // 过滤掉 AbortError
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('用户停止了对话生成')
      return
    }
    console.error('发送消息失败:', error)
  }
}

// 停止生成
function handleStop() {
  conversationService.stopGeneration()
  ElMessage.info('已停止生成')
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 格式化时间
function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 清空历史
function clearHistory() {
  conversationService.clearHistory()
  ElMessage.success('对话历史已清空')
}

// 播放内容库内容
async function playContent(title: string, summary: string) {
  // 检查是否配置了密钥
  if (!configStore.hasKeys) {
    ElMessage.warning('请先配置API密钥才能使用对话功能')
    return
  }

  if (isStreaming.value) {
    ElMessage.warning('请等待当前对话完成')
    return
  }

  const message = `请详细讲解一下${title}，包括${summary}`

  inputMessage.value = ''
  currentResponse.value = ''

  try {
    await conversationService.sendMessage(
      message,
      // onChunk: 流式回调
      (chunk: string) => {
        currentResponse.value += chunk
        scrollToBottom()
      },
      // onComplete: 完成回调
      (fullText: string) => {
        currentResponse.value = fullText
        scrollToBottom()
        // 通知父组件对话完成，触发数字人语音播报
        emit('responseComplete', fullText)
      },
      // onError: 错误回调
      (error: Error) => {
        // 过滤掉 AbortError，这是用户主动停止的正常行为
        if (error.name === 'AbortError') {
          console.log('用户停止了对话生成')
          // 清理流式状态
          currentResponse.value = ''
          return
        }
        ElMessage.error(`对话失败: ${error.message}`)
      }
    )
  } catch (error) {
    // 过滤掉 AbortError
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('用户停止了对话生成')
      // 清理流式状态
      currentResponse.value = ''
      return
    }
    console.error('播放内容失败:', error)
  }
}

onUnmounted(() => {
  // 组件卸载时停止生成
  if (isStreaming.value) {
    handleStop()
  }
})

// 暴露方法
defineExpose({
  clearHistory,
  playContent
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;
}

.message-user {
  flex-direction: row-reverse;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-user .message-avatar {
  background: #E6F7FF;
}

.message-assistant .message-avatar {
  background: #F0F5FF;
}

.message-content {
  margin-left: 12px;
  max-width: 70%;
}

.message-bubble {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

.message-user .message-content {
  margin-left: 0;
  margin-right: 12px;
  align-items: flex-end;
}

.message-user .message-bubble {
  background: #1890FF;
  color: white;
}

.message-assistant .message-bubble {
  background: white;
  color: #333;
}

.message-bubble.streaming {
  background: #F0F5FF;
}

.cursor {
  animation: blink 1s infinite;
  color: #1890FF;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.thinking-dots {
  display: inline-flex;
  gap: 4px;
}

.thinking-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890FF;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.message-time {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #e8e8e8;
}

.message-input {
  margin-bottom: 12px;
}

.input-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.send-button {
  background: linear-gradient(135deg, #1890FF 0%, #096DD9 100%);
  border: none;
}

.stop-button {
  background: #FF4D4F;
  border: none;
  color: white;
}

/* 停止消息的特殊样式 */
.message-stopped {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #FFF3E0;
  border: 1px dashed #FF9800;
  border-radius: 8px;
  color: #FF9800;
  font-size: 13px;
  font-style: italic;
}

.message-stopped .stopped-icon {
  font-size: 16px;
}
</style>
