import { ref } from 'vue'
import { AvatarService, AvatarState, ConnectionStatus } from './AvatarService'
import type { KeyConfig } from '@shared/types'

/**
 * 数字人连接管理器
 */
export class AvatarConnectionManager {
  private avatarService: AvatarService | null = null
  private currentStatus = ref<ConnectionStatus>(ConnectionStatus.IDLE)
  private statusCallbacks: Array<(status: ConnectionStatus) => void> = []
  private progressCallbacks: Array<(progress: number) => void> = []
  private subtitleCallback: ((text: string) => void) | null = null  // 字幕回调
  private subtitleTimer: number | null = null  // 字幕定时器
  private subtitleQueue: string[] = []  // 字幕队列
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3

  constructor() {}

  /**
   * 设置字幕回调
   */
  setSubtitleCallback(callback: (text: string) => void) {
    this.subtitleCallback = callback
  }

  /**
   * 清除字幕
   */
  clearSubtitle() {
    this.clearSubtitleTimer()
    if (this.subtitleCallback) {
      this.subtitleCallback('')
    }
  }

  /**
   * 清理字幕定时器
   */
  private clearSubtitleTimer() {
    if (this.subtitleTimer !== null) {
      clearInterval(this.subtitleTimer)
      this.subtitleTimer = null
    }
    this.subtitleQueue = []
  }

  /**
   * 队列方式播放字幕
   */
  playSubtitles(sentences: string[], interval: number = 3000) {
    this.clearSubtitleTimer()
    this.subtitleQueue = [...sentences]
    let index = 0

    // 立即显示第一句
    if (this.subtitleQueue.length > 0 && this.subtitleCallback) {
      this.subtitleCallback(this.subtitleQueue[0])
      index++
    }

    // 定时显示后续句子
    this.subtitleTimer = setInterval(() => {
      if (index < this.subtitleQueue.length && this.subtitleCallback) {
        this.subtitleCallback(this.subtitleQueue[index])
        index++
      } else {
        this.clearSubtitleTimer()
      }
    }, interval) as unknown as number
  }

  /**
   * 获取当前连接状态
   */
  getStatus() {
    return this.currentStatus
  }

  /**
   * 检查是否已连接
   */
  isConnected() {
    return this.currentStatus.value === ConnectionStatus.CONNECTED
  }

  /**
   * 检查是否正在连接
   */
  isConnecting() {
    return this.currentStatus.value === ConnectionStatus.CONNECTING
  }

