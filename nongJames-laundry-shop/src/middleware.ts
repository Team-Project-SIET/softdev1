import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware = โค้ดที่รันก่อนทุก request
 * ใช้ตรวจสอบว่า user login แล้วหรือยัง
 *
 * ถ้าเข้าหน้าที่ต้อง login แต่ยังไม่ได้ login
 * → redirect ไป /login ทันที
 */

// หน้าที่ต้อง login ก่อน
const PROTECTED = ['/orders', '/profile', '/admin', '/driver', '/executive']

// หน้าที่ต้อง role เฉพาะ
const ROLE_REQUIRED: Record<string, string[]> = {
  '/admin':     ['admin', 'staff'],
  '/driver':    ['driver'],
  '/executive': ['executive', 'admin'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ดึง token จาก cookie
  const token = request.cookies.get('nj_token')?.value

  // เช็คว่าเป็น protected route ไหม
  const isProtected = PROTECTED.some(r => pathname.startsWith(r))

  // ยังไม่ login แต่พยายามเข้า protected route
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname) // เก็บ path ไว้ redirect กลับหลัง login
    return NextResponse.redirect(loginUrl)
  }

  // ถ้า login แล้วแต่พยายามเข้า /login หรือ /register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/orders', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/orders/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/driver/:path*',
    '/executive/:path*',
    '/login',
    '/register',
  ],
}
