import cors from 'cors'

// CORS配置
export const corsMiddleware = cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['http://localhost:5173', 'http://localhost:5174'] // 生产环境配置
    : true, // 开发环境允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-ModelScope-API-Key']
})
