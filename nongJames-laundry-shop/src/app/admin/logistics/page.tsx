'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Task = {
  id: string; taskType: string; status: string
  assignedAt: string; completedAt: string | null
  notes: string | null; orderNumber: string
  orderStatus: string; driverName: string
}

type Driver = { id: string; name: string; email: string }

const STATUS_COLOR: Record<string, string> = {
  assigned:    'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-600',
}

export default function AdminLogisticsPage() {
  const { token } = useAuth()
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    orderId: '', driverId: '', taskType: 'pickup', notes: ''
  })
  const [assigning, setAssigning] = useState(false)
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  const fetchData = async () => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    const [tasksRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/logistics/tasks`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/auth/me`, { headers }).then(r => r.json()), // placeholder
    ])

    if (tasksRes.success) setTasks(tasksRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [token])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !form.orderId || !form.driverId) return
    setAssigning(true)
    setError('')

    const res = await fetch(`${API_URL}/logistics/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        orderId:  form.orderId,
        driverId: form.driverId,
        taskType: form.taskType,
        notes:    form.notes || undefined,
      }),
    }).then(r => r.json())

    if (res.success) {
      setSuccess('มอบหมายงานสำเร็จ!')
      setForm({ orderId: '', driverId: '', taskType: 'pickup', notes: '' })
      await fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(res.message || 'เกิดข้อผิดพลาด')
    }
    setAssigning(false)
  }

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Logistics</h1>
        <p className="text-gray-400 text-sm mt-0.5">มอบหมายงานและติดตาม Driver</p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Assign Form */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">มอบหมายงานใหม่</h2>

            {success && (
              <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs">
                ✅ {success}
              </div>
            )}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Order ID</label>
                <input
                  value={form.orderId}
                  onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))}
                  placeholder="UUID ของ Order"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Driver ID</label>
                <input
                  value={form.driverId}
                  onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))}
                  placeholder="UUID ของ Driver"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ประเภทงาน</label>
                <select
                  value={form.taskType}
                  onChange={e => setForm(p => ({ ...p, taskType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none"
                >
                  <option value="pickup">🚗 รับผ้า (Pickup)</option>
                  <option value="delivery">🚚 ส่งผ้า (Delivery)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">หมายเหตุ</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="โทรนัดก่อน, ชั้น 5..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={assigning}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {assigning ? 'กำลังมอบหมาย...' : 'มอบหมายงาน'}
              </button>
            </form>
          </div>
        </div>

        {/* Tasks List */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order', 'Driver', 'ประเภท', 'สถานะ', 'หมายเหตุ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">กำลังโหลด...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">ยังไม่มีงาน</td></tr>
                ) : (
                  tasks.map((task, i) => (
                    <tr key={task.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i === tasks.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">
                        {task.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.driverName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {task.taskType === 'pickup' ? '🚗 รับผ้า' : '🚚 ส่งผ้า'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[task.status] || 'bg-gray-100 text-gray-700'}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {task.notes ? task.notes : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}