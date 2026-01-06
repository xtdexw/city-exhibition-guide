import type { KeyConfig } from '@shared/types'

// 星云SDK全局类型声明
declare global {
  interface Window {
    XmovAvatar: any
  }
}

// SDK状态枚举 - 根据SDK文档
export enum AvatarState {
  IDLE = 'idle',
  LISTEN = 'listen',
  THINK = 'think',
  SPEAK = 'speak',
  INTERACTIVE_IDLE = 'interactive_idle',
  OFFLINE = 'offlineMode',
  ONLINE = 'onlineMode'
}

// 连接状态枚举
export enum ConnectionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// SDK状态码 - 根据SDK文档
enum SDKStatus {
  online = 0,
  offline = 1,
  network_on = 2,
  network_off = 3,
  close = 4  // 这是正常关闭状态，不是错误
}

// SDK回调类型
interface SDKCallbacks {
  onWidgetEvent?: (data: any) => void
  onNetworkInfo?: (info: any) => void
  onMessage?: (message: any) => void
  onStateChange?: (state: string) => void
  onStatusChange?: (status: number) => void
  onStateRenderChange?: (state: string, duration: number) => void
  onVoiceStateChange?: (status: string) => void
  onDownloadProgress?: (progress: number) => void
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
}

/**
 * 星云数字人服务类
 */
export class AvatarService {
  private sdk: any = null
  private config: KeyConfig
  private containerId: string
  private currentState: AvatarState = AvatarState.IDLE
  private isDestroyed: boolean = false
  private initError: string | null = null  // 记录初始化错误
  private speakResolveHook: (() => void) | null = null  // 说话完成回调钩子
  private speakRejectHook: ((error: Error) => void) | null = null  // 说话错误回调钩子

  constructor(config: KeyConfig, containerId: string = 'avatar-container') {
    this.config = config
    this.containerId = containerId
    this.isDestroyed = false
    this.initError = null
  }