  /**
   * 连接数字人
   */
  async connect(config: KeyConfig, containerId: string = 'avatar-container'): Promise<boolean> {
    // 如果已经连接，先断开
    if (this.isConnected()) {
      await this.disconnect()
      await this.delay(1000)
    }

    // 如果正在连接，等待当前连接完成
    if (this.isConnecting()) {
      return false
    }

    this.setStatus(ConnectionStatus.CONNECTING)
    this.reconnectAttempts = 0

    try {
      // 每次连接前彻底清理
      if (this.avatarService) {
        this.avatarService.destroy()
        this.avatarService = null
      }

      // 额外等待时间，确保资源完全释放
      await this.delay(500)

      // 创建新的服务实例
      this.avatarService = new AvatarService(config, containerId)

      let renderCompleted = false

      // 初始化SDK
      await this.avatarService.init({
        onDownloadProgress: (progress: number) => {
          // 通知所有进度监听器
          this.progressCallbacks.forEach(callback => callback(progress))
        },
        onMessage: (message: any) => {
          // 只处理错误，忽略正常消息
        },
        onStateChange: (state: string) => {
          // 静默处理状态变化
        },
        onStatusChange: (status: number) => {
          // 静默处理状态变化
        },
        onStateRenderChange: (state: string, duration: number) => {
          // 渲染状态变化，可能是数字人显示的信号
          console.log('[连接管理器] 渲染状态变化:', state, duration)
          if (state === 'idle' || state === 'online') {
            renderCompleted = true
          }
        }
      })

      // 检查初始化是否真的成功
      if (this.avatarService.getInitError()) {
        throw new Error(`SDK初始化错误: ${this.avatarService.getInitError()}`)
      }

      // 等待数字人真正渲染出来 - 通过检测容器中的渲染元素
      console.log('[连接管理器] 等待数字人渲染...')
      const renderCheckInterval = 100
      const maxWaitTime = 30000 // 最多等待30秒
      let waitedTime = 0

      while (waitedTime < maxWaitTime) {
        // 检查容器中是否有渲染元素（canvas或video）
        const container = document.getElementById(containerId)
        if (container) {
          const canvas = container.querySelector('canvas')
          const video = container.querySelector('video')
          const hasRenderElement = canvas || video

          // 如果有渲染元素，或者渲染已完成，就认为数字人已显示
          if (hasRenderElement || renderCompleted) {
            console.log('[连接管理器] 检测到数字人渲染元素')
            break
          }
        }

        await this.delay(renderCheckInterval)
        waitedTime += renderCheckInterval
      }

      // 设置连接成功状态
      this.setStatus(ConnectionStatus.CONNECTED)
      console.log('[连接管理器] 数字人连接成功')

      // 先返回连接成功，让界面可以立即显示提示
      // 打招呼改为异步执行，不阻塞连接流程
      setTimeout(async () => {
        try {
          // 等待一段时间确保完全稳定
          await this.delay(1000)

          // 检查SDK是否仍然正常
          if (!this.avatarService || !this.avatarService.isInitialized() || !this.isConnected()) {
            return // 已断开，不执行打招呼
          }

          // 打招呼 - 使用简短文本
          const greetingText = '您好，我是智能讲解员小星，很高兴为您服务！'

          // 更新字幕（分段显示，避免太长）
          if (this.subtitleCallback) {
            this.subtitleCallback(greetingText)
          }

          // 使用 speak（不等待完成）
          this.avatarService.speak(greetingText, true, true)

          // 等待播报完成后清除字幕
          setTimeout(() => {
            if (this.subtitleCallback) {
              this.subtitleCallback('')
            }
          }, 5000)

          // 设置最终状态
          if (this.avatarService && this.avatarService.isInitialized() && this.isConnected()) {
            try {
              this.avatarService.setState(AvatarState.INTERACTIVE_IDLE)
            } catch (error) {
              console.warn('[连接管理器] 设置状态失败:', error)
            }
          }
        } catch (error) {
          console.warn('[连接管理器] 打招呼失败:', error)
        }
      }, 100)

      return true
    } catch (error) {
      console.error('[连接管理器] 连接失败:', error)
      this.setStatus(ConnectionStatus.ERROR)

      // 清理失败的实例
      if (this.avatarService) {
        this.avatarService.destroy()
        this.avatarService = null
      }

      // 自动重试
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        await this.delay(2000)
        return this.connect(config, containerId)
      }

      return false
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (!this.avatarService) {
      return
    }

    this.setStatus(ConnectionStatus.DISCONNECTING)

    try {
      // 清理字幕和定时器
      this.clearSubtitle()

      // 先销毁SDK
      this.avatarService.destroy()
      this.avatarService = null

      // 等待资源释放
      await this.delay(500)

      this.setStatus(ConnectionStatus.DISCONNECTED)
    } catch (error) {
      this.setStatus(ConnectionStatus.ERROR)
      // 即使出错，也清理实例
      this.avatarService = null
    }
  }

  /**
   * 重新连接
   */
  async reconnect(config: KeyConfig, containerId?: string): Promise<boolean> {
    // 先断开现有连接
    await this.disconnect()

    // 等待一段时间
    await this.delay(1000)

    // 重新连接
    return this.connect(config, containerId)
  }

  /**
   * 获取AvatarService实例
   */
  getService(): AvatarService | null {
    return this.avatarService
  }

  /**
   * 监听连接状态变化
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.statusCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 监听下载进度变化
   */
  onProgressChange(callback: (progress: number) => void): () => void {
    this.progressCallbacks.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.progressCallbacks.indexOf(callback)
      if (index > -1) {
        this.progressCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 设置连接状态
   */
  private setStatus(status: ConnectionStatus): void {
    this.currentStatus.value = status
    this.statusCallbacks.forEach(callback => callback(status))
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const avatarConnectionManager = new AvatarConnectionManager()
