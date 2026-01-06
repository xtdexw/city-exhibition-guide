# 城市展厅智能讲解系统 - 开发文档

## 项目概述

### 项目名称
**城市展厅具身智能讲解系统**

### 赛道信息
- **赛道**: 大屏交互与智能讲解
- **方向**: 城市展厅讲解 - 配合展厅多媒体内容，生动讲述城市历史底蕴、文化故事与未来规划蓝图

### 核心理念
让每块屏幕都拥有一个"有形象、会交互、能办事"的具身智能数字人，将传统展厅升级为具身智能终端。

### 项目定位
为城市展厅打造一个基于数字人的智能讲解系统，通过大屏展示+数字人讲解的形式，为参观者提供沉浸式、交互式的城市历史与文化体验。

---

## 技术架构

### 核心技术栈
1. **前端框架**: Vue 3 + TypeScript + Vite
2. **数字人技术**: 魔珐星云具身驱动SDK (JS版本)
3. **AI大模型**: 魔搭社区AI模型
4. **大屏可视化**: ECharts / DataV
5. **状态管理**: Pinia
6. **UI框架**: Element Plus / Ant Design Vue
7. **构建工具**: Vite

### 系统架构图
```
┌─────────────────────────────────────────────────┐
│           展厅大屏显示端 (Browser)                │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────────┐   │
│  │  数字人区域   │      │   内容展示区域    │   │
│  │  (3D Avatar) │      │  (多媒体/图表)    │   │
│  └──────────────┘      └──────────────────┘   │
├─────────────────────────────────────────────────┤
│           应用层 (Vue 3 Application)             │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │数字人管理│  │ 内容管理 │  │ 交互管理模块 │ │
│  │  模块   │  │  模块   │  │              │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
├─────────────────────────────────────────────────┤
│           服务层 (Services)                      │
├─────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────────┐   │
│  │  魔珐星云SDK      │  │  魔搭AI模型      │   │
│  │  (XmovAvatar)    │  │  (ModelScope)   │   │
│  └──────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 功能模块设计

### 1. 数字人管理模块

#### 1.1 密钥管理系统
**功能需求**:
- 支持用户手动输入API密钥
- 密钥存储在localStorage中
- 提供内置测试密钥供开发调试
- 支持密钥的增删改查

**实现方案**:
```typescript
// 密钥管理接口
interface KeyConfig {
  xingyunAppId: string;      // 星云AppID
  xingyunAppSecret: string;  // 星云AppSecret
  modelscopeApiKey: string;  // 魔搭API Key
  isTestMode: boolean;       // 是否使用测试模式
}

// 密钥存储服务
class KeyStorageService {
  // 保存密钥到localStorage
  saveKeys(config: KeyConfig): void;

  // 从localStorage读取密钥
  loadKeys(): KeyConfig | null;

  // 清除密钥
  clearKeys(): void;

  // 获取测试密钥
  getTestKeys(): KeyConfig;
}
```

**测试密钥策略**:
- 提供有限额的测试密钥
- 测试模式下显示水印提示
- 限制每日调用次数

#### 1.2 连接控制系统
**功能需求**:
- 手动控制数字人的连接与断开
- 实时显示连接状态
- 连接失败自动重试机制
- 网络异常处理

**实现方案**:
```typescript
// 连接管理器
class AvatarConnectionManager {
  // 连接数字人
  async connect(config: KeyConfig): Promise<boolean>;

  // 断开连接
  async disconnect(): Promise<void>;

  // 重新连接
  async reconnect(): Promise<boolean>;

  // 获取连接状态
  getConnectionStatus(): ConnectionStatus;

  // 监听连接状态变化
  onStatusChange(callback: (status: ConnectionStatus) => void): void;
}

enum ConnectionStatus {
  IDLE = 'idle',           // 未连接
  CONNECTING = 'connecting', // 连接中
  CONNECTED = 'connected',   // 已连接
  DISCONNECTING = 'disconnecting', // 断开中
  DISCONNECTED = 'disconnected',   // 已断开
  ERROR = 'error'          // 连接错误
}
```

#### 1.3 状态控制系统
**功能需求**:
- 控制数字人状态切换
- 支持Idle/Listen/Speak/Think等状态
- 流式语音输出控制

**实现方案**:
```typescript
// 数字人状态控制器
class AvatarStateController {
  // 设置待机状态
  idle(): void;

