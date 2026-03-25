const SERVICES = [
  {
    icon: '◇',
    title: 'ซักพับ',
    desc: 'ดูแลผ้าทุกชิ้นด้วยความละเอียดอ่อน แยกผ้าสีและผ้าขาวอย่างเป็นสัดส่วน พร้อมพับอย่างสวยงามพร้อมใช้งาน',
  },
  {
    icon: '⌂',
    title: 'ซักแห้ง',
    desc: 'นวัตกรรมการซักแห้งที่เป็นมิตรต่อสิ่งแวดล้อม บำรุงเนื้อผ้าแบรนด์เนมและผ้าไหมที่คุณรักให้ดูใหม่อยู่เสมอ',
  },
  {
    icon: '⌁',
    title: 'ซักผ้าหนัก-ผ้าห่ม',
    desc: 'ทีมผู้เชี่ยวชาญการรีดผ้าที่เก็บทุกรายละเอียด ให้เสื้อเชิ้ตและชุดทางการของคุณเนี้ยบในระดับมืออาชีพ',
  },
]

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            บริการของเรา
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            บริการซักอบรีดแบบพรีเมียม
          </h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto">
            ทุกบริการผ่านกระบวนการดูแลที่ได้มาตรฐาน พร้อมรับประกันความพึงพอใจ
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map(s => (
            <div
              key={s.title}
              className="group bg-gray-50 rounded-3xl p-8 hover:bg-gray-900 transition-all duration-300 cursor-pointer"
            >
              <div className="w-14 h-14 bg-white group-hover:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl text-gray-600 group-hover:text-white shadow-sm mb-6 transition-all">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors">
                {s.title}
              </h3>
              <p className="text-gray-500 group-hover:text-gray-400 leading-relaxed text-sm transition-colors">
                {s.desc}
              </p>
              <div className="mt-6 flex items-center gap-1 text-sm font-medium text-gray-600 group-hover:text-gray-300 transition-all">
                รายละเอียด
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
