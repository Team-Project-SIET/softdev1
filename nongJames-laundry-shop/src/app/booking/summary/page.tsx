'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const PRICES: Record<string, Record<string, number>> = {
  wash_fold:  { wash_only: 50,  wash_iron: 70,  dry_clean: 150 },
  delicate:   { wash_only: 100, wash_iron: 150, dry_clean: 200 },
  heavy:      { wash_only: 120, wash_iron: 160, dry_clean: 180 },
}

export default function SummaryPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [booking, setBooking] = useState<any>(null)
  const [weight,  setWeight]  = useState(3)
  const [method,  setMethod]  = useState<'qr' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const data = sessionStorage.getItem('nj_booking')
    if (!data) { router.push('/booking'); return }
    setBooking(JSON.parse(data))
  }, [])

  if (!booking) return null

  const unitPrice = PRICES[booking.serviceId]?.[booking.optionId] ?? 50
  const totalAmount = unitPrice * weight

  const handleConfirm = async () => {
    if (!method) return
    setLoading(true)

    // บันทึกข้อมูลสำหรับหน้า payment
    sessionStorage.setItem('nj_booking', JSON.stringify({
      ...booking,
      weight,
      unitPrice,
      totalAmount,
      method,
    }))
    router.push('/booking/payment')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">

      {/* Back */}
      <Link href="/booking" className="absolute top-24 left-6 z-20">
        <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </div>
      </Link>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ชำระเงิน</h1>
        <p className="text-gray-500 text-sm mt-1">กรุณาเลือกวิธีชำระเงินเพื่อดำเนินการต่อ</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 w-full max-w-xl shadow-lg border border-white/80 mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-6">สรุปออเดอร์</h2>

        <div className="space-y-3">
          {[
            { label: 'ประเภทผ้า', value: booking.serviceName },
            { label: 'บริการ',    value: booking.optionLabel  },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">{row.label}:</span>
              <span className="text-gray-800 font-medium">{row.value}</span>
            </div>
          ))}

          {/* Weight Input */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">น้ำหนัก:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeight(w => Math.max(1, w - 1))}
                className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold"
              >−</button>
              <span className="font-bold text-gray-900 w-16 text-center">{weight} กิโลกรัม</span>
              <button
                onClick={() => setWeight(w => w + 1)}
                className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold"
              >+</button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
          <span className="font-bold text-gray-700">ยอดรวม:</span>
          <span className="text-3xl font-black text-gray-900">{totalAmount.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="w-full max-w-xl mb-6">
        <p className="font-bold text-gray-800 mb-3">เลือกวิธีชำระเงิน</p>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setMethod('qr')}
            className={`bg-white/70 backdrop-blur-md border-2 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm ${
              method === 'qr'
                ? 'border-blue-500 bg-blue-50/70'
                : 'border-white/70 hover:border-gray-300'
            }`}
          >
            <div className="w-14 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold text-center leading-tight">THAI QR</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">Thai QR Payment</p>
              <p className="text-gray-500 text-xs">PromptPay / QR Code</p>
            </div>
            {method === 'qr' && (
              <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="w-full max-w-xl">
        <button
          onClick={handleConfirm}
          disabled={!method || loading}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {loading ? 'กำลังดำเนินการ...' : 'ยืนยันและชำระเงิน'}
        </button>
      </div>

    </div>
  )
}
