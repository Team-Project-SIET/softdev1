import Navbar from '@/components/home/Navbar'

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blurred background */}
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
