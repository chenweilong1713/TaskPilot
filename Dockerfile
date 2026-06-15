# ============================================
# TaskPilot Docker 镜像
# 默认端口 3000
# 数据卷：/app/prisma（数据库） /app/data/avatars（头像上传）
# ============================================

# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 package.json 利用 Docker 层缓存
COPY package.json ./
RUN npm install

# 复制全部源码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Nuxt 生产包
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine

WORKDIR /app

# 安装 SQLite CLI（用于入口脚本初始化数据库）
RUN apk add --no-cache sqlite

# 从构建阶段复制必要文件
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

# 复制数据库初始化脚本和入口脚本
COPY prisma/init.sql /app/init.sql
COPY docker-entrypoint.mjs /app/docker-entrypoint.mjs

# 创建数据持久化目录
RUN mkdir -p /app/prisma /app/data/avatars

# 环境变量
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV DATABASE_URL="file:/app/prisma/dev.db"

# 暴露端口
EXPOSE 3000

# 声明数据卷（映射宿主机目录以实现持久化）
#   /app/prisma       — SQLite 数据库文件
#   /app/data/avatars — 用户上传的头像图片
VOLUME ["/app/prisma", "/app/data/avatars"]

# 入口脚本：初始化数据库 → 启动应用
ENTRYPOINT ["node", "/app/docker-entrypoint.mjs"]
