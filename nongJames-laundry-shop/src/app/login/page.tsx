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
  customer:  '/',
}

export default function LoginPage() {
  const router     = useRouter()
  const { login }  = useAuth()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: form.email, password: form.password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'เกิดข้อผิดพลาด')
      return
    }

    // ← ส่ง user data ตรงๆ ไม่ต้องเรียก /auth/me อีกรอบ
    const user = await login(data.data.token, data.data.user)
    router.push(ROLE_REDIRECT[user.role] || '/orders')

  } catch (err) {
    console.error('Login error:', err)
    setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    setLoading(false)
  }
  }

  const handleLineLogin   = () => { window.location.href = `${API_URL}/auth/line`   }
  const handleGoogleLogin = () => { window.location.href = `${API_URL}/auth/google` }

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
              การซักรีดที่ง่ายกว่าเดิม<br />
              สั่งงานผ่านเว็บ เช็คสถานะได้เรียลไทม์
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">

          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
            <p className="text-gray-400 mt-1 text-sm">เริ่มต้นประสบการณ์การบริการซัก</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">อีเมล</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">รหัสผ่าน</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                required
              />
              <div className="flex justify-end mt-1.5">
                <button type="button" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ลืมรหัสผ่าน?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>

          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium tracking-widest">OR CONNECT VIA</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLineLogin}
              className="w-full py-3.5 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#06C755' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              Login with LINE OA
            </button>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-xl font-medium text-sm text-gray-700 bg-gray-50 border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Login with Google
            </button>
          </div>

          <p className="text-center mt-8 text-sm text-gray-400">
            ยังไม่มีบัญชี?{' '}
            <Link href="/register" className="text-gray-900 font-medium hover:underline">
              ลงทะเบียน
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
