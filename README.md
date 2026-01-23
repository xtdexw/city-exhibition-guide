# 城市展厅智能讲解系统

> 魔珐星云具身智能黑客松 - 大屏交互与智能讲解赛道
>
> 让每块屏幕都拥有一个"有形象、会交互、能办事"的具身智能数字人

## 🌟 项目简介

本项目为城市展厅打造一个基于数字人的智能讲解系统，通过大屏展示+数字人讲解的形式，为参观者提供沉浸式、交互式的城市历史与文化体验。

### 核心特性

- 🤖 **3D 数字人驱动** - 基于魔珐星云 SDK 的实时数字人展示
- 💬 **智能对话** - 流式 AI 对话，自然语言交互体验
- 🔍 **语义搜索** - 基于 Embedding 向量的智能内容推荐
- 🖼️ **多模态交互** - 图像识别、图文对话、自动分析
- 📊 **数据大屏** - 5大可视化图表展示城市数据
- 🎭 **智能语音** - SDK自带字幕同步，语音播报优化

## 🛠️ 技术栈

### 前端技术

| 技术         | 版本   | 说明                   |
| ------------ | ------ | ---------------------- |
| Vue 3        | ^3.4.0 | 渐进式 JavaScript 框架 |
| TypeScript   | ^5.3.0 | 类型安全开发           |
| Vite         | ^5.0.0 | 下一代前端构建工具     |
| Pinia        | ^2.1.0 | Vue 3 官方状态管理     |
| Element Plus | ^2.5.0 | Vue 3 UI 组件库        |
| Vue Router   | ^4.2.0 | 路由管理               |
| ECharts      | ^5.5.0 | 数据可视化             |
| Axios        | ^1.6.0 | HTTP 客户端            |

### 后端技术

| 技术       | 版本     | 说明                |
| ---------- | -------- | ------------------- |
| Node.js    | >=18.0.0 | JavaScript 运行环境 |
| Express    | ^4.18.0  | Web 应用框架        |
| TypeScript | ^5.3.0   | 类型安全开发        |
| tsx        | ^4.7.0   | TypeScript 执行工具 |

### AI 模型

| 模型                        | 用途                 |
| --------------------------- | -------------------- |
| Qwen3-Embedding-8B          | 文本向量化，语义搜索 |
| Qwen3-VL-235B-A22B-Instruct | 多模态视觉-语言模型  |

## 📦 安装与运行

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd city-exhibition-guide

# 2. 安装所有依赖
npm run install:all

# 3. 复制后端环境变量（已包含测试密钥）
cp server/.env.example server/.env

# 4. 启动开发服务器（前端+后端同时启动）
npm run dev
```

访问 http://localhost:5173 查看应用

### 环境变量配置

> **快速体验**: 项目已包含测试密钥，可以直接运行体验。测试密钥有调用额度限制，正式使用请替换为自己的密钥。

**后端配置 (server/.env)** - 需要复制配置文件：

```bash
cp server/.env.example server/.env
```

配置内容：
```env
# 测试密钥（有额度限制）
MODELSCOPE_API_KEY=ms-110b80f9-ae5a-4590-91d4-08bc8e54603a
PORT=3001
```

**申请自己的密钥**: 访问 [魔搭社区](https://modelscope.cn/my/myaccesstoken) 获取 API Key

**前端配置** - 无需配置文件：

- 星云密钥已内置在代码中，启动后在设置页点击"使用测试密钥"即可
- API 地址已默认配置为 `http://localhost:3001`

如需自定义，可创建 `client/.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_XINGYUN_GATEWAY=https://nebula-agent.xingyun3d.com/user/v1/ttsa/session
```

### 其他命令

