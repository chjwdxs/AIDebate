// 应用状态管理
const AppState = {
    debate: {
        topic: '',
        status: 'idle', // idle, running, paused, finished
        messages: [],
        currentTurn: 'positive',
        turnCount: 0,
        maxTurns: 6
    },
    config: {
        models: {
            positive: { name: '', apiKey: '', baseUrl: '' },
            negative: { name: '', apiKey: '', baseUrl: '' },
            judge: { name: '', apiKey: '', baseUrl: '' }
        },
        maxTurns: 6
    },
    ui: {
        isConfigVisible: true,
        isLoading: false
    },
    connection: {
        connected: false,
        socket: null
    }
};

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 当前辩论ID
const currentDebateId = generateId();

// DOM元素引用
const elements = {
    configPanel: document.getElementById('configPanel'),
    configForm: document.getElementById('configForm'),
    configToggle: document.getElementById('configToggle'),
    messagesContainer: document.getElementById('messagesContainer'),
    currentTopic: document.getElementById('currentTopic'),
    startButton: document.getElementById('startButton'),
    pauseButton: document.getElementById('pauseButton'),
    resumeButton: document.getElementById('resumeButton'),
    resetButton: document.getElementById('resetButton'),
    debateStatus: document.getElementById('debateStatus'),
    currentTurn: document.getElementById('currentTurn'),
    currentSpeaker: document.getElementById('currentSpeaker'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    connectionStatus: document.getElementById('connectionStatus'),
    systemMessage: document.getElementById('systemMessage'),
    positiveModelInfo: document.getElementById('positiveModelInfo'),
    negativeModelInfo: document.getElementById('negativeModelInfo'),
    judgeModelInfo: document.getElementById('judgeModelInfo')
};

// 初始化应用
function initApp() {
    console.log('初始化AI辩论平台...');
    
    // 初始化WebSocket连接
    initWebSocket();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 尝试从本地存储加载配置
    loadConfigFromStorage();
    
    // 更新UI
    updateUI();
}

// 初始化WebSocket连接
function initWebSocket() {
    const socket = io();
    
    socket.on('connect', () => {
        console.log('已连接到服务器');
        AppState.connection.connected = true;
        updateConnectionStatus('🟢 已连接');
        
        // 加入辩论房间
        socket.emit('join-debate', currentDebateId);
    });
    
    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
        AppState.connection.connected = false;
        updateConnectionStatus('🔴 已断开');
    });
    
    // 接收辩论消息
    socket.on('debate:message', (message) => {
        addMessageToUI(message);
        AppState.debate.messages.push(message);
    });
    
    // 接收辩论状态更新
    socket.on('debate:state', (state) => {
        AppState.debate.status = state.status;
        AppState.debate.currentTurn = state.currentTurn;
        AppState.debate.turnCount = state.turnCount;
        AppState.debate.maxTurns = state.maxTurns;
        updateUI();
    });
    
    // 接收辩论完成事件
    socket.on('debate:complete', (result) => {
        showSystemMessage('辩论已完成，裁判已给出评判结果');
    });
    
    // 接收错误信息
    socket.on('debate:error', (error) => {
        showSystemMessage('错误: ' + error.message, 'error');
    });
    
    AppState.connection.socket = socket;
}

// 绑定事件监听器
function bindEventListeners() {
    // 配置表单提交
    elements.configForm.addEventListener('submit', handleConfigSubmit);
    
    // 配置面板切换
    elements.configToggle.addEventListener('click', toggleConfigPanel);
    
    // 控制按钮
    elements.startButton.addEventListener('click', startDebate);
    elements.pauseButton.addEventListener('click', pauseDebate);
    elements.resumeButton.addEventListener('click', resumeDebate);
    elements.resetButton.addEventListener('click', resetDebate);
}

// 处理配置表单提交
function handleConfigSubmit(e) {
    e.preventDefault();
    
    // 收集表单数据
    const formData = new FormData(elements.configForm);
    
    AppState.config = {
        models: {
            positive: {
                name: formData.get('positiveModel'),
                apiKey: formData.get('positiveApiKey'),
                baseUrl: formData.get('positiveBaseUrl')
            },
            negative: {
                name: formData.get('negativeModel'),
                apiKey: formData.get('negativeApiKey'),
                baseUrl: formData.get('negativeBaseUrl')
            },
            judge: {
                name: formData.get('judgeModel'),
                apiKey: formData.get('judgeApiKey'),
                baseUrl: formData.get('judgeBaseUrl')
            }
        },
        maxTurns: parseInt(formData.get('maxTurns'))
    };
    
    AppState.debate.topic = formData.get('debateTopic');
    AppState.debate.maxTurns = AppState.config.maxTurns;
    
    // 保存到本地存储
    saveConfigToStorage();
    
    // 更新UI
    updateUI();
    
    showSystemMessage('配置已保存');
}

// 切换配置面板显示状态
function toggleConfigPanel() {
    AppState.ui.isConfigVisible = !AppState.ui.isConfigVisible;
    elements.configPanel.classList.toggle('hidden', !AppState.ui.isConfigVisible);
    elements.configToggle.textContent = AppState.ui.isConfigVisible ? '隐藏配置' : '显示配置';
}

// 开始辩论
function startDebate() {
    if (!AppState.connection.connected) {
        showSystemMessage('未连接到服务器，请检查网络连接', 'error');
        return;
    }
    
    if (!AppState.debate.topic) {
        showSystemMessage('请先设置辩论主题', 'error');
        return;
    }
    
    // 检查是否配置了所有模型
    const models = AppState.config.models;
    if (!models.positive.apiKey || !models.negative.apiKey || !models.judge.apiKey) {
        showSystemMessage('请配置所有AI模型的API密钥', 'error');
        return;
    }
    
    // 发送开始辩论请求
    AppState.connection.socket.emit('debate:start', {
        debateId: currentDebateId,
        topic: AppState.debate.topic,
        config: AppState.config
    });
    
    showSystemMessage('正在开始辩论...');
}

