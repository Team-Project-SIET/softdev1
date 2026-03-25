import Image from 'next/image'

const FEATURES = [
  {
    icon: '✦',
    title: 'Expertise',
    desc: 'ดูแลโดยผู้เชี่ยวชาญด้านผ้าที่มีประสบการณ์มากกว่า 60 ปี',
  },
  {
    icon: '◉',
    title: 'Eco-friendly',
    desc: 'ใช้น้ำยาซักผ้าออร์แกนิค ปลอดภัยต่อคุณและโลก',
  },
  {
    icon: '⊞',
    title: 'Fast Delivery',
    desc: 'บริการรับ-ส่งตรงเวลา พร้อมแจ้งสถานะแบบ Real-time',
  },
  {
    icon: '◈',
    title: 'Insurance',
    desc: 'รับประกันความเสียหาย สูงสุด 10 เท่าของค่าบริการ',
  },
]

export default function WhyChoose() {
  return (
    <section id="about" className="py-24 bg-stone-200">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div>
          <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            ทำไมต้องเลือกเรา
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-12">
            ทำไมต้องเลือก<br />NongJames
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-gray-600 text-lg shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{f.title}</p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="relative hidden md:block">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square bg-stone-300">
            <Image
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=600&fit=crop"
              alt="Why NongJames"
              fill
              className="object-cover"
            />
          </div>
        </div>

      </div>
    </section>
  )
}
