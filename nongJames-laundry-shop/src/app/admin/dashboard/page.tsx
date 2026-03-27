"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  ordersToday: number;
  waitingPickup: number;
  inProgress: number;
  revenueToday: number;
}

interface WeeklyData {
  day: string;
  dry: number;
  press: number;
}

interface PendingTask {
  id: string;
  title: string;
  subtitle: string;
  priority: "urgent" | "normal" | "low";
}

interface UrgentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerInitials: string;
  customerColor: string;
  service: string;
  status: string;
  statusColor: string;
  deadline: string;
  deadlineUrgent?: boolean;
}

interface Driver {
  id: string;
  name: string;
  route: string;
  status: "ว่าง" | "กำลังส่ง";
  taskCount: number;
  avatar?: string;
}

interface Activity {
  id: string;
  message: string;
  orderCode: string;
  timeAgo: string;
  color: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_pickup:     { label: 'รอรับผ้า',    color: 'bg-amber-100 text-amber-700'   },
  washing:            { label: 'กำลังซัก',    color: 'bg-sky-100 text-sky-700'       },
  packing:            { label: 'กำลังแพ็ค',   color: 'bg-orange-100 text-orange-700' },
  ready_for_delivery: { label: 'พร้อมส่ง',    color: 'bg-emerald-100 text-emerald-700'},
  completed:          { label: 'เสร็จสิ้น',   color: 'bg-green-100 text-green-700'   },
  cancelled:          { label: 'ยกเลิก',      color: 'bg-red-100 text-red-700'       },
}

