@echo off
REM AI辩论平台部署脚本 (Windows)

echo 开始部署AI辩论平台...

REM 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 未检测到Node.js，请先安装Node.js
    exit /b 1
)

REM 检查是否安装了npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 未检测到npm，请先安装npm
    exit /b 1
)

REM 安装依赖
echo 安装项目依赖...
npm install

REM 构建项目（如果需要）
echo 构建项目...
npm run build

REM 设置生产环境变量
echo 请确保已设置正确的环境变量，特别是API密钥

REM 启动服务
echo 启动服务...
npm run start:prod

echo 部署完成！