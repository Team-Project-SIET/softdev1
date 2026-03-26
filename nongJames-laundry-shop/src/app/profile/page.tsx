'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Form = {
  name:          string
  phone:         string
  email:         string
  houseNo:       string
  building:      string
  road:          string
  subDistrict:   string
  district:      string
  province:      string
  mapLink:       string
  noSpinDry:     boolean
  washOnly:      boolean
  separateWhite: boolean
  notes:         string
}

// ── Toggle Component ──────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-blue-500' : 'bg-gray-200'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ── Input Component ───────────────────────────────────────────────────
function Input({
  value, onChange, placeholder, type = 'text', disabled = false
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

export default function ProfilePage() {
  const { user, token, logout } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<Form>({
    name:          '',
    phone:         '',
    email:         '',
    houseNo:       '',
    building:      '',
    road:          '',
    subDistrict:   '',
    district:      '',
    province:      'กรุงเทพมหานคร',
    mapLink:       '',
    noSpinDry:     false,
    washOnly:      false,
    separateWhite: false,
    notes:         '',
  })
  const [loading, setSaving] = useState(false)
  const [toast,   setToast]  = useState('')

  // โหลดข้อมูล user เริ่มต้น
  useEffect(() => {
    if (!user) return
    setForm(prev => ({
      ...prev,
      name:  user.name  || '',
      email: user.email || '',
    }))

    // ดึงข้อมูล customer จาก API
    if (!token) return
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const c = d.data
          setForm(prev => ({
            ...prev,
            phone: c.phone || '',
          }))
        }
      })
      .catch(() => {})
  }, [user, token])

  const setField = <K extends keyof Form>(key: K, val: Form[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // รวม address เป็น string
      const address = [
        form.houseNo,
        form.building,
        `ถนน${form.road}`,
        `แขวง${form.subDistrict}`,
        `เขต${form.district}`,
        form.province,
      ].filter(Boolean).join(' ')

      // TODO: เรียก PATCH /customers/:id เมื่อมี endpoint
      console.log('save:', { ...form, address })

      setToast('บันทึกข้อมูลสำเร็จ!')
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop')`,
          filter: 'blur(16px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="fixed inset-0 bg-white/25" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Toast */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-6 py-3 rounded-2xl shadow-xl">
            {toast}
          </div>
        )}

        <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 pt-28">

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ═══ LEFT ══════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* ข้อมูลส่วนตัว */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">ชื่อ-นามสกุล</label>
                    <Input value={form.name} onChange={v => setField('name', v)} placeholder="ชื่อ-นามสกุล" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">เบอร์โทร</label>
                    <Input value={form.phone} onChange={v => setField('phone', v)} placeholder="0812345678" type="tel" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">อีเมล</label>
                    <Input value={form.email} disabled placeholder="อีเมล" />
                    <p className="text-xs text-gray-400 mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
                  </div>
                </div>
              </div>

              {/* ความชอบ & หมายเหตุ */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-800">ความชอบส่วนตัว & หมายเหตุ</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'noSpinDry',     label: 'ไม่ใช้ยาปรับผ้านุ่ม',   icon: '🧴' },
                    { key: 'washOnly',      label: 'ซักมือด้วยเท่านั้น',      icon: '🫧' },
                    { key: 'separateWhite', label: 'แยกชักผ้าขาว',         icon: '👕' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <Toggle
                        checked={form[item.key as keyof Form] as boolean}
                        onChange={() => setField(item.key as keyof Form, !form[item.key as keyof Form] as any)}
                      />
                    </div>
                  ))}

                  <div className="pt-2">
                    <label className="text-xs text-gray-500 font-medium mb-1.5 block">หมายเหตุเพิ่มเติม</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setField('notes', e.target.value)}
                      placeholder="ระบุข้อความพิเศษสำหรับพนักงาน..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT ═════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* ที่อยู่ */}
              <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-800">ที่อยู่รับ-ส่งผ้า</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">บ้านเลขที่/ห้อง</label>
                    <Input value={form.houseNo} onChange={v => setField('houseNo', v)} placeholder="123/45" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">อาคาร/บ้าน</label>
                    <Input value={form.building} onChange={v => setField('building', v)} placeholder="พริสติม คอนโด" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">ถนน</label>
                    <Input value={form.road} onChange={v => setField('road', v)} placeholder="สุขุมวิท 24" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">แขวง/ตำบล</label>
                    <Input value={form.subDistrict} onChange={v => setField('subDistrict', v)} placeholder="คลองตัน" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">แขวง/อำเภอ</label>
                    <Input value={form.district} onChange={v => setField('district', v)} placeholder="คลองเตย" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">จังหวัด</label>
                    <Input value={form.province} onChange={v => setField('province', v)} placeholder="กรุงเทพมหานคร" />
                  </div>
                </div>

                {/* Map */}
                <div className="mt-4">
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                    📍 ปักหมุดตำแหน่ง (MAP)
                  </label>
                  <Input
                    value={form.mapLink}
                    onChange={v => setField('mapLink', v)}
                    placeholder="วาง Google Maps link ที่นี่..."
                  />

                  {/* Map Preview */}
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 h-44 bg-gray-100">
                    {form.mapLink ? (
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(form.mapLink)}&output=embed`}
                        width="100%" height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                        <p className="text-xs">ใส่ Google Maps link เพื่อแสดงแผนที่</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div className="mt-3">
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">หมายเหตุที่อยู่</label>
                  <textarea
                    placeholder="เช่น ฝากผ้าไว้ที่รปภ. แจ้งห้องเลข 123 ได้เลยครับ"
                    rows={2}
                    className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ── Bottom Actions ──────────────────────────────────────── */}
          <div className="mt-6 bg-white/60 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-gray-400 text-sm mt-0.5">©</span>
              <p className="text-gray-500 text-xs leading-relaxed">
                การเปลี่ยนแปลงข้อมูลจะมีผลต่อคำสั่งซื้อในอนาคตทันที
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-6 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                ยกเลิก
              </Link>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-8 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </div>
  )
}
