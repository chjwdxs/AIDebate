const OpenAI = require('openai');

class OpenAIClient {
  constructor(config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
    this.model = config.name || 'gpt-3.5-turbo';
  }
  
  // 更新配置
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.model = config.name || this.model;
    
    // 重新初始化客户端
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl
    });
  }
  
  // 聊天完成
  async chatCompletion(messages, options = {}) {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300,
        ...options
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: response.choices[0].message.content,
        model: this.model,
        tokens: response.usage?.total_tokens || 0,
        duration: duration
      };
    } catch (error) {
      console.error('OpenAI API调用错误:', error);
      throw error;
    }
  }
  
  // 流式聊天完成
  async streamCompletion(messages, onChunk, options = {}) {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 300,
        stream: true,
        ...options
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error('OpenAI API流式调用错误:', error);
      throw error;
    }
  }
}

module.exports = OpenAIClient;