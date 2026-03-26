'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const id = sessionStorage.getItem('nj_last_order_id')
    setOrderId(id)
    sessionStorage.removeItem('nj_booking')
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-12 w-full max-w-md text-center shadow-xl border border-white/80">

        {/* Success Icon */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-3">เสร็จสิ้น</h1>
        <p className="text-gray-500 text-sm">ตรวจสอบสถานะรายการของท่าน</p>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          {orderId ? (
            <Link
              href={`/orders/${orderId}`}
              className="block w-full py-4 bg-white/80 hover:bg-white border border-gray-200 text-gray-900 rounded-2xl font-medium text-sm transition-colors shadow-sm"
            >
              เช็คสถานะ
            </Link>
          ) : (
            <Link
              href="/orders"
              className="block w-full py-4 bg-white/80 hover:bg-white border border-gray-200 text-gray-900 rounded-2xl font-medium text-sm transition-colors shadow-sm"
            >
              เช็คสถานะ
            </Link>
          )}
          <Link
            href="/orders"
            className="block w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium text-sm transition-colors"
          >
            กลับหน้าหลัก
          </Link>
        </div>

      </div>
    </div>
  )
}
