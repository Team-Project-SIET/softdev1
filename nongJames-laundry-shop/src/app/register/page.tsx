'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const ROLE_REDIRECT: Record<string, string> = {
  admin:     '/admin/dashboard',
  driver:    '/driver/tasks',
  executive: '/executive/finance',
  customer:  '/orders',
}

export default function RegisterPage() {
  const router    = useRouter()
  const { login } = useAuth()

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
    role:            'customer',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง')
      return
    }
    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (form.phone && !/^0[0-9]{9}$/.test(form.phone)) {
      setError('เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
          phone:    form.phone || undefined,
          role:     form.role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        return
      }

      // สมัครสำเร็จ → login เลย
      const user = await login(data.data.token, data.data.user)
      router.push(ROLE_REDIRECT[user.role] || '/orders')

    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleLineLogin = () => { window.location.href = `${API_URL}/auth/line` }

  return (
    <div className="min-h-screen flex">

      {/* Left */}
      <div className="hidden lg:flex w-3/5 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=1200&h=900&fit=crop"
          alt="NongJames" fill className="object-cover" priority
        />
        <div className="absolute inset-0 bg-gray-900/55" />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <span className="text-gray-900 text-xs font-bold">NJ</span>
            </div>
            <span className="text-white font-bold text-lg">NongJames</span>
          </Link>
          <div className="pb-8">
            <h2 className="text-4xl font-bold text-white leading-snug">
              ให้เราดูแลเสื้อผ้า<br />ตัวโปรดของคุณ
            </h2>
            <p className="text-white/70 mt-5 leading-relaxed">
              สมัครสมาชิกวันนี้ เพื่อประสบการณ์<br />
              การซักรีดที่ง่ายกว่าเดิม
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">ลงทะเบียน</h1>
            <p className="text-gray-400 mt-1 text-sm">เริ่มต้นประสบการณ์การบริการซัก</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ชื่อ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ชื่อ-นามสกุล</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </span>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* อีเมล */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">อีเมล</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* เบอร์โทร */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                เบอร์โทรศัพท์
                <span className="text-gray-400 font-normal ml-1">(ไม่บังคับ)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </span>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="0812345678" maxLength={10}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* รหัสผ่าน */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">รหัสผ่าน</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="w-full px-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                required minLength={8}
              />
            </div>

            {/* ยืนยันรหัสผ่าน */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ยืนยันรหัสผ่าน</label>
              <input
                type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                className={`w-full px-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 transition-all ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'ring-2 ring-red-300 bg-red-50'
                    : 'focus:ring-gray-900 focus:bg-white'
                }`}
                required
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
              )}
            </div>

            {/* ตำแหน่ง */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ตำแหน่ง</label>
              <div className="w-full px-4 py-3.5 bg-gray-100 rounded-xl text-gray-400 text-sm flex items-center justify-between cursor-not-allowed">
                <span className="text-gray-600">ลูกค้า</span>
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">ค่าเริ่มต้น</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังสมัครสมาชิก...
                </span>
              ) : 'ลงทะเบียน'}
            </button>

          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium tracking-widest">OR CONNECT VIA</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={handleLineLogin}
            className="w-full py-3.5 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#06C755' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            Login with LINE
          </button>

          <p className="text-center mt-6 text-sm text-gray-400">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}