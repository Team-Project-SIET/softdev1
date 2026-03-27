'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Types ─────────────────────────────────────────────────────────────
type Order = {
  id:           string
  orderNumber:  string
  status:       string
  totalAmount:  string
  deliveryFee:  string
  paymentStatus:string
  createdAt:    string
}

type Subscription = {
  planName:        string
  status:          string
  endDate:         string
  freeDelivery:    boolean
  discountPercent: string
} | null

// ── สถานะ Order ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_pickup:     { label: 'รอรับผ้า',     color: 'text-orange-600', bg: 'bg-orange-50',  icon: '🚗' },
  washing:            { label: 'กำลังซัก',     color: 'text-blue-600',   bg: 'bg-blue-50',    icon: '🫧' },
  packing:            { label: 'กำลังแพ็ค',    color: 'text-purple-600', bg: 'bg-purple-50',  icon: '📦' },
  ready_for_delivery: { label: 'พร้อมส่ง',     color: 'text-teal-600',   bg: 'bg-teal-50',    icon: '🚚' },
  completed:          { label: 'ส่งคืนแล้ว',   color: 'text-green-600',  bg: 'bg-green-50',   icon: '✅' },
  cancelled:          { label: 'ยกเลิก',        color: 'text-red-500',    bg: 'bg-red-50',     icon: '❌' },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: 'รอชำระ',  color: 'text-amber-600'  },
  paid:     { label: 'ชำระแล้ว', color: 'text-green-600' },
  failed:   { label: 'ล้มเหลว', color: 'text-red-500'    },
  refunded: { label: 'คืนเงิน', color: 'text-gray-500'   },
}

