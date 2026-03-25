import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-3xl mx-auto px-8 text-center">
        <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
          เริ่มต้นวันนี้
        </span>
        <h2 className="text-4xl font-bold text-white mt-4">
          พร้อมให้เราดูแลผ้าของคุณ?
        </h2>
        <p className="text-gray-400 mt-4 text-lg leading-relaxed">
          เริ่มต้นง่ายๆ ใน 3 ขั้นตอน<br />
          รับผ้าสะอาดถึงบ้านภายใน 6 ชั่วโมง
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/booking"
            className="px-8 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            เริ่มจองบริการ
          </Link>
          <Link
            href="#pricing"
            className="px-8 py-3 border border-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            ดูแพ็กเกจ
          </Link>
        </div>
      </div>
    </section>
  )
}
