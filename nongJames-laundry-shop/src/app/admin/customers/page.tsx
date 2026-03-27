"use client";

import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types (camelCase ตาม API) ────────────────────────────────────────────────
interface Customer {
  id:                   string;
  name:                 string;
  phone:                string | null;
  address:              string | null;
  type:                 string;
  isGuest:              boolean;
  createdAt:            string;
  subscriptionStatus?:  string | null;
  subscriptionPlanName?: string | null;
  freeDelivery?:        boolean;
  discountPercent?:     string | null;
  // computed จาก orders
  latestOrderNumber?:   string;
  latestOrderStatus?:   string;
  orderCount:           number;
  totalRevenue:         number;
}

// ─── Status (ตรงกับ DB enum) ─────────────────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending_pickup:     { label: "รอรับผ้า",   bg: "bg-amber-200",   text: "text-amber-700"   },
  washing:            { label: "กำลังซัก",   bg: "bg-sky-200",     text: "text-sky-700"     },
  packing:            { label: "กำลังแพ็ค",  bg: "bg-orange-200",  text: "text-orange-700"  },
  ready_for_delivery: { label: "พร้อมส่ง",   bg: "bg-violet-200",  text: "text-violet-700"  },
  completed:          { label: "เสร็จสิ้น",  bg: "bg-emerald-200", text: "text-emerald-700" },
  cancelled:          { label: "ยกเลิก",     bg: "bg-gray-200",    text: "text-gray-600"    },
};

const ACCOUNT_STATUS: Record<string, { dot: string; text: string }> = {
  "ใช้งานปกติ": { dot: "bg-emerald-400", text: "text-gray-700"    },
  "สมาชิก":     { dot: "bg-blue-400",    text: "text-blue-700"   },
  "B2B":        { dot: "bg-purple-400",  text: "text-purple-700" },
  "Guest":      { dot: "bg-gray-400",    text: "text-gray-500"   },
};

const AVATAR_COLORS = [
  ["bg-blue-100","text-blue-600"],   ["bg-violet-100","text-violet-600"],
  ["bg-amber-100","text-amber-600"], ["bg-rose-100","text-rose-600"],
  ["bg-emerald-100","text-emerald-600"],["bg-sky-100","text-sky-600"],
  ["bg-pink-100","text-pink-600"],   ["bg-teal-100","text-teal-600"],
];

function getInitials(name: string) {
  const p = (name ?? "ล").trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (name ?? "ล").slice(0, 2).toUpperCase();
}

const PER_PAGE = 10;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, active }: {
  icon: React.ReactNode; value: string | number; label: string; active?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${active ? "bg-blue-100" : "bg-white shadow-sm"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-blue-200" : "bg-gray-100"}`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-bold tracking-tight ${active ? "text-blue-700" : "text-gray-900"}`}>{value}</p>
        <p className={`text-xs mt-0.5 ${active ? "text-blue-500" : "text-gray-500"}`}>{label}</p>
      </div>
    </div>
  );
}

