// ── รูปแบบ Response มาตรฐานของ NJ API ────────────────────────────────
//
// ✅ สำเร็จ:  { success: true,  message: "...", data: {...} }
// ❌ ล้มเหลว: { success: false, message: "...", data: null  }

// สำเร็จ — ใช้กับ GET, PUT, PATCH
export const ok = (data: unknown, message = 'success') => ({
  success: true,
  message,
  data,
})

// สร้างสำเร็จ — ใช้กับ POST (HTTP 201)
export const created = (data: unknown, message = 'created successfully') => ({
  success: true,
  message,
  data,
})

// ── Error Response ────────────────────────────────────────────────────
// ใช้ new Response() เพื่อกำหนด HTTP status code เองได้

export const badRequest = (message: string) =>
  new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )

export const unauthorized = (message = 'กรุณา Login ก่อนใช้งาน') =>
  new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )

export const forbidden = (message = 'ไม่มีสิทธิ์เข้าถึง') =>
  new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  )

export const notFound = (message = 'ไม่พบข้อมูลที่ต้องการ') =>
  new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  )

export const serverError = (message = 'เกิดข้อผิดพลาด กรุณาลองใหม่') =>
  new Response(
    JSON.stringify({ success: false, message, data: null }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
