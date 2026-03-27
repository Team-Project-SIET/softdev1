"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API      = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";

// ─── Types (camelCase ตาม API) ────────────────────────────────────────────────
interface TaskOrder {
  id:              string;
  orderNumber:     string;
  customerName:    string | null;
  customerPhone:   string | null;
  pickupAddress:   string | null;
  deliveryAddress: string | null;
  orderType:       string;
  status:          string;
  paymentStatus:   string;
  totalAmount:     string;
  createdAt:       string;
  lat?:            number;
  lng?:            number;
  assignedDriverId?: string | null;
}

interface Driver {
  id:        string;
  name:      string;
  email?:    string;
  status:    "ว่าง" | "กำลังส่ง";
  taskCount: number;
}

interface LogisticTask {
  id:          string;
  taskType:    string;
  status:      string;
  orderNumber: string;
  driverName:  string;
  driverId?:   string;
  customerName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
}

// ─── Constants (ตรงกับ DB enum) ───────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending_pickup:     { label: "รอรับผ้า",   color: "bg-amber-100 text-amber-700"    },
  washing:            { label: "กำลังซัก",   color: "bg-sky-100 text-sky-700"        },
  packing:            { label: "กำลังแพ็ค",  color: "bg-orange-100 text-orange-700"  },
  ready_for_delivery: { label: "พร้อมส่ง",   color: "bg-violet-100 text-violet-700"  },
  completed:          { label: "เสร็จสิ้น",  color: "bg-emerald-100 text-emerald-700"},
  cancelled:          { label: "ยกเลิก",     color: "bg-red-100 text-red-700"        },
};

const TASK_TYPE_LABEL: Record<string, string> = {
  pickup:   "🚗 รับผ้า",
  delivery: "🚚 ส่งผ้า",
};

const avatarColors = [
  "bg-blue-500","bg-violet-500","bg-emerald-500",
  "bg-amber-500","bg-rose-500","bg-cyan-500",
];

