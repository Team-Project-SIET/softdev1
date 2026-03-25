import Link from 'next/link'

const FOOTER_LINKS = [
  {
    title: 'Company',
    links: [
      { label: 'Privacy Policy',  href: '/privacy'  },
      { label: 'Terms of Service', href: '/terms'   },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Dry Cleaning', href: '/services/dry-cleaning' },
      { label: 'Wash & Fold',  href: '/services/wash-fold'   },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ',        href: '/faq'     },
    ],
  },
  {
    title: 'Values',
    links: [
      { label: 'Sustainability', href: '/sustainability' },
    ],
  },
]

const SOCIAL_ICONS = [
  {
    label: 'LINE',
    href: 'https://line.me',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 4V8a2 2 0 010-4z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@nongjames.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'Website',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-stone-300">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-5 gap-8">

          {/* Brand — col-span-1 */}
          <div className="col-span-1">
            <Link href="/" className="font-bold text-lg text-stone-700">
              NongJames
            </Link>
            <p className="text-stone-500 text-sm leading-relaxed mt-3">
              ยกระดับมาตรฐานการดูแลเสื้อผ้าของคุณ ด้วยบริการ
              ระดับพรีเมียมและความใส่ใจในทุกรายละเอียด
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-5">
              {SOCIAL_ICONS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="col-span-1" />

          {/* Links — col-span-3 */}
          <div className="col-span-3 grid grid-cols-4 gap-8">
            {FOOTER_LINKS.map(col => (
              <div key={col.title}>
                <p className="font-semibold text-stone-600 text-sm mb-4">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-stone-500 text-sm hover:text-stone-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-400/50">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <p className="text-stone-500 text-sm text-center">
            © 2026 NongJames. The Pristine Editorial Laundry Experience.
          </p>
        </div>
      </div>

    </footer>
  )
}
