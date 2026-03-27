'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Types ──────────────────────────────────────────────────────────────
type Order = {
  id: string; orderNumber: string; status: string
  orderType: string; totalAmount: string
  paymentStatus: string; createdAt: string
  customerName: string | null   // ← เพิ่ม
  customerPhone: string | null  // ← เพิ่ม
}

type Payment = {
  id: string; orderId: string; amount: string
  method: string; status: string; paidAt: string | null; createdAt: string
}

// ── Constants ──────────────────────────────────────────────────────────
const DAYS    = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
const COLORS  = ['#2563eb', '#93c5fd', '#e5e7eb']

const METHOD_LABEL: Record<string, string> = {
  promptpay_qr: 'PromptPay',
  omise_card:   'บัตรเครดิต',
  truewallet:   'TrueWallet',
  scb_easy:     'SCB Easy',
}
const METHOD_ICON: Record<string, string> = {
  promptpay_qr: '🏦',
  omise_card:   '💳',
  truewallet:   '💚',
  scb_easy:     '🟣',
}

// ── Helpers ────────────────────────────────────────────────────────────
const isToday  = (d: string) => new Date(d).toDateString() === new Date().toDateString()
const isInWeek = (d: string) => {
  const now  = new Date()
  const date = new Date(d)
  const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); start.setHours(0,0,0,0)
  return date >= start
}

export default function FinancePage() {
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const PAGE_SIZE = 4

  useEffect(() => {
    const token = localStorage.getItem('nj_token')
    if (!token) return
    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.success) setOrders(d.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── คำนวณ Stats ────────────────────────────────────────────────────
  const paidOrders    = orders.filter(o => o.paymentStatus === 'paid')
  const pendingOrders = orders.filter(o => o.paymentStatus === 'pending' && o.status !== 'cancelled')

  const todayRevenue  = paidOrders.filter(o => isToday(o.createdAt))
    .reduce((s, o) => s + Number(o.totalAmount), 0)
  const weekRevenue   = paidOrders.filter(o => isInWeek(o.createdAt))
    .reduce((s, o) => s + Number(o.totalAmount), 0)
  const pendingAmount = pendingOrders
    .reduce((s, o) => s + Number(o.totalAmount), 0)

  // ── Weekly Chart Data ──────────────────────────────────────────────
  const weeklyData = DAYS.map((day, i) => {
    const dayOrders = orders.filter(o => {
      const d   = new Date(o.createdAt)
      const dow = d.getDay() // 0=sun
      const mapped = dow === 0 ? 6 : dow - 1 // แปลงเป็น 0=จ ... 6=อา
      return mapped === i
    })
    return {
      day,
      ซักแห้ง:     dayOrders.filter(o => o.orderType === 'b2b').length || 0,
      ซักรีดปกติ:  dayOrders.filter(o => o.orderType === 'b2c').length || 0,
    }
  })

  // ── Payment Method Breakdown ───────────────────────────────────────
  const methodCount: Record<string, number> = {}
  // ใช้ mock ratio เพราะยังไม่มี /payments endpoint รวม
  const methodData = [
    { name: 'QR Code (PromptPay)', value: 70, color: COLORS[0] },
    { name: 'บัตรเครดิต',          value: 20, color: COLORS[1] },
    { name: 'เงินสด',              value: 10, color: COLORS[2] },
  ]

  // ── Recent Payments (จาก orders ที่ paid) ─────────────────────────
  const recentPaid = [...paidOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const totalPages = Math.ceil(recentPaid.length / PAGE_SIZE)
  const paginated  = recentPaid.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
  })

  const statCards = [
    {
      label:  'รายได้วันนี้ (B)',
      value:  `฿${todayRevenue.toLocaleString()}`,
      trend:  '+5%',
      icon:   (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      bg: 'bg-blue-50',
    },
    {
      label:  'รายได้สัปดาห์นี้ (B)',
      value:  `฿${weekRevenue.toLocaleString()}`,
      trend:  '+12%',
      icon:   (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16l4-4 4 4 4-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      bg: 'bg-blue-50',
    },
    {
      label:  'รอชำระเงิน (B)',
      value:  `฿${pendingAmount.toLocaleString()}`,
      trend:  null,
      icon:   (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="p-6 space-y-5">

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
              {card.trend && (
                <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                  ↑ {card.trend}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-5">

        {/* Bar Chart */}
        <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-gray-800">สถิติงานซักรายสัปดาห์</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-800 inline-block" />
                ซักแห้ง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-300 inline-block" />
                ซักรีดปกติ
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Bar dataKey="ซักแห้ง"    fill="#1e3a5f" radius={[4,4,0,0]} />
              <Bar dataKey="ซักรีดปกติ" fill="#93c5fd" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800 mb-1">ช่องทางการชำระเงิน</p>
          <p className="text-xs text-gray-400 mb-4">สัดส่วนตามจำนวนรายการ</p>

          <div className="flex items-center justify-center">
            <div className="relative">
              <PieChart width={180} height={180}>
                <Pie
                  data={methodData}
                  cx={90} cy={90}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {methodData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-gray-800">100%</p>
                <p className="text-xs text-gray-400">รวมทั้งหมด</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-3">
            {methodData.map(m => (
              <div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-gray-600">{m.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Recent Payments Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800">ประวัติการชำระเงินล่าสุด</p>
          <button className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
            ดูทั้งหมด →
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              {['รหัสออเดอร์', 'ชื่อลูกค้า', 'ช่องทาง', 'ยอดเงิน', 'เวลา', 'สถานะ'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">ยังไม่มีข้อมูล</td>
              </tr>
            ) : (
              paginated.map((order, i) => (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50/70 transition-colors ${
                    i !== paginated.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  {/* Order Number */}
                  <td className="px-6 py-4">
                    <span className="text-blue-500 font-semibold text-sm">#{order.orderNumber}</span>
                  </td>

                 {/* Customer */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {order.customerName?.charAt(0) || '?'}
                      </div>
                      <span className="text-gray-700 text-sm">
                        {order.customerName || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </td>

                  {/* Method */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <span>🏦</span>
                      PromptPay
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      ฿{Number(order.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {formatTime(order.createdAt)} น.
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-green-500 bg-green-50 px-2.5 py-1 rounded-lg">
                        สำเร็จ
                      </span>
                      <button className="text-gray-300 hover:text-gray-500 transition-colors ml-3">⋮</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              แสดง {Math.min(paginated.length, PAGE_SIZE)} จาก {recentPaid.length} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm"
              >
                ›
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
