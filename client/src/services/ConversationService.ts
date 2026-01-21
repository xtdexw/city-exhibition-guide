/**
 * AI对话服务
 * 提供流式对话和消息管理功能
 */

import { ref } from 'vue'
import { SYSTEM_PROMPT } from './prompts'

/**
 * 优化文本以适应数字人语音播报
 * 根据星云SDK文档和最佳实践进行预处理
 */
export function optimizeTextForAvatar(text: string): string {
  if (!text) return text

  let optimized = text

  // 1. 移除markdown标记符号
  optimized = optimized.replace(/#{1,6}\s/g, '') // 移除标题标记
  optimized = optimized.replace(/\*{1,2}/g, '') // 移除加粗/斜体标记
  optimized = optimized.replace(/~~/g, '') // 移除删除线
  optimized = optimized.replace(/`{1,3}/g, '') // 移除代码标记
  optimized = optimized.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除markdown链接但保留文字

  // 2. 移除emoji和特殊unicode字符
  optimized = optimized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')

  // 3. 转换英文标点为中文标点（让语音更自然）
  optimized = optimized.replace(/,/g, '，')
  optimized = optimized.replace(/\./g, '。')
  optimized = optimized.replace(/!/g, '！')
  optimized = optimized.replace(/\?/g, '？')
  optimized = optimized.replace(/:/g, '：')
  optimized = optimized.replace(/;/g, '；')

  // 4. 移除过多的空行和空格
  optimized = optimized.replace(/\n{3,}/g, '\n\n') // 最多保留两个连续换行
  optimized = optimized.replace(/[ \t]+/g, ' ') // 多个空格合并为一个

  // 5. 处理一些特殊字符
  optimized = optimized.replace(/•/g, '、') // 列表符号替换
  optimized = optimized.replace(/·/g, '、')
  optimized = optimized.replace(/\|/g, '，') // 竖线替换

  // 6. 移除代码块标记
  optimized = optimized.replace(/```[\s\S]*?```/g, '[代码]')

  // 7. 简化一些技术术语的括号表达
  optimized = optimized.replace(/\（([^）]+)\）/g, '($1)') // 中文括号转英文
  optimized = optimized.replace(/【([^】]+)】/g, '[$1]') // 方括号转换

  // 8. 移除一些可能引起问题的特殊符号
  optimized = optimized.replace(/[<>]/g, '') // 移除尖括号
  optimized = optimized.replace(/"/g, '"') // 统一引号

  // 9. 处理数字和单位
  optimized = optimized.replace(/(\d+)\s*(万|亿|千|百|十)/g, '$1$2') // 数字和单位合并

  // 10. 移除过多的省略号
  optimized = optimized.replace(/\.+/g, '。')
  optimized = optimized.replace(/~+/g, '')

  // 11. 确保句子结尾有标点
  optimized = optimized.trim()
  if (optimized.length > 0 && !/[。！？.!?]$/.test(optimized)) {
    optimized += '。'
  }

  return optimized
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class ConversationService {
  private messages = ref<ChatMessage[]>([])
  private isStreaming = ref(false)
  private currentAbortController: AbortController | null = null

  constructor() {
    // 初始化系统消息
    this.messages.value.push({
      role: 'system',
      content: SYSTEM_PROMPT,
      timestamp: Date.now()
    })
  }

  /**
   * 获取所有消息
   */
  getMessages() {
    return this.messages.value
  }

  /**
   * 添加用户消息
   */
  addUserMessage(content: string) {
    this.messages.value.push({
      role: 'user',
      content,
      timestamp: Date.now()
    })
  }

  /**
   * 添加助手消息
   */
  addAssistantMessage(content: string) {
    this.messages.value.push({
      role: 'assistant',
      content,
      timestamp: Date.now()
    })
  }

  /**
   * 清空对话历史（保留系统消息）
   */
  clearHistory() {
    const systemMessage = this.messages.value.find(m => m.role === 'system')
    this.messages.value = systemMessage ? [systemMessage] : []
  }

  /**
   * 获取是否正在流式响应
   */
  getIsStreaming() {
    return this.isStreaming.value
  }

  /**
   * 发送消息并获取流式响应
   */
  async sendMessage(
    userMessage: string,
    onChunk: (text: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void
  ) {
    if (this.isStreaming.value) {
      throw new Error('当前已有对话正在进行中')
    }

    this.isStreaming.value = true
    this.currentAbortController = new AbortController()

    // 添加用户消息
    this.addUserMessage(userMessage)

    try {
      // 获取系统消息
      const systemMessage = this.messages.value.find(m => m.role === 'system')

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history: this.messages.value.slice(1), // 排除系统消息
          systemPrompt: systemMessage?.content // 发送系统提示词
        }),
        signal: this.currentAbortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is null')
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              onComplete(fullText)
              break
            }

            try {
              const parsed = JSON.parse(data)
              // 支持 OpenAI 标准格式: { choices: [{ delta: { content: "..." } }] }
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullText += content
                onChunk(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 添加助手回复到历史
      if (fullText) {
        this.addAssistantMessage(fullText)
      }

      return fullText
    } catch (error) {
      // 如果是 AbortError，添加一个停止标记以保持对话历史平衡
      if (error instanceof Error && error.name === 'AbortError') {
        // 添加一个特殊标记，表示用户中止
        this.addAssistantMessage('__STOPPED__')
        console.log('[ConversationService] 用户中止对话，已添加停止标记')
      } else {
        onError(error as Error)
      }
      throw error
    } finally {
      this.isStreaming.value = false
      this.currentAbortController = null
    }
  }

  /**
   * 停止当前对话
   */
  stopGeneration() {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
    }
    this.isStreaming.value = false
  }
}

// 导出单例
export const conversationService = new ConversationService()
