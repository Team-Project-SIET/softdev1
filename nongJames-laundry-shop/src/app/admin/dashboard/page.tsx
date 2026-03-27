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
  pending:     { label: "รอรับผ้า",      color: "bg-amber-100 text-amber-700" },
  picked_up:   { label: "รับผ้าแล้ว",    color: "bg-blue-100 text-blue-700" },
  washing:     { label: "กำลังซัก",      color: "bg-sky-100 text-sky-700" },
  drying:      { label: "กำลังอบ",       color: "bg-orange-100 text-orange-700" },
  ready:       { label: "พร้อมส่ง",      color: "bg-emerald-100 text-emerald-700" },
  delivering:  { label: "กำลังส่ง",      color: "bg-violet-100 text-violet-700" },
  delivered:   { label: "ซักเสร็จแล้ว", color: "bg-green-100 text-green-700" },
  cancelled:   { label: "ยกเลิก",        color: "bg-red-100 text-red-700" },
  overdue:     { label: "เลยกำหนด",     color: "bg-red-100 text-red-700" },
};

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
    setLoading(true);
    try {
      const token = localStorage.getItem("nj_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [ordersRes, paymentsRes, driversRes] = await Promise.all([
        fetch(`${API}/orders?limit=100`, { headers }),
        fetch(`${API}/payments?limit=100`, { headers }),
        fetch(`${API}/customers?role=driver&limit=50`, { headers }).catch(() => ({ ok: false })),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { data: [] };

      const orders: any[] = ordersData?.data ?? ordersData?.orders ?? [];
      const payments: any[] = paymentsData?.data ?? paymentsData?.payments ?? [];

      // ─── Stats ──────────────────────────────────────────────────────────────
      const today = new Date().toDateString();
      const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
      const waitingPickup = orders.filter((o) => o.status === "pending").length;
      const inProgress = orders.filter((o) => ["washing", "drying", "picked_up"].includes(o.status)).length;
      const revenueToday = payments
        .filter((p) => new Date(p.created_at).toDateString() === today && p.status === "paid")
        .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

      setStats({ ordersToday: todayOrders.length, waitingPickup, inProgress, revenueToday });

      // ─── Weekly chart ────────────────────────────────────────────────────────
      const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
      const weekMap: Record<number, { dry: number; press: number }> = {};
      for (let i = 0; i < 7; i++) weekMap[i] = { dry: 0, press: 0 };
      orders.forEach((o) => {
        const day = new Date(o.created_at).getDay();
        const serviceName: string = o.service_name ?? o.service?.name ?? "";
        if (serviceName.includes("รีด") || serviceName.includes("press")) weekMap[day].press++;
        else weekMap[day].dry++;
      });
      const weekly = days.map((label, i) => ({ day: label, dry: weekMap[i].dry, press: weekMap[i].press }));
      // reorder Mon-Sun
      const reordered = [...weekly.slice(1), weekly[0]];
      setWeeklyData(reordered);

      // ─── Pending tasks ───────────────────────────────────────────────────────
      const overdue = orders.filter(
        (o) => o.scheduled_delivery && new Date(o.scheduled_delivery) < new Date() && !["delivered", "cancelled"].includes(o.status)
      );
      const pt: PendingTask[] = [
        ...(overdue.length
          ? [{ id: "t1", title: "ตรวจเช็คความเสียหาย", subtitle: `ออเดอร์ #${overdue[0]?.order_code ?? "???"}  ชุดลูกโทน`, priority: "urgent" as const }]
          : []),
        ...(waitingPickup > 0
          ? [{ id: "t2", title: "โทรยืนยันเวลาจัดส่ง", subtitle: `${waitingPickup} รายการรอนัด`, priority: "normal" as const }]
          : []),
        { id: "t3", title: "อัพเดทคลังน้ำยาซักผ้า", subtitle: "น้ำยาซักสูตรนอนไบฝ้า", priority: "low" as const },
      ];
      setPendingTasks(pt);

      // ─── Urgent orders ───────────────────────────────────────────────────────
      const urgent = orders
        .filter((o) => !["delivered", "cancelled"].includes(o.status))
        .sort((a, b) => new Date(a.scheduled_delivery ?? a.created_at).getTime() - new Date(b.scheduled_delivery ?? b.created_at).getTime())
        .slice(0, 5);

      setUrgentOrders(
        urgent.map((o, i) => {
          const name: string = o.customer_name ?? o.customer?.name ?? "ลูกค้า";
          const dl = o.scheduled_delivery ?? o.updated_at;
          const { text, urgent: dlUrgent } = formatDeadline(dl);
          const statusInfo = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
          return {
            id: o.id,
            orderCode: o.order_code ?? `ORD-${String(o.id).slice(-4)}`,
            customerName: name,
            customerInitials: getInitials(name),
            customerColor: avatarColors[i % avatarColors.length],
            service: o.service_name ?? o.service?.name ?? "บริการซัก",
            status: statusInfo.label,
            statusColor: statusInfo.color,
            deadline: text,
            deadlineUrgent: dlUrgent,
          };
        })
      );

      // ─── Drivers (fake from users/customers with driver role) ──────────────
      const driverData = (driversRes as any).ok ? await (driversRes as Response).json() : { data: [] };
      const driverList: any[] = driverData?.data ?? driverData?.users ?? [];
      setDrivers(
        driverList.slice(0, 4).map((d: any) => ({
          id: d.id,
          name: d.name ?? d.email,
          route: "เส้นทาง: สุขุมวิท 24-39",
          status: Math.random() > 0.4 ? "ว่าง" : "กำลังส่ง",
          taskCount: Math.floor(Math.random() * 5) + 1,
          avatar: d.avatar_url,
        }))
      );

      // ─── Activities ──────────────────────────────────────────────────────────
      const recent = [...orders]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4);
      const actColors = ["#3b82f6", "#f59e0b", "#10b981", "#6366f1"];
      const actMessages = (o: any) => {
        if (o.status === "delivered") return `ส่งเสร็จเรียบร้อย: ${o.customer_name ?? "ลูกค้า"}`;
        if (o.status === "washing") return `ผ้า ${Math.floor(Math.random() * 3) + 1} พับ ตรวจสอบรอยเปื้อน`;
        if (o.status === "pending") return `${o.customer_name ?? "ลูกค้า"} ชำระเงินเรียบร้อย`;
        return `อัพเดทสถานะ: ${STATUS_MAP[o.status]?.label ?? o.status}`;
      };
      setActivities(
        recent.map((o, i) => ({
          id: o.id,
          message: actMessages(o),
          orderCode: `#${o.order_code ?? `ORD-${String(o.id).slice(-4)}`}`,
          timeAgo: timeAgo(o.updated_at ?? o.created_at),
          color: actColors[i % actColors.length],
        }))
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
