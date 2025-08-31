#!/bin/bash

# AI辩论平台部署脚本

echo "开始部署AI辩论平台..."

# 检查是否安装了Node.js
if ! command -v node &> /dev/null
then
    echo "未检测到Node.js，请先安装Node.js"
    exit 1
fi

# 检查是否安装了npm
if ! command -v npm &> /dev/null
then
    echo "未检测到npm，请先安装npm"
    exit 1
fi

# 安装依赖
echo "安装项目依赖..."
npm install

# 构建项目（如果需要）
echo "构建项目..."
npm run build

# 设置生产环境变量
echo "请确保已设置正确的环境变量，特别是API密钥"

# 启动服务
echo "启动服务..."
npm run start:prod

echo "部署完成！"