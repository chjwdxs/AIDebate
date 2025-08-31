class DebateEngine {
  constructor(debateId, topic, config, io) {
    this.debateId = debateId;
    this.topic = topic;
    this.config = config;
    this.io = io;
    
    this.state = 'idle'; // idle, running, paused, finished
    this.currentTurn = 'positive';
    this.turnCount = 0;
    this.maxTurns = config.maxTurns || 6; // 默认3轮辩论(正反方各3次)
    this.messages = [];
    
    // 初始化AI代理管理器
    this.agentManager = new (require('./AIAgentManager'))(config);
  }
  
  // 开始辩论
  async startDebate() {
    if (this.state !== 'idle') return;
    
    this.state = 'running';
    this.emitState();
    
    // 发送辩论开始消息
    const startMessage = {
      id: this.generateId(),
      role: 'system',
      content: `辩论开始！主题：${this.topic}`,
      timestamp: new Date().toISOString()
    };
    
    this.addMessage(startMessage);
    
    // 开始第一轮
    await this.processNextTurn();
  }
  
  // 暂停辩论
  pauseDebate() {
    if (this.state === 'running') {
      this.state = 'paused';
      this.emitState();
    }
  }
  
  // 继续辩论
  resumeDebate() {
    if (this.state === 'paused') {
      this.state = 'running';
      this.emitState();
      // 继续下一轮
      this.processNextTurn();
    }
  }
  
  // 重置辩论
  resetDebate() {
    this.state = 'idle';
    this.currentTurn = 'positive';
    this.turnCount = 0;
    this.messages = [];
    this.emitState();
  }
  
  // 处理下一轮发言
  async processNextTurn() {
    // 检查是否应该暂停或结束
    if (this.state !== 'running') return;
    
    // 检查是否达到最大轮数
    if (this.turnCount >= this.maxTurns) {
      await this.endDebate();
      return;
    }
    
    // 增加轮次计数
    this.turnCount++;
    
    try {
      // 获取当前发言人角色
      const role = this.currentTurn;
      
      // 构造提示词上下文
      const context = this.buildContext(role);
      
      // 调用AI代理
      const response = await this.agentManager.callAgent(role, context);
      
      // 创建消息对象
      const message = {
        id: this.generateId(),
        role: role,
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          model: response.model,
          tokens: response.tokens,
          duration: response.duration
        }
      };
      
      // 添加消息到记录
      this.addMessage(message);
      
      // 切换发言角色
      this.currentTurn = this.currentTurn === 'positive' ? 'negative' : 'positive';
      
      // 发送状态更新
      this.emitState();
      
      // 继续下一轮（使用setTimeout避免阻塞）
      setTimeout(() => this.processNextTurn(), 1000);
    } catch (error) {
      console.error('处理辩论轮次时出错:', error);
      this.emitError('处理辩论发言时出错: ' + error.message);
    }
  }
  
  // 结束辩论并请求裁判评判
  async endDebate() {
    this.state = 'finished';
    
    // 发送辩论结束消息
    const endMessage = {
      id: this.generateId(),
      role: 'system',
      content: '辩论结束，正在等待裁判评判...',
      timestamp: new Date().toISOString()
    };
    
    this.addMessage(endMessage);
    this.emitState();
    
    try {
      // 请求裁判评判
      const context = this.buildJudgeContext();
      const response = await this.agentManager.callAgent('judge', context);
      
      // 创建裁判消息
      const judgeMessage = {
        id: this.generateId(),
        role: 'judge',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          model: response.model,
          tokens: response.tokens,
          duration: response.duration
        }
      };
      
      this.addMessage(judgeMessage);
      
      // 发送辩论完成事件
      this.io.to(this.debateId).emit('debate:complete', {
        winner: 'undecided', // 由前端解析裁判内容确定获胜方
        summary: response.content
      });
      
      this.emitState();
    } catch (error) {
      console.error('裁判评判时出错:', error);
      this.emitError('裁判评判时出错: ' + error.message);
    }
  }
  
  // 构造AI上下文
  buildContext(role) {
    const systemPrompt = this.getSystemPrompt(role);
    
    // 添加历史消息作为上下文，但限制数量避免过长
    const recentMessages = this.messages.slice(-6); // 最近3轮对话
    
    return {
      system: systemPrompt,
      topic: this.topic,
      messages: recentMessages
    };
  }
  
  // 构造裁判上下文
  buildJudgeContext() {
    const systemPrompt = this.getSystemPrompt('judge');
    
    // 为裁判提供完整的消息历史
    return {
      system: systemPrompt,
      topic: this.topic,
      messages: this.messages
    };
  }
  
  // 获取系统提示词
  getSystemPrompt(role) {
    const prompts = {
      positive: `你是一名专业的正方辩手，你的任务是：
1. 明确表明你的正方立场
2. 提供有力的论据支持你的观点
3. 针对反方的论点进行反驳
4. 保持逻辑清晰和论证有力
5. 语言风格：理性、专业、有说服力

辩论规则：
- 每次发言控制在200字以内
- 必须围绕辩论主题进行论述
- 可以引用事实、数据、案例等支持观点
- 保持礼貌和专业的辩论风格

当前辩论主题：${this.topic}`,
      
      negative: `你是一名专业的反方辩手，你的任务是：
1. 明确表明你的反方立场
2. 找出正方观点的漏洞和问题
3. 提出反驳论据和对立观点
4. 质疑正方的逻辑和证据
5. 语言风格：批判性思维、逻辑严密

辩论规则：
- 每次发言控制在200字以内
- 必须针对正方观点进行有效反驳
- 可以提出反例和对立证据
- 保持建设性的批判态度

当前辩论主题：${this.topic}`,
      
      judge: `你是一名公正的辩论裁判，你的任务是：
1. 客观评价双方的论证质量
2. 分析论据的说服力和逻辑性
3. 评估论证的完整性和深度
4. 保持中立和公正的立场
5. 给出最终的评判结果

评判标准：
- 论据的真实性和可信度
- 逻辑推理的严密性
- 反驳的有效性
- 表达的清晰度
- 整体论证的说服力

请总结双方观点并给出你的评判结果。

当前辩论主题：${this.topic}`
    };
    
    return prompts[role] || '';
  }
  
  // 添加消息到记录
  addMessage(message) {
    this.messages.push(message);
    this.io.to(this.debateId).emit('debate:message', message);
  }
  
  // 发送状态更新
  emitState() {
    this.io.to(this.debateId).emit('debate:state', {
      status: this.state,
      currentTurn: this.currentTurn,
      turnCount: this.turnCount,
      maxTurns: this.maxTurns
    });
  }
  
  // 发送错误信息
  emitError(message) {
    this.io.to(this.debateId).emit('debate:error', {
      message: message,
      timestamp: new Date().toISOString()
    });
  }
  
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // 获取当前状态
  getState() {
    return {
      debateId: this.debateId,
      topic: this.topic,
      state: this.state,
      currentTurn: this.currentTurn,
      turnCount: this.turnCount,
      maxTurns: this.maxTurns,
      messages: [...this.messages]
    };
  }
}

module.exports = DebateEngine;