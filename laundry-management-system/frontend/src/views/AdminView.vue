<template>
  <div class="w-full space-y-10 pb-20 animate-fade-in bg-slate-50/50 min-h-screen font-sans">
    
    <section class="relative bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white shadow-2xl overflow-hidden mx-4 mt-4 max-w-[1400px] xl:mx-auto">
      <div class="absolute top-[-10%] left-[-5%] w-96 h-96 bg-[#00b09b]/20 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div class="relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 class="text-5xl font-black italic tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              COMMAND CENTER
            </h1>
            <p class="text-slate-400 mt-2 font-medium tracking-wide uppercase text-xs flex items-center gap-2">
              <span>Real-time Logistics Monitoring System</span>
              <span v-if="isSyncing" class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md animate-pulse">Syncing...</span>
            </p>
          </div>
          <div class="flex items-center gap-4">
            <button @click="logout" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20 shadow-sm">
              LOGOUT
            </button>
            <div class="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-lg">
               <div class="text-right">
                  <p class="text-[10px] text-slate-500 font-black">SYSTEM STATUS</p>
                  <p class="text-emerald-400 font-bold text-sm">LIVE MONITORING</p>
               </div>
               <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <div class="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <div class="w-3 h-3 bg-emerald-500 rounded-full relative z-10"></div>
               </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div class="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-lg relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-center mb-8">
                 <h4 class="font-black text-sm uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <span class="text-emerald-400">📊</span> Expected Revenue Stream
                 </h4>
                 <span class="text-xs text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full font-black border border-emerald-500/20 shadow-sm">
                   ฿{{ totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }} Total
                 </span>
              </div>
              <div class="flex items-end justify-between h-40 gap-3">
                <div v-for="(val, i) in weeklyChartData" :key="i" class="flex-1 flex flex-col items-center group relative">
                  <div class="w-full bg-gradient-to-t from-[#00b09b]/10 to-[#00b09b]/30 rounded-t-xl group-hover:from-[#00b09b]/40 group-hover:to-[#00b09b] transition-all duration-500 relative shadow-inner" :style="{ height: val.percent + '%' }">
                     <div class="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 px-3 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap">
                       ฿{{val.amount.toLocaleString()}}
                       <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                     </div>
                  </div>
                  <span class="text-[10px] text-slate-400 mt-4 font-black group-hover:text-emerald-400 transition-colors">{{ ['MON','TUE','WED','THU','FRI','SAT','SUN'][i] }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 flex flex-col items-center justify-center shadow-lg relative">
             <h4 class="font-black text-sm uppercase tracking-widest text-slate-300 mb-6 w-full text-center flex items-center justify-center gap-2">
                <span class="text-[#00b09b]">🎯</span> Job Distribution
             </h4>
             <div class="relative w-36 h-36 mb-6">
                <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(0,176,155,0.3)]">
                  <circle cx="18" cy="18" r="16" fill="none" class="text-slate-800/80" stroke="currentColor" stroke-width="3"></circle>
                  <circle cx="18" cy="18" r="16" fill="none" class="text-[#00b09b]" stroke="currentColor" stroke-width="3.5" 
                    :stroke-dasharray="`${completionRate}, 100`" stroke-linecap="round" style="transition: stroke-dasharray 1.5s cubic-bezier(0.23, 1, 0.32, 1);"></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-full m-2 backdrop-blur-sm border border-white/5">
                   <span class="text-3xl font-black text-white leading-none">{{ orders.length }}</span>
                   <span class="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider">Total Tasks</span>
                </div>
             </div>
             <div class="flex justify-center gap-5 w-full text-[10px] font-black tracking-wider bg-black/20 py-2.5 rounded-xl border border-white/5">
                <div class="flex items-center gap-2 text-[#00b09b]"><span class="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#00b09b] to-emerald-400 shadow-[0_0_5px_rgba(0,176,155,0.5)]"></span> DONE ({{ countByStatus('completed') }})</div>
                <div class="flex items-center gap-2 text-slate-400"><span class="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500"></span> ACTIVE ({{ orders.length - countByStatus('completed') - countByStatus('cancelled') }})</div>
             </div>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="stat in summaryStats" :key="stat.label" class="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-300 group relative overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1">
            <div class="absolute right-[-10px] bottom-[-20px] text-7xl opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 transform group-hover:-rotate-12">{{ stat.icon }}</div>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest flex justify-between items-center">
              {{ stat.label }}
            </p>
            <p class="text-4xl font-black mt-3 flex items-baseline gap-2" :class="stat.color">
              {{ stat.value }} 
              <span v-if="stat.subtext" class="text-xs font-medium opacity-60">{{ stat.subtext }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-[1400px] mx-auto px-4 xl:px-0">
      <div class="bg-white rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden relative">
        <div v-if="isLoadingData" class="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
          <div class="w-12 h-12 border-4 border-[#00b09b]/30 border-t-[#00b09b] rounded-full animate-spin"></div>
          <p class="text-slate-500 font-bold mt-4 text-sm tracking-wide">กำลังโหลดข้อมูลระบบ...</p>
        </div>

        <div class="p-8 md:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
          <div class="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
            <h3 class="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span class="bg-slate-900 text-white p-2.5 rounded-xl text-lg shadow-md">📋</span> Operational Log
            </h3>
            <div class="relative w-full md:w-80 group">
              <input v-model="searchQuery" type="text" placeholder="ค้นหารหัส #NJ, เบอร์โทร, ชื่อลูกค้า..." 
                class="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white focus:bg-white focus:ring-4 focus:ring-[#00b09b]/10 focus:border-[#00b09b]/50 transition-all font-medium text-sm outline-none shadow-sm">
              <span class="absolute left-4 top-4 opacity-40 group-focus-within:opacity-100 group-focus-within:text-[#00b09b] transition-all text-lg">🔍</span>
              <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-4 top-4 text-slate-300 hover:text-red-400 transition-colors">✕</button>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-100/80 rounded-3xl border border-slate-200/50 shadow-inner">
              <button v-for="f in filterOptions" :key="f.value" @click="selectedFilter = f.value"
                :class="['px-5 py-3 rounded-2xl text-[11px] font-black tracking-wide transition-all duration-300', 
                        selectedFilter === f.value 
                          ? 'bg-white text-[#00b09b] shadow-[0_5px_15px_rgba(0,176,155,0.15)] scale-[1.02] border border-slate-100' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50']">
                {{ f.label }}
              </button>
          </div>
        </div>

        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left whitespace-nowrap">
            <thead>
              <tr class="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100 bg-slate-50/50">
                <th class="px-8 py-6 rounded-tl-3xl">Customer & Order</th>
                <th class="px-6 py-6">Service Type</th>
                <th class="px-6 py-6 text-center">Operation Stats</th>
                <th class="px-6 py-6 text-center">Current Phase</th>
                <th class="px-8 py-6 text-right rounded-tr-3xl">Actions / Command</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/80">
              <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50/80 transition-all duration-200 group">
                <td class="px-8 py-5">
                  <div class="flex items-center space-x-4">
                    <div class="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                      <span class="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-300">ID</span>
                      <span class="font-black text-lg leading-none">{{ String(order.id).slice(-2) }}</span>
                    </div>
                    <div>
                      <p class="font-black text-slate-800 text-[15px] mb-1 group-hover:text-[#00b09b] transition-colors flex items-center gap-2">
                        {{ order.customerName || 'ไม่ระบุชื่อลูกค้า' }}
                        <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">#NJ-{{ String(order.id).slice(-5) }}</span>
                      </p>
                      <div class="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                        <span class="flex items-center gap-1"><span class="text-slate-300">📞</span> {{ order.phone || '-' }}</span>
                        <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span class="uppercase tracking-wider">{{ formatDate(order.date) }}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-5">
                  <div class="flex flex-col items-start gap-1.5">
                    <span class="font-bold text-slate-700 text-sm flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      {{ getServiceIcon(order.serviceType) }} {{ getServiceText(order.serviceType) }}
                    </span>
                    <span v-if="order.note && order.note !== '-'" class="text-[10px] text-amber-600 bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 max-w-[200px] truncate" :title="order.note">
                      <span>⚠️</span> {{ order.note }}
                    </span>
                  </div>
                </td>

                <td class="px-6 py-5 text-center">
                  <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/50 border border-slate-100/50 w-max mx-auto min-w-[100px]">
                    <span class="font-black text-slate-700 text-sm">
                      {{ order.weight ? order.weight + ' kg' : 'ยังไม่ระบุ' }}
                    </span>
                    <div class="w-full h-[1px] bg-slate-200 my-1"></div>
                    <span class="text-[13px] font-black text-[#00b09b]">
                      ฿{{ order.price ? parseFloat(order.price).toLocaleString(undefined, {minimumFractionDigits:2}) : '0.00' }}
                    </span>
                  </div>
                </td>

                <td class="px-6 py-5 text-center">
                  <div class="flex flex-col items-center gap-1.5">
                    <span class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm inline-flex items-center justify-center gap-2 min-w-[130px] border" :class="getStatusBadgeClass(order.status)">
                      <span class="w-2 h-2 rounded-full animate-pulse" :class="getStatusDotClass(order.status)"></span> 
                      {{ getStatusText(order.status) }}
                    </span>
                    <span class="text-[9px] font-bold text-slate-400">{{ getStatusSubtext(order.status) }}</span>
                  </div>
                </td>

                <td class="px-8 py-5 text-right">
                   <div class="flex items-center justify-end space-x-3 relative">
                      <div v-if="updatingId === order.id" class="absolute inset-y-0 right-0 flex items-center justify-center bg-white/80 backdrop-blur-sm px-6 rounded-2xl z-10 w-full">
                         <div class="flex items-center gap-2 text-[#00b09b] font-bold text-xs">
                           <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Processing...
                         </div>
                      </div>

                      <button v-if="order.status !== 'completed' && order.status !== 'cancelled'" 
                        @click="cancelOrder(order.id)" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 hover:shadow-red-500/20" title="ยกเลิกออเดอร์">
                        ✕
                      </button>

                      <button 
                        v-if="order.status !== 'completed' && order.status !== 'cancelled'"
                        @click="handleAdvance(order)" 
                        :class="['px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-md flex items-center gap-2 min-w-[140px] justify-center', 
                                getActionButtonClass(order.status)]">
                        {{ getNextStepText(order.status) }}
                      </button>

                      <div v-if="order.status === 'completed'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center gap-2 justify-center min-w-[140px] opacity-70">
                         🎉 JOB CLOSED
                      </div>
                      <div v-if="order.status === 'cancelled'" class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-400 border border-red-100 flex items-center gap-2 justify-center min-w-[140px] opacity-70">
                         🚫 ABORTED
                      </div>
                   </div>
                </td>
              </tr>
              
              <tr v-if="filteredOrders.length === 0 && !isLoadingData">
                <td colspan="5" class="py-24 text-center text-slate-400">
                  <div class="text-6xl mb-4 opacity-40 grayscale flex justify-center">📭</div>
                  <p class="font-black text-xl text-slate-600 mb-1">ไม่พบข้อมูลออเดอร์ในระบบ</p>
                  <p class="text-sm font-medium">ลองเปลี่ยนฟิลเตอร์ (Tab) หรือคำค้นหาในช่อง Search</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// ==========================================
