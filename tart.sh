[1mdiff --git a/README.md b/README.md[m
[1mindex 8e29940..865e125 100644[m
[1m--- a/README.md[m
[1m+++ b/README.md[m
[36m@@ -26,10 +26,12 @@[m
 [m
 ### 前置条件[m
 [m
[31m-- Node.js 18+[m
[32m+[m[32m- **Node.js 18.0 或更高版本** （必须！低版本无法运行）[m
 - MySQL 8.0（需提前安装）[m
 - pnpm 8+[m
 [m
[32m+[m[32m> ⚠️ **重要**: 如果 Node.js 版本低于 18，会出现语法错误（`SyntaxError: Unexpected token '||='`）。请使用 `node -v` 检查版本。[m
[32m+[m
 ### 方式一：直接运行[m
 [m
 ```bash[m
[36m@@ -164,6 +166,8 @@[m [mmysql -u root -p sauna_membership < backup.sql[m
 [m
 ## 🔧 常见问题[m
 [m
[32m+[m[32m> 💡 **完整故障排除指南**: 请阅读 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取详细的排查步骤。[m
[32m+[m
 ### Q: 启动失败，提示数据库连接错误？[m
 [m
 **A**: [m
[36m@@ -171,6 +175,13 @@[m [mmysql -u root -p sauna_membership < backup.sql[m
 2. 检查 `.env` 中的数据库配置[m
 3. 测试连接：`mysql -u root -p`[m
 [m
[32m+[m[32m### Q: 启动时提示 "SyntaxError: Unexpected token '||='"？[m
[32m+[m
[32m+[m[32m**A**: 这是因为 Node.js 版本过低（< 18）。解决方法：[m
[32m+[m[32m1. 运行 `node -v` 检查版本[m
[32m+[m[32m2. 升级 Node.js 至 18 或更高版本（推荐使用 [nvm](https://github.com/nvm-sh/nvm)）[m
[32m+[m[32m3. 升级后重新运行 `./start.sh`[m
[32m+[m
 ### Q: 启动时提示 "ENOENT: no such file or directory, stat dist/static/index.html"？[m
 [m
 **A**: 这是因为前端未构建或构建失败。解决方法：[m
[36m@@ -179,7 +190,7 @@[m [mmysql -u root -p sauna_membership < backup.sql[m
 3. 使用 `./start.sh` 脚本启动，它会自动检测并构建[m
 [m
 **注意**：如果部署到生产服务器，必须确保：[m
[31m-- 运行过 `pnpm run build` [m
[32m+[m[32m- 运行过 `pnpm run build`[m
 - `dist/` 目录已复制到服务器[m
 - 或使用 `./start.sh` 自动构建[m
 [m
