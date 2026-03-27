'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import QRCode from 'react-qr-code'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const PROMPTPAY_PHONE = process.env.NEXT_PUBLIC_PROMPTPAY_PHONE || '0812345678'

// Generate PromptPay payload
function generatePromptPayPayload(phone: string, amount: number): string {
  // PromptPay EMVCo QR format
  const sanitized = phone.replace(/[^0-9]/g, '')
  const id = sanitized.startsWith('0')
    ? `0066${sanitized.substring(1)}`
    : sanitized

  const payload = [
    '000201',
    '010212',
    `2937${`0016A000000677010111${`01${id.length.toString().padStart(2, '0')}${id}`}`.length.toString().padStart(2, '0')}0016A000000677010111${`01${id.length.toString().padStart(2, '0')}${id}`}`,
    '5303764',
    ...(amount > 0 ? [`5405${amount.toFixed(2).replace('.', '').padStart(5, '0')}`] : []),
    '5802TH',
    '6304',
  ]

  // CRC calculation (simplified - use promptpay-qr lib for production)
  const str = payload.join('') + '6304'
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  const crcStr = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  return str.replace('6304', `6304${crcStr}`)
}

export default function PaymentPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [booking,  setBooking]  = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [loading,  setLoading]  = useState(false)
  const [qrPayload,setQrPayload]= useState('')

  useEffect(() => {
    const data = sessionStorage.getItem('nj_booking')
    if (!data) { router.push('/booking'); return }
    const b = JSON.parse(data)
    setBooking(b)

    // Generate PromptPay QR
    try {
      // Try using promptpay-qr library
      import('promptpay-qr').then(m => {
        const gen = m.default || m
        const payload = gen(PROMPTPAY_PHONE, { amount: b.totalAmount })
        setQrPayload(payload)
      }).catch(() => {
        // Fallback: use simplified generator
        setQrPayload(`00020101021229370016A00000067701011101130066${PROMPTPAY_PHONE.replace(/^0/, '')}530376454${String(b.totalAmount * 100).padStart(10, '0')}5802TH6304ABCD`)
      })
    } catch {
      setQrPayload('PROMPTPAY_PLACEHOLDER')
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}.${s}`
  }

  const handleConfirmPaid = async () => {
  setLoading(true)
  try {
    if (token && booking && booking.customerId) {
      await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          // ← ไม่ต้องส่ง customerId เพราะ backend resolve เอง
          orderType:     'b2c',
          pickupAddress: 'ที่อยู่จากโปรไฟล์',
          items: [{
            serviceId: booking.serviceId === 'wash_fold'
              ? '50000000-0000-0000-0000-000000000001'
              : booking.serviceId === 'delicate'
              ? '50000000-0000-0000-0000-000000000002'
              : '50000000-0000-0000-0000-000000000003',
            quantity:  booking.weight,
            unitPrice: booking.unitPrice,
          }],
        }),
      }).then(r => r.json()).then(data => {
        if (data.success && data.data?.id) {
          sessionStorage.setItem('nj_last_order_id', data.data.id)
        }
      })
    }
    router.push('/booking/success')
  } catch {
    router.push('/booking/success')
  } finally {
    setLoading(false)
  }
}


  if (!booking) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">

      {/* Back */}
      <Link href="/booking/summary" className="absolute top-24 left-6 z-20">
        <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </div>
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">ชำระผ่าน QR Code</h1>

      {/* QR Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-white/80 w-full max-w-sm">

        {/* Thai QR Header */}
        <div className="bg-blue-900 py-4 px-6 text-center">
          <p className="text-white font-bold tracking-wider text-sm">THAI QR PAYMENT</p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
              <span className="text-blue-900 text-xs font-black">✦</span>
            </div>
            <span className="text-white text-xs">PromptPay</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-inner">
            {qrPayload ? (
              <QRCode
                value={qrPayload}
                size={220}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm mt-4 font-medium">
            ยอด {booking.totalAmount?.toLocaleString()} บาท
          </p>
          <p className="text-gray-400 text-xs mt-1">แสกนเพื่อชำระ</p>
        </div>
      </div>

      {/* Timer */}
      {timeLeft > 0 ? (
        <button
          disabled
          className="mt-4 px-8 py-3 bg-blue-100 text-blue-600 rounded-xl text-sm font-medium border border-blue-200"
        >
          รหัสจะหมดอายุใน {formatTime(timeLeft)} นาที
        </button>
      ) : (
        <Link
          href="/booking/payment"
          className="mt-4 px-8 py-3 bg-orange-100 text-orange-600 rounded-xl text-sm font-medium"
        >
          QR หมดอายุแล้ว — กดเพื่อรับอันใหม่
        </Link>
      )}

      {/* Confirm Paid */}
      <button
        onClick={handleConfirmPaid}
        disabled={loading}
        className="mt-6 w-full max-w-sm py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-colors disabled:opacity-60 shadow-lg"
      >
        {loading ? 'กำลังยืนยัน...' : '✓ ยืนยันการชำระเงินแล้ว'}
      </button>

    </div>
  )
}