// 1. STATES
// ==========================================
const orders = ref([]);
const searchQuery = ref('');
const selectedFilter = ref('all');
const isLoadingData = ref(true); // โหลดครั้งแรก
const isSyncing = ref(false); // สถานะตอน Polling
const updatingId = ref(null); // ID ของออเดอร์ที่กำลังกดอัปเดต
let pollingInterval = null;

const filterOptions = [
  { label: 'ALL JOBS', value: 'all' },
  { label: 'WAITING (คนขับ)', value: 'pending' },
  { label: 'WASHING (ซัก)', value: 'processing' },
  { label: 'DELIVERING (คนขับ)', value: 'delivering' },
  { label: 'DONE', value: 'completed' },
];

// ==========================================
// 2. LIFECYCLE & DATA FETCHING
// ==========================================
onMounted(() => {
  // ตรวจสอบสิทธิ์ (Admin Guard)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || user.role !== 'admin') {
    alert('Access Denied: 🛡️ พื้นที่เฉพาะผู้ดูแลระบบ (Command Center) เท่านั้น');
    router.push('/login');
    return;
  }

  fetchOrders(false);

  // 🔄 Real-time Polling: ดึงข้อมูลเบื้องหลังทุก 5 วินาที
  pollingInterval = setInterval(() => {
    // ไม่ดึงถ้ากำลังกดอัปเดตข้อมูลอยู่ (ป้องกันข้อมูลกระตุก)
    if (!updatingId.value) {
      fetchOrders(true);
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

const fetchOrders = async (isSilent = false) => {
  if (!isSilent) isLoadingData.value = true;
  else isSyncing.value = true;

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // เรียงจากใหม่ไปเก่า
    orders.value = response.data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  } catch (error) {
    // 🔙 Fallback: ใช้ LocalStorage เสมือนเป็น Database กลาง
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    orders.value = localOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  } finally {
    isLoadingData.value = false;
    setTimeout(() => isSyncing.value = false, 500); // ดีเลย์ปิดคำว่า Syncing ให้ user เห็นนิดนึง
  }
};

// ==========================================
// 3. COMPUTED PROPERTIES (DASHBOARD & FILTERS)
// ==========================================
const filteredOrders = computed(() => {
  let res = orders.value;
  // กรองตาม Tab สถานะ
  if (selectedFilter.value !== 'all') {
    res = res.filter(o => o.status === selectedFilter.value);
  }
  // กรองตามช่องค้นหา
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    res = res.filter(o => 
      (o.id && String(o.id).includes(query)) || 
      (o.customerName && o.customerName.toLowerCase().includes(query)) ||
      (o.phone && o.phone.includes(query)) ||
      (o.serviceType && getServiceText(o.serviceType).toLowerCase().includes(query))
    );
  }
  return res;
});

const countByStatus = (status) => orders.value.filter(o => o.status === status).length;

const totalRevenue = computed(() => {
  return orders.value
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
});

const summaryStats = computed(() => [
  { label: 'Total Volume', value: orders.value.length, subtext: 'Orders', color: 'text-white', icon: '📦' },
  { label: 'Pending Logistics', value: countByStatus('pending') + countByStatus('delivering'), subtext: 'Tasks', color: 'text-amber-400', icon: '🚚' },
  { label: 'In Washing Machine', value: countByStatus('processing'), subtext: 'Loads', color: 'text-blue-400', icon: '🧼' },
  { label: 'Success Rate', value: completionRate.value + '%', subtext: 'Done', color: 'text-emerald-400', icon: '🏆' }
]);

const completionRate = computed(() => {
  const activeOrders = orders.value.filter(o => o.status !== 'cancelled').length;
  if (activeOrders === 0) return 0;
  return ((countByStatus('completed') / activeOrders) * 100).toFixed(0);
});

// Mock ข้อมูลกราฟแท่งโดยอิงจาก Revenue รวม (ให้ดูขยับตามจริงนิดหน่อย)
const weeklyChartData = computed(() => {
  const base = totalRevenue.value / 7 || 1500;
  return [
    { percent: 40, amount: Math.floor(base * 0.4) },
    { percent: 65, amount: Math.floor(base * 0.65) },
    { percent: 50, amount: Math.floor(base * 0.5) },
    { percent: Math.min(90, (base * 1.2) / 20), amount: Math.floor(base * 1.2) }, // ตัวอย่าง Random Peak
    { percent: 75, amount: Math.floor(base * 0.75) },
    { percent: 100, amount: Math.floor(base * 1.5) },
    { percent: 85, amount: Math.floor(base * 0.85) }
  ];
});

// ==========================================
// 4. ACTIONS (WORKFLOW COMMANDS)
// ==========================================
const handleAdvance = async (order) => {
  const flow = ['pending', 'processing', 'delivering', 'completed'];
  const currentIndex = flow.indexOf(order.status);
  if (currentIndex === -1 || currentIndex === flow.length - 1) return;
  
  const nextStatus = flow[currentIndex + 1];

  // Logic ตรวจสอบก่อนขยับสเตตัส (เผื่อมีเงื่อนไขบังคับ)
  if (order.status === 'pending') {
    if (!confirm(`ออเดอร์ #${String(order.id).slice(-5)}\nต้องการรับผ้าเข้าร้าน และเริ่มกระบวนการซักใช่หรือไม่?`)) return;
  } else if (order.status === 'processing') {
    if (!confirm(`ออเดอร์ #${String(order.id).slice(-5)}\nผ้าซักเสร็จเรียบร้อยแล้ว ต้องการส่งงานให้คนขับ (Deliver) ใช่หรือไม่?`)) return;
  } else if (order.status === 'delivering') {
    if (!confirm(`แอดมินต้องการปิดงาน (Force Complete) ออเดอร์นี้แทนคนขับใช่หรือไม่?`)) return;
  }

  updatingId.value = order.id; // เปิด Spinner

  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/admin/orders/${order.id}`, { status: nextStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchOrders(true);
  } catch (error) {
    // 🔙 Fallback
    await new Promise(resolve => setTimeout(resolve, 600)); // Fake API delay
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    const index = localOrders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      localOrders[index].status = nextStatus;
      localStorage.setItem('myOrders', JSON.stringify(localOrders));
      orders.value = localOrders;
    }
  } finally {
    updatingId.value = null; // ปิด Spinner
  }
};

const cancelOrder = async (orderId) => {
  if (confirm('🚨 คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการ "ยกเลิก" ออเดอร์นี้?\nการกระทำนี้ไม่สามารถย้อนกลับได้')) {
    updatingId.value = orderId;
    try {
      // (API call structure is same as handleAdvance)
      await new Promise(resolve => setTimeout(resolve, 500));
      const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
      const index = localOrders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        localOrders[index].status = 'cancelled';
        localStorage.setItem('myOrders', JSON.stringify(localOrders));
        orders.value = localOrders;
      }
    } finally {
      updatingId.value = null;
    }
  }
};

const logout = () => {
  if (confirm('ยืนยันการออกจากระบบ?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
};

// ==========================================
// 5. FORMATTERS & HELPERS (UI Text/Styles)
// ==========================================
const getNextStepText = (status) => ({
  pending: 'รับเข้าร้าน (ซัก)',
  processing: 'ซักเสร็จ (เรียกคนขับ)',
  delivering: 'บังคับปิดงาน',
}[status] || 'NEXT');

const getActionButtonClass = (status) => ({
  pending: 'bg-slate-900 text-white hover:bg-blue-500 hover:shadow-blue-500/30',
  processing: 'bg-blue-600 text-white hover:bg-purple-500 hover:shadow-purple-500/30',
  delivering: 'bg-purple-100 text-purple-700 hover:bg-emerald-500 hover:text-white border border-purple-200',
}[status] || 'bg-slate-200');

const getStatusText = (status) => ({
  pending: 'WAITING PICKUP',
  processing: 'IN PROGRESS',
  delivering: 'OUT FOR DELIVERY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED'
}[status] || status.toUpperCase());

const getStatusSubtext = (status) => ({
  pending: 'รอคนขับไปรับผ้า',
  processing: 'กำลังดำเนินการซัก/อบ',
  delivering: 'คนขับกำลังนำไปส่งคืน',
  completed: 'ส่งมอบและรับเงินแล้ว',
  cancelled: 'ออเดอร์ถูกยกเลิก'
}[status] || '');

const getStatusBadgeClass = (status) => ({
  pending: 'bg-amber-50 text-amber-600 border-amber-200/60',
  processing: 'bg-blue-50 text-blue-600 border-blue-200/60',
  delivering: 'bg-purple-50 text-purple-600 border-purple-200/60',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-600 border-red-200/60'
}[status] || 'bg-slate-50 border-slate-200');

const getStatusDotClass = (status) => ({
  pending: 'bg-amber-500',
  processing: 'bg-blue-500',
  delivering: 'bg-purple-500',
  completed: 'bg-emerald-500 hidden', // ปิดไฟกระพริบตอนเสร็จ
  cancelled: 'bg-red-500 hidden'
}[status] || 'bg-slate-500');

const getServiceText = (id) => {
  const map = { wash_dry_fold: 'ซัก อบ พับ', wash_iron: 'ซัก อบ รีด', dry_clean: 'ซักแห้งพิเศษ' };
  return map[id] || id || 'บริการมาตรฐาน';
};

const getServiceIcon = (id) => {
  const map = { wash_dry_fold: '🧺', wash_iron: '👔', dry_clean: '✨' };
  return map[id] || '👕';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Custom Scrollbar for the table */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
</style>