/**
 * 向量计算工具函数
 */

/**
 * 计算两个向量的余弦相似度
 * @param vec1 第一个向量
 * @param vec2 第二个向量
 * @returns 相似度值 (0-1之间，1表示完全相同)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('向量长度不匹配')
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)

  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * 计算两个向量的欧氏距离
 * @param vec1 第一个向量
 * @param vec2 第二个向量
 * @returns 距离值
 */
export function euclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('向量长度不匹配')
  }

  let sum = 0
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

/**
 * 向量归一化
 * @param vec 输入向量
 * @returns 归一化后的向量
 */
export function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0))

  if (norm === 0) {
    return vec
  }

  return vec.map(val => val / norm)
}

/**
 * 计算向量的点积
 * @param vec1 第一个向量
 * @param vec2 第二个向量
 * @returns 点积值
 */
export function dotProduct(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('向量长度不匹配')
  }

  return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
}

/**
 * 找到最相似的向量
 * @param query 查询向量
 * @param vectors 候选向量列表
 * @param topK 返回前K个结果
 * @returns 最相似的向量及其索引和相似度
 */
export function findMostSimilar(
  query: number[],
  vectors: number[][],
  topK: number = 5
): Array<{ index: number; similarity: number; vector: number[] }> {
  const similarities = vectors.map((vector, index) => ({
    index,
    similarity: cosineSimilarity(query, vector),
    vector
  }))

  // 按相似度降序排序
  similarities.sort((a, b) => b.similarity - a.similarity)

  // 返回前K个结果
  return similarities.slice(0, topK)
}

/**
 * 过滤低相似度结果
 * @param results 相似度结果列表
 * @param threshold 相似度阈值（默认0.6）
 * @returns 过滤后的结果
 */
export function filterByThreshold<T extends { similarity: number }>(
  results: T[],
  threshold: number = 0.6
): T[] {
  return results.filter(result => result.similarity >= threshold)
}
