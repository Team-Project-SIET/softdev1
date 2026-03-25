const STATS = [
  { num: '10,000+', label: 'ลูกค้าที่ไว้วางใจ' },
  { num: '6 ชม.',   label: 'จัดส่งเร็วสุด'     },
  { num: '60+',     label: 'ปีประสบการณ์'       },
  { num: '4.9 ★',  label: 'คะแนนรีวิวเฉลี่ย'  },
]

export default function Stats() {
  return (
    <section className="bg-gray-900 py-14">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-white">{stat.num}</p>
            <p className="text-gray-400 mt-1 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
