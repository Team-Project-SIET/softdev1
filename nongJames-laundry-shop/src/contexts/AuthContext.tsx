'use client'

/**
 * AuthContext คือ "กล่องเก็บข้อมูล user" ที่แชร์ให้ทุก component ใช้ได้
 *
 * วิธีทำงาน:
 * 1. ตอน app เปิด → อ่าน token จาก localStorage แล้วดึงข้อมูล user
 * 2. ทุก component ที่ต้องการข้อมูล user → เรียก useAuth()
 *
 * ตัวอย่างการใช้:
 * const { user, isAuthenticated, logout } = useAuth()
 */

import {
  createContext, useContext,
  useState, useEffect,
  type ReactNode,
} from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Type ──────────────────────────────────────────────────────────────
export type User = {
  id:    string
  name:  string
  email: string
  role:  'admin' | 'driver' | 'executive' | 'customer'
}

type AuthContextType = {
  user:            User | null
  token:           string | null
  isLoading:       boolean   // กำลังโหลดอยู่ (ตอน app boot)
  isAuthenticated: boolean   // login แล้วหรือยัง
  login:           (token: string) => Promise<User>
  logout:          () => void
}

// ── Context ───────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * ตอน app เริ่มต้น → เช็คว่ามี token ค้างอยู่ใน localStorage ไหม
   * ถ้ามี → ดึงข้อมูล user จาก API
   */
  useEffect(() => {
    const stored = localStorage.getItem('nj_token')
    if (stored) {
      fetchUser(stored).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  /** ดึงข้อมูล user จาก API ด้วย token */
  const fetchUser = async (tkn: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
    if (!res.ok) {
      // token หมดอายุหรือ invalid → ลบทิ้ง
      localStorage.removeItem('nj_token')
      document.cookie = 'nj_token=; path=/; max-age=0'
      return
    }
    const { data } = await res.json()
    setUser(data)
    setToken(tkn)
  }

  /**
   * login(token) → เรียกหลังได้ token จาก OAuth callback
   * return: User object (สำหรับ redirect ตาม role)
   */
  const login = async (tkn: string): Promise<User> => {
    // เก็บ token ลง localStorage (client) และ Cookie (middleware)
    localStorage.setItem('nj_token', tkn)
    document.cookie = `nj_token=${tkn}; path=/; max-age=604800; SameSite=Lax`

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
    if (!res.ok) throw new Error('Invalid token')

    const { data } = await res.json()
    setUser(data)
    setToken(tkn)
    return data
  }

  /** logout → ลบ token และ redirect กลับหน้าแรก */
  const logout = () => {
    localStorage.removeItem('nj_token')
    document.cookie = 'nj_token=; path=/; max-age=0'
    setUser(null)
    setToken(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน <AuthProvider>')
  return ctx
}