export default function CustomerOrdersPage() {
  const { user, token } = useAuth()
  const [orders,  setOrders]  = useState<Order[]>([])
  const [sub,     setSub]     = useState<Subscription>(null)
  const [loading, setLoading] = useState(true)

  // ── ดึง Orders ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API_URL}/orders/my`,        { headers }).then(r => r.json()),
      // ดึง subscription ถ้ามี customer id
      fetch(`${API_URL}/auth/me`,          { headers }).then(r => r.json()),
    ])
    .then(async ([ordersRes, meRes]) => {
      if (ordersRes.success) setOrders(ordersRes.data || [])

      // ดึง subscription ของ customer
      if (meRes.success) {
        const customerId = meRes.data?.customerId
        if (customerId) {
          const subRes = await fetch(
            `${API_URL}/customers/${customerId}/subscription`,
            { headers }
          ).then(r => r.json())
          if (subRes.success && subRes.data) setSub(subRes.data)
        }
      }
    })
    .finally(() => setLoading(false))
  }, [token])

  // ── Active Orders (ที่ยังไม่เสร็จ) ───────────────────────────────────
  const activeOrders = orders.filter(o =>
    !['completed', 'cancelled'].includes(o.status)
  )

  // ── Completed Orders ──────────────────────────────────────────────────
  const completedOrders = orders.filter(o => o.status === 'completed')

  // ── Format date ───────────────────────────────────────────────────────
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ═══ HERO ════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            {/* Greeting */}
            <div>
              <p className="text-slate-400 text-sm font-medium">ยินดีต้อนรับกลับมา 👋</p>
              <h1 className="text-3xl font-bold mt-1">
                สวัสดีครับ คุณ{user?.name.split(' ')[0]}
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                จัดการออเดอร์ซักรีดและติดตามสถานะได้ที่นี่
              </p>
            </div>

            {/* Subscription Badge */}
            {sub?.status === 'active' ? (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <p className="text-slate-300 text-xs">แพ็กเกจปัจจุบัน</p>
                <p className="font-bold text-lg mt-0.5">⭐ {sub.planName}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {sub.freeDelivery ? '✓ ส่งฟรีทุกครั้ง' : ''} · ลด {sub.discountPercent}%
                </p>
                <p className="text-slate-400 text-xs">ถึง {formatDate(sub.endDate)}</p>
              </div>
            ) : (
              <Link
                href="/#pricing"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-4 transition-colors text-sm font-medium"
              >
                ⭐ อัปเกรดเป็น Premium
                <span className="block text-xs font-normal opacity-80 mt-0.5">ส่งฟรี + ลด 15%</span>
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'ออเดอร์ทั้งหมด', value: orders.length,          icon: '📦' },
              { label: 'กำลังดำเนินการ', value: activeOrders.length,    icon: '🔄' },
              { label: 'ส่งคืนแล้ว',     value: completedOrders.length,  icon: '✅' },
              { label: 'ยอดใช้บริการ',   value: `฿${orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + Number(o.totalAmount), 0).toLocaleString()}`, icon: '💰' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-10">

        {/* ═══ ACTIVE ORDERS ═══════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">กำลังดำเนินการ</h2>
              <p className="text-gray-400 text-sm mt-0.5">ออเดอร์ที่อยู่ระหว่างซัก</p>
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <p className="text-4xl mb-3">🧺</p>
              <p className="text-gray-500 font-medium">ยังไม่มีออเดอร์ที่กำลังดำเนินการ</p>
              <p className="text-gray-400 text-sm mt-1">สั่งซักได้เลยครับ!</p>
              <Link
                href="/booking"
                className="inline-block mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors"
              >
                ดูบริการ
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map(order => {
                const st = STATUS_CONFIG[order.status]
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{order.orderNumber}</p>
                        <p className="font-bold text-gray-900 mt-0.5 text-lg">
                          ฿{Number(order.totalAmount).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${st?.bg} ${st?.color}`}>
                        {st?.icon} {st?.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                      <div className="flex items-center gap-1">
                        {['pending_pickup','washing','packing','ready_for_delivery','completed'].map((s, i) => {
                          const steps = ['pending_pickup','washing','packing','ready_for_delivery','completed']
                          const currentIdx = steps.indexOf(order.status)
                          const isDone = i <= currentIdx
                          return (
                            <div key={s} className="flex-1 flex items-center gap-1">
                              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                                isDone ? 'bg-slate-700' : 'bg-gray-100'
                              }`} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {['รับผ้า','ซัก','แพ็ค','พร้อมส่ง','เสร็จ'].map((l, i) => {
                          const steps = ['pending_pickup','washing','packing','ready_for_delivery','completed']
                          const isDone = i <= steps.indexOf(order.status)
                          return (
                            <span key={l} className={`text-xs ${isDone ? 'text-slate-700 font-medium' : 'text-gray-300'}`}>
                              {l}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className={`text-xs font-medium ${PAYMENT_CONFIG[order.paymentStatus]?.color}`}>
                        💳 {PAYMENT_CONFIG[order.paymentStatus]?.label}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors">
                        ดูรายละเอียด →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ═══ SERVICES ════════════════════════════════════════════ */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">บริการซักอบรีดแบบพรีเมียม</h2>
            <p className="text-gray-400 text-sm mt-0.5">เลือกบริการที่เหมาะกับคุณ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '◇', title: 'ซักพับ',              price: '50',  unit: '/กก.',  desc: 'ซัก อบ พับเรียบร้อย แยกสี-ขาว' },
              { icon: '⌂', title: 'ซักแห้ง',             price: '150', unit: '/ชิ้น', desc: 'Dry Cleaning สำหรับผ้าแบรนด์เนม' },
              { icon: '⌁', title: 'ซักผ้าห่ม-ผ้าปูที่นอน', price: '120', unit: '/ชิ้น', desc: 'ซักผ้าหนักด้วยเครื่องเฉพาะ' },
            ].map(s => (
              <div
                key={s.title}
                className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
              >
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-gray-500 group-hover:text-white transition-all mb-5">
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    ฿{s.price}
                    <span className="text-gray-400 text-sm font-normal">{s.unit}</span>
                  </span>
                  <span className="text-sm text-gray-400 group-hover:text-gray-700 transition-colors">
                    เลือกดู →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ORDER HISTORY ═══════════════════════════════════════ */}
        {completedOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">ประวัติการใช้บริการ</h2>
                <p className="text-gray-400 text-sm mt-0.5">{completedOrders.length} รายการ</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              {completedOrders.slice(0, 5).map((order, i) => {
                const st = STATUS_CONFIG[order.status]
                const pay = PAYMENT_CONFIG[order.paymentStatus]
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
                      i !== completedOrders.slice(0,5).length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${st?.bg} rounded-xl flex items-center justify-center text-lg`}>
                        {st?.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-gray-400 text-xs">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-xs font-medium ${pay?.color}`}>{pay?.label}</span>
                      <span className="font-bold text-gray-900">฿{Number(order.totalAmount).toLocaleString()}</span>
                      <span className="text-gray-300 text-sm">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
