'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const STATUSES = [
  { key: 'pending_pickup',     label: '🚗 รอรับผ้า'   },
  { key: 'washing',            label: '🫧 กำลังซัก'   },
  { key: 'packing',            label: '📦 กำลังแพ็ค'  },
  { key: 'ready_for_delivery', label: '🚚 พร้อมส่ง'   },
  { key: 'completed',          label: '✅ เสร็จสิ้น'  },
  { key: 'cancelled',          label: '❌ ยกเลิก'     },
]

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuth()
  const [order,    setOrder]    = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [note,     setNote]     = useState('')
  const [success,  setSuccess]  = useState('')

  const fetchOrder = async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
    if (res.success) setOrder(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchOrder() }, [token])

  const handleChangeStatus = async (newStatus: string) => {
    if (!token) return
    setUpdating(true)
    const res = await fetch(`${API_URL}/orders/${params.id}/status`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus, note: note || undefined }),
    }).then(r => r.json())

    if (res.success) {
      setSuccess(`อัปเดตสถานะเป็น "${newStatus}" แล้ว`)
      setNote('')
      await fetchOrder()
      setTimeout(() => setSuccess(''), 3000)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">ไม่พบ Order</p>
        <Link href="/admin/orders" className="text-sm text-blue-600 underline mt-2 block">
          กลับรายการ
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">

      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-700 transition-colors">
          ← กลับ
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-400 text-sm">รายละเอียด Order</p>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✅ {success}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">

        {/* Left */}
        <div className="col-span-2 space-y-6">

          {/* Order Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">ข้อมูล Order</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'หมายเลข',    value: order.orderNumber },
                { label: 'ประเภท',     value: order.orderType?.toUpperCase() },
                { label: 'สถานะ',      value: order.status },
                { label: 'ชำระเงิน',   value: order.paymentStatus },
                { label: 'ยอดรวม',     value: `฿${Number(order.totalAmount).toLocaleString()}` },
                { label: 'ค่าส่ง',     value: `฿${Number(order.deliveryFee).toLocaleString()}` },
                { label: 'ส่วนลด',     value: `฿${Number(order.discountAmount).toLocaleString()}` },
                { label: 'ที่อยู่รับ',  value: order.pickupAddress || '-' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-gray-400 text-xs mb-0.5">{row.label}</p>
                  <p className="font-medium text-gray-900">{row.value}</p>
                </div>
              ))}
            </div>
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">หมายเหตุ</p>
                <p className="text-gray-700 text-sm">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">รายการบริการ</h2>
            {order.items?.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        รายการที่ {order.items.indexOf(item) + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        {Number(item.quantity)} หน่วย × ฿{Number(item.unitPrice).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      ฿{Number(item.subtotal).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">ไม่มีรายการ</p>
            )}
          </div>

        </div>

        {/* Right — Change Status */}
        <div className="space-y-4">

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">เปลี่ยนสถานะ</h2>

            <div className="space-y-2 mb-4">
              {STATUSES.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleChangeStatus(s.key)}
                  disabled={updating || order.status === s.key}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    order.status === s.key
                      ? 'bg-gray-900 text-white font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                  }`}
                >
                  {s.label}
                  {order.status === s.key && <span className="ml-2 text-xs opacity-70">← ปัจจุบัน</span>}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1.5">หมายเหตุ (ไม่บังคับ)</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="เช่น รับผ้าแล้ว เริ่มซัก..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">ประวัติสถานะ</h2>
            <div className="space-y-3">
              {order.items?.length === 0 && (
                <p className="text-gray-400 text-xs">ไม่มีประวัติ</p>
              )}
              <p className="text-xs text-gray-400">
                สร้างเมื่อ{' '}
                {new Date(order.createdAt).toLocaleDateString('th-TH', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