  // 设置倾听状态
  listen(): void;

  // 设置思考状态
  think(): void;

  // 说话(流式输出)
  speak(ssml: string, isStart: boolean, isEnd: boolean): void;

  // 设置音量
  setVolume(volume: number): void;

  // 进入离线模式
  offlineMode(): void;

  // 进入在线模式
  onlineMode(): void;
}
```

### 2. 内容管理模块

#### 2.1 讲解内容库
**内容分类**:
1. **城市历史**
   - 古代历史
   - 近现代历史
   - 重要历史事件
   - 历史名人故事

2. **文化底蕴**
   - 传统文化
   - 民俗风情
   - 非遗文化
   - 文学艺术

3. **城市规划**
   - 城市发展历程
   - 现状概览
   - 未来规划蓝图
   - 重点建设项目

4. **地标建筑**
   - 历史建筑
   - 现代地标
   - 文化场馆
   - 公共设施

**内容结构设计**:
```typescript
interface ContentItem {
  id: string;
  title: string;
  category: ContentCategory;
  tags: string[];
  summary: string;          // 简要描述
  content: string;          // 详细内容
  multimedia: {             // 多媒体资源
    images?: string[];      // 图片URL
    videos?: string[];      // 视频URL
    charts?: ChartConfig[]; // 图表配置
  };
  ssmlTemplate?: string;    // SSML模板(用于数字人KA动作)
  duration?: number;        // 预计讲解时长(秒)
  relatedItems?: string[];  // 相关内容ID
}
```

#### 2.2 内容推荐系统
**功能需求**:
- 基于用户兴趣推荐内容
- 支持关联内容推荐
- 热门内容排序
- 智能讲解路径规划

**实现方案**:
```typescript
class ContentRecommendationService {
  // 获取推荐内容
  getRecommendations(context: {
    userPreferences?: string[];
    currentItem?: string;
    viewingHistory?: string[];
  }): ContentItem[];

  // 获取热门内容
  getPopularContents(limit: number): ContentItem[];

  // 规划讲解路径
  planTourPath(duration: number, categories: ContentCategory[]): ContentItem[];
}
```

#### 2.3 多媒体内容管理
**功能需求**:
- 支持图片、视频、图表等多种媒体形式
- 与数字人讲解同步展示
- 支持Widget事件触发
- 自定义媒体展示效果

**实现方案**:
```typescript
class MultimediaController {
  // 显示图片
  showImage(images: string[], options?: DisplayOptions): void;

  // 显示视频
  playVideo(videoUrl: string, options?: DisplayOptions): void;

  // 显示图表
  showChart(chartConfig: ChartConfig): void;

  // 显示幻灯片
  showSlideshow(slides: SlideConfig[]): void;

  // 清除所有展示内容
  clearAll(): void;
}
```

### 3. 交互管理模块

#### 3.1 对话交互系统
**功能需求**:
- 集成魔搭AI模型进行自然对话
- 支持语音/文本双模态输入
- 意图识别与槽位填充
- 多轮对话管理

**实现方案**:
```typescript
class ConversationService {
  // 发送消息
  async sendMessage(message: string): Promise<ConversationResponse>;

  // 开始语音输入
  startVoiceInput(): void;

  // 停止语音输入
  stopVoiceInput(): void;

  // 获取对话历史
  getConversationHistory(): ConversationMessage[];
}

interface ConversationResponse {
  text: string;              // 回复文本
  ssml?: string;             // SSML格式文本
  action?: string;           // 触发的动作
  content?: ContentItem;     // 推荐的内容
  multimedia?: MultimediaData; // 多媒体数据
}
```

#### 3.2 智能问答系统
**功能需求**:
- 基于RAG的知识检索
- 支持开放式问题
- 专业领域问答(历史、文化、规划等)
- 不确定问题的澄清机制

**实现方案**:
```typescript
class QAService {
  // 提问
  async askQuestion(question: string): Promise<QAResponse>;

