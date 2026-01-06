import { Request, Response, NextFunction } from 'express'

// API错误类
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 错误处理中间件
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code
    })
  }

  // 默认错误响应
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  })
}

// 404处理
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `路由不存在: ${req.method} ${req.path}`
  })
}
