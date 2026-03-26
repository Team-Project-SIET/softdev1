// LINE Messaging API helper functions

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

// ── ส่ง Reply (ตอบกลับภายใน 30 วิ หลังรับ event) ──────────────────
export const replyMessage = async (replyToken: string, text: string) => {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
}

// ── ส่ง Push (ส่งหาผู้ใช้ทุกเวลา) ──────────────────────────────────
export const pushMessage = async (lineUserId: string, text: string) => {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to:       lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })
}

// ── แปลงสถานะเป็นข้อความ ─────────────────────────────────────────────
export const STATUS_TEXT: Record<string, string> = {
  pending_pickup:     '🚗 รอรับผ้า',
  washing:            '🫧 กำลังซัก',
  packing:            '📦 กำลังแพ็ค',
  ready_for_delivery: '🚚 พร้อมจัดส่ง',
  completed:          '✅ ส่งคืนแล้ว',
  cancelled:          '❌ ยกเลิก',
}

// ── Verify LINE Webhook Signature ────────────────────────────────────
export const verifySignature = (body: string, signature: string): boolean => {
  const secret = process.env.LINE_CHANNEL_SECRET!
  const hash   = require('crypto')
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}
