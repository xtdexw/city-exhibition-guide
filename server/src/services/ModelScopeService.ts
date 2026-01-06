import type { EmbeddingResponse } from '@shared/types'

export class ModelScopeService {
  private apiKey: string
  private baseURL = 'https://api-inference.modelscope.cn/v1'

  constructor() {
    this.apiKey = process.env.MODELSCOPE_API_KEY || ''
    // 不再在这里打印警告，因为可能太早了
  }

  /**
   * 更新 API key（用于环境变量加载后更新）
   */
  updateApiKey(): void {
    this.apiKey = process.env.MODELSCOPE_API_KEY || ''
  }

  /**
   * 检查 API key 是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * 获取文本的Embedding向量
   * 使用 Qwen3-Embedding-8B 模型
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen3-Embedding-8B',
          input: text,
          encoding_format: 'float'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Embedding API错误: ${response.status} - ${error}`)
      }

      const data: EmbeddingResponse = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('获取Embedding失败:', error)
      throw error
    }
  }

  /**
   * 批量获取文本的Embedding向量
   */
  async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []

    for (const text of texts) {
      const embedding = await this.getEmbedding(text)
      embeddings.push(embedding)
    }

    return embeddings
  }

  /**
   * 多模态对话（支持文本和图片）
   * 使用 Qwen3-VL-235B-A22B-Instruct 模型
   */
  async multimodalChat(
    messages: Array<{ role: string; content: any }>,
    onChunk?: (text: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen3-VL-235B-A22B-Instruct',
          messages,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Chat API错误: ${response.status} - ${error}`)
      }

      return this.handleStreamResponse(response, onChunk)
    } catch (error) {
      console.error('多模态对话失败:', error)
      throw error
    }
  }

  /**
   * 纯文本对话
   */
  async textChat(
    messages: Array<{ role: string; content: string }>,
    onChunk?: (text: string) => void
  ): Promise<string> {
    // 将纯文本消息转换为多模态格式
    const multimodalMessages = messages.map(msg => ({
      role: msg.role,
      content: [{ type: 'text', text: msg.content }]
    }))

    return this.multimodalChat(multimodalMessages, onChunk)
  }

  /**
   * 处理流式响应
   */
  private async handleStreamResponse(
    response: Response,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('响应体为空')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              return fullText
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content

              if (content) {
                fullText += content
                onChunk?.(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullText
  }

  /**
   * 展品图像分析
   */
  async analyzeExhibit(imageUrl: string): Promise<string> {
    const prompt = '请详细分析这幅图片中的展品，包括：1.外观特征 2.历史背景 3.文化价值 4.艺术特色。请用生动有趣的语言讲解。'

    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: imageUrl }
        }
      ]
    }]

    return this.multimodalChat(messages)
  }
}

// 导出单例
export const modelScopeService = new ModelScopeService()
