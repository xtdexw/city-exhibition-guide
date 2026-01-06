// 共享类型定义

// 密钥配置
export interface KeyConfig {
  xingyunAppId: string
  xingyunAppSecret: string
  modelscopeApiKey: string
  isTestMode: boolean
}

// 连接状态
export enum ConnectionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// 内容分类
export enum ContentCategory {
  HISTORY = 'history',
  CULTURE = 'culture',
  PLANNING = 'planning',
  LANDMARK = 'landmark'
}

// 内容项
export interface ContentItem {
  id: string
  title: string
  category: ContentCategory
  tags: string[]
  summary: string
  content: string
  multimedia: {
    images?: string[]
    videos?: string[]
    charts?: ChartConfig[]
  }
  ssmlTemplate?: string
  duration?: number
  relatedItems?: string[]
  embedding?: number[]
  similarity?: number
}

// 图表配置
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'map' | 'timeline'
  data: any
  options?: any
}

// 对话消息
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl?: string
}

// 对话响应
export interface ConversationResponse {
  text: string
  ssml?: string
  action?: string
  content?: ContentItem
  multimedia?: MultimediaData
}

// 多媒体数据
export interface MultimediaData {
  type: 'image' | 'video' | 'chart'
  url?: string
  data?: any
}

// 展品分析
export interface ExhibitAnalysis {
  imageUrl: string
  description: string
  timestamp: number
}

// API响应
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 搜索结果
export interface SearchResult {
  results: ContentItem[]
  query: string
}

// Embedding响应
export interface EmbeddingResponse {
  data: {
    embedding: number[]
    index: number
  }[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}
