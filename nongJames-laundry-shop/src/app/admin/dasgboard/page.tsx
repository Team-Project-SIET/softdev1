'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Order = {
  id:           string
  orderNumber:  string
  status:       string
  orderType:    string
  totalAmount:  string
  paymentStatus:string
  createdAt:    string
}

const COLUMNS = [
  { key: 'pending_pickup',     label: 'รอรับผ้า',    color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { key: 'washing',            label: 'กำลังซัก',    color: 'bg-blue-50 border-blue-200',     badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400'   },
  { key: 'packing',            label: 'กำลังแพ็ค',   color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  { key: 'ready_for_delivery', label: 'พร้อมส่ง',    color: 'bg-teal-50 border-teal-200',     badge: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-400'   },
  { key: 'completed',          label: 'เสร็จสิ้น',   color: 'bg-green-50 border-green-200',   badge: 'bg-green-100 text-green-700',   dot: 'bg-green-400'  },
]

const PAYMENT_COLOR: Record<string, string> = {
  pending:  'text-amber-600',
  paid:     'text-green-600',
  failed:   'text-red-500',
  refunded: 'text-gray-400',
}

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
    if (res.success) setOrders(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [token])

  const changeStatus = async (orderId: string, newStatus: string) => {
    if (!token) return
    setUpdating(orderId)
    await fetch(`${API_URL}/orders/${orderId}/status`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchOrders()
    setUpdating(null)
  }

  const getNextStatus = (current: string) => {
    const flow = ['pending_pickup','washing','packing','ready_for_delivery','completed']
    const idx  = flow.indexOf(current)
    return idx < flow.length - 1 ? flow[idx + 1] : null
  }

  const activeOrders   = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
  const completedToday = orders.filter(o => o.status === 'completed').length
  const totalRevenue   = orders.filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + Number(o.totalAmount), 0)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Kanban Board — จัดการสถานะงานซักรีด</p>
        </div>
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors"
        >
          + ดู Orders ทั้งหมด
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders ทั้งหมด',   value: orders.length,        icon: '📦', color: 'bg-white' },
          { label: 'กำลังดำเนินการ',   value: activeOrders.length,  icon: '🔄', color: 'bg-white' },
          { label: 'เสร็จวันนี้',       value: completedToday,        icon: '✅', color: 'bg-white' },
          { label: 'รายรับรวม',         value: `฿${totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-gray-100 shadow-sm`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col.key)
            return (
              <div key={col.key} className={`${col.color} border rounded-2xl p-3 min-h-96`}>

                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${col.badge}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-300 text-xs">ว่าง</div>
                  ) : (
                    colOrders.map(order => {
                      const next = getNextStatus(order.status)
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-xl p-3 shadow-sm border border-white hover:shadow-md transition-shadow"
                        >
                          {/* Order Number */}
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <span className="text-xs font-bold text-gray-900 leading-tight">
                              {order.orderNumber}
                            </span>
                            <span className={`text-xs font-medium shrink-0 ${
                              order.orderType === 'b2b'
                                ? 'text-purple-600'
                                : 'text-gray-400'
                            }`}>
                              {order.orderType.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 mb-2">
                            {formatDate(order.createdAt)}
                          </p>

                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-900">
                              ฿{Number(order.totalAmount).toLocaleString()}
                            </span>
                            <span className={`text-xs font-medium ${PAYMENT_COLOR[order.paymentStatus]}`}>
                              {order.paymentStatus === 'paid' ? '✓ ชำระแล้ว' : 'รอชำระ'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="flex-1 text-center text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              ดู
                            </Link>
                            {next && (
                              <button
                                onClick={() => changeStatus(order.id, next)}
                                disabled={updating === order.id}
                                className="flex-1 text-xs py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >
                                {updating === order.id ? '...' : '→ ถัดไป'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
