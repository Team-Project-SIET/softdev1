# 🧺 NJ Laundry

พัฒนาด้วย **ElysiaJS** บน **Bun Runtime** และ **Next.js**

---

## ✅ สิ่งที่ต้องติดตั้งก่อน

| โปรแกรม | Version | ดาวน์โหลด |
|---------|---------|-----------|
| **Bun** | >= 1.0 | https://bun.sh |
| **Docker Desktop** | latest | https://www.docker.com/products/docker-desktop |
| **Git** | latest | https://git-scm.com |

---

## 🚀 วิธีเริ่มต้น (ครั้งแรก)

### 1. Clone โปรเจกต์

```bash
git clone <repo-url>
cd nongJames-laundry-shop
```

### ติดตั้ง Next.js dependencies
```
bun install
```
### ติดตั้ง API dependencies
```
cd nongJames-api
bun install
cd ..
```

### รัน migrate (ยังต้องรันบน host เพราะใช้ localhost)
>bun drizzle-kit migrate

### ตั้งค่า Environment Variables

```cp .env.example .env```

จากนั้นแก้ไขรายละเอียดตามที่ example ได้เขียนไว้
### build container 
``` docker compose up -d --build ```
### เปิด PostgreSQL + pgAdmin ด้วย Docker
ถ้ารันอยู่แล้วไม่ต้องใช้คำสั่งนี้
```docker compose up -d``` 

### เช็คว่า container รันอยู่
```docker ps```

ควรเห็น 2 containers:
>postgres   → port 5433
pgadmin    → port 5050

### Migrate Database รันจาก root ของ project (nongJames-laundry-shop)
```
bun drizzle-kit migrate
```

### รัน API
>``` cd nongJames-api ```
``` bun run dev ```

### รัน Frontend (เปิด terminal ใหม่)
>```cd ..``` (cd.. ในกรณีจะใช้ตอนอยู่ใน folders nongJames-api) (แนะนำว่าให้ดูที่ path ว่าตอนนี้อยู่ที่ไหน ควรจะอยู่ที่ nongJames-laundry-shop)
```bun run dev```

### Ports ที่ใช้
---
| service | URL | คำอธิบาย |
| :--- | :---: | ---: |
| Next.js | http://localhost:3000 |Frontend |
| ElysiaJS API | http://localhost:8000 | Backend API |
| Swagger Docs | http://localhost:8000/swagger | API Documentation |
| pgAdmin| http://localhost:5050 | Database UI |
| PostgreSQL | localhost:5433 | Database |
---

### API Documentation
เปิด Swagger UI ที่:
>http://localhost:8000/swagger

วิธีทดสอบ API ด้วย Swagger
1. เปิด http://localhost:8000/swagger
2. กด Authorize (ปุ่มมุมขวาบน)
3. ใส่ JWT token ที่ได้จาก Login
4. กด route ที่ต้องการ → Try it out → Execute

### วิธีขอ JWT Token
1. เปิด browser ไปที่ http://localhost:8000/auth/google
2. Login ด้วย Google account
3. Copy token จาก URL ที่ redirect กลับมา
   http://localhost:3000/auth/callback?token=eyJhbGci...

### คำสั่งที่ใช้บ่อย
### รัน API (dev mode)
>```bun run dev```

### รัน database migration
>```bun drizzle-kit migrate```

### เปิด Drizzle Studio (GUI ดู database)
>```bun drizzle-kit studio```

### เปิด / ปิด Docker
>```docker compose up -d```
```docker compose down```

### Tech Stack
---
| Layer | Technology |
| :--- | ---: |
| Runtime | Bun |
| Framework | ElysiaJS |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | LINE / Google OAuth2 + JWT |
| Docs | Swagger (@elysiajs/swagger) |
| Container | Docker |
---

# พบปัญหาติดต่อจ่าฝูง
| Name | Email |
| :--- | ---: |
| 4RUN | kuysasa007@gmail.com |