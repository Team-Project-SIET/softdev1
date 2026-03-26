'use client'

/**
 * หน้านี้รับ token จาก LINE/Google OAuth แล้ว:
 * 1. เก็บ token
 * 2. ดึงข้อมูล user
 * 3. redirect ตาม role
 *
 * URL ที่ได้รับ: /auth/callback?token=eyJhbGci...
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// redirect แต่ละ role ไปหน้าไหน
const ROLE_REDIRECT: Record<string, string> = {
  admin:     '/admin/dashboard',
  driver:    '/driver/tasks',
  executive: '/executive/finance',
  customer:  '/orders',
}

export default function AuthCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { login }    = useAuth()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    // มี error จาก OAuth
    if (error) {
      setStatus('error')
      setErrMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง')
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    // ไม่มี token
    if (!token) {
      setStatus('error')
      setErrMsg('ไม่พบข้อมูล token กรุณาลองใหม่อีกครั้ง')
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    // login และ redirect ตาม role
    login(token)
      .then(user => {
        const redirect = ROLE_REDIRECT[user.role] || '/orders'
        router.push(redirect)
      })
      .catch(() => {
        setStatus('error')
        setErrMsg('Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่')
        setTimeout(() => router.push('/login'), 3000)
      })
  }, [])

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 mt-4 text-sm font-medium">กำลังเข้าสู่ระบบ...</p>
          <p className="text-gray-400 mt-1 text-xs">กรุณารอสักครู่</p>
        </div>
      </div>
    )
  }

  // Error
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full mx-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-500 text-xl">✕</span>
        </div>
        <h2 className="text-gray-900 font-bold mt-4">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-500 text-sm mt-2">{errMsg}</p>
        <p className="text-gray-400 text-xs mt-2">กำลังพาไปหน้า Login...</p>
      </div>
    </div>
  )
}
