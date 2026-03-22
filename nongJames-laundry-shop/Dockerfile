# ════════════════════════════════════════
# Stage 1: deps — ติดตั้ง dependencies
# ════════════════════════════════════════
FROM oven/bun:latest AS deps

WORKDIR /app

# copy เฉพาะ package files ก่อน
# เพื่อให้ Docker cache layer นี้ได้
# ถ้า package.json ไม่เปลี่ยน จะไม่ install ใหม่
COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

# ════════════════════════════════════════
# Stage 2: builder — build Next.js
# ════════════════════════════════════════
FROM oven/bun:latest AS builder

WORKDIR /app

# เอา node_modules จาก stage deps มาใช้
COPY --from=deps /app/node_modules ./node_modules

# copy source code ทั้งหมด
COPY . .

# build Next.js
# output จะอยู่ที่ .next/standalone
RUN bun run build

# ════════════════════════════════════════
# Stage 3: runner — รัน production
# ════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# สร้าง user ที่ไม่ใช่ root เพื่อ security
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# copy เฉพาะที่จำเป็นสำหรับ production
# standalone = Next.js bundle ทุกอย่างมาให้แล้ว
COPY --from=builder /app/public                         ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

USER nextjs

EXPOSE 3000

# server.js สร้างโดย Next.js standalone build อัตโนมัติ
CMD ["node", "server.js"]