const avatarColors = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function formatDeadline(dateStr: string): { text: string; urgent: boolean } {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const isPast = d < now;
  const timeStr = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  if (isPast) return { text: "เมื่อวานนี้", urgent: true };
  if (isToday) return { text: `วันนี้, ${timeStr} น.`, urgent: false };
  if (isTomorrow) return { text: `พรุ่งนี้, ${timeStr} น.`, urgent: false };
  return { text: d.toLocaleDateString("th-TH", { month: "short", day: "numeric" }), urgent: false };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ ordersToday: 0, waitingPickup: 0, inProgress: 0, revenueToday: 0 });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
  setLoading(true)
  try {
    const token = localStorage.getItem('nj_token')
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

    // ← เรียกแค่ /orders เพราะมีข้อมูลครบ
    const res = await fetch(`${API}/orders`, { headers })
    if (!res.ok) { setLoading(false); return }

    const data = await res.json()
    const orders: any[] = data?.data ?? []

    // ─── Stats ──────────────────────────────────────────────────────
    const today = new Date().toDateString()

    const todayOrders   = orders.filter(o => new Date(o.createdAt).toDateString() === today)
    const waitingPickup = orders.filter(o => o.status === 'pending_pickup').length
    const inProgress    = orders.filter(o => ['washing', 'packing'].includes(o.status)).length
    const revenueToday  = orders
      .filter(o => new Date(o.createdAt).toDateString() === today && o.paymentStatus === 'paid')
      .reduce((s: number, o: any) => s + Number(o.totalAmount ?? 0), 0)

    setStats({ ordersToday: todayOrders.length, waitingPickup, inProgress, revenueToday })

    // ─── Weekly chart ────────────────────────────────────────────────
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    const weekMap: Record<number, { dry: number; press: number }> = {}
    for (let i = 0; i < 7; i++) weekMap[i] = { dry: 0, press: 0 }

    orders.forEach(o => {
      const day = new Date(o.createdAt).getDay()
      // B2B = ซักแห้ง, B2C = ซักรีดปกติ
      if (o.orderType === 'b2b') weekMap[day].dry++
      else weekMap[day].press++
    })

    const weekly = days.map((label, i) => ({ day: label, dry: weekMap[i].dry, press: weekMap[i].press }))
    setWeeklyData([...weekly.slice(1), weekly[0]]) // Mon-Sun

    // ─── Pending tasks ───────────────────────────────────────────────
    const pt: PendingTask[] = []

    const pendingCount = orders.filter(o => o.status === 'pending_pickup').length
    if (pendingCount > 0) {
      pt.push({ id: 't1', title: 'รอมอบหมาย Driver', subtitle: `${pendingCount} ออเดอร์รอรับผ้า`, priority: 'urgent' })
    }

    const washingCount = orders.filter(o => o.status === 'washing').length
    if (washingCount > 0) {
      pt.push({ id: 't2', title: 'กำลังซักผ้า', subtitle: `${washingCount} ออเดอร์กำลังซัก`, priority: 'normal' })
    }

    const unPaidCount = orders.filter(o => o.paymentStatus === 'pending' && o.status !== 'cancelled').length
    if (unPaidCount > 0) {
      pt.push({ id: 't3', title: 'รอชำระเงิน', subtitle: `${unPaidCount} ออเดอร์ยังไม่ชำระ`, priority: 'low' })
    }

    if (pt.length === 0) {
      pt.push({ id: 't0', title: 'ทุกอย่างเรียบร้อย 🎉', subtitle: 'ไม่มีงานค้าง', priority: 'low' })
    }

    setPendingTasks(pt)

    // ─── Urgent orders (ที่ยังดำเนินการอยู่) ──────────────────────────
    const activeOrders = orders
      .filter(o => !['completed', 'cancelled'].includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5)

    setUrgentOrders(
      activeOrders.map((o, i) => {
        const name: string = o.customerName ?? 'ลูกค้า'
        const { text, urgent: dlUrgent } = formatDeadline(o.createdAt)
        const statusInfo = STATUS_MAP[o.status] ?? { label: o.status, color: 'bg-gray-100 text-gray-600' }
        return {
          id:               o.id,
          orderCode:        o.orderNumber ?? `ORD-${String(o.id).slice(-4)}`,
          customerName:     name,
          customerInitials: getInitials(name),
          customerColor:    avatarColors[i % avatarColors.length],
          service:          o.orderType === 'b2b' ? 'B2B ซักอบ' : 'B2C ซักพับ',
          status:           statusInfo.label,
          statusColor:      statusInfo.color,
          deadline:         text,
          deadlineUrgent:   dlUrgent,
        }
      })
    )

    // ─── Drivers (ดึงจาก logistics tasks) ─────────────────────────────
    const logRes = await fetch(`${API}/logistics/tasks`, { headers }).catch(() => null)
    if (logRes?.ok) {
      const logData = await logRes.json()
      const tasks: any[] = logData?.data ?? []

      // group by driver
      const driverMap: Record<string, { name: string; count: number; status: string }> = {}
      tasks.forEach(t => {
        if (!driverMap[t.driverId ?? t.driver_id]) {
          driverMap[t.driverId ?? t.driver_id] = {
            name:   t.driverName ?? 'Driver',
            count:  0,
            status: t.status,
          }
        }
        driverMap[t.driverId ?? t.driver_id].count++
      })

      setDrivers(
        Object.entries(driverMap).slice(0, 4).map(([id, d]) => ({
          id,
          name:      d.name,
          route:     'เส้นทาง: ลาดกระบัง',
          status:    d.status === 'in_progress' ? 'กำลังส่ง' : 'ว่าง',
          taskCount: d.count,
        }))
      )
    }

    // ─── Activities ────────────────────────────────────────────────────
    const STATUS_TH: Record<string, string> = {
      pending_pickup:     'รอรับผ้า',
      washing:            'กำลังซัก',
      packing:            'กำลังแพ็ค',
      ready_for_delivery: 'พร้อมส่ง',
      completed:          'ส่งคืนแล้ว',
      cancelled:          'ยกเลิก',
    }

    const actColors = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1']
    const recent = [...orders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)

    setActivities(
      recent.map((o, i) => ({
        id:        o.id,
        message:   `${o.customerName ?? 'ลูกค้า'} → ${STATUS_TH[o.status] ?? o.status}`,
        orderCode: `#${o.orderNumber ?? o.id.slice(0, 8)}`,
        timeAgo:   timeAgo(o.updatedAt ?? o.createdAt),
        color:     actColors[i % actColors.length],
      }))
    )

  } catch (err) {
    console.error('Dashboard fetch error:', err)
  } finally {
    setLoading(false)
  }
}, [])


  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-72 bg-white rounded-2xl animate-pulse" />
          <div className="h-72 bg-white rounded-2xl animate-pulse" />
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="ออเดอร์วันนี้" value={stats.ordersToday} />
        <StatCard label="รอรับผ้า" value={stats.waitingPickup} />
        <StatCard label="กำลังซัก" value={stats.inProgress} />
        <StatCard
          label="รายได้รวม (บาท)"
          value={stats.revenueToday.toLocaleString("th-TH")}
          dark
          badge="วันนี้"
        />
      </div>

      {/* Chart + Pending */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">สถิติงานซักรายสัปดาห์</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> ซักแห้ง
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]" /> ซักรีดปกติ
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barSize={14} barGap={4}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                cursor={{ fill: "rgba(59,130,246,0.05)" }}
              />
              <Bar dataKey="dry" name="ซักแห้ง" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="press" name="ซักรีดปกติ" fill="#93c5fd" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending tasks */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">งานที่ค้าง (Pending)</h2>
            <button className="text-xs text-blue-500 hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="space-y-3">
            {pendingTasks.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div
                  className={`w-1 h-full min-h-[36px] rounded-full flex-shrink-0 ${
                    t.priority === "urgent" ? "bg-red-500" : t.priority === "normal" ? "bg-amber-400" : "bg-gray-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subtitle}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    t.priority === "urgent"
                      ? "bg-red-100 text-red-600"
                      : t.priority === "normal"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.priority === "urgent" ? "ด่วน" : t.priority === "normal" ? "ปกติ" : "ต่ำ"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent orders table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">รายการที่ต้องจัดการด่วน</h2>
          <p className="text-xs text-gray-500 mt-0.5">รายการที่ค้างชำระหรือใกล้กำหนดส่งมอบ</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
              {["รหัสออเดอร์", "ลูกค้า", "ประเภทบริการ", "สถานะ", "กำหนดส่ง", "การจัดการ"].map((h) => (
                <th key={h} className="text-left pb-3 font-medium px-2 first:pl-0 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {urgentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3.5 px-2 first:pl-0">
                  <span className="text-blue-500 font-semibold text-sm">#{o.orderCode}</span>
                </td>
                <td className="py-3.5 px-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${o.customerColor} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                      {o.customerInitials}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{o.customerName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-2 text-sm text-gray-600">{o.service}</td>
                <td className="py-3.5 px-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${o.statusColor}`}>
                    {o.status}
                  </span>
                </td>
                <td className={`py-3.5 px-2 text-sm font-medium ${o.deadlineUrgent ? "text-red-500" : "text-gray-600"}`}>
                  {o.deadline}
                </td>
                <td className="py-3.5 px-2 last:pr-0">
                  <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-500">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M17.5 3.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 7.5-7.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {urgentOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">ไม่มีออเดอร์ที่ค้างอยู่ 🎉</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drivers + Activity */}
      <div className="grid grid-cols-3 gap-4">
        {/* Drivers */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">คนขับที่กำลังปฏิบัติงาน</h2>
            <button className="text-xs text-blue-500 hover:underline">ดูทั้งหมด →</button>
          </div>
          {drivers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">ไม่พบข้อมูลคนขับ</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                    <p className="text-xs text-gray-500 truncate">{d.route}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.taskCount} ออเดอร์ · ล่าสุด</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                    d.status === "ว่าง" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="bg-[#0d1b2e] rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-white mb-4">ความเคลื่อนไหวล่าสุด</h2>
          <div className="space-y-4">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: a.color }} />
                <div>
                  <p className="text-sm text-white/85 leading-snug">{a.message}</p>
                  <p className="text-xs text-white/40 mt-0.5">{a.orderCode} · {a.timeAgo}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-white/40 text-center py-4">ยังไม่มีความเคลื่อนไหว</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, dark, badge,
}: {
  label: string;
  value: string | number;
  dark?: boolean;
  badge?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm relative overflow-hidden ${dark ? "bg-[#0d1b2e]" : "bg-white"}`}>
      {dark && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
      )}
      <p className={`text-xs font-medium mb-2 ${dark ? "text-white/55" : "text-gray-500"}`}>{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>{value}</p>
      {badge && (
        <span className="absolute top-4 right-4 text-[10px] bg-white/15 text-white/70 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}
