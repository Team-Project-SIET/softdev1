"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// ⚠️ ใส่ Google Maps API Key ของคุณที่นี่ หรือใน .env.local เป็น NEXT_PUBLIC_GMAPS_KEY
const GMAPS_KEY = process.env.NEXT_PUBLIC_GMAPS_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaskOrder {
  id: string;
  order_code: string;
  customer_name: string;
  address: string;
  service_name: string;
  status: string;
  scheduled_time: string | null;
  lat?: number;
  lng?: number;
  assigned_driver_id?: string | null;
}

interface Driver {
  id: string;
  name: string;
  avatar_url?: string;
  vehicle?: string;
  status: "ว่าง" | "กำลังส่ง";
  task_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: "รอรับผ้า", color: "bg-amber-100 text-amber-700" },
  picked_up:  { label: "รับผ้าแล้ว", color: "bg-blue-100 text-blue-700" },
  ready:      { label: "รอส่งผ้า", color: "bg-violet-100 text-violet-700" },
  delivering: { label: "รอส่งผ้า", color: "bg-sky-100 text-sky-600" },
  delivered:  { label: "ส่งแล้ว", color: "bg-emerald-100 text-emerald-700" },
};

const avatarColors = [
  "bg-blue-500","bg-violet-500","bg-emerald-500",
  "bg-amber-500","bg-rose-500","bg-cyan-500",
];

function getInitials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function formatTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
}

