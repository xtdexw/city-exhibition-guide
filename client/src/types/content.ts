/**
 * 内容管理相关类型定义
 */

export interface ContentItem {
  id: string
  title: string
  category: ContentCategory
  tags: string[]
  summary: string
  content: string
  embedding?: number[] // Embedding向量，用于语义搜索
  multimedia?: {
    images?: string[]
    videos?: string[]
    charts?: ChartConfig[]
  }
  duration?: number
  difficulty: 'basic' | 'medium' | 'advanced'
  createdAt: number
}

export type ContentCategory =
  | 'history'      // 城市历史
  | 'culture'      // 文化底蕴
  | 'planning'     // 城市规划
  | 'landmark'     // 地标建筑
  | 'economy'      // 经济发展
  | 'technology'   // 科技创新

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'map' | 'timeline'
  title: string
  data: any
  options?: any
}

export interface ContentRecommendation {
  content: ContentItem
  similarity: number
  reason: string
}
