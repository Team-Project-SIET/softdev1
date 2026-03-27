'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Order = {
  id: string; orderNumber: string; status: string; orderType: string
  totalAmount: string; paymentStatus: string; createdAt: string
}

type ChartData = {
  day: string; dry: number; normal: number
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending_pickup:     { label: 'รอรับผ้า',  color: 'text-amber-700',  bg: 'bg-amber-100/80'  },
  washing:            { label: 'กำลังซัก',  color: 'text-blue-700',   bg: 'bg-blue-100/80'   },
  packing:            { label: 'กำลังแพ็ค', color: 'text-purple-700', bg: 'bg-purple-100/80' },
  ready_for_delivery: { label: 'พร้อมส่ง',  color: 'text-teal-700',   bg: 'bg-teal-100/80'   },
  completed:          { label: 'ซักเสร็จแล้ว', color: 'text-green-700', bg: 'bg-green-100/80' },
  cancelled:          { label: 'ยกเลิก',    color: 'text-red-700',    bg: 'bg-red-100/80'    },
}

// Mock fallback data
const WEEK_DATA = [
  { day: 'จ.', dry: 8,  normal: 12 },
  { day: 'อ.', dry: 12, normal: 18 },
  { day: 'พ.', dry: 6,  normal: 10 },
  { day: 'พฤ.', dry: 15, normal: 22 },
  { day: 'ศ.', dry: 20, normal: 30 },
  { day: 'ส.', dry: 18, normal: 25 },
  { day: 'อา.', dry: 10, normal: 14 },
]

const PENDING_TASKS = [
  { id: 1, title: 'ตรวจเช็คความเสียหาย', sub: 'ออเดอร์ #8902 · ลูกค้าไหม', color: 'bg-red-400',    tag: '! ด่วน' },
  { id: 2, title: 'โทรยืนยันเวลาส่ง',    sub: 'คุณวิกาดา · 16:30 น.',       color: 'bg-amber-400', tag: 'นัดนี้' },
  { id: 3, title: 'อัพเดตคลังน้ำยาซัก',  sub: 'น้ำยาซักลงต่ำกว่ากมอนไขผ้า', color: 'bg-slate-300', tag: '≡ ทำ'  },
]

