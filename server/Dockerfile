FROM node:18-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl

# 安装依赖
COPY package*.json ./
RUN npm install --production=false

# 复制源代码
COPY src ./src

ENV NODE_ENV=production

EXPOSE 4000

# 启动前先执行数据库迁移
CMD sh -c "npm run migrate && node src/index.js"