  // 获取相关建议问题
  getSuggestedQuestions(context?: string): string[];

  // 搜索知识库
  searchKnowledge(query: string): Promise<KnowledgeItem[]>;
}

interface QAResponse {
  answer: string;
  confidence: number;
  sources?: KnowledgeItem[];
  followUpQuestions?: string[];
}
```

#### 3.3 触摸交互系统
**功能需求**:
- 大屏触摸按钮交互
- 内容快速选择
- 手势识别(可选)
- 导航菜单

**实现方案**:
```typescript
class TouchInteractionService {
  // 注册触摸区域
  registerTouchZone(zone: TouchZone): void;

  // 处理触摸事件
  handleTouch(event: TouchEvent): void;

  // 显示交互提示
  showInteractionHint(hint: string): void;

  // 导航到内容
  navigateToContent(contentId: string): void;
}
```

### 4. 数据可视化模块

#### 4.1 大屏数据展示
**展示内容**:
- 城市发展数据对比
- 人口变化趋势图
- 经济指标仪表盘
- 未来规划数据可视化

**技术实现**:
```typescript
// 使用ECharts/DataV创建图表
class DataVisualizationService {
  // 创建折线图
  createLineChart(config: LineChartConfig): void;

  // 创建柱状图
  createBarChart(config: BarChartConfig): void;

  // 创建地图
  createMap(config: MapConfig): void;

  // 创建仪表盘
  createGauge(config: GaugeConfig): void;

  // 更新图表数据
  updateChart(chartId: string, data: any): void;
}
```

#### 4.2 动态数据联动
**功能需求**:
- 数字人讲解与图表联动
- 讲解时高亮显示相关数据
- 支持数据动画效果

---

## 项目目录结构

```
city-exhibition-guide/
├── public/
│   ├── assets/              # 静态资源
│   │   ├── images/          # 图片
│   │   ├── videos/          # 视频
│   │   └── models/          # 3D模型等
│   └── index.html
├── src/
│   ├── api/                 # API接口层
│   │   ├── avatar.ts        # 星云SDK封装
│   │   ├── modelscope.ts    # 魔搭AI接口
│   │   └── types.ts         # API类型定义
│   ├── assets/              # 资源文件
│   │   ├── styles/          # 样式文件
│   │   └── data/            # 静态数据
│   │       └── contents/    # 讲解内容库
│   ├── components/          # 组件
│   │   ├── avatar/          # 数字人组件
│   │   │   ├── AvatarContainer.vue    # 数字人容器
│   │   │   ├── AvatarControl.vue      # 数字人控制面板
│   │   │   ├── ConnectionState.vue   # 连接状态显示
│   │   │   └── KeyInputDialog.vue     # 密钥输入对话框
│   │   ├── content/         # 内容展示组件
│   │   │   ├── ContentDisplay.vue     # 内容展示主组件
│   │   │   ├── ImageGallery.vue       # 图片画廊
│   │   │   ├── VideoPlayer.vue        # 视频播放器
│   │   │   └── ChartViewer.vue        # 图表查看器
│   │   ├── interaction/     # 交互组件
│   │   │   ├── ChatBox.vue           # 对话框
│   │   │   ├── VoiceInput.vue        # 语音输入
│   │   │   ├── TouchMenu.vue         # 触摸菜单
│   │   │   └── QuickActions.vue      # 快捷操作
│   │   ├── visualization/ # 可视化组件
│   │   │   ├── DataDashboard.vue     # 数据仪表盘
│   │   │   ├── CityMap.vue           # 城市地图
│   │   │   └── Timeline.vue          # 时间轴
│   │   └── common/          # 通用组件
│   │       ├── Loading.vue
│   │       ├── Error.vue
│   │       └── Empty.vue
│   ├── composables/         # 组合式函数
│   │   ├── useAvatar.ts     # 数字人相关逻辑
│   │   ├── useAI.ts         # AI模型相关逻辑
│   │   ├── useContent.ts    # 内容管理逻辑
│   │   └── useKeyStorage.ts # 密钥存储逻辑
│   ├── router/              # 路由
│   │   └── index.ts
│   ├── stores/              # Pinia状态管理
│   │   ├── avatar.ts        # 数字人状态
│   │   ├── content.ts       # 内容状态
│   │   ├── config.ts        # 配置状态
│   │   └── conversation.ts  # 对话状态
│   ├── services/            # 业务服务层
│   │   ├── AvatarService.ts        # 数字人服务
│   │   ├── AIConversationService.ts # AI对话服务
│   │   ├── ContentService.ts       # 内容服务
│   │   ├── KeyStorageService.ts    # 密钥存储服务
│   │   ├── MultimediaService.ts    # 多媒体服务
│   │   └── DataService.ts          # 数据服务
│   ├── utils/               # 工具函数
│   │   ├── logger.ts        # 日志工具
│   │   ├── validator.ts     # 验证工具
│   │   ├── formatter.ts     # 格式化工具
│   │   └── constants.ts     # 常量定义
│   ├── views/               # 页面视图
│   │   ├── Home.vue         # 主页(大屏展示)
│   │   ├── Settings.vue     # 设置页
│   │   └── Debug.vue        # 调试页
│   ├── App.vue
│   └── main.ts
├── tests/                   # 测试文件
│   ├── unit/                # 单元测试
│   └── e2e/                 # 端到端测试
├── .env.example             # 环境变量示例
├── .env.development
├── .env.production
├── .gitignore
├── README.md                # 项目说明文档
├── claude.md                # 本开发文档
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## 开发计划

