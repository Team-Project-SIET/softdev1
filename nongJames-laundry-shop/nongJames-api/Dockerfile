# ── Base Image ────────────────────────────────────────────────────────
# ใช้ official Bun image
FROM oven/bun:latest

# ── Working Directory ─────────────────────────────────────────────────
# ตั้ง root ของ project เป็น /app
# เพราะ API import schema จาก ../src/db/schema/ (Next.js project)
WORKDIR /app

# ── Install Dependencies ──────────────────────────────────────────────
# copy package.json ก่อน เพื่อ cache layer
# ถ้า package.json ไม่เปลี่ยน Docker จะใช้ cache แทนติดตั้งใหม่
COPY nongJames-api/package.json nongJames-api/bun.lock* ./nongJames-api/
RUN cd nongJames-api && bun install --frozen-lockfile

# ── Copy Source Code ──────────────────────────────────────────────────
# copy API source
COPY nongJames-api/src        ./nongJames-api/src
COPY nongJames-api/tsconfig.json ./nongJames-api/

# copy shared DB schema จาก Next.js project
# (db.ts import ด้วย path '../src/db/schema/')
COPY src/db ./src/db

# ── Switch to API Directory ───────────────────────────────────────────
WORKDIR /app/nongJames-api

# ── Expose Port ───────────────────────────────────────────────────────
EXPOSE 8000

# ── Start API ─────────────────────────────────────────────────────────
CMD ["bun", "run", "src/index.ts"]
