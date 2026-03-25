const STEPS = [
  {
    num: '01',
    title: 'จองออนไลน์',
    desc: 'เลือกบริการที่ต้องการ กำหนดวันเวลา และที่อยู่รับผ้า ผ่านหน้าเว็บไซต์หรือ LINE OA ได้เลย',
  },
  {
    num: '02',
    title: 'รับผ้า & ซัก',
    desc: 'พนักงานเข้ารับผ้าถึงที่ ตรวจสอบรายการ และนำไปซัก อบ รีด ตามแพ็กเกจที่เลือก',
  },
  {
    num: '03',
    title: 'จัดส่งคืนถึงบ้าน',
    desc: 'ผ้าสะอาดพร้อมใช้งาน ถูกจัดส่งกลับถึงบ้านตามเวลาที่กำหนด พร้อมแจ้งเตือนทุกขั้นตอน',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-8">

        <div className="mb-16">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            ขั้นตอน
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            3 ขั้นตอนในการใช้บริการ
          </h2>
          <p className="text-gray-400 mt-2">สะดวก รวดเร็ว พร้อมบริการระดับ VIP</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative">

              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gray-200 z-0" />
              )}

              <div className="bg-white rounded-3xl p-8 shadow-sm relative z-10">
                <span className="text-5xl font-black text-gray-100 block mb-4">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
