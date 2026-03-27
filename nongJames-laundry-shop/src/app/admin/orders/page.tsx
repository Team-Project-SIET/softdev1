"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_id: string;
  service_name: string;
  status: string;
  scheduled_delivery: string | null;
  created_at: string;
  updated_at: string;
  total_amount: number;
  address?: string;
  note?: string;
  weight?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: "รอรับผ้า",      color: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  picked_up:  { label: "รับผ้าแล้ว",   color: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  washing:    { label: "กำลังซัก",     color: "bg-sky-100 text-sky-700",       dot: "bg-sky-400" },
  drying:     { label: "กำลังอบ",      color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  ready:      { label: "พร้อมส่ง",     color: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  delivering: { label: "กำลังส่ง",     color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  delivered:  { label: "ส่งเสร็จแล้ว", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  cancelled:  { label: "ยกเลิก",       color: "bg-red-100 text-red-700",       dot: "bg-red-400" },
};

const STATUS_FLOW: Record<string, string> = {
  pending:    "picked_up",
  picked_up:  "washing",
  washing:    "drying",
  drying:     "ready",
  ready:      "delivering",
  delivering: "delivered",
};

const FILTER_TABS = [
  { key: "all",       label: "ทั้งหมด" },
  { key: "pending",   label: "รอรับผ้า" },
  { key: "washing",   label: "กำลังซัก" },
  { key: "drying",    label: "กำลังอบ" },
  { key: "ready",     label: "พร้อมส่ง" },
  { key: "delivering",label: "กำลังส่ง" },
  { key: "delivered", label: "เสร็จแล้ว" },
];

const avatarColors = [
  "bg-blue-500","bg-violet-500","bg-emerald-500",
  "bg-amber-500","bg-rose-500","bg-cyan-500","bg-pink-500","bg-teal-500",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const time = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `วันนี้, ${time} น.`;
  if (isTomorrow) return `พรุ่งนี้, ${time} น.`;
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + `, ${time} น.`;
}

function isOverdue(d: string | null, status: string) {
  if (!d || ["delivered", "cancelled"].includes(status)) return false;
  return new Date(d) < new Date();
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[380px] bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">รหัสออเดอร์</p>
            <h3 className="font-bold text-gray-900 text-lg">#{order.order_code}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.color}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">ลูกค้า</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${avatarColors[order.customer_name.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                {getInitials(order.customer_name)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{order.customer_name}</p>
                <p className="text-xs text-gray-500">{order.address ?? "ไม่ระบุที่อยู่"}</p>
              </div>
            </div>
          </div>

          {/* Order info */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">รายละเอียดออเดอร์</p>
            {[
              { label: "บริการ", value: order.service_name },
              { label: "น้ำหนัก", value: order.weight ? `${order.weight} kg` : "—" },
              { label: "ยอดชำระ", value: `฿${Number(order.total_amount ?? 0).toLocaleString("th-TH")}` },
              { label: "วันที่สั่ง", value: formatDate(order.created_at) },
              { label: "กำหนดส่ง", value: formatDate(order.scheduled_delivery) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-medium ${label === "ยอดชำระ" ? "text-blue-600" : isOverdue(order.scheduled_delivery, order.status) && label === "กำหนดส่ง" ? "text-red-500" : "text-gray-800"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-medium mb-1">หมายเหตุ</p>
              <p className="text-sm text-amber-800">{order.note}</p>
            </div>
          )}

          {/* Status timeline */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">ขั้นตอน</p>
            <div className="space-y-1">
              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "cancelled").map(([k, v], i) => {
                const statusKeys = Object.keys(STATUS_CONFIG).filter(s => s !== "cancelled");
                const currentIdx = statusKeys.indexOf(order.status);
                const thisIdx = statusKeys.indexOf(k);
                const done = thisIdx < currentIdx;
                const active = thisIdx === currentIdx;
                return (
                  <div key={k} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? "bg-blue-50" : ""}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-500" : active ? "bg-blue-500" : "bg-gray-200"}`}>
                      {done ? (
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="m20 6-11 11-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-gray-400"}`} />
                      )}
                    </div>
                    <span className={`text-sm ${active ? "text-blue-700 font-semibold" : done ? "text-gray-400" : "text-gray-500"}`}>{v.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer action */}
        {nextStatus && (
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => { onStatusChange(order.id, nextStatus); onClose(); }}
              className="w-full bg-[#0d1b2e] hover:bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              อัพเดทเป็น: {STATUS_CONFIG[nextStatus]?.label}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(.16,1,.3,1); }
      `}</style>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PER_PAGE = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nj_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/orders?limit=200`, { headers });
      const data = res.ok ? await res.json() : { data: [] };
      const list: Order[] = data?.data ?? data?.orders ?? [];
      setOrders(list);

      // Count per status
      const c: Record<string, number> = { all: list.length };
      list.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
      setCounts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Filter + search
  useEffect(() => {
    let result = orders;
    if (activeTab !== "all") result = result.filter((o) => o.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_code?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.service_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
    setPage(1);
  }, [orders, activeTab, search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem("nj_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(`${API}/orders/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการงานซัก</h1>
          <p className="text-sm text-gray-500 mt-0.5">ออเดอร์ทั้งหมด {orders.length} รายการ</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1b2e] text-white rounded-xl text-sm font-medium hover:bg-[#1e3a5f] transition-colors"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          รีเฟรช
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100 overflow-x-auto">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === t.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {counts[t.key] != null && counts[t.key] > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + sort bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหา รหัส / ชื่อลูกค้า / บริการ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
          <span className="text-sm text-gray-400">
            แสดง {filtered.length} รายการ
          </span>
        </div>

        {/* Table */}
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
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50/80">
                  {["รหัสออเดอร์", "ลูกค้า", "ประเภทบริการ", "สถานะ", "กำหนดส่ง", "ยอดชำระ", "การจัดการ"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
                  const overdue = isOverdue(o.scheduled_delivery, o.status);
                  const nextSt = STATUS_FLOW[o.status];
                  const colorIdx = (o.customer_name.charCodeAt(0)) % avatarColors.length;

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-blue-50/30 transition-colors group ${updatingId === o.id ? "opacity-50" : ""}`}
                    >
                      <td className="py-3.5 px-4 pl-5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-blue-500 hover:text-blue-700 font-semibold text-sm"
                        >
                          #{o.order_code}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                            {getInitials(o.customer_name)}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{o.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-600">{o.service_name ?? "—"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-sm font-medium ${overdue ? "text-red-500" : "text-gray-600"}`}>
                        <span className="flex items-center gap-1">
                          {overdue && (
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="flex-shrink-0">
                              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {formatDate(o.scheduled_delivery)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">
                        ฿{Number(o.total_amount ?? 0).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Detail */}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                            title="ดูรายละเอียด"
                          >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                          {/* Next status */}
                          {nextSt && (
                            <button
                              onClick={() => handleStatusChange(o.id, nextSt)}
                              className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-gray-400 hover:text-emerald-600"
                              title={`อัพเดทเป็น: ${STATUS_CONFIG[nextSt]?.label}`}
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                                <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            title="แก้ไข"
                          >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="m17.5 3.5 3 3L12 15l-4 1 1-4 7.5-7.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-gray-400">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">ไม่พบออเดอร์</p>
                <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยน filter หรือคำค้นหา</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  แสดง {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} จาก {filtered.length} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 text-sm rounded-lg transition-colors font-medium ${
                          page === pageNum
                            ? "bg-[#0d1b2e] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order detail drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
