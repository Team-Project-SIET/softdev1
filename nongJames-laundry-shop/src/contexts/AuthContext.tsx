'use client'

import {
  createContext, useContext,
  useState, useEffect,
  type ReactNode,
} from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type User = {
  id:    string
  name:  string
  email: string
  role:  'admin' | 'driver' | 'executive' | 'customer'
}

type AuthContextType = {
  user:            User | null
  token:           string | null
  isLoading:       boolean
  isAuthenticated: boolean
  login:           (token: string, userData?: User) => Promise<User>
  logout:          () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('nj_token')
    const storedUser  = localStorage.getItem('nj_user')  // ← อ่าน user ด้วย

    if (storedToken && storedUser) {
      try {
        // ✅ อ่านจาก localStorage เลย ไม่ต้องเรียก API
        const parsedUser = JSON.parse(storedUser) as User
        setUser(parsedUser)
        setToken(storedToken)
      } catch {
        // ถ้า parse ไม่ได้ → clear ทั้งหมด
        localStorage.removeItem('nj_token')
        localStorage.removeItem('nj_user')
        document.cookie = 'nj_token=; path=/; max-age=0'
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (tkn: string, userData?: User): Promise<User> => {
    if (userData) {
      // ✅ มี userData → เก็บเลย ไม่ต้องเรียก API
      localStorage.setItem('nj_token', tkn)
      localStorage.setItem('nj_user', JSON.stringify(userData)) // ← เก็บ user ด้วย
      document.cookie = `nj_token=${tkn}; path=/; max-age=604800; SameSite=Lax`
      setUser(userData)
      setToken(tkn)
      return userData
    }

    // กรณีไม่มี userData → เรียก /auth/me
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
    if (!res.ok) throw new Error('Invalid token')

    const { data } = await res.json()
    localStorage.setItem('nj_token', tkn)
    localStorage.setItem('nj_user', JSON.stringify(data)) // ← เก็บ user ด้วย
    document.cookie = `nj_token=${tkn}; path=/; max-age=604800; SameSite=Lax`
    setUser(data)
    setToken(tkn)
    return data
  }

  const logout = () => {
    localStorage.removeItem('nj_token')
    localStorage.removeItem('nj_user') // ← ลบ user ด้วย
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน <AuthProvider>')
  return ctx
}
