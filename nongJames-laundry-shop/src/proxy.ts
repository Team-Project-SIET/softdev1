// src/proxy.ts  ← ชื่อไฟล์ใหม่
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/orders', '/profile', '/admin', '/driver', '/executive']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('nj_token')?.value

  const isProtected = PROTECTED.some(r => pathname.startsWith(r))

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
