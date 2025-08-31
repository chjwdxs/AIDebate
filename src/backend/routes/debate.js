const express = require('express');
const router = express.Router();

// 获取辩论配置模板
router.get('/config-template', (req, res) => {
  const template = {
    models: {
      positive: {
        name: 'gpt-3.5-turbo',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1'
      },
      negative: {
        name: 'gpt-3.5-turbo',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1'
      },
      judge: {
        name: 'gpt-4',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1'
      }
    },
    maxTurns: 6
  };
  
  res.json(template);
});

// 验证配置
router.post('/validate-config', (req, res) => {
  const { config } = req.body;
  
  if (!config || !config.models) {
    return res.status(400).json({ 
      valid: false, 
      errors: ['配置不能为空'] 
    });
  }
  
  const errors = [];
  
  // 验证每个角色的配置
  ['positive', 'negative', 'judge'].forEach(role => {
    const modelConfig = config.models[role];
    if (!modelConfig) {
      errors.push(`${role} 角色配置缺失`);
      return;
    }
    
    if (!modelConfig.name) {
      errors.push(`${role} 角色模型名称不能为空`);
    }
    
    if (!modelConfig.apiKey) {
      errors.push(`${role} 角色API密钥不能为空`);
    }
    
    if (!modelConfig.baseUrl) {
      errors.push(`${role} 角色API地址不能为空`);
    }
  });
  
  if (config.maxTurns && (config.maxTurns < 2 || config.maxTurns > 20)) {
    errors.push('最大轮次数必须在2-20之间');
  }
  
  res.json({
    valid: errors.length === 0,
    errors: errors
  });
});

module.exports = router;