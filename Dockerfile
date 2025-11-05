# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括开发依赖）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建前端
RUN pnpm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm 和生产依赖
RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile

# 复制构建产物和服务器文件
COPY --from=builder /app/dist ./dist
COPY server.js ./

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "server.js"]
