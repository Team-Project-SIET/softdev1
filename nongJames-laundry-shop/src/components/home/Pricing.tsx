'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    name:     'Basic',
    monthly:  199,
    yearly:   1990,
    desc:     'เหมาะสำหรับผู้เริ่มต้น',
    color:    'bg-white',
    highlight: false,
    features: [
      { text: 'ส่วนลด 5% ทุก Order',     included: true  },
      { text: 'ส่งฟรีทุกครั้ง',           included: false },
      { text: 'แจ้งสถานะผ่าน LINE',       included: true  },
      { text: 'Priority pick-up',          included: false },
      { text: 'Account manager',           included: false },
    ],
  },
  {
    name:     'Monthly',
    monthly:  299,
    yearly:   2990,
    desc:     'ยอดนิยม — คุ้มค่าที่สุด',
    color:    'bg-gray-900',
    highlight: true,
    features: [
      { text: 'ส่วนลด 10% ทุก Order',     included: true },
      { text: 'ส่งฟรีทุกครั้ง',           included: true },
      { text: 'แจ้งสถานะผ่าน LINE',       included: true },
      { text: 'Priority pick-up',          included: true },
      { text: 'Account manager',           included: false},
    ],
  },
  {
    name:     'Yearly',
    monthly:  249,
    yearly:   2990,
    desc:     'ประหยัดสุด — เหมาะรายปี',
    color:    'bg-white',
    highlight: false,
    features: [
      { text: 'ส่วนลด 20% ทุก Order',     included: true },
      { text: 'ส่งฟรีทุกครั้ง',           included: true },
      { text: 'แจ้งสถานะผ่าน LINE',       included: true },
      { text: 'Priority pick-up',          included: true },
      { text: 'Account manager',           included: true },
    ],
  },
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            แพ็กเกจ
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h2>
          <p className="text-gray-400 mt-3">ยกเลิกได้ทุกเวลา ไม่มีผูกมัด</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              รายเดือน
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                isYearly ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              รายปี
            </span>
            {isYearly && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ประหยัด 17%
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col border transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gray-900 border-gray-900 shadow-2xl md:scale-105'
                  : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Plan Header */}
              <div className="mb-8">
                {plan.highlight && (
                  <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full mb-3 inline-block">
                    ⭐ ยอดนิยม
                  </span>
                )}
                <p className={`text-sm mt-1 ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                  {plan.desc}
                </p>
                <h3 className={`text-2xl font-bold mt-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mt-5">
                  <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    ฿{isYearly
                      ? plan.name === 'Yearly'
                        ? (plan.yearly / 12).toFixed(0)
                        : plan.monthly
                      : plan.monthly
                    }
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                    /เดือน
                  </span>
                </div>

                {isYearly && plan.name === 'Yearly' && (
                  <p className="text-xs text-green-400 mt-1">
                    ชำระ ฿{plan.yearly.toLocaleString()} ต่อปี
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className={`h-px mb-8 ${plan.highlight ? 'bg-white/10' : 'bg-gray-100'}`} />

              {/* Features */}
              <ul className="space-y-4 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      f.included
                        ? plan.highlight
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-700'
                        : plan.highlight
                          ? 'bg-white/5 text-white/20'
                          : 'bg-gray-50 text-gray-300'
                    }`}>
                      {f.included ? '✓' : '✕'}
                    </span>
                    <span className={`text-sm ${
                      f.included
                        ? plan.highlight ? 'text-gray-300' : 'text-gray-600'
                        : plan.highlight ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={`w-full py-3 rounded-xl font-medium text-sm text-center transition-colors ${
                  plan.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                เลือกแพ็กเกจนี้
              </Link>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-gray-400 text-sm mt-10">
          ✦ ทุกแพ็กเกจมีทดลองใช้ฟรี 7 วัน · ยกเลิกได้ทุกเวลา · ไม่คิดค่าธรรมเนียมแรกเข้า
        </p>

      </div>
    </section>
  )
}
