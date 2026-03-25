'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'รู้จักเรา',              href: '#about'        },
  { label: 'การบริการ',              href: '#services'     },
  { label: 'ขั้นตอนการให้บริการ',   href: '#how-it-works' },
  { label: 'เคล็ดลับการดูแลผ้า',    href: '#tips'         },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white shadow-sm py-3'
        : 'bg-white/80 backdrop-blur-md py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">NJ</span>
          </div>
          <span className="font-bold text-lg text-gray-900">NongJames</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden md:block">ไทย | EN</span>
          <Link
            href="/login"
            className="text-sm px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="text-sm px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            ลงทะเบียน
          </Link>
        </div>

      </div>
    </nav>
  )
}