// Service icon (SVG path)
function ServiceIcon({ name }: { name: string }) {
  if (name?.includes("รีด") || name?.includes("press"))
    return (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-blue-500">
        <path d="M3 12h18M3 12c0-3.87 3.13-7 7-7h4c3.87 0 7 3.13 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="6" y="12" width="12" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  if (name?.includes("อบ") || name?.includes("dry"))
    return (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-orange-500">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-sky-500">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

// ─── Google Map component ─────────────────────────────────────────────────────
declare global { interface Window { google: any; initGMap: () => void; } }

function GoogleMapView({ orders }: { orders: TaskOrder[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [noKey, setNoKey] = useState(false);

  // Load Google Maps script once
  useEffect(() => {
    if (!GMAPS_KEY) { setNoKey(true); return; }
    if (window.google?.maps) { setLoaded(true); return; }
    if (document.getElementById("gmaps-script")) {
      const check = setInterval(() => { if (window.google?.maps) { setLoaded(true); clearInterval(check); } }, 200);
      return () => clearInterval(check);
    }
    window.initGMap = () => setLoaded(true);
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=initGMap&language=th`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Init map
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 13.756, lng: 100.502 },
      zoom: 12,
      disableDefaultUI: false,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [loaded]);

  // Update markers when orders change
  useEffect(() => {
    if (!mapInstance.current || !loaded) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    orders.forEach((o, i) => {
      if (!o.lat || !o.lng) return;
      const pos = { lat: o.lat, lng: o.lng };
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        title: o.customer_name,
        label: { text: String(i + 1), color: "white", fontSize: "11px", fontWeight: "bold" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: o.status === "pending" ? "#f59e0b" : o.status === "delivering" ? "#6366f1" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });
      const iw = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;padding:4px 2px"><p style="font-weight:600;margin:0 0 2px">${o.customer_name}</p><p style="color:#6b7280;font-size:12px;margin:0">${o.address}</p></div>`,
      });
      marker.addListener("click", () => iw.open(mapInstance.current, marker));
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (!bounds.isEmpty()) mapInstance.current.fitBounds(bounds);
  }, [orders, loaded]);

  if (noKey) {
    return (
      <div className="flex-1 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-3">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-blue-500">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <p className="font-semibold text-gray-700">Google Maps</p>
        <p className="text-sm text-gray-500 max-w-[220px]">
          ใส่ Google Maps API Key ใน<br />
          <code className="bg-gray-200 text-gray-700 px-1 rounded text-xs">NEXT_PUBLIC_GMAPS_KEY</code><br />
          เพื่อแสดงแผนที่
        </p>
        {/* Fallback: Show order locations as list */}
        <div className="w-full mt-2 space-y-2 max-h-48 overflow-y-auto">
          {orders.filter(o => o.address).map((o, i) => (
            <div key={o.id} className="flex items-center gap-2 text-left bg-white rounded-xl px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{o.customer_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{o.address}</p>
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
  const [orders, setOrders] = useState<TaskOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null); // driverId being assigned
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nj_token");
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [ordersRes, driversRes] = await Promise.all([
        fetch(`${API}/orders?limit=50&status=pending,ready,delivering,picked_up`, { headers: h }),
        fetch(`${API}/logistics/drivers`, { headers: h }).catch(() =>
          fetch(`${API}/customers?limit=20`, { headers: h })
        ),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const rawOrders: any[] = ordersData?.data ?? ordersData?.orders ?? [];

      // Map orders — geocode ด้วย lat/lng ถ้ามี หรือ assign Bangkok coords แบบ random สำหรับ demo
      const BKK_CENTER = { lat: 13.756, lng: 100.502 };
      const mapped: TaskOrder[] = rawOrders
        .filter((o) => !["delivered", "cancelled"].includes(o.status))
        .slice(0, 20)
        .map((o, i) => ({
          id: String(o.id),
          order_code: o.order_code ?? `ORD-${String(o.id).slice(-4)}`,
          customer_name: o.customer_name ?? o.customer?.name ?? "ลูกค้า",
          address: o.delivery_address ?? o.address ?? o.customer?.address ?? "ไม่ระบุที่อยู่",
          service_name: o.service_name ?? o.service?.name ?? "บริการซัก",
          status: o.status,
          scheduled_time: o.scheduled_delivery ?? o.scheduled_pickup ?? null,
          assigned_driver_id: o.assigned_driver_id ?? null,
          // ถ้าไม่มี coordinates ให้ scatter รอบ BKK
          lat: o.lat ?? (BKK_CENTER.lat + (Math.random() - 0.5) * 0.1),
          lng: o.lng ?? (BKK_CENTER.lng + (Math.random() - 0.5) * 0.12),
        }));
      setOrders(mapped);

      // Drivers
      const driversData = driversRes.ok ? await driversRes.json() : { data: [] };
      const rawDrivers: any[] = driversData?.data ?? driversData?.drivers ?? driversData?.users ?? [];
      const driverList: Driver[] = rawDrivers
        .filter((d: any) => d.role === "driver" || driversData?.drivers)
        .slice(0, 6)
        .map((d: any, i: number) => ({
          id: String(d.id),
          name: d.name ?? d.email ?? `คนขับ ${i + 1}`,
          avatar_url: d.avatar_url,
          vehicle: d.vehicle ?? (i % 2 === 0 ? "มอเตอร์ไซต์" : "รถยนต์"),
          status: mapped.some((o) => o.assigned_driver_id === String(d.id)) ? "กำลังส่ง" : "ว่าง",
          task_count: mapped.filter((o) => o.assigned_driver_id === String(d.id)).length,
        }));

      // Fallback mock drivers if API returns none
      if (driverList.length === 0) {
        setDrivers([
          { id: "d1", name: "เจมจิรา อ้อยบำรุง", vehicle: "มอเตอร์ไซต์", status: "ว่าง", task_count: 0 },
          { id: "d2", name: "สมพร ดวงดี", vehicle: "มอเตอร์ไซต์", status: "ว่าง", task_count: 0 },
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

  const handleAssign = async (driverId: string, driverName: string) => {
    if (!selectedOrderId) { showToast("⚠️ กรุณาเลือกออเดอร์ก่อน"); return; }
    setAssigning(driverId);
    try {
      const token = localStorage.getItem("nj_token");
      const h: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(`${API}/logistics/assign`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ order_id: selectedOrderId, driver_id: driverId }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrderId ? { ...o, assigned_driver_id: driverId } : o))
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId ? { ...d, status: "กำลังส่ง", task_count: d.task_count + 1 } : d
        )
      );
      showToast(`✅ มอบหมายงานให้ ${driverName} แล้ว`);
      setSelectedOrderId(null);
    } catch (e) {
      console.error(e);
      showToast("❌ มอบหมายงานไม่สำเร็จ");
    } finally {
      setAssigning(null);
    }
  };

  const pendingOrders = orders.filter((o) => ["pending", "ready"].includes(o.status));
  const inProgressOrders = orders.filter((o) => ["delivering", "picked_up"].includes(o.status));
  const allTaskOrders = [...pendingOrders, ...inProgressOrders];

  return (
    <div className="flex h-full gap-5 p-6 overflow-hidden">
      {/* ─── Left: Order list ─────────────────────────────────────────── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-base">รายการรอการรับ-ส่ง</h1>
            {selectedOrderId && (
              <p className="text-xs text-blue-500 mt-0.5 font-medium">เลือกออเดอร์แล้ว → คลิก "มอบหมายงาน"</p>
            )}
          </div>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {allTaskOrders.length} รายการ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
            ))
          ) : allTaskOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2"/></svg>
              </div>
              ไม่มีออเดอร์รอดำเนินการ
            </div>
          ) : (
            allTaskOrders.map((o) => {
              const cfg = STATUS_CFG[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
              const selected = selectedOrderId === o.id;
              const assignedDriver = drivers.find((d) => d.id === o.assigned_driver_id);
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
                    <span className="text-xs text-gray-400">ID: #{o.order_code}</span>
                  </div>

                  <p className="font-semibold text-gray-800 mb-1">{o.customer_name}</p>

                  <div className="flex items-start gap-1.5 mb-2">
                    <svg width="12" height="12" className="text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-xs text-gray-500 leading-tight">{o.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <ServiceIcon name={o.service_name} />
                      <span className="text-xs text-gray-600">{o.service_name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{formatTime(o.scheduled_time)}</span>
                  </div>

                  {assignedDriver && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">
                        {getInitials(assignedDriver.name)}
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">มอบหมายให้ {assignedDriver.name} แล้ว</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right: Drivers + Map ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Drivers */}
        <div>
          <h2 className="font-bold text-gray-900 text-base mb-3">พนักงานขับรถ</h2>
          <div className="grid grid-cols-2 gap-3">
            {drivers.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {d.avatar_url ? (
                      <img src={d.avatar_url} alt={d.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${avatarColors[d.name.charCodeAt(0) % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                        {getInitials(d.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{d.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === "ว่าง" ? "bg-emerald-400" : "bg-blue-400"}`} />
                        <span className={`text-xs ${d.status === "ว่าง" ? "text-emerald-600" : "text-blue-600"}`}>{d.status}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{d.vehicle}</span>
                </div>

                {d.task_count > 0 && (
                  <p className="text-xs text-gray-400 mb-2">{d.task_count} งานที่รับแล้ว</p>
                )}

                <button
                  onClick={() => handleAssign(d.id, d.name)}
                  disabled={assigning === d.id || !selectedOrderId}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedOrderId
                      ? "bg-[#0d1b2e] hover:bg-[#1e3a5f] text-white cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  } ${assigning === d.id ? "opacity-70" : ""}`}
                >
                  {assigning === d.id ? "กำลังมอบหมาย..." : "มอบหมายงาน"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">แผนที่จุดส่ง</h2>
            <span className="text-xs text-gray-400">{allTaskOrders.filter(o => o.lat).length} จุด</span>
          </div>
          <div className="flex-1 min-h-[280px]">
            <GoogleMapView orders={allTaskOrders} />
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
        @keyframes fade-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>
    </div>
  );
}