  /**
   * 初始化SDK
   */
  async init(callbacks?: SDKCallbacks): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('SDK实例已被销毁，无法初始化')
    }

    if (!window.XmovAvatar) {
      throw new Error('星云SDK未加载，请检查网络连接')
    }

    // 检查容器元素是否存在
    const container = document.getElementById(this.containerId)
    if (!container) {
      console.error(`[Avatar] 容器元素 #${this.containerId} 不存在`)
      throw new Error(`容器元素 #${this.containerId} 不存在`)
    }

    // gatewayServer 配置
    const gatewayServer = 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'

    // 验证密钥是否存在（不限制长度，由 SDK 验证）
    if (!this.config.xingyunAppId) {
      console.error('[Avatar] AppId 不能为空')
      throw new Error('AppId 不能为空')
    }
    if (!this.config.xingyunAppSecret) {
      console.error('[Avatar] AppSecret 不能为空')
      throw new Error('AppSecret 不能为空')
    }

    // 创建SDK实例
    try {
      this.sdk = new window.XmovAvatar({
        containerId: `#${this.containerId}`,
        appId: this.config.xingyunAppId,
        appSecret: this.config.xingyunAppSecret,
        gatewayServer: gatewayServer,

        onWidgetEvent: (data: any) => {
          callbacks?.onWidgetEvent?.(data)
        },

        onNetworkInfo: (info: any) => {
          callbacks?.onNetworkInfo?.(info)
        },

        onMessage: (message: any) => {
          // 检测并记录关键错误
          if (message.code && message.code !== 0) {
            console.error(`[Avatar] SDK错误: ${message.code} - ${message.message}`)

            // 关键错误码：10005-房间限流, 10003-请求失败, 10004-主动关闭
            if (message.code === 10005 || message.code === 10003) {
              this.initError = `${message.code}: ${message.message}`
            }
          }
          callbacks?.onMessage?.(message)
        },

        onStateChange: (state: string) => {
          this.currentState = state as AvatarState
          callbacks?.onStateChange?.(state)
        },

        onStatusChange: (status: number) => {
          // 静默处理状态变化，不打印日志
          callbacks?.onStatusChange?.(status)
        },

        onStateRenderChange: callbacks?.onStateRenderChange,

        onVoiceStateChange: (status: string) => {
          callbacks?.onVoiceStateChange?.(status)
          // 监听语音播放状态，触发对应的回调
          if (status === 'voice_start') {
            callbacks?.onSpeakStart?.()
          } else if (status === 'voice_end') {
            callbacks?.onSpeakEnd?.()
            // 触发内部钩子
            if (this.speakResolveHook) {
              this.speakResolveHook()
              this.speakResolveHook = null
              this.speakRejectHook = null
            }
          }
        },

        enableLogger: true  // 开启SDK内部日志用于调试
      })
    } catch (error) {
      console.error('[Avatar] 创建SDK实例失败:', error)
      throw error
    }

    // 初始化SDK
    try {
      await this.sdk.init({
        onDownloadProgress: (progress: number) => {
          callbacks?.onDownloadProgress?.(progress)
        }
      })

      // 检查初始化过程中是否有错误
      if (this.initError) {
        throw new Error(`SDK初始化失败: ${this.initError}`)
      }

      // 修复背景容器透明度
      setTimeout(() => {
        const container = document.getElementById(this.containerId)
        if (container) {
          const bgContainer = container.querySelector('#avatar-bg-container')
          if (bgContainer) {
            const styles = window.getComputedStyle(bgContainer)
            if (styles.opacity === '0') {
              ;(bgContainer as HTMLElement).style.opacity = '1'
            }
          }
        }
      }, 1000)

    } catch (error) {
      console.error('[Avatar] SDK初始化失败:', error)
      throw error
    }
  }

  /**
   * 获取状态名称
   */
  private getStatusName(status: number): string {
    const statusMap: Record<number, string> = {
      0: 'online',
      1: 'offline',
      2: 'network_on',
      3: 'network_off',
      4: 'close'
    }
    return statusMap[status] || `unknown(${status})`
  }

  /**
   * 说话 - 控制数字人说话
   * @param text - 说话内容
   * @param isStart - 是否开始（true: 开始新话语，false: 继续当前话语）
   * @param isEnd - 是否结束（true: 结束话语，false: 未结束）
   */
  speak(text: string, isStart: boolean = true, isEnd: boolean = true): void {
    if (!this.sdk || this.isDestroyed) {
      return
    }

    try {
      // 直接调用 SDK speak 方法
      this.sdk.speak(text, isStart, isEnd)

      if (isEnd) {
        this.currentState = AvatarState.SPEAK
      }
    } catch (error) {
      console.error('[Avatar] speak error:', error)
    }
  }

  /**
   * 说话并等待完成 - 返回Promise，等待语音播放完成
   */
  async speakAndWait(text: string, isStart: boolean = false, isEnd: boolean = false, timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sdk || this.isDestroyed) {
        resolve()
        return
      }

      // 设置完成钩子
      this.speakResolveHook = resolve
      this.speakRejectHook = reject

      // 发送语音
      this.sdk.speak(text, isStart, isEnd)

      // 超时保护
      setTimeout(() => {
        if (this.speakResolveHook) {
          console.warn('[Avatar] 语音播放超时')
          this.speakResolveHook()
          this.speakResolveHook = null
          this.speakRejectHook = null
        }
      }, timeout)
    })
  }

  /**
   * 流式说话 - 用于AI流式响应
   */
  speakStream(text: string): void {
    if (!text) return
    this.speak(text, true, true)
  }

  /**
   * 设置状态
   */
  setState(state: AvatarState): void {
    if (!this.sdk || this.isDestroyed) {
      return
    }

    switch (state) {
      case AvatarState.IDLE:
        this.sdk.idle()
        break
      case AvatarState.LISTEN:
        this.sdk.listen()
        break
      case AvatarState.THINK:
        this.sdk.think()
        break
      case AvatarState.SPEAK:
        // speak 状态通过调用 speak() 方法触发，不需要单独设置
        break
      case AvatarState.INTERACTIVE_IDLE:
        this.sdk.interactiveidle()
        break
      case AvatarState.OFFLINE:
        this.sdk.offlineMode()
        break
      case AvatarState.ONLINE:
        this.sdk.onlineMode()
        break
      default:
        console.warn('[Avatar] 未知状态:', state)
    }

    this.currentState = state
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (!this.sdk || this.isDestroyed) {
      return
    }
    this.sdk.setVolume(volume)
  }

  /**
   * 进入离线模式
   */
  offlineMode(): void {
    if (!this.sdk || this.isDestroyed) {
      return
    }
    this.sdk.offlineMode()
  }

  /**
   * 进入在线模式
   */
  onlineMode(): void {
    if (!this.sdk || this.isDestroyed) {
      return
    }
    this.sdk.onlineMode()
  }

  /**
   * 获取当前状态
   */
  getState(): AvatarState {
    return this.currentState
  }

  /**
   * 销毁SDK
   */
  destroy(): void {
    if (this.sdk && !this.isDestroyed) {
      this.sdk.destroy()
      this.sdk = null
      this.isDestroyed = true
      this.initError = null  // 重置错误
    }
  }

  /**
   * 检查SDK是否已初始化
   */
  isInitialized(): boolean {
    return this.sdk !== null && !this.isDestroyed && !this.initError
  }

  /**
   * 获取初始化错误
   */
  getInitError(): string | null {
    return this.initError
  }

  /**
   * 检查SDK是否已销毁
   */
  isDestroyedHandler(): boolean {
    return this.isDestroyed
  }
}
