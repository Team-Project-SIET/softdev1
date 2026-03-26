import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/home/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title:       'NongJames Laundry',
  description: 'บริการซักรีดพรีเมียม ส่งถึงบ้าน',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {/**
         * AuthProvider ครอบทั้ง app
         * ทำให้ทุก page เรียก useAuth() ได้เลย
         */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}