```bash
# 生成内容向量索引（语义搜索）
cd server && npm run generate-embeddings

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🎯 功能模块

### 1. 数字人管理

- ✅ 密钥配置管理（localStorage 持久化）
- ✅ 手动连接/断开数字人
- ✅ 实时连接状态显示
- ✅ 数字人状态控制（待机/倾听/思考/说话等）
- ✅ 流式语音输出
- ✅ SDK自带字幕同步显示
- ✅ 并发朗读控制机制

### 2. 智能对话

- ✅ AI 流式对话
- ✅ 多轮对话历史管理
- ✅ 对话停止功能（保留用户问题）
- ✅ 文本优化（适配语音播报）
- ✅ 内容库讲解（流式显示）

### 3. 内容管理

- ✅ 讲解内容库（历史/文化/规划/地标等）
- ✅ 语义搜索推荐
- ✅ 内容分类与标签
- ✅ 一键讲解功能

### 4. 多模态交互

- ✅ 图像识别与讲解
- ✅ 图文智能对话
- ✅ 展品自动分析

### 5. 数据可视化

- ✅ 5大图表类型（人口趋势、GDP增长、产业结构、科技创新、发展质量）
- ✅ 懒加载优化（避免初始化卡顿）
- ✅ 响应式图表设计
- ✅ 渐变色彩主题

## 📁 项目结构

```
city-exhibition-guide/
├── client/                    # Vue 3 前端应用
│   ├── src/
│   │   ├── api/              # API接口层
│   │   ├── components/       # Vue组件
│   │   │   ├── avatar/       # 数字人组件
│   │   │   ├── chat/         # 对话组件
│   │   │   ├── content/      # 内容组件
│   │   │   └── visualization/ # 可视化组件
│   │   ├── data/             # 数据文件
│   │   ├── router/           # 路由配置
│   │   ├── services/         # 业务服务
│   │   ├── stores/           # Pinia状态管理
│   │   ├── types/            # TypeScript类型
│   │   ├── views/            # 页面视图
│   │   ├── App.vue           # 根组件
│   │   └── main.ts           # 应用入口
│   ├── .env.example           # 环境变量示例
│   ├── package.json           # 前端依赖
│   ├── vite.config.ts         # Vite配置
│   └── tsconfig.json          # TypeScript配置
│
├── server/                    # Node.js 后端服务
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── middleware/       # Express中间件
│   │   ├── routes/           # API路由
│   │   ├── services/         # 业务服务
│   │   ├── utils/            # 工具函数
│   │   └── index.ts          # 服务器入口
│   ├── .env.example           # 环境变量示例
│   └── package.json           # 后端依赖
│
├── shared/                    # 前后端共享代码
│   └── types/                 # 共享类型定义
│
├── package.json              # 根项目配置
├── README.md                 # 项目说明
└── .gitignore                # Git忽略配置
```

## 🔌 API 接口

### 健康检查

- **GET** `/health` - 服务健康状态

### AI 对话

- **POST** `/api/chat/stream` - 流式对话接口
- **POST** `/api/chat/exhibit` - 展品图像分析

### 语义搜索

- **POST** `/api/search/semantic` - 语义搜索
- **POST** `/api/search/batch` - 批量搜索

## 🎨 界面预览

### 三栏布局设计

```
┌─────────────────────────────────────────────────────┐
│                 城市展厅智能讲解系统                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────┐ │
│  │              │  │                 │  │         │ │
│  │  数字人区域   │  │   内容展示区     │  │ 对话区  │ │
│  │              │  │                 │  │         │ │
│  │  3D Avatar   │  │  多媒体/图表     │  │ 聊天框  │ │
│  │              │  │                 │  │         │ │
│  │  [状态显示]   │  │                 │  │ 快捷操作│ │
│  │  [连接控制]   │  │                 │  │         │ │
│  └──────────────┘  └─────────────────┘  └─────────┘ │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## 🚀 部署

### 生产环境构建

```bash
# 1. 构建前端
cd client
npm run build

# 2. 启动后端（会自动服务前端静态文件）
cd ..
npm start
```

服务器将运行在 http://localhost:3001

### Docker 部署（可选）

```dockerfile
# Dockerfile示例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## ❓ 常见问题

### Q: 数字人连接失败？

A: 请检查：

1. 星云 AppId 和 AppSecret 是否正确配置
2. 网络连接是否正常
3. 浏览器控制台是否有错误信息

### Q: AI 对话显示 "Failed to fetch"？

A: 这是最常见的问题，请按以下步骤排查：

**步骤 1：检查后端服务是否运行**
```bash
# 在浏览器访问健康检查接口
http://localhost:3001/health

# 或使用 curl 命令
curl http://localhost:3001/health
```

如果返回 `{"status":"ok"}`，说明后端正常运行。

**步骤 2：检查前端环境变量**
1. 打开浏览器控制台 (F12)
2. 在 Console 中输入：
```javascript
import.meta.env.VITE_API_BASE_URL
```
3. 确认输出是 `http://localhost:3001`

**步骤 3：检查浏览器 Network 标签**
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 发送一条测试消息
4. 查看失败的请求 URL 和端口号

**步骤 4：重启服务**
修改 `.env` 文件后，必须重启服务才能生效：
```bash
# 停止当前服务 (Ctrl+C)
# 重新启动
npm run dev
```

**步骤 5：检查端口占用**
```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

### Q: AI 对话没有响应？

A: 请确认：

1. 后端服务是否正常运行（访问 http://localhost:3001/health）
2. 魔搭 API 密钥是否正确配置在 `server/.env`
3. 查看"Network"标签页检查 API 请求状态码
4. 查看后端控制台是否有错误日志

### Q: 如何添加新的讲解内容？

A: 编辑 `client/src/data/contentLibrary.ts` 文件，添加新的内容项，然后重新生成向量索引。

### Q: 数据大屏切换时卡顿？

A: 已通过懒加载机制优化，图表会在首次切换到数据大屏标签时初始化，避免页面加载时的性能问题。

## 👨‍💻 作者 & 联系方式

**Nie Tao**

**xtwork32@163.com**

## 📄 许可证

MIT License

---