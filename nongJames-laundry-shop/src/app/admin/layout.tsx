"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "หน้าแรก",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".9" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "จัดการงานซัก",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="3" rx="1.5" fill="currentColor" opacity=".9" />
        <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor" opacity=".6" />
        <rect x="3" y="18" width="12" height="3" rx="1.5" fill="currentColor" opacity=".4" />
      </svg>
    ),
  },
  {
    href: "/admin/logistics",
    label: "มอบหมายคนขับ",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="1" y="9" width="22" height="9" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="6" cy="18" r="3" fill="currentColor" />
        <circle cx="18" cy="18" r="3" fill="currentColor" />
        <path d="M1 12h3l3-5h8l3 5h3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/customers",
    label: "รายชื่อลูกค้า",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
        <circle cx="19" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M22 21v-1.5a2.5 2.5 0 0 0-2-2.45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/executive/finance",
    label: "สรุปยอดเงิน",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
        <rect x="6" y="14" width="4" height="2" rx="1" fill="currentColor" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; avatar?: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("nj_user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/"); return; }
    setUser({ name: u.name || u.email, avatar: u.avatar_url, role: "System Admin" });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("nj_token");
    localStorage.removeItem("nj_user");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-[#0d1b2e] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <span className="text-white font-bold text-sm">NJ</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">nongJames</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-[#1e3a5f] text-white shadow-lg shadow-blue-900/30"
                    : "text-white/55 hover:bg-white/8 hover:text-white/90"
                }`}
              >
                <span className={active ? "text-[#5ba3f5]" : ""}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 space-y-1 border-t border-white/10 pt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/8 text-sm transition-all">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            ช่วยเหลือ
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[60px] bg-white/80 backdrop-blur-sm border-b border-gray-200/80 flex items-center justify-between px-6 flex-shrink-0">
          <div className="relative w-[340px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาออเดอร์ หรือ ชื่อลูกค้า..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">{user?.name ?? "..."}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