function getInitials(name: string) {
  const p = (name ?? "ล").trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (name ?? "ล").slice(0, 2).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// ─── Google Map ───────────────────────────────────────────────────────────────
declare global { interface Window { google: any; initGMap: () => void; } }

function GoogleMapView({ orders }: { orders: TaskOrder[] }) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [noKey,  setNoKey]  = useState(false);

  useEffect(() => {
    if (!GMAPS_KEY) { setNoKey(true); return; }
    if (window.google?.maps) { setLoaded(true); return; }
    if (document.getElementById("gmaps-script")) {
      const check = setInterval(() => { if (window.google?.maps) { setLoaded(true); clearInterval(check); } }, 200);
      return () => clearInterval(check);
    }
    window.initGMap = () => setLoaded(true);
    const script = document.createElement("script");
    script.id  = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=initGMap&language=th`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 13.756, lng: 100.502 }, zoom: 12,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
    });
  }, [loaded]);

  useEffect(() => {
    if (!mapInstance.current || !loaded) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    const bounds = new window.google.maps.LatLngBounds();
    orders.forEach((o, i) => {
      if (!o.lat || !o.lng) return;
      const pos    = { lat: o.lat, lng: o.lng };
      const marker = new window.google.maps.Marker({
        position: pos, map: mapInstance.current,
        title: o.customerName ?? "ลูกค้า",
        label: { text: String(i + 1), color: "white", fontSize: "11px", fontWeight: "bold" },
        icon: {
          path:       window.google.maps.SymbolPath.CIRCLE,
          scale:      14,
          fillColor:  o.status === "pending_pickup" ? "#f59e0b" : o.status === "ready_for_delivery" ? "#6366f1" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });
      const name = o.customerName ?? "ลูกค้า";
      const addr = o.pickupAddress ?? o.deliveryAddress ?? "ไม่ระบุ";
      const iw = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;padding:4px 2px"><p style="font-weight:600;margin:0 0 2px">${name}</p><p style="color:#6b7280;font-size:12px;margin:0">${addr}</p></div>`,
      });
      marker.addListener("click", () => iw.open(mapInstance.current, marker));
      markersRef.current.push(marker);
      bounds.extend(pos);
    });
    if (!bounds.isEmpty()) mapInstance.current.fitBounds(bounds);
  }, [orders, loaded]);

  if (noKey) {
    return (
      <div className="flex-1 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-blue-500">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <p className="font-semibold text-gray-700 text-sm">Google Maps</p>
        <p className="text-xs text-gray-500">ตั้งค่า <code className="bg-gray-200 px-1 rounded text-gray-700">NEXT_PUBLIC_GMAPS_KEY</code></p>
        <div className="w-full mt-1 space-y-2 max-h-48 overflow-y-auto">
          {orders.filter(o => o.pickupAddress).map((o, i) => (
            <div key={o.id} className="flex items-center gap-2 text-left bg-white rounded-xl px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{o.customerName ?? "ลูกค้า"}</p>
                <p className="text-[11px] text-gray-500 truncate">{o.pickupAddress ?? o.deliveryAddress}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-2xl overflow-hidden relative min-h-[300px]">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <p className="text-sm text-gray-400">กำลังโหลดแผนที่...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDriversPage() {
  const [orders,          setOrders]          = useState<TaskOrder[]>([]);
  const [drivers,         setDrivers]         = useState<Driver[]>([]);
  const [tasks,           setTasks]           = useState<LogisticTask[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [assigning,       setAssigning]       = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedType,    setSelectedType]    = useState<"pickup" | "delivery">("pickup");
  const [toast,           setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem("nj_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [ordersRes, tasksRes] = await Promise.all([
        fetch(`${API}/orders`,           { headers }),
        fetch(`${API}/logistics/tasks`,  { headers }),
      ]);

      // ── Orders ────────────────────────────────────────────────────────
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const rawOrders: any[] = ordersData?.data ?? [];

      const BKK = { lat: 13.756, lng: 100.502 };
      const activeOrders: TaskOrder[] = rawOrders
        .filter(o => !["completed","cancelled"].includes(o.status))
        .map((o, i) => ({
          id:              String(o.id),
          orderNumber:     o.orderNumber   ?? `ORD-${String(o.id).slice(-4)}`,
          customerName:    o.customerName  ?? null,
          customerPhone:   o.customerPhone ?? null,
          pickupAddress:   o.pickupAddress   ?? null,
          deliveryAddress: o.deliveryAddress ?? null,
          orderType:       o.orderType   ?? "b2c",
          status:          o.status,
          paymentStatus:   o.paymentStatus ?? "pending",
          totalAmount:     o.totalAmount  ?? "0",
          createdAt:       o.createdAt,
          // ถ้าไม่มี coordinates → scatter รอบ BKK เพื่อ demo
          lat: o.lat ?? (BKK.lat + (Math.random() - 0.5) * 0.08),
          lng: o.lng ?? (BKK.lng + (Math.random() - 0.5) * 0.10),
        }));
      setOrders(activeOrders);

      // ── Tasks + Drivers ───────────────────────────────────────────────
      const tasksData = tasksRes.ok ? await tasksRes.json() : { data: [] };
      const rawTasks: any[] = tasksData?.data ?? [];

      const mappedTasks: LogisticTask[] = rawTasks.map(t => ({
        id:          String(t.id),
        taskType:    t.taskType   ?? t.task_type,
        status:      t.status,
        orderNumber: t.orderNumber ?? "—",
        driverName:  t.driverName  ?? "ไม่ระบุ",
        driverId:    t.driverId    ?? t.driver_id,
        customerName:    t.customerName    ?? null,
        pickupAddress:   t.pickupAddress   ?? null,
        deliveryAddress: t.deliveryAddress ?? null,
      }));
      setTasks(mappedTasks);

      // สร้าง driver list จาก tasks (unique by driverId)
      const driverMap: Record<string, Driver> = {};
      rawTasks.forEach(t => {
        const did  = String(t.driverId ?? t.driver_id ?? t.id);
        const name = t.driverName ?? "Driver";
        if (!driverMap[did]) {
          driverMap[did] = { id: did, name, status: "ว่าง", taskCount: 0 };
        }
        if (t.status === "in_progress") driverMap[did].status = "กำลังส่ง";
        if (!["completed","cancelled"].includes(t.status)) driverMap[did].taskCount++;
      });

      const driverList = Object.values(driverMap);
      // fallback ถ้ายังไม่มี tasks
      if (driverList.length === 0) {
        setDrivers([
          { id: "10000000-0000-0000-0000-000000000003", name: "ไก่ รับส่ง",  status: "ว่าง", taskCount: 0 },
          { id: "10000000-0000-0000-0000-000000000004", name: "นก รับส่ง",   status: "ว่าง", taskCount: 0 },
          { id: "10000000-0000-0000-0000-000000000005", name: "แมว รับส่ง",  status: "ว่าง", taskCount: 0 },
        ]);
      } else {
        setDrivers(driverList);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Assign task (POST /logistics/tasks) ───────────────────────────────────
  const handleAssign = async (driverId: string, driverName: string) => {
    if (!selectedOrderId) { showToast("⚠️ กรุณาเลือกออเดอร์ก่อน"); return; }
    setAssigning(driverId);
    try {
      const token = localStorage.getItem("nj_token");
      const res   = await fetch(`${API}/logistics/tasks`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId:  selectedOrderId,    // ← camelCase
          driverId: driverId,
          taskType: selectedType,       // 'pickup' | 'delivery'
        }),
      });

      if (res.ok) {
        setDrivers(prev =>
          prev.map(d => d.id === driverId
            ? { ...d, status: "กำลังส่ง", taskCount: d.taskCount + 1 }
            : d
          )
        );
        showToast(`✅ มอบหมาย ${TASK_TYPE_LABEL[selectedType]} ให้ ${driverName} แล้ว`);
        setSelectedOrderId(null);
        await fetchData(); // refresh
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(`❌ ${err.message ?? "มอบหมายงานไม่สำเร็จ"}`);
      }
    } catch (e) {
      console.error(e);
      showToast("❌ ไม่สามารถเชื่อมต่อ server");
    } finally {
      setAssigning(null);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="flex h-full gap-5 p-6 overflow-hidden">

      {/* ─── LEFT: Order list ─────────────────────────────────────────── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-base">รายการรอดำเนินการ</h1>
            {selectedOrderId && (
              <p className="text-xs text-blue-500 mt-0.5 font-medium">เลือกแล้ว → คลิก "มอบหมายงาน"</p>
            )}
          </div>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {orders.length} รายการ
          </span>
        </div>

        {/* Task type selector */}
        {selectedOrderId && (
          <div className="flex gap-2">
            {(["pickup","delivery"] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  selectedType === t ? "bg-[#0d1b2e] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {TASK_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
            ))
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-gray-400">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              ไม่มีออเดอร์ที่ต้องดำเนินการ
            </div>
          ) : (
            orders.map(o => {
              const cfg      = STATUS_CFG[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
              const selected = selectedOrderId === o.id;
              const name     = o.customerName ?? "ลูกค้า";

              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(selected ? null : o.id)}
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border-2 transition-all hover:shadow-md ${
                    selected ? "border-blue-400 ring-2 ring-blue-100" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">#{o.orderNumber}</span>
                  </div>

                  <p className="font-semibold text-gray-800 text-sm mb-1">{name}</p>

                  {o.customerPhone && (
                    <p className="text-xs text-gray-400 mb-1">📞 {o.customerPhone}</p>
                  )}

                  {(o.pickupAddress || o.deliveryAddress) && (
                    <div className="flex items-start gap-1.5 mb-2">
                      <svg width="12" height="12" className="text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="text-xs text-gray-500 leading-tight line-clamp-2">
                        {o.pickupAddress ?? o.deliveryAddress}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      o.orderType === "b2b" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {o.orderType?.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${
                      o.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {o.paymentStatus === "paid" ? "✅ ชำระแล้ว" : "⏳ รอชำระ"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT: Drivers + Map ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">

        {/* Drivers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">พนักงานขับรถ</h2>
            {selectedOrder && (
              <div className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-medium">
                กำลังมอบหมาย: #{selectedOrder.orderNumber}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {drivers.map(d => (
              <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full ${avatarColors[d.name.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs`}>
                      {getInitials(d.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-xs leading-tight">{d.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === "ว่าง" ? "bg-emerald-400" : "bg-blue-400"}`} />
                        <span className={`text-[11px] ${d.status === "ว่าง" ? "text-emerald-600" : "text-blue-600"}`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {d.taskCount > 0 && (
                  <p className="text-[11px] text-gray-400 mb-2">{d.taskCount} งานที่รับแล้ว</p>
                )}

                <button
                  onClick={() => handleAssign(d.id, d.name)}
                  disabled={assigning === d.id || !selectedOrderId}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedOrderId
                      ? "bg-[#0d1b2e] hover:bg-[#1e3a5f] text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  } ${assigning === d.id ? "opacity-70" : ""}`}
                >
                  {assigning === d.id ? "กำลังมอบหมาย..." : "มอบหมายงาน"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks table */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">งานที่มอบหมายแล้ว</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                    {["Order","Driver","ประเภท","สถานะ","ลูกค้า"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.slice(0, 8).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-500">#{t.orderNumber}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${avatarColors[t.driverName.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {getInitials(t.driverName)}
                        </div>
                        <span className="text-xs text-gray-700">{t.driverName}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {TASK_TYPE_LABEL[t.taskType] ?? t.taskType}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          t.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {t.status === "assigned" ? "มอบหมายแล้ว" :
                           t.status === "in_progress" ? "กำลังดำเนินการ" :
                           t.status === "completed" ? "เสร็จสิ้น" : t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {t.customerName ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">แผนที่จุดรับ-ส่ง</h2>
            <span className="text-xs text-gray-400">{orders.length} จุด</span>
          </div>
          <div className="flex-1 min-h-[240px]">
            <GoogleMapView orders={orders} />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>
    </div>
  );
}
