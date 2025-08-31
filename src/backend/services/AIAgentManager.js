const OpenAIClient = require('./OpenAIClient');

class AIAgentManager {
  constructor(config) {
    this.config = config;
    this.agents = {
      positive: null,
      negative: null,
      judge: null
    };
    
    // 初始化代理
    this.initializeAgents();
  }
  
  // 初始化AI代理
  initializeAgents() {
    // 为每个角色创建OpenAI客户端
    Object.keys(this.config.models).forEach(role => {
      const modelConfig = this.config.models[role];
      if (modelConfig && modelConfig.apiKey && modelConfig.baseUrl) {
        this.agents[role] = new OpenAIClient(modelConfig);
      }
    });
  }
  
  // 更新代理配置
  updateAgent(role, config) {
    if (this.agents[role]) {
      this.agents[role].updateConfig(config);
    } else {
      this.agents[role] = new OpenAIClient(config);
    }
  }
  
  // 调用指定角色的AI代理
  async callAgent(role, context) {
    const agent = this.agents[role];
    
    if (!agent) {
      throw new Error(`未配置 ${role} 角色的AI代理`);
    }
    
    // 构造提示消息
    const messages = [
      {
        role: 'system',
        content: context.system
      }
    ];
    
    // 添加历史对话上下文
    context.messages.forEach(msg => {
      // 只添加用户和助手的消息，跳过系统消息
      if (msg.role !== 'system') {
        messages.push({
          role: this.mapRole(msg.role),
          content: msg.content
        });
      }
    });
    
    // 添加当前轮次的提示
    messages.push({
      role: 'user',
      content: `请就辩论主题"${context.topic}"发表你的观点。`
    });
    
    try {
      // 调用AI
      const response = await agent.chatCompletion(messages);
      return response;
    } catch (error) {
      console.error(`${role} 角色AI调用失败:`, error);
      throw new Error(`AI调用失败: ${error.message}`);
    }
  }
  
  // 映射角色到OpenAI角色
  mapRole(role) {
    const roleMap = {
      'positive': 'user',
      'negative': 'user',
      'judge': 'user',
      'system': 'system'
    };
    
    return roleMap[role] || 'user';
  }
  
  // 获取代理状态
  getAgentStatus() {
    const status = {};
    Object.keys(this.agents).forEach(role => {
      status[role] = this.agents[role] ? 'active' : 'inactive';
    });
    return status;
  }
}

module.exports = AIAgentManager;