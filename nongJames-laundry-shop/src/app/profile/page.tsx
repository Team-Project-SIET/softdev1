'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: '⊞' },
  { href: '/admin/orders',     label: 'Orders',       icon: '📦' },
  { href: '/admin/customers',  label: 'ลูกค้า',       icon: '👥' },
  { href: '/admin/logistics',  label: 'Logistics',    icon: '🚗' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      if (user?.role !== 'admin' && user?.role !== 'executive') {
        router.push('/')
      }
    }
  }, [isLoading, isAuthenticated, user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 flex flex-col fixed h-full z-30">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-900 text-xs font-bold">NJ</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">NongJames</p>
              <p className="text-gray-400 text-xs">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors px-1"
          >
            ออกจากระบบ →
          </button>
        </div>

      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>

    </div>
  )
}
