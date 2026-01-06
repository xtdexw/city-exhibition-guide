import { Router } from 'express'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { modelScopeService } from '../services/ModelScopeService.js'
import { cosineSimilarity } from '../utils/vector.js'
import type { ContentItem } from '@shared/types'
import type { SearchResult } from '@shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

// 向量缓存
let embeddingsCache: Array<ContentItem & { embedding: number[] }> | null = null

/**
 * 加载预计算的向量索引
 */
async function loadEmbeddings(): Promise<Array<ContentItem & { embedding: number[] }>> {
  // 如果已缓存，直接返回
  if (embeddingsCache) {
    return embeddingsCache
  }

  try {
    const embeddingsPath = join(__dirname, '../../../client/src/data/embeddings.json')

    // 检查文件是否存在
    await fs.access(embeddingsPath)

    // 读取文件
    const content = await fs.readFile(embeddingsPath, 'utf-8')
    const data = JSON.parse(content)

    // 过滤掉没有embedding的项目
    embeddingsCache = data.filter((item: any) => item.embedding && Array.isArray(item.embedding))

    console.log(`已加载 ${embeddingsCache.length} 个向量索引`)
    return embeddingsCache
  } catch (error) {
    console.error('加载向量索引失败:', error)
    return []
  }
}

/**
 * POST /api/search/semantic
 * 语义搜索 - 根据查询文本返回最相似的内容
 */
router.post('/semantic', async (req, res, next) => {
  try {
    const { query, threshold = 0.6, limit = 5 } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的查询文本'
      })
    }

    // 1. 实时计算查询文本的向量
    console.log(`正在计算查询向量: ${query}`)
    const queryEmbedding = await modelScopeService.getEmbedding(query)

    // 2. 加载预计算的内容向量
    const contentEmbeddings = await loadEmbeddings()

    if (contentEmbeddings.length === 0) {
      return res.json({
        success: true,
        results: [],
        query,
        message: '内容库为空，请先运行向量预计算脚本'
      })
    }

    // 3. 计算相似度
    const results = contentEmbeddings
      .map(item => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    // 4. 返回结果（移除embedding字段以减少响应大小）
    const searchResults = results.map(({ embedding, ...rest }) => rest)

    res.json({
      success: true,
      results: searchResults,
      query,
      total: searchResults.length
    } as SearchResult)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/search/batch
 * 批量语义搜索 - 一次搜索多个查询
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { queries, threshold = 0.6, limit = 5 } = req.body

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的查询数组'
      })
    }

    // 限制批量查询数量
    if (queries.length > 10) {
      return res.status(400).json({
        success: false,
        error: '批量查询最多支持10个'
      })
    }

    const results = await Promise.all(
      queries.map(async (query) => {
        try {
          const queryEmbedding = await modelScopeService.getEmbedding(query)
          const contentEmbeddings = await loadEmbeddings()

          const matches = contentEmbeddings
            .map(item => ({
              ...item,
              similarity: cosineSimilarity(queryEmbedding, item.embedding)
            }))
            .filter(item => item.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)

          return {
            query,
            results: matches.map(({ embedding, ...rest }) => rest),
            total: matches.length
          }
        } catch (error) {
          return {
            query,
            results: [],
            total: 0,
            error: error instanceof Error ? error.message : '未知错误'
          }
        }
      })
    )

    res.json({
      success: true,
      results
    })
  } catch (error) {
    next(error)
  }
})

export default router
