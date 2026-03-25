import Image from 'next/image'
import Link from 'next/link'

const BLOGS = [
  {
    title: 'วิธีจัดคราบเปื้อนอย่างมืออาชีพ',
    excerpt: 'รวมเทคนิคการจัดคราบกาแฟ ไวน์แดง และคราบเครื่องสำอางให้หายเกลี้ยงโดยไม่ทำลายเส้นใย...',
    tag: 'เคล็ดลับ',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
  },
  {
    title: 'จัดตู้เสื้อผ้าแบบ Minimal',
    excerpt: 'เปลี่ยนตู้เสื้อผ้าที่วุ่นวายให้เป็นระเบียบตามสไตล์ Aqua Atelier ช่วยการแต่งตัวง่ายขึ้นทุกวัน...',
    tag: 'ไลฟ์สไตล์',
    img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=250&fit=crop',
  },
  {
    title: 'การดูแลผ้าไหมให้สวยงาม',
    excerpt: 'ผ้าไหมต้องการการดูแลเป็นพิเศษ มาดูวิธีการซักและการเก็บรักษาที่ถูกต้องเพื่อคงความงดงาม...',
    tag: 'ผ้าพิเศษ',
    img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=250&fit=crop',
  },
]

export default function Blog() {
  return (
    <section id="tips" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
              บทความ
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3">เคล็ดลับการดูแลผ้า</h2>
            <p className="text-gray-400 mt-1">สาระดีๆ เพื่อการถนอมเสื้อผ้าที่คุณรัก</p>
          </div>
          <Link
            href="/blog"
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors hidden md:block"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOGS.map(blog => (
            <div
              key={blog.title}
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={blog.img}
                  alt={blog.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 text-xs bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-medium text-gray-700">
                  {blog.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 underline underline-offset-2 group-hover:text-gray-600 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {blog.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-600">
                  อ่านต่อ
                  <span className="group-hover:translate-x-0.5 transition-transform inline-block">↗</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
