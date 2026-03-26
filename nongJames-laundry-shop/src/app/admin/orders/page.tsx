'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Order = {
  id: string; orderNumber: string; status: string
  orderType: string; totalAmount: string
  paymentStatus: string; createdAt: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_pickup:     { label: 'รอรับผ้า',   color: 'bg-orange-100 text-orange-700' },
  washing:            { label: 'กำลังซัก',   color: 'bg-blue-100 text-blue-700'    },
  packing:            { label: 'กำลังแพ็ค',  color: 'bg-purple-100 text-purple-700'},
  ready_for_delivery: { label: 'พร้อมส่ง',   color: 'bg-teal-100 text-teal-700'   },
  completed:          { label: 'เสร็จสิ้น',  color: 'bg-green-100 text-green-700' },
  cancelled:          { label: 'ยกเลิก',     color: 'bg-red-100 text-red-600'     },
}

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.success) setOrders(d.data)
      setLoading(false)
    })
  }, [token])

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">รายการ Orders ทั้งหมด ({orders.length} รายการ)</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาหมายเลข Order..."
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 w-64"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none"
        >
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['หมายเลข Order','ประเภท','สถานะ','ยอดรวม','ชำระเงิน','วันที่','จัดการ'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  กำลังโหลด...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  ไม่พบ Orders
                </td>
              </tr>
            ) : (
              filtered.map((o, i) => {
                const st = STATUS_LABEL[o.status]
                return (
                  <tr
                    key={o.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        o.orderType === 'b2b'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {o.orderType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${st?.color}`}>
                        {st?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ฿{Number(o.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        o.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {o.paymentStatus === 'paid' ? '✓ ชำระแล้ว' : 'รอชำระ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        จัดการ
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
