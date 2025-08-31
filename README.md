# AI辩论平台

AI辩论平台是一个基于Web的应用程序，允许用户创建辩论主题，并观看两个AI模型进行正反方辩论。

## 功能特点

- 支持正反方AI辩论，角色明确
- 兼容OpenAI API的多模型配置
- 实时辩论进程控制（暂停/继续）
- 用户友好的辩论观看界面
- 灵活的模型配置（正方、反方、裁判）

## 技术栈

- **前端**: 原生HTML5 + CSS3 + JavaScript (ES6+)
- **后端**: Node.js + Express
- **AI集成**: OpenAI兼容API
- **实时通信**: WebSocket (Socket.io)
- **数据存储**: 内存存储 + 可选文件持久化

## 项目结构

```
ai-debate-platform/
├── src/
│   ├── frontend/           # 前端代码
│   │   ├── index.html      # 主页面
│   │   ├── styles.css      # 样式文件
│   │   └── app.js          # 前端JavaScript逻辑
│   └── backend/            # 后端代码
│       ├── server.js       # 服务器入口文件
│       ├── controllers/    # 控制器
│       ├── models/         # 数据模型
│       ├── services/       # 服务层
│       ├── routes/         # 路由
│       └── utils/          # 工具函数
├── package.json            # 项目配置和依赖
└── README.md               # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js >= 14.x
- npm 或 yarn

### 安装步骤

1. 克隆项目代码:
   ```
   git clone <项目地址>
   cd ai-debate-platform
   ```

2. 安装依赖:
   ```
   npm run setup
   # 或
   npm install
   ```

3. 配置环境变量:
   ```
   cp .env.example .env
   # 编辑 .env 文件，添加你的API密钥
   ```

4. 启动服务:
   ```
   npm start
   # 或开发模式
   npm run dev
   ```

5. 访问应用:
   在浏览器中打开 `http://localhost:3000`

## 使用说明

1. 配置AI模型:
   - 在页面左侧配置面板中设置正方、反方和裁判AI模型
   - 输入API密钥和API地址
   - 设置辩论主题和最大轮数

2. 开始辩论:
   - 点击"开始辩论"按钮启动辩论
   - 观看AI模型之间的实时辩论

3. 控制辩论:
   - 使用暂停/继续按钮控制辩论进程
   - 点击重置按钮重新开始

## 配置说明

### 支持的AI服务

平台支持任何兼容OpenAI API的AI服务，包括但不限于:
- OpenAI
- Azure OpenAI
- Anthropic Claude (通过兼容层)
- Google Gemini (通过兼容层)
- 本地部署的大模型 (如LLaMA.cpp)

### 环境变量

- `PORT`: 服务器端口，默认3000
- `LOG_LEVEL`: 日志级别 (error, warn, info, debug)
- `DEBUG`: 是否启用详细日志

## 开发指南

### 项目架构

#### 前端架构
- 使用原生JavaScript实现，无框架依赖
- 模块化设计，易于维护和扩展
- 响应式布局，适配不同设备

#### 后端架构
- 基于Express.js的RESTful API
- WebSocket实现实时通信
- 模块化服务设计

### API接口

#### 获取配置模板
```
GET /api/debate/config-template
```

#### 验证配置
```
POST /api/debate/validate-config
```

### WebSocket事件

#### 客户端到服务器
- `join-debate`: 加入辩论房间
- `debate:start`: 开始辩论
- `debate:pause`: 暂停辩论
- `debate:resume`: 继续辩论
- `debate:reset`: 重置辩论

#### 服务器到客户端
- `debate:message`: 辩论消息
- `debate:state`: 辩论状态更新
- `debate:error`: 错误信息
- `debate:complete`: 辩论完成

## 部署

### 本地部署
```
npm start
```

### 生产环境部署
```
npm run start:prod
```

### Docker部署
```
# 构建镜像
docker build -t ai-debate-platform .

# 运行容器
docker run -p 3000:3000 ai-debate-platform
```

### Heroku部署
1. 注册Heroku账号并安装Heroku CLI
2. 登录Heroku:
   ```
   heroku login
   ```
3. 创建应用:
   ```
   heroku create your-app-name
   ```
4. 设置环境变量:
   ```
   heroku config:set NODE_ENV=production
   ```
5. 部署应用:
   ```
   git push heroku main
   ```

### 其他云平台部署
大多数云平台都支持Node.js应用部署，通常需要:
1. 连接Git仓库并设置自动部署
2. 配置环境变量
3. 设置域名和SSL证书（如果需要）

## 安全说明

1. API密钥存储:
   - 前端使用浏览器本地存储加密保存
   - 后端不持久化存储用户密钥

2. 输入验证:
   - 前后端双重验证
   - 防止XSS和注入攻击

3. 访问控制:
   - CORS策略限制
   - 房间隔离确保数据安全

## 故障排除

### 常见问题

1. 无法连接到AI服务:
   - 检查API密钥是否正确
   - 验证API地址是否可达
   - 确认网络连接正常

2. 辩论无法开始:
   - 确保已配置所有必要参数
   - 检查WebSocket连接状态
   - 查看控制台错误日志

### 日志查看
```
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

本项目采用MIT许可证，详情请见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请提交Issue或通过以下方式联系:
- 邮箱: [你的邮箱]
- 微信: [你的微信]