### Phase 1: 基础架构搭建 (第1-2天)
- [ ] 初始化Vue 3项目
- [ ] 配置TypeScript和Vite
- [ ] 搭建基础目录结构
- [ ] 安装依赖包
- [ ] 配置路由和状态管理

### Phase 2: 密钥管理系统 (第2-3天)
- [ ] 实现KeyStorageService
- [ ] 创建密钥输入界面
- [ ] 实现localStorage存储
- [ ] 添加测试密钥功能
- [ ] 密钥验证逻辑

### Phase 3: 星云SDK集成 (第3-5天)
- [ ] 引入星云SDK
- [ ] 创建AvatarService封装
- [ ] 实现连接管理器
- [ ] 实现状态控制器
- [ ] 添加连接UI组件
- [ ] 实现手动连接/断开功能

### Phase 4: 魔搭AI集成 (第5-6天)
- [ ] 研究魔搭API文档
- [ ] 创建AIConversationService
- [ ] 实现流式对话
- [ ] 添加错误处理
- [ ] 实现对话UI组件

### Phase 5: 内容管理系统 (第6-8天)
- [ ] 设计内容数据结构
- [ ] 创建示例内容库
- [ ] 实现ContentService
- [ ] 创建内容展示组件
- [ ] 实现内容推荐算法
- [ ] 添加多媒体支持

### Phase 6: 大屏可视化 (第8-10天)
- [ ] 集成ECharts
- [ ] 创建数据可视化组件
- [ ] 实现图表动态更新
- [ ] 添加与数字人的联动
- [ ] 优化大屏布局

### Phase 7: 交互系统 (第10-12天)
- [ ] 实现触摸交互
- [ ] 创建对话界面
- [ ] 实现问答系统
- [ ] 优化交互体验

### Phase 8: 测试与优化 (第12-14天)
- [ ] 功能测试
- [ ] 性能优化
- [ ] 兼容性测试
- [ ] 用户体验优化
- [ ] 代码重构

---

## 关键技术实现细节

### 1. 星云SDK集成示例

