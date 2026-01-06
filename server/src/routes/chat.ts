import { Router } from 'express'
import { modelScopeService } from '../services/ModelScopeService.js'

const router = Router()

/**
 * POST /api/chat
 * AI对话接口 - 支持流式响应
 */
router.post('/', async (req, res, next) => {
  try {
    const { messages, stream = true } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的对话消息数组'
      })
    }

    // 验证消息格式
    const isValid = messages.every(msg =>
      msg &&
      typeof msg === 'object' &&
      typeof msg.role === 'string' &&
      ['user', 'assistant', 'system'].includes(msg.role) &&
      msg.content
    )

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: '消息格式不正确'
      })
    }

    if (stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const fullText = await modelScopeService.multimodalChat(
        messages,
        (chunk) => {
          // 发送流式数据
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
        }
      )

      // 发送完成标记
      res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`)
      res.end()
    } else {
      // 非流式响应
      const fullText = await modelScopeService.multimodalChat(messages)

      res.json({
        success: true,
        response: fullText
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/chat/exhibit
 * 展品图像分析接口
 */
router.post('/exhibit', async (req, res, next) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的图片URL'
      })
    }

    console.log(`正在分析展品图片: ${imageUrl}`)

    const description = await modelScopeService.analyzeExhibit(imageUrl)

    res.json({
      success: true,
      data: {
        imageUrl,
        description,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/chat/stream
 * 简化的流式对话接口
 */
router.post('/stream', async (req, res, next) => {
  try {
    const { message, history = [], systemPrompt } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的消息内容'
      })
    }

    // 构建消息数组，包含系统消息
    const messages: Array<{ role: string; content: string }> = []

    // 添加系统消息（如果有）
    if (systemPrompt && typeof systemPrompt === 'string') {
      messages.push({ role: 'system', content: systemPrompt })
    }

    // 添加历史消息
    messages.push(...history)

    // 添加当前用户消息
    messages.push({ role: 'user', content: message })

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // 禁用Nginx缓冲

    // 发送AI响应
    await modelScopeService.textChat(
      messages,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
    )

    // 发送完成标记
    res.write(`data: [DONE]\n\n`)
    res.end()
  } catch (error) {
    next(error)
  }
})

export default router