// ─── Customer Modal ───────────────────────────────────────────────────────────
function CustomerModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  if (!customer) return null;
  const [bg, fg] = AVATAR_COLORS[customer.name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scale-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">ข้อมูลลูกค้า</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${fg} font-bold text-lg`}>
              {getInitials(customer.name)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
              <p className="text-sm text-gray-500">{customer.phone ?? "ไม่ระบุเบอร์"}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {customer.type === "b2b" ? "🏢 ลูกค้าองค์กร" : customer.isGuest ? "👤 Guest" : "👤 ลูกค้าทั่วไป"}
              </p>
            </div>
          </div>

          {/* Subscription badge */}
          {customer.subscriptionStatus === "active" && customer.subscriptionPlanName && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">⭐ {customer.subscriptionPlanName}</span>
              <span className="text-xs text-blue-500">
                {customer.freeDelivery ? "ส่งฟรี" : ""} ลด {customer.discountPercent}%
              </span>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            {[
              { label: "ออเดอร์ล่าสุด",   value: customer.latestOrderNumber ? `#${customer.latestOrderNumber}` : "—" },
              { label: "จำนวนออเดอร์",     value: `${customer.orderCount} ออเดอร์` },
              { label: "ยอดใช้บริการรวม", value: `฿${customer.totalRevenue.toLocaleString("th-TH")}` },
              { label: "ที่อยู่",          value: customer.address ?? "ไม่ระบุ" },
              { label: "สมาชิกตั้งแต่",   value: new Date(customer.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-800 text-right max-w-[180px] truncate">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button className="flex-1 bg-[#0d1b2e] hover:bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              ดูออเดอร์ทั้งหมด
            </button>
            <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              แก้ไข
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scale-in { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .animate-scale-in { animation:scale-in .2s cubic-bezier(.16,1,.3,1) }
      `}</style>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCustomersPage() {
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [filtered,         setFiltered]         = useState<Customer[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState("");
  const [page,             setPage]             = useState(1);
  const [stats,            setStats]            = useState({ total: 0, activeOrders: 0, washing: 0, growth: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [menuOpen,         setMenuOpen]         = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem("nj_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [custRes, ordersRes] = await Promise.all([
        fetch(`${API}/customers`, { headers }),
        fetch(`${API}/orders`,    { headers }),
      ]);

      const custData   = custRes.ok   ? await custRes.json()   : { data: [] };
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };

      const rawCustomers: any[] = custData?.data   ?? [];
      const rawOrders: any[]    = ordersData?.data ?? [];

      // Build customer list joined with orders
      const list: Customer[] = rawCustomers.map((c: any) => {
        // หา orders ของลูกค้าคนนี้ (match by customerId หรือ id)
        const cOrders = rawOrders.filter(
          (o: any) => String(o.customerId ?? o.customer_id) === String(c.id)
        );

        // latest order = เรียงจากใหม่สุด
        const latest = [...cOrders].sort(
          (a: any, b: any) =>
            new Date(b.createdAt ?? b.created_at).getTime() -
            new Date(a.createdAt ?? a.created_at).getTime()
        )[0];

        // รายได้รวม (paid orders)
        const totalRevenue = cOrders
          .filter((o: any) => o.paymentStatus === "paid")
          .reduce((s: number, o: any) => s + Number(o.totalAmount ?? o.total_amount ?? 0), 0);

        return {
          id:                   String(c.id),
          name:                 c.name ?? "ไม่ระบุ",
          phone:                c.phone   ?? null,
          address:              c.address ?? null,
          type:                 c.type    ?? "b2c",
          isGuest:              c.isGuest ?? c.is_guest ?? false,
          createdAt:            c.createdAt ?? c.created_at,
          // ── subscription (จาก join) ──────────────────────
          subscriptionStatus:   c.subscriptionStatus   ?? null,
          subscriptionPlanName: c.subscriptionPlanName ?? null,
          freeDelivery:         c.freeDelivery  ?? false,
          discountPercent:      c.discountPercent ?? null,
          // ── computed ─────────────────────────────────────
          latestOrderNumber:    latest?.orderNumber ?? latest?.order_code ?? null,
          latestOrderStatus:    latest?.status       ?? null,
          orderCount:           cOrders.length,
          totalRevenue,
        };
      });

      setCustomers(list);

      // Stats
      const activeOrders = rawOrders.filter(
        (o: any) => !["completed","cancelled"].includes(o.status)
      ).length;
      const washing = rawOrders.filter((o: any) => o.status === "washing").length;

      const now = new Date();
      const thisMonth = list.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const lastMonth = list.filter(c => {
        const d  = new Date(c.createdAt);
        const lm = new Date(now.getFullYear(), now.getMonth() - 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }).length;
      const growth = lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0 ? 100 : 0;

      setStats({ total: list.length, activeOrders, washing, growth });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q ? customers.filter(c =>
        (c.name    ?? "").toLowerCase().includes(q) ||
        (c.phone   ?? "").includes(q) ||
        (c.latestOrderNumber ?? "").toLowerCase().includes(q)
      ) : customers
    );
    setPage(1);
  }, [search, customers]);

  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // account status label
  const getAccountStatus = (c: Customer) => {
    if (c.type === "b2b")   return "B2B";
    if (c.isGuest)          return "Guest";
    if (c.subscriptionStatus === "active") return "สมาชิก";
    return "ใช้งานปกติ";
  };

  return (
    <div className="p-6 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard active
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-blue-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          value={stats.total} label="ลูกค้าทั้งหมด"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-gray-500"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>}
          value={stats.activeOrders} label="ออเดอร์กำลังดำเนินการ"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-blue-500"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>}
          value={stats.washing} label="กำลังซัก"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-gray-500"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 7 22 7 22 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          value={`${stats.growth > 0 ? "+" : ""}${stats.growth}%`} label="การเติบโตเดือนนี้"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="ค้นหาชื่อ / เบอร์โทร / รหัสออเดอร์..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} คน</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50/80 border-b border-gray-100">
                  {["ชื่อ-นามสกุล","ออเดอร์ล่าสุด","เบอร์โทร","ยอดใช้บริการ","สถานะงาน","สถานะบัญชี","การจัดการ"].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-medium first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(c => {
                  const [bg, fg]    = AVATAR_COLORS[c.name.charCodeAt(0) % AVATAR_COLORS.length];
                  const orderCfg    = c.latestOrderStatus
                    ? (ORDER_STATUS[c.latestOrderStatus] ?? { label: c.latestOrderStatus, bg: "bg-gray-200", text: "text-gray-600" })
                    : null;
                  const accStatus   = getAccountStatus(c);
                  const accountCfg  = ACCOUNT_STATUS[accStatus] ?? ACCOUNT_STATUS["ใช้งานปกติ"];

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group cursor-pointer" onClick={() => setMenuOpen(null)}>

                      {/* Name */}
                      <td className="py-3.5 px-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center ${fg} font-bold text-xs flex-shrink-0`}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedCustomer(c); }}
                              className="font-semibold text-sm text-gray-800 hover:text-blue-600 text-left leading-tight"
                            >
                              {c.name}
                            </button>
                            {c.type === "b2b" && (
                              <span className="block text-[10px] text-purple-600 font-medium">B2B</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Latest order */}
                      <td className="py-3.5 px-4">
                        {c.latestOrderNumber ? (
                          <span className="bg-blue-50 text-blue-600 font-semibold text-xs px-2.5 py-1.5 rounded-lg">
                            #{c.latestOrderNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-sm text-gray-600">
                        {c.phone ?? "—"}
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">
                        {c.totalRevenue > 0
                          ? `฿${c.totalRevenue.toLocaleString("th-TH")}`
                          : <span className="text-gray-400 font-normal">{c.orderCount} ออเดอร์</span>
                        }
                      </td>

                      {/* Order status */}
                      <td className="py-3.5 px-4">
                        {orderCfg ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${orderCfg.bg} ${orderCfg.text}`}>
                            {orderCfg.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* Account status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${accountCfg.dot}`} />
                          <span className={`text-xs font-medium ${accountCfg.text}`}>{accStatus}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 pr-5 relative">
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="5"  r="1.5" fill="currentColor"/>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        {menuOpen === c.id && (
                          <div className="absolute right-4 top-12 z-10 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36 text-sm">
                            {[
                              { icon: "👁",  label: "ดูรายละเอียด", action: () => { setSelectedCustomer(c); setMenuOpen(null); } },
                              { icon: "✏️", label: "แก้ไขข้อมูล",  action: () => setMenuOpen(null) },
                            ].map(item => (
                              <button
                                key={item.label}
                                onClick={e => { e.stopPropagation(); item.action(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                              >
                                <span>{item.icon}</span>{item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-14 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-400">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">ไม่พบลูกค้า</p>
                <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนคำค้นหา</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  แสดง {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} จาก {filtered.length} คน
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                    <button key={i+1} onClick={() => setPage(i+1)}
                      className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                        page === i+1 ? "bg-[#0d1b2e] text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}>{i+1}</button>
                  ))}
                  {totalPages > 5 && <span className="text-gray-400 px-1">...</span>}
                  {totalPages > 5 && (
                    <button onClick={() => setPage(totalPages)}
                      className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                        page === totalPages ? "bg-[#0d1b2e] text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}>{totalPages}</button>
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom banners */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden bg-[#0d1b2e] relative min-h-[200px] flex flex-col justify-end p-6">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2e] via-[#0d1b2e]/60 to-transparent z-10" />
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-to-br from-blue-600/40 to-transparent" />
          </div>
          <div className="relative z-20">
            <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">Member Highlight</span>
            <h3 className="text-white font-bold text-lg mt-1 leading-snug">สิทธิพิเศษสำหรับลูกค้าพรีเมียม</h3>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">เพิ่มยอดการใช้บริการและรักษาฐานลูกค้าด้วยแคมเปญส่งผ้าครบ 10 ครั้ง ฟรี 1 ครั้ง</p>
          </div>
        </div>
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase bg-blue-100 px-2 py-0.5 rounded-full">System Update</span>
            <h3 className="font-bold text-gray-900 text-lg mt-3 leading-snug">ระบบแจ้งเตือนอัตโนมัติ<br/>ผ่าน LINE</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">ช่วยให้ลูกค้าทราบสถานะงานทันทีที่ซักเสร็จ เพิ่มความพึงพอใจ</p>
          </div>
          <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold mt-4 transition-colors group">
            ตั้งค่าการแจ้งเตือน
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </div>
  );
}
