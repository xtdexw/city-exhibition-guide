import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { modelScopeService } from '../services/ModelScopeService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 内容库路径
const CONTENTS_PATH = join(__dirname, '../../../client/src/data/contents/exhibits.json')
// 输出路径
const OUTPUT_PATH = join(__dirname, '../../../client/src/data/embeddings.json')

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 加载内容库
 */
async function loadContents() {
  console.log('正在加载内容库...')
  const content = await fs.readFile(CONTENTS_PATH, 'utf-8')
  const contents = JSON.parse(content)
  console.log(`已加载 ${contents.length} 个内容项`)
  return contents
}

/**
 * 生成向量索引
 */
async function generateEmbeddings(contents: any[]) {
  console.log('开始生成向量索引...\n')

  const results = []

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i]
    console.log(`[${i + 1}/${contents.length}] 正在处理: ${item.title}`)

    try {
      // 使用summary作为embedding的输入文本
      const embedding = await modelScopeService.getEmbedding(item.summary)

      results.push({
        ...item,
        embedding
      })

      console.log(`  ✓ 完成 (向量维度: ${embedding.length})`)

      // 添加延迟避免API限流
      if (i < contents.length - 1) {
        await delay(500)
      }
    } catch (error) {
      console.error(`  ✗ 失败: ${error instanceof Error ? error.message : '未知错误'}`)

      // 失败时也保存内容，但embedding为空
      results.push({
        ...item,
        embedding: null
      })
    }
  }

  return results
}

/**
 * 保存向量索引
 */
async function saveEmbeddings(data: any[]) {
  console.log('\n正在保存向量索引...')
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✓ 向量索引已保存到: ${OUTPUT_PATH}`)

  // 统计信息
  const successCount = data.filter(item => item.embedding !== null).length
  const failCount = data.filter(item => item.embedding === null).length

  console.log('\n统计信息:')
  console.log(`  总计: ${data.length} 个内容`)
  console.log(`  成功: ${successCount} 个`)
  console.log(`  失败: ${failCount} 个`)
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('  向量预计算脚本')
  console.log('========================================\n')

  try {
    // 1. 加载内容
    const contents = await loadContents()

    // 2. 生成向量
    const embeddings = await generateEmbeddings(contents)

    // 3. 保存结果
    await saveEmbeddings(embeddings)

    console.log('\n✓ 所有任务完成!')
  } catch (error) {
    console.error('\n✗ 错误:', error)
    process.exit(1)
  }
}

// 运行脚本
main()
