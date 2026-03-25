import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="min-h-screen pt-20 bg-stone-50 flex items-center">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-20">

        {/* Left — Text */}
        <div>
          <span className="inline-block text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-4 py-1.5 rounded-full tracking-wide">
            ✦ บริการซักรีดพรีเมียม ส่งถึงบ้าน
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mt-6 leading-tight">
            คุ้มค่า<br />ได้พัก<br />
            <span className="text-gray-400">เพราะเราซักให้</span>
          </h1>
          <p className="text-gray-500 mt-6 text-lg leading-relaxed max-w-md">
            Laundry คือบริการซักอบรีด ที่มีพนักงานไปรับผ้าถึงที่
            ทำความสะอาด · จัดส่งเสื้อผ้าคืน เร็วสุดภายใน 6 ชั่วโมง
          </p>

          <div className="flex items-center gap-4 mt-8">
            <Link
              href="/booking"
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              เริ่มจองบริการ
            </Link>
            <Link
              href="#pricing"
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              ดูราคาเริ่มต้น
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-200">
            <div>
              <p className="text-xl font-bold text-gray-900">4.9★</p>
              <p className="text-xs text-gray-400 mt-0.5">จากรีวิวจริง</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-xl font-bold text-gray-900">10,000+</p>
              <p className="text-xs text-gray-400 mt-0.5">ลูกค้าที่ไว้วางใจ</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-xl font-bold text-gray-900">6 ชม.</p>
              <p className="text-xs text-gray-400 mt-0.5">จัดส่งเร็วสุด</p>
            </div>
          </div>
        </div>

        {/* Right — Image */}
        <div className="relative hidden md:block">
          <div className="absolute -inset-4 bg-stone-200 rounded-3xl -rotate-2" />
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square bg-stone-300">
            <Image
              src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&h=700&fit=crop"
              alt="NongJames Service"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Floating status card */}
          <div className="absolute bottom-8 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">สถานะผ้าของคุณ</p>
                <p className="text-sm font-bold text-gray-900">กำลังซัก · เหลือ 2 ชม.</p>
              </div>
            </div>
          </div>
          {/* Floating rating card */}
          <div className="absolute top-8 -right-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">รีวิวล่าสุด</p>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">"บริการดีมากค่ะ ประทับใจ"</p>
          </div>
        </div>

      </div>
    </section>
  )
}