```typescript
// src/api/avatar.ts
import XmovAvatar from 'xmovAvatar';

export class AvatarService {
  private sdk: any = null;
  private config: KeyConfig;

  constructor(config: KeyConfig) {
    this.config = config;
  }

  async init(containerId: string): Promise<void> {
    this.sdk = new XmovAvatar({
      containerId: `#${containerId}`,
      appId: this.config.xingyunAppId,
      appSecret: this.config.xingyunAppSecret,
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',
      onMessage: (message: any) => {
        console.log('SDK Message:', message);
      },
      onStateChange: (state: string) => {
        console.log('State Change:', state);
      },
      onVoiceStateChange: (status: string) => {
        console.log('Voice State:', status);
      },
      enableLogger: process.env.NODE_ENV === 'development'
    });

    await this.sdk.init({
      onDownloadProgress: (progress: number) => {
        console.log(`Loading progress: ${progress}%`);
      }
    });
  }

  speak(text: string, isStart: boolean = false, isEnd: boolean = false): void {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    this.sdk.speak(text, isStart, isEnd);
  }

  setState(state: 'idle' | 'listen' | 'think' | 'interactive_idle'): void {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    this.sdk[state]();
  }

  destroy(): void {
    if (this.sdk) {
      this.sdk.destroy();
      this.sdk = null;
    }
  }
}
```

### 2. 魔搭AI集成示例

```typescript
// src/api/modelscope.ts
import type { ChatMessage } from '@/types';

export class ModelScopeService {
  private apiKey: string;
  private baseURL = 'https://api.modelscope.cn/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatStream(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen-plus', // 或其他模型
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}
```

### 3. 密钥存储服务实现

```typescript
// src/services/KeyStorageService.ts
export interface KeyConfig {
  xingyunAppId: string;
  xingyunAppSecret: string;
  modelscopeApiKey: string;
  isTestMode: boolean;
}

const STORAGE_KEY = 'city_exhibition_keys';
const TEST_KEYS: KeyConfig = {
  xingyunAppId: 'test_app_id',        // 替换为实际测试AppId
  xingyunAppSecret: 'test_secret',     // 替换为实际测试Secret
  modelscopeApiKey: 'test_api_key',    // 替换为实际测试API Key
  isTestMode: true
};

