const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 根据环境加载不同的配置文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 配置CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "*",
  methods: ["GET", "POST"],
  credentials: true
};

// 配置Socket.IO
const io = socketIo(server, {
  cors: corsOptions
});

// 中间件
app.use(cors(corsOptions));
app.use(express.json());
// 在生产环境中，前端静态文件应该在构建后放在dist或public目录下
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // 处理前端路由
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
} else {
  // 开发环境中提供前端静态文件
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// 路由
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI辩论平台后端服务运行中',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 导入并使用路由
const debateRoutes = require('./routes/debate');
app.use('/api/debate', debateRoutes);

// 存储活动的辩论会话
const activeDebates = new Map();

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 加入辩论房间
  socket.on('join-debate', (debateId) => {
    socket.join(debateId);
    console.log(`用户 ${socket.id} 加入辩论房间 ${debateId}`);
  });

  // 开始辩论
  socket.on('debate:start', async (data) => {
    const { debateId, topic, config } = data;
    
    // 创建新的辩论引擎实例
    const DebateEngine = require('./services/DebateEngine');
    const debate = new DebateEngine(debateId, topic, config, io);
    
    // 存储辩论实例
    activeDebates.set(debateId, debate);
    
    // 开始辩论
    await debate.startDebate();
  });

  // 暂停辩论
  socket.on('debate:pause', (data) => {
    const { debateId } = data;
    const debate = activeDebates.get(debateId);
    if (debate) {
      debate.pauseDebate();
    }
  });

  // 继续辩论
  socket.on('debate:resume', (data) => {
    const { debateId } = data;
    const debate = activeDebates.get(debateId);
    if (debate) {
      debate.resumeDebate();
    }
  });

  // 重置辩论
  socket.on('debate:reset', (data) => {
    const { debateId } = data;
    const debate = activeDebates.get(debateId);
    if (debate) {
      debate.resetDebate();
      activeDebates.delete(debateId);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message 
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口未找到' });
});

// 启动服务器
// 获取端口，云平台通常会通过环境变量提供
const PORT = process.env.PORT || 3000;

// 启动服务器
server.listen(PORT, () => {
  console.log(`AI辩论平台服务器运行在端口 ${PORT}`);
  console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io, activeDebates };