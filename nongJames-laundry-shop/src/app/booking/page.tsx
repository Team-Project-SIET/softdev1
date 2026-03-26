'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SERVICES = [
  {
    id: 'wash_fold',
    name: 'ผ้าทั่วไป',
    icon: '◇',
    color: 'text-orange-500',
    bg: 'bg-white',
  },
  {
    id: 'delicate',
    name: 'ผ้าละเอียด',
    icon: '⌂',
    color: 'text-blue-400',
    bg: 'bg-white',
  },
  {
    id: 'heavy',
    name: 'ผ้าหนัก-ผ้าห่ม',
    icon: '⌁',
    color: 'text-amber-400',
    bg: 'bg-white',
  },
]

const OPTIONS = [
  { id: 'wash_only', label: 'ซักอบ',    time: 'ระยะเวลา 1-2 ชม.' },
  { id: 'wash_iron', label: 'ซักอบรีด', time: 'ระยะเวลา 2-3 ชม.' },
  { id: 'dry_clean', label: 'ซักแห้ง',  time: 'ระยะเวลา 1 ชม.'   },
]

export default function BookingPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)

  const service = SERVICES[idx]
  const prev = () => setIdx(i => (i - 1 + SERVICES.length) % SERVICES.length)
  const next = () => setIdx(i => (i + 1) % SERVICES.length)

  const handleSelect = (opt: typeof OPTIONS[0]) => {
    sessionStorage.setItem('nj_booking', JSON.stringify({
      serviceId:    service.id,
      serviceName:  service.name,
      optionId:     opt.id,
      optionLabel:  opt.label,
    }))
    router.push('/booking/summary')
  }

  return (
    <div className="min-h-screen flex flex-col pt-20">

      {/* Back */}
      <Link href="/orders" className="absolute top-24 left-6 z-20">
        <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </div>
      </Link>

      {/* Title */}
      <div className="text-center py-8">
        <h1 className="text-lg font-bold text-gray-800">บริการซักอบรีดแบบพรีเมียม</h1>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-10">

          {/* Prev */}
          <button onClick={prev} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors">
            ‹
          </button>

          {/* Card */}
          <div className="text-center">
            <div className={`w-40 h-40 ${service.bg} rounded-full flex items-center justify-center shadow-xl mx-auto border border-white/80`}>
              <span className={`text-7xl ${service.color}`}>{service.icon}</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mt-6 drop-shadow-sm">
              {service.name}
            </h2>
          </div>

          {/* Next */}
          <button onClick={next} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors">
            ›
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-6">
          {SERVICES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx ? 'w-6 h-2 bg-gray-800' : 'w-2 h-2 bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="pb-16 px-8">
        <div className="flex gap-4 justify-center max-w-xl mx-auto">
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className="flex-1 bg-white/60 backdrop-blur-md border border-white/70 hover:bg-white rounded-3xl px-4 py-5 text-center transition-all hover:shadow-lg hover:-translate-y-1 shadow-sm"
            >
              <p className="font-bold text-gray-800 text-sm">{opt.label}</p>
              <p className="text-gray-500 text-xs mt-1">{opt.time}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
