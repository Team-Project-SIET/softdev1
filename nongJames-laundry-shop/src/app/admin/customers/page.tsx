'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Customer = {
  id: string; name: string; phone: string | null
  address: string | null; type: string; isGuest: boolean; createdAt: string
}

export default function AdminCustomersPage() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.success) setCustomers(d.data)
      setLoading(false)
    })
  }, [token])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
        <p className="text-gray-400 text-sm mt-0.5">รายการลูกค้าทั้งหมด ({customers.length} คน)</p>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ หรือเบอร์โทร..."
        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900 w-72 mb-6"
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['ชื่อ','เบอร์โทร','ประเภท','ที่อยู่','สมัครเมื่อ'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">กำลังโหลด...</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i === filtered.length-1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.isGuest && <p className="text-xs text-gray-400">Guest</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.type === 'b2b' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                  {c.address || '-'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(c.createdAt).toLocaleDateString('th-TH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
