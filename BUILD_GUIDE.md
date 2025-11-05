# 构建指南

## 📦 包管理器

本项目使用 **pnpm** 作为唯一的包管理器。

### 重要说明

- ✅ **使用**: `pnpm-lock.yaml`
- ❌ **不使用**: `package-lock.json`, `yarn.lock`

### 安装依赖

```bash
# 前端
pnpm install

# 后端
cd server && npm install
```

### 构建项目

```bash
# 前端构建
pnpm run build

# 查看构建产物
ls -lh dist/static
```

## 🐳 Docker 构建

### 本地测试构建

```bash
# 测试前端镜像构建
docker build -t sauna-frontend:test .

# 测试后端镜像构建
docker build -t sauna-backend:test ./server

# 使用 docker compose 构建
docker compose build
```

### 构建优化

项目已配置 `.dockerignore` 文件，自动排除：
- `node_modules/`
- 锁文件（`package-lock.json`, `yarn.lock`）
- Git 文件
- 文档文件（除 README.md）
- 环境变量文件

### 常见问题

#### Q: Docker 构建时提示找不到依赖？

**原因**: 可能是缓存问题

**解决**:
```bash
# 清除构建缓存
docker compose build --no-cache

# 或清理所有 Docker 缓存
docker system prune -a
```

#### Q: pnpm 和 npm 混用导致问题？

**解决**:
```bash
# 删除所有 node_modules 和锁文件
rm -rf node_modules package-lock.json yarn.lock
rm -rf server/node_modules

# 重新安装
pnpm install
cd server && npm install
```

#### Q: 前端构建失败？

**检查清单**:
1. 确保只有 `pnpm-lock.yaml` 存在
2. 删除 `package-lock.json`（如果存在）
3. 清空 node_modules 重新安装
4. 检查 Node.js 版本（需要 18+）

```bash
# 完整重置流程
rm -rf node_modules dist
rm -f package-lock.json
pnpm install
pnpm run build
```

## 🔧 开发工具配置

### VS Code

添加到 `.vscode/settings.json`:

```json
{
  "npm.packageManager": "pnpm",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 禁用 npm/yarn

在项目根目录创建 `.npmrc`:

```
package-manager=pnpm
```

## 📝 构建脚本说明

### 前端 (package.json)

```json
{
  "scripts": {
    "dev": "vite --host --port 3000",
    "build:client": "vite build --outDir dist/static",
    "build": "rm -rf dist && pnpm build:client && cp package.json dist && touch dist/build.flag"
  }
}
```

### 后端 (server/package.json)

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "migrate": "node src/db/migrate.js"
  }
}
```

## 🚀 CI/CD 配置建议

### GitHub Actions 示例

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm run build
      
      - name: Build Docker images
        run: docker compose build
```

## 📊 构建性能

### 典型构建时间

| 步骤 | 时间 | 说明 |
|------|------|------|
| pnpm install | ~10-30秒 | 首次或清理后 |
| pnpm build | ~8-15秒 | 前端构建 |
| docker build (frontend) | ~2-5分钟 | 包含依赖安装 |
| docker build (backend) | ~1-2分钟 | 相对轻量 |

### 优化建议

1. **使用 Docker 缓存**: 不要频繁使用 `--no-cache`
2. **多阶段构建**: 前端 Dockerfile 已采用
3. **CI 缓存**: 缓存 `node_modules` 和 Docker 层

---

最后更新: 2025-01-05
