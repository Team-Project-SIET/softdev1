const TESTIMONIALS = [
  {
    name: 'คุณสมหญิง วงศ์ดี',
    role: 'สมาชิก Premium',
    text: 'บริการดีมากค่ะ ผ้ามาสะอาด พับเรียบร้อย ส่งตรงเวลา ใช้บริการมาหลายปีแล้วไม่เคยผิดหวังเลย',
    rating: 5,
    initial: 'ส',
  },
  {
    name: 'คุณสมชาย แสนดี',
    role: 'ลูกค้าองค์กร',
    text: 'คุ้มค่ามากครับ ราคาไม่แพง คุณภาพดีกว่าที่คาดไว้ พนักงานสุภาพ ตรงต่อเวลาทุกครั้ง',
    rating: 5,
    initial: 'ช',
  },
  {
    name: 'คุณวิภา รุ่งเรือง',
    role: 'ลูกค้า B2B',
    text: 'ใช้บริการสำหรับโรงแรมค่ะ ผลลัพธ์น่าพอใจมาก สะอาด ตรงเวลา และราคามีความสมเหตุสมผล',
    rating: 5,
    initial: 'ว',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            รีวิว
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            ลูกค้าพูดถึงเรา
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-gray-50 rounded-3xl p-8">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">{t.initial}</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
