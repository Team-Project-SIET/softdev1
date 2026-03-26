'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/home/Navbar'

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // ถ้าโหลดเสร็จแล้วแต่ยังไม่ได้ login → ไป login page
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/booking')
    }
  }, [isAuthenticated, isLoading])

  // กำลังเช็ค auth อยู่
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ยังไม่ login → ไม่แสดงอะไร (กำลัง redirect)
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop')`,
          filter: 'blur(18px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="fixed inset-0 bg-white/30" />
      <div className="relative z-10">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
