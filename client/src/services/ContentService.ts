/**
 * 内容管理服务
 * 提供内容检索、推荐、语义搜索等功能
 */

import { ref } from 'vue'
import type { ContentItem, ContentRecommendation } from '@/types/content'
import { contentLibrary } from '@/data/contentLibrary'

class ContentService {
  private contents = ref<ContentItem[]>(contentLibrary)
  private embeddings = new Map<string, number[]>()

  constructor() {
    // 初始化时加载Embedding向量（这里使用模拟数据）
    this.loadEmbeddings()
  }

  /**
   * 加载Embedding向量
   * 实际应用中应该从后端API加载预计算的向量
   */
  private async loadEmbeddings() {
    // 这里使用模拟的向量数据
    // 实际项目中，应该在开发时运行脚本预计算所有内容的Embedding
    for (const content of this.contents.value) {
      // 生成模拟的Embedding向量（1536维）
      this.embeddings.set(content.id, this.generateMockEmbedding(content.summary))
    }
  }

  /**
   * 生成模拟Embedding向量（仅用于开发测试）
   */
  private generateMockEmbedding(text: string): number[] {
    // 基于文本生成伪随机的固定向量
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const vector: number[] = []
    for (let i = 0; i < 1536; i++) {
      // 使用简单的伪随机算法
      const value = Math.sin(seed * (i + 1)) * 0.1
      vector.push(value)
    }
    return vector
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * 获取所有内容
   */
  getAllContents(): ContentItem[] {
    return this.contents.value
  }

  /**
   * 根据ID获取内容
   */
  getContentById(id: string): ContentItem | undefined {
    return this.contents.value.find(item => item.id === id)
  }

  /**
   * 根据分类获取内容
   */
  getContentByCategory(category: string): ContentItem[] {
    return this.contents.value.filter(item => item.category === category)
  }

  /**
   * 根据难度获取内容
   */
  getContentByDifficulty(difficulty: 'basic' | 'medium' | 'advanced'): ContentItem[] {
    return this.contents.value.filter(item => item.difficulty === difficulty)
  }

  /**
   * 搜索内容（关键词匹配）
   */
  searchByKeyword(keyword: string): ContentItem[] {
    const lowerKeyword = keyword.toLowerCase()
    return this.contents.value.filter(item =>
      item.title.toLowerCase().includes(lowerKeyword) ||
      item.summary.toLowerCase().includes(lowerKeyword) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    )
  }

  /**
   * 语义搜索（使用Embedding）
   */
  async semanticSearch(query: string, topK: number = 5): Promise<ContentRecommendation[]> {
    // 生成查询的Embedding（模拟）
    const queryEmbedding = this.generateMockEmbedding(query)

    // 计算所有内容的相似度
    const recommendations: ContentRecommendation[] = this.contents.value.map(content => {
      const contentEmbedding = this.embeddings.get(content.id) || []
      const similarity = this.cosineSimilarity(queryEmbedding, contentEmbedding)

      return {
        content,
        similarity,
        reason: this.generateRecommendationReason(similarity)
      }
    })

    // 按相似度排序，返回Top K
    return recommendations
      .filter(rec => rec.similarity > 0.3) // 过滤相似度太低的
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReason(similarity: number): string {
    if (similarity > 0.8) return '高度相关'
    if (similarity > 0.6) return '密切相关'
    if (similarity > 0.4) return '可能相关'
    return '相关度较低'
  }

  /**
   * 获取推荐内容（基于热门程度）
   */
  getRecommendedContents(count: number = 4): ContentItem[] {
    // 这里简单返回前4个，实际可以根据点击量、评分等排序
    return this.contents.value.slice(0, count)
  }

  /**
   * 获取相关内容推荐
   */
  getRelatedContents(currentContentId: string, count: number = 3): ContentItem[] {
    const currentContent = this.getContentById(currentContentId)
    if (!currentContent) return []

    // 基于标签找相关内容
    const related = this.contents.value.filter(item =>
      item.id !== currentContentId &&
      item.tags.some(tag => currentContent.tags.includes(tag))
    )

    return related.slice(0, count)
  }
}

// 导出单例
export const contentService = new ContentService()
