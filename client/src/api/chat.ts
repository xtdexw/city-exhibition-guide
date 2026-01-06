import { useConfigStore } from '@/stores/config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * 获取API请求头
 */
function getHeaders() {
  const configStore = useConfigStore()
  return {
    'Content-Type': 'application/json',
    'X-ModelScope-API-Key': configStore.keys?.modelscopeApiKey || ''
  }
}

/**
 * 处理API错误
 */
function handleApiError(error: any): Error {
  if (error.response) {
    // 服务器返回了错误响应
    const message = error.response.data?.error || error.response.statusText
    return new Error(message)
  } else if (error.request) {
    // 请求已发送但没有收到响应
    return new Error('网络错误: 无法连接到服务器')
  } else {
    // 其他错误
    return new Error(error.message || '未知错误')
  }
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * 聊天响应
 */
export interface ChatResponse {
  text: string
  done: boolean
}

/**
 * 发送聊天消息（流式）
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messages })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is null')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            onComplete()
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  } catch (error) {
    onError(handleApiError(error))
  }
}

/**
 * 发送聊天消息（非流式）
 */
export async function sendChatMessageSync(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messages })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.reply
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * 语义搜索请求
 */
export interface SemanticSearchRequest {
  query: string
  threshold?: number
  limit?: number
}

/**
 * 语义搜索响应
 */
export interface SemanticSearchResponse {
  results: Array<{
    id: string
    title: string
    category: string
    tags: string[]
    summary: string
    content: string
    similarity: number
  }>
}

/**
 * 语义搜索
 */
export async function semanticSearch(
  request: SemanticSearchRequest
): Promise<SemanticSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search/semantic`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * 展品分析请求
 */
export interface ExhibitAnalysisRequest {
  imageUrl: string
  prompt?: string
}

/**
 * 展品分析响应
 */
export interface ExhibitAnalysisResponse {
  description: string
  timestamp: number
}

/**
 * 展品图像分析
 */
export async function analyzeExhibit(
  request: ExhibitAnalysisRequest
): Promise<ExhibitAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/exhibit/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * 获取系统提示词
 */
export function getSystemPrompt(): string {
  return `你是一个城市展厅的智能讲解员，名字叫"小星"。你的任务是向参观者介绍这座城市的历史、文化、规划和地标。

请遵循以下原则：
1. 使用友好、专业的语气
2. 回答要简洁明了，通常在50-100字之间
3. 如果不知道答案，诚实地告诉参观者你会帮忙查询
4. 可以主动引导参观者了解更多相关内容
5. 适当使用emoji让对话更生动

请用中文回答。`
}