const ACTIVITIES = [
  { text: 'คุณเนตร ชำรับเงินเรียบร้อย', sub: '#ORD-8922 | 2 นาทีที่แล้ว',   dot: 'bg-blue-500'  },
  { text: 'ผ้าหมู 2 มัน ตรวจสอบรอบเป็นน้ำ', sub: '#ORD-8819 | 15 นาทีที่แล้ว', dot: 'bg-amber-500' },
  { text: 'จัดส่งเรียบร้อย: คุณสลัตดา',  sub: '#ORD-8805 | 45 นาทีที่แล้ว', dot: 'bg-green-500' },
]

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [orders,   setOrders]  = useState<Order[]>([])
  const [chartData, setChartData] = useState<ChartData[]>(WEEK_DATA)
  const [loading,  setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json())
      if (res.success) {
        setOrders(res.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
    setLoading(false)
  }

  const fetchChartData = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/orders/stats/weekly`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json())
      if (res.success && res.data) {
        setChartData(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      setChartData(WEEK_DATA)
    }
  }

  useEffect(() => {
    if (token) {
      fetchOrders()
      fetchChartData()
    }
  }, [token])

  const changeStatus = async (orderId: string, status: string) => {
    if (!token) return
    setUpdating(orderId)
    try {
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      await fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
    setUpdating(null)
  }

  const todayOrders   = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
  const pendingPickup = orders.filter(o => o.status === 'pending_pickup').length
  const washing       = orders.filter(o => o.status === 'washing').length
  const todayRevenue  = orders
    .filter(o => o.paymentStatus === 'paid' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + Number(o.totalAmount), 0)

  const urgentOrders = orders
    .filter(o => !['completed', 'cancelled'].includes(o.status))
    .slice(0, 5)

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-6 space-y-6">

      {/* ── Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-5">

        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm font-medium">ออเดอร์วันนี้</p>
          <p className="text-4xl font-black text-gray-900 mt-2">
            {loading ? '—' : todayOrders.length}
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm font-medium">รอรับผ้า</p>
          <p className="text-4xl font-black text-gray-900 mt-2">
            {loading ? '—' : pendingPickup}
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm font-medium">กำลังซัก</p>
          <p className="text-4xl font-black text-gray-900 mt-2">
            {loading ? '—' : washing}
          </p>
        </div>

        {/* Card 4 — Dark */}
        <div className="bg-slate-900 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <p className="text-white/60 text-sm font-medium">รายได้รวม (บาท)</p>
            <span className="text-xs bg-white/15 text-white/80 px-2 py-0.5 rounded-full">วันนี้</span>
          </div>
          <p className="text-4xl font-black text-white mt-2">
            {loading ? '—' : todayRevenue.toLocaleString()}
          </p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* ── Chart + Pending ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Bar Chart */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900">สถิติงานซักรายสัปดาห์</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                ซักแห้ง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                ซักรีดปกติ
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={18} barGap={4}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="dry"    name="ซักแห้ง"    fill="#93c5fd" radius={[6, 6, 0, 0]} />
              <Bar dataKey="normal" name="ซักรีดปกติ" fill="#1e293b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">งานที่ค้าง (Pending)</h2>
            <Link href="/admin/orders" className="text-xs text-blue-500 hover:text-blue-700 font-medium">ดูทั้งหมด</Link>
          </div>
          <div className="space-y-3">
            {PENDING_TASKS.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`w-1 h-full min-h-10 rounded-full ${task.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{task.sub}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0 font-medium">
                  {task.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Urgent Orders Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">รายการที่ต้องจัดการด่วน</h2>
          <p className="text-gray-400 text-sm mt-0.5">รายการที่ต้างซักหรือใกล้ถึงกำหนดส่งมอบ</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-3" />
            กำลังโหลด...
          </div>
        ) : urgentOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-sm">ไม่มีออเดอร์ค้าง</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400">รหัสออเดอร์</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400">ลูกค้า</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400">ประเภทบริการ</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400">สถานะ</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400">กำหนดส่ง</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {urgentOrders.map((order, i) => {
                const st      = STATUS_LABEL[order.status]
                const isLast  = i === urgentOrders.length - 1
                const initial = order.orderNumber.slice(-2).toUpperCase()
                const colors  = ['bg-blue-200', 'bg-purple-200', 'bg-green-200', 'bg-amber-200', 'bg-red-200']
                const avatarBg = colors[i % colors.length]

                return (
                  <tr key={order.id} className={`border-b hover:bg-gray-50/60 transition-colors ${isLast ? 'border-b-0' : 'border-gray-100'}`}>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-600 font-mono font-semibold hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 ${avatarBg} rounded-full flex items-center justify-center text-xs font-bold text-gray-700`}>
                          {initial}
                        </div>
                        <span className="text-gray-700 font-medium">ลูกค้า #{order.orderNumber.slice(-4)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {order.orderType === 'b2b' ? 'ซักแห้งพรีเมียม' : 'ซักพับ'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${st?.bg} ${st?.color}`}>
                        {st?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {formatTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 pb-6">

        {/* Active Drivers */}
        <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">คนขับที่กำลังปฏิบัติงาน</h2>
            <Link href="/admin/logistics" className="text-xs text-blue-500 font-medium hover:text-blue-700">
              ดูทั้งหมด →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'เจมจิรา อ้อยารุง', route: 'เส้นทาง สุขุมวิท 24 - 39', orders: 3, status: 'ว่าง',    dot: 'bg-gray-400'  },
              { name: 'Jams Bond',        route: 'รับของจาก กองหลอ - เอกมัย', orders: 4, status: 'กำลังส่ง', dot: 'bg-green-500' },
              { name: 'อั้นจิรา อ้อยารุง', route: 'เส้นทาง สุขุมวิท 24 - 39', orders: 3, status: 'ว่าง',    dot: 'bg-gray-400'  },
            ].map((driver, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{driver.name}</p>
                    <span className={`w-1.5 h-1.5 rounded-full ${driver.dot} shrink-0`} />
                    <span className="text-xs text-gray-400 shrink-0">{driver.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{driver.route}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{driver.orders} ออเดอร์ · ยังไม่หยุด</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-900 rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-white mb-5">ความเคลื่อนไหวล่าสุด</h2>
          <div className="space-y-4">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${a.dot}`} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{a.text}</p>
                  <p className="text-white/40 text-xs mt-0.5">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
} 