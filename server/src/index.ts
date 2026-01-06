import express from 'express'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { corsMiddleware } from './middleware/cors.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import searchRouter from './routes/search.js'
import chatRouter from './routes/chat.js'
import { modelScopeService } from './services/ModelScopeService.js'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 显式指定 .env 文件路径
const envPath = resolve(__dirname, '../.env')
console.log(`[服务器] 正在加载 .env 文件: ${envPath}`)
const envResult = dotenv.config({ path: envPath })

if (envResult.error) {
  console.error('[服务器] .env 文件加载失败:', envResult.error)
} else {
  console.log('[服务器] .env 文件加载成功')
  console.log('[服务器] MODELSCOPE_API_KEY 已配置:', !!process.env.MODELSCOPE_API_KEY)
}

// 启动时检查 ModelScope 配置
// 先更新 API key（因为模块加载时环境变量还没加载）
modelScopeService.updateApiKey()

if (!modelScopeService.isConfigured()) {
  console.warn('[服务器] 警告: MODELSCOPE_API_KEY 未配置，AI对话功能将无法使用')
} else {
  console.log('[服务器] ModelScope AI 服务配置正常')
}

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(corsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '城市展厅智能讲解系统后端服务运行中' })
})

// API路由
app.get('/api', (req, res) => {
  res.json({
    name: '城市展厅智能讲解系统 API',
    version: '1.0.0',
    endpoints: {
      search: '/api/search/*',
      chat: '/api/chat/*'
    }
  })
})

// 业务路由
app.use('/api/search', searchRouter)
app.use('/api/chat', chatRouter)

// 404处理
app.use(notFoundHandler)

// 错误处理
app.use(errorHandler)

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📚 API文档: http://localhost:${PORT}/api`)
})