// 暂停辩论
function pauseDebate() {
    AppState.connection.socket.emit('debate:pause', {
        debateId: currentDebateId
    });
    
    showSystemMessage('辩论已暂停');
}

// 继续辩论
function resumeDebate() {
    AppState.connection.socket.emit('debate:resume', {
        debateId: currentDebateId
    });
    
    showSystemMessage('辩论已继续');
}

// 重置辩论
function resetDebate() {
    AppState.connection.socket.emit('debate:reset', {
        debateId: currentDebateId
    });
    
    // 重置本地状态
    AppState.debate.status = 'idle';
    AppState.debate.messages = [];
    AppState.debate.currentTurn = 'positive';
    AppState.debate.turnCount = 0;
    
    // 清空消息容器
    elements.messagesContainer.innerHTML = '<div class="messages-placeholder"><p>欢迎使用AI辩论平台！</p><p>请在左侧配置面板设置模型参数和辩论主题，然后开始辩论。</p></div>';
    
    updateUI();
    showSystemMessage('辩论已重置');
}

// 添加消息到UI
function addMessageToUI(message) {
    // 移除占位符（如果存在）
    const placeholder = elements.messagesContainer.querySelector('.messages-placeholder');
    if (placeholder) {
        elements.messagesContainer.innerHTML = '';
    }
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    
    // 格式化时间
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    // 角色名称映射
    const roleNames = {
        'positive': '正方辩手',
        'negative': '反方辩手',
        'judge': '裁判',
        'system': '系统'
    };
    
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-role">${roleNames[message.role] || message.role}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    // 添加到容器
    elements.messagesContainer.appendChild(messageElement);
    
    // 滚动到底部
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

// 更新UI
function updateUI() {
    // 更新主题显示
    elements.currentTopic.textContent = AppState.debate.topic || '请设置辩论主题';
    
    // 更新按钮状态
    const isConfigured = AppState.debate.topic && AppState.config.models.positive.apiKey;
    elements.startButton.disabled = AppState.debate.status !== 'idle' || !isConfigured;
    elements.pauseButton.disabled = AppState.debate.status !== 'running';
    elements.resumeButton.disabled = AppState.debate.status !== 'paused';
    
    // 更新状态显示
    const statusLabels = {
        'idle': '未开始',
        'running': '进行中',
        'paused': '已暂停',
        'finished': '已结束'
    };
    
    elements.debateStatus.textContent = statusLabels[AppState.debate.status] || AppState.debate.status;
    elements.currentTurn.textContent = AppState.debate.turnCount;
    elements.currentSpeaker.textContent = AppState.debate.currentTurn === 'positive' ? '正方' : 
                                         AppState.debate.currentTurn === 'negative' ? '反方' : '-';
    
    // 更新进度条
    const progressPercent = AppState.debate.maxTurns > 0 ? 
        (AppState.debate.turnCount / AppState.debate.maxTurns) * 100 : 0;
    elements.progressFill.style.width = `${progressPercent}%`;
    elements.progressText.textContent = `${AppState.debate.turnCount}/${AppState.debate.maxTurns}`;
    
    // 更新模型信息显示
    elements.positiveModelInfo.textContent = AppState.config.models.positive.name || '未配置';
    elements.negativeModelInfo.textContent = AppState.config.models.negative.name || '未配置';
    elements.judgeModelInfo.textContent = AppState.config.models.judge.name || '未配置';
}

// 更新连接状态显示
function updateConnectionStatus(message) {
    elements.connectionStatus.textContent = message;
}

// 显示系统消息
function showSystemMessage(message, type = 'info') {
    elements.systemMessage.textContent = message;
    elements.systemMessage.className = `system-message ${type}`;
    
    // 3秒后清除消息
    setTimeout(() => {
        if (elements.systemMessage.textContent === message) {
            elements.systemMessage.textContent = '';
            elements.systemMessage.className = 'system-message';
        }
    }, 3000);
}

// 保存配置到本地存储
function saveConfigToStorage() {
    try {
        localStorage.setItem('aiDebateConfig', JSON.stringify(AppState.config));
        localStorage.setItem('aiDebateTopic', AppState.debate.topic);
    } catch (e) {
        console.error('保存配置到本地存储失败:', e);
    }
}

// 从本地存储加载配置
function loadConfigFromStorage() {
    try {
        const savedConfig = localStorage.getItem('aiDebateConfig');
        const savedTopic = localStorage.getItem('aiDebateTopic');
        
        if (savedConfig) {
            AppState.config = JSON.parse(savedConfig);
            
            // 填充表单
            document.getElementById('positiveModel').value = AppState.config.models.positive.name;
            document.getElementById('positiveBaseUrl').value = AppState.config.models.positive.baseUrl;
            document.getElementById('negativeModel').value = AppState.config.models.negative.name;
            document.getElementById('negativeBaseUrl').value = AppState.config.models.negative.baseUrl;
            document.getElementById('judgeModel').value = AppState.config.models.judge.name;
            document.getElementById('judgeBaseUrl').value = AppState.config.models.judge.baseUrl;
            document.getElementById('maxTurns').value = AppState.config.maxTurns;
        }
        
        if (savedTopic) {
            AppState.debate.topic = savedTopic;
            document.getElementById('debateTopic').value = savedTopic;
        }
    } catch (e) {
        console.error('从本地存储加载配置失败:', e);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);