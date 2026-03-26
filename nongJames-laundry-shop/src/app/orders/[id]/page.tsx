'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/home/Navbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type OrderDetail = {
  id:              string
  orderNumber:     string
  status:          string
  orderType:       string
  pickupAddress:   string
  deliveryAddress: string
  totalAmount:     string
  deliveryFee:     string
  discountAmount:  string
  paymentStatus:   string
  notes:           string | null
  createdAt:       string
  items:           OrderItem[]
}

type OrderItem = {
  id:        string
  serviceId: string
  quantity:  string
  unitPrice: string
  subtotal:  string
}

const STEPS = [
  { key: 'pending_pickup',     label: 'รอรับผ้า', icon: '🧺' },
  { key: 'washing',            label: 'กำลังซัก', icon: '🫧' },
  { key: 'packing',            label: 'การบรรจุ', icon: '📦' },
  { key: 'ready_for_delivery', label: 'พร้อมส่ง', icon: '🛵' },
  { key: 'completed',          label: 'เสร็จสิ้น', icon: '✓'  },
]

const PAYMENT_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'รอชำระเงิน',  color: 'text-amber-600'  },
  paid:     { label: 'ชำระเงินสำเร็จ', color: 'text-green-600' },
  failed:   { label: 'ชำระไม่สำเร็จ', color: 'text-red-500'  },
  refunded: { label: 'คืนเงินแล้ว',  color: 'text-gray-500'   },
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuth()
  const [order,   setOrder]   = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setOrder(d.data) })
      .finally(() => setLoading(false))
  }, [token, params.id])

  const currentStepIdx = STEPS.findIndex(s => s.key === order?.status)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 font-medium">ไม่พบออเดอร์นี้</p>
          <Link href="/orders" className="mt-4 text-sm text-blue-600 underline">กลับหน้าหลัก</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Blurred background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop')`,
          filter: 'blur(18px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="fixed inset-0 bg-white/30" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-6">

          {/* Back + Header */}
          <div className="flex items-start gap-4">
            <Link href="/orders" className="mt-1">
              <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">การติดตามสถานะออเดอร์</h1>
              <p className="text-gray-500 text-sm mt-0.5">ออเดอร์เลขที่ #{order.orderNumber}</p>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/80">

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((step, i) => {
                const isDone    = i < currentStepIdx
                const isCurrent = i === currentStepIdx
                const isLast    = i === STEPS.length - 1

                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-sm ${
                        isDone    ? 'bg-slate-700 text-white' :
                        isCurrent ? 'bg-white border-4 border-blue-400 text-gray-700 shadow-md' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {step.icon}
                      </div>
                      <span className={`text-xs mt-2 font-medium text-center ${
                        isDone || isCurrent ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div className={`flex-1 h-1 mx-2 rounded-full mb-5 ${
                        i < currentStepIdx ? 'bg-slate-700' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-6 mt-6 border-t border-gray-100 pt-6">
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">กำหนดการรับผ้า</p>
                <p className="font-bold text-gray-900 text-sm">{formatDate(order.createdAt)}</p>
                <p className="text-gray-500 text-xs mt-0.5">09:00 - 11:00 น.</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">กำหนดการส่งผ้า</p>
                <p className="font-bold text-gray-900 text-sm">
                  {formatDate(new Date(new Date(order.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString())}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">14:00 - 16:00 น.</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">ยอดรวมทั้งหมด</p>
                <p className="text-2xl font-black text-gray-900">
                  {Number(order.totalAmount).toLocaleString()}.00 บาท
                </p>
                <p className={`text-xs mt-0.5 font-medium ${PAYMENT_LABEL[order.paymentStatus]?.color}`}>
                  {PAYMENT_LABEL[order.paymentStatus]?.label}
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Order Items */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4">รายละเอียดออเดอร์</h2>
              <div className="space-y-3">
                {order.items.length > 0 ? (
                  order.items.map((item, i) => (
                    <div key={item.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 border border-white/80 shadow-sm">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        🧺
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">บริการที่ {i + 1}</p>
                        <p className="text-gray-500 text-sm mt-0.5">
                          {Number(item.quantity)} {Number(item.quantity) > 1 ? 'กก.' : 'ชิ้น'} × ฿{Number(item.unitPrice).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {Number(item.subtotal).toLocaleString()}.00 บาท
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 text-center border border-white/80">
                    <p className="text-gray-400 text-sm">ไม่มีรายการ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Contact */}
              <div className="bg-slate-800 rounded-3xl p-6 text-white">
                <p className="font-medium leading-relaxed text-sm opacity-90">
                  เจ้าหน้าที่กำลังดูแลเสื้อผ้า<br />
                  ของคุณอย่างประณีตที่สุด<br />
                  หากมีข้อสงสัยสามารถ<br />
                  ติดต่อเราได้ทันที
                </p>
                <a
                  href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_OA_ID || '@nongjames'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block w-full py-3 bg-white text-gray-900 rounded-2xl font-bold text-sm text-center hover:bg-gray-100 transition-colors"
                >
                  ติดต่อฝ่ายบริการลูกค้า
                </a>
              </div>

              {/* Pickup Address */}
              {order.pickupAddress && (
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium mb-2">📍 ที่อยู่รับผ้า</p>
                  <p className="text-gray-800 text-sm font-medium">{order.pickupAddress}</p>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="bg-amber-50/70 backdrop-blur-md rounded-3xl p-5 border border-amber-100 shadow-sm">
                  <p className="text-xs text-amber-600 font-medium mb-2">📝 หมายเหตุ</p>
                  <p className="text-gray-800 text-sm">{order.notes}</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