export class KeyStorageService {
  static saveKeys(config: KeyConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save keys:', error);
      throw new Error('无法保存密钥配置');
    }
  }

  static loadKeys(): KeyConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
    return null;
  }

  static clearKeys(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getTestKeys(): KeyConfig {
    return { ...TEST_KEYS };
  }

  static validateKeys(config: KeyConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.xingyunAppId || config.xingyunAppId.trim() === '') {
      errors.push('星云AppId不能为空');
    }

    if (!config.xingyunAppSecret || config.xingyunAppSecret.trim() === '') {
      errors.push('星云AppSecret不能为空');
    }

    if (!config.modelscopeApiKey || config.modelscopeApiKey.trim() === '') {
      errors.push('魔搭API Key不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 4. 连接管理器实现

```typescript
// src/services/AvatarConnectionManager.ts
import { AvatarService } from '@/api/avatar';
import type { KeyConfig } from './KeyStorageService';

export enum ConnectionStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

type StatusCallback = (status: ConnectionStatus) => void;

export class AvatarConnectionManager {
  private avatarService: AvatarService | null = null;
  private currentStatus: ConnectionStatus = ConnectionStatus.IDLE;
  private statusCallbacks: StatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect(config: KeyConfig, containerId: string): Promise<boolean> {
    this.setStatus(ConnectionStatus.CONNECTING);

    try {
      this.avatarService = new AvatarService(config);
      await this.avatarService.init(containerId);

      this.setStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.setStatus(ConnectionStatus.ERROR);

      // 自动重试
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await this.delay(2000 * this.reconnectAttempts);
        return this.connect(config, containerId);
      }

      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.avatarService) {
      return;
    }

    this.setStatus(ConnectionStatus.DISCONNECTING);

    try {
      this.avatarService.destroy();
      this.avatarService = null;
      this.setStatus(ConnectionStatus.DISCONNECTED);
    } catch (error) {
      console.error('Disconnect failed:', error);
      this.setStatus(ConnectionStatus.ERROR);
    }
  }

  async reconnect(): Promise<boolean> {
    const config = KeyStorageService.loadKeys();
    if (!config) {
      return false;
    }

    await this.disconnect();
    await this.delay(1000);
    return this.connect(config, 'avatar-container');
  }

  getConnectionStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  onStatusChange(callback: StatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  getAvatarService(): AvatarService | null {
    return this.avatarService;
  }

  private setStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusCallbacks.forEach(callback => callback(status));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 大屏布局设计

### 布局方案
```
┌─────────────────────────────────────────────────────────────┐
│                      城市展厅智能讲解系统                      │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│               │          内容展示区域                         │
│   数字人区域   │      (图片/视频/图表)                        │
│               │                                             │
│   3D Avatar   │                                             │
│               │                                             │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│                       对话交互区域                           │
├─────────────────────────────────────────────────────────────┤
│              快捷操作 [历史] [文化] [规划] [建筑]             │
└─────────────────────────────────────────────────────────────┘
```

### 响应式设计
- **1920x1080** (标准大屏)
- **2560x1440** (2K大屏)
- **3840x2160** (4K大屏)

---

## 内容库示例

### 城市历史内容示例
```json
{
  "id": "history_001",
  "title": "古城千年史",
  "category": "history",
  "tags": ["古代", "历史", "文化"],
  "summary": "探索这座城市从古至今的发展历程",
  "content": "这座城市始建于两千多年前，历经多个朝代的更迭...",
  "multimedia": {
    "images": [
      "/assets/images/history/ancient_city.jpg",
      "/assets/images/history/historical_site.jpg"
    ],
    "charts": [
      {
        "type": "timeline",
        "data": "历史时间轴数据"
      }
    ]
  },
  "ssmlTemplate": "<speak><ue4event><type>ka_intent</type><data><ka_intent>StoryTelling</ka_intent></data></ue4event>{content}</speak>",
  "duration": 180
}
```

---

## 测试策略

### 单元测试
- 密钥管理功能测试
- API接口Mock测试
- 业务逻辑测试

### 集成测试
- 星云SDK集成测试
- 魔搭AI集成测试
- 端到端流程测试

### 性能测试
- 大屏渲染性能
- AI响应速度
- 内存使用情况

---

## 部署方案

### 开发环境
```bash
npm install
npm run dev
```

### 生产构建
```bash
npm run build
```

### 静态部署
- 支持GitHub Pages
- 支持Vercel/Netlify
- 支持Nginx静态托管

---

## 风险与应对

### 技术风险
1. **星云SDK稳定性**
   - 应对: 实现完善的错误处理和重连机制

2. **AI模型响应延迟**
   - 应对: 添加加载动画和流式输出

3. **浏览器兼容性**
   - 应对: 使用Web标准API,提供降级方案

### 内容风险
1. **内容版权问题**
   - 应对: 使用原创内容或开源授权内容

2. **内容准确性**
   - 应对: 建立内容审核机制

---

## 后续优化方向

### 短期优化
1. 添加更多互动小游戏
2. 支持多语言讲解
3. 添加用户行为分析

### 长期规划
1. 接入更多AI模型能力
2. 支持AR/VR扩展
3. 建立云端内容管理平台
4. 开发移动端伴侣应用

---

## 参考资源

### 官方文档
- [魔珐星云官网](https://xingyun3d.com)
- [星云SDK文档](https://xingyun3d.com/developers/52-183)
- [魔搭社区](https://modelscope.cn)

### 技术社区
- Vue 3官方文档
- ECharts文档
- TypeScript官方文档

---

## 附录

### A. 环境变量配置 (.env.example)
```env
# 星云配置
VITE_XINGYUN_APP_ID=your_app_id
VITE_XINGYUN_APP_SECRET=your_app_secret
VITE_XINGYUN_GATEWAY=https://nebula-agent.xingyun3d.com/user/v1/ttsa/session

# 魔搭AI配置
VITE_MODELSCOPE_API_KEY=your_api_key
VITE_MODELSCOPE_BASE_URL=https://api.modelscope.cn/v1

# 应用配置
VITE_APP_TITLE=城市展厅智能讲解系统
VITE_APP_VERSION=1.0.0

# 开发模式
VITE_DEV_MODE=true
```

### B. package.json依赖
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "echarts": "^5.5.0",
    "element-plus": "^2.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-01-05
**作者**: Nie Tao
