<template>
  <div class="w-full min-h-screen bg-slate-50/50 space-y-10 pb-20 animate-fade-in font-sans">
    
    <section class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-b-[3rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl overflow-hidden md:mx-4 md:mt-4 max-w-7xl lg:mx-auto">
      <div class="absolute -right-10 -bottom-10 opacity-10 transform -rotate-12 pointer-events-none">
        <span class="text-[12rem]">🚚</span>
      </div>

      <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="w-full flex justify-between items-start">
          <div>
            <h1 class="text-4xl font-black tracking-tight italic">DRIVER LOGISTICS</h1>
            <p class="text-slate-400 mt-2 font-medium">ยินดีต้อนรับกลับมา, <span class="text-orange-400 font-bold">{{ driverName }}</span></p>
          </div>
          <button @click="logout" class="md:hidden bg-white/10 text-white p-3 rounded-2xl hover:bg-red-500 transition-all shadow-sm">
            🚪
          </button>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="flex-1 md:flex-none bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center min-w-[120px] shadow-lg">
             <p class="text-[10px] uppercase font-black text-slate-400 mb-1">งานทั้งหมดวันนี้</p>
             <p class="text-3xl font-black text-white">{{ pickups.length + deliveries.length }}</p>
          </div>
          <div class="flex-1 md:flex-none bg-orange-500 px-6 py-4 rounded-3xl shadow-lg shadow-orange-500/20 text-center min-w-[120px] flex flex-col justify-center">
             <p class="text-[10px] uppercase font-black text-orange-100 mb-1">สถานะระบบ</p>
             <p class="text-lg font-black uppercase text-white flex items-center justify-center gap-2">
               <span class="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span> อัปเดตล่าสุด
             </p>
          </div>
          <button @click="logout" class="hidden md:block bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-4 rounded-3xl font-black hover:bg-red-500 hover:text-white transition-all shadow-sm">
            LOGOUT
          </button>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
      
      <div class="space-y-6">
        <div class="flex justify-between items-center px-4">
          <h3 class="text-2xl font-black text-slate-800 flex items-center">
            <span class="bg-orange-100 text-orange-600 p-3 rounded-2xl mr-4 text-xl shadow-sm">🏠</span> 
            รายการไปรับผ้า
          </h3>
          <span class="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">{{ pickups.length }} งาน</span>
        </div>

        <div v-if="isLoadingInitial" class="p-16 bg-white rounded-[3rem] flex justify-center border border-slate-100 shadow-sm">
          <svg class="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>

        <div v-else-if="pickups.length === 0" class="p-16 bg-white rounded-[3rem] text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div class="text-6xl mb-4 opacity-40 grayscale">📭</div>
          <p class="text-slate-400 font-bold text-lg">ยังไม่มีรายการรับผ้า</p>
          <p class="text-slate-400 text-sm font-medium mt-1">รอออเดอร์ใหม่จากลูกค้า</p>
        </div>

        <div v-else v-for="task in pickups" :key="task.id" class="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
          <div class="absolute top-0 right-0 w-2 h-full bg-orange-400"></div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">Request Pickup</p>
              <h4 class="text-2xl font-black text-slate-800">{{ task.customerName || 'ลูกค้าไม่ระบุชื่อ' }}</h4>
              <p class="text-xs text-slate-400 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                Order ID: #{{ String(task.id).slice(-6) }}
              </p>
            </div>
            <div class="flex space-x-2">
              <a :href="'tel:' + (task.phone || '0800000000')" class="bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl text-slate-600 shadow-sm hover:bg-blue-500 hover:text-white transition-all text-xl" title="โทรหาลูกค้า">📞</a>
              <a :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(task.address || 'Thailand')" target="_blank" class="bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl text-slate-600 shadow-sm hover:bg-emerald-500 hover:text-white transition-all text-xl" title="นำทาง">📍</a>
            </div>
          </div>

          <div class="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
            <p class="text-slate-600 text-sm leading-relaxed"><span class="font-bold text-slate-800">ที่อยู่:</span> {{ task.address || 'ติดต่อลูกค้าเพื่อสอบถามที่อยู่' }}</p>
            <div class="mt-4 flex items-center justify-between text-xs font-bold text-slate-600">
              <span class="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-1">
                <span>{{ getServiceIcon(task.serviceType) }}</span> {{ getServiceText(task.serviceType) }}
              </span>
              <span class="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">น้ำหนัก: {{ task.weight || '?' }} kg</span>
            </div>
            <p v-if="task.note && task.note !== '-'" class="mt-3 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
              ⚠️ หมายเหตุ: {{ task.note }}
            </p>
          </div>

          <button 
            @click="handleStatusUpdate(task.id, 'pending')" 
            :disabled="updatingId === task.id"
            class="w-full bg-orange-500 text-white py-5 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 transform active:scale-95 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed">
            <svg v-if="updatingId === task.id" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span v-else>✅</span>
            {{ updatingId === task.id ? 'กำลังอัปเดตระบบ...' : 'รับผ้าจากลูกค้าแล้ว' }}
          </button>
        </div>
      </div>
      

      <div class="space-y-6">
        <div class="flex justify-between items-center px-4">
          <h3 class="text-2xl font-black text-slate-800 flex items-center">
            <span class="bg-emerald-100 text-emerald-600 p-3 rounded-2xl mr-4 text-xl shadow-sm">✨</span> 
            รายการส่งคืนผ้า
          </h3>
          <span class="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm">{{ deliveries.length }} งาน</span>
        </div>

        <div v-if="isLoadingInitial" class="p-16 bg-white rounded-[3rem] flex justify-center border border-slate-100 shadow-sm">
          <svg class="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>

        <div v-else-if="deliveries.length === 0" class="p-16 bg-white rounded-[3rem] text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div class="text-6xl mb-4 opacity-40 grayscale">👕</div>
          <p class="text-slate-400 font-bold text-lg">ยังไม่มีรายการส่งคืน</p>
          <p class="text-slate-400 text-sm font-medium mt-1">รอแอดมินอัปเดตสถานะการซัก</p>
        </div>

        <div v-else v-for="task in deliveries" :key="task.id" class="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all relative overflow-hidden">
          <div class="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Ready to Deliver</p>
              <h4 class="text-2xl font-black text-slate-800">{{ task.customerName || 'ลูกค้าไม่ระบุชื่อ' }}</h4>
              <p class="text-xs text-slate-400 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                Order ID: #{{ String(task.id).slice(-6) }}
              </p>
            </div>
            <div class="flex space-x-2">
              <a :href="'tel:' + (task.phone || '0800000000')" class="bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl text-slate-600 shadow-sm hover:bg-blue-500 hover:text-white transition-all text-xl">📞</a>
              <a :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(task.address || 'Thailand')" target="_blank" class="bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl text-slate-600 shadow-sm hover:bg-emerald-500 hover:text-white transition-all text-xl">📍</a>
            </div>
          </div>

          <div class="bg-emerald-50/50 p-5 rounded-2xl mb-8 border border-emerald-100">
            <p class="text-slate-600 text-sm leading-relaxed font-medium"><span class="font-bold text-emerald-800">ส่งที่:</span> {{ task.address || 'ติดต่อลูกค้าเพื่อสอบถามที่อยู่' }}</p>
            <div class="mt-4 pt-4 border-t border-emerald-200/50 flex justify-between items-end">
               <div>
                  <p class="text-[10px] font-black text-slate-500 uppercase">ยอดที่ต้องเรียกเก็บ</p>
                  <p class="text-3xl font-black text-slate-800 italic">฿{{ task.price || '0.00' }}</p>
               </div>
               <span class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">น้ำหนัก: {{ task.weight }} kg</span>
            </div>
          </div>

          <button 
            @click="handleStatusUpdate(task.id, 'delivering')" 
            :disabled="updatingId === task.id"
            class="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 transform active:scale-95 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed">
            <svg v-if="updatingId === task.id" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span v-else>🚀</span>
            {{ updatingId === task.id ? 'กำลังปิดงาน...' : 'ส่งผ้าถึงมือลูกค้าแล้ว' }}
          </button>
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
const driverName = ref('');
const allOrders = ref([]);
const isLoadingInitial = ref(true); // โหลดครั้งแรกตอนเข้าหน้าเว็บ
const updatingId = ref(null); // เช็คว่าปุ่มไหนดำลังโหลดอยู่
let pollingInterval = null;

// ==========================================
// 2. LIFECYCLE & AUTHENTICATION
// ==========================================
onMounted(() => {
  // ตรวจสอบสิทธิ์ (Role)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || (user.role !== 'driver' && user.role !== 'admin')) {
    alert('Access Denied: พื้นที่เฉพาะพนักงานขับรถหรือแอดมินเท่านั้น');
    router.push('/login');
    return;
  }
  driverName.value = user.name || 'พนักงานขับรถ';

  // ดึงข้อมูลครั้งแรก
  fetchOrders(false);

  // 🔄 ระบบ Real-time Polling (ดึงข้อมูลทุก 5 วินาทีแบบ Silent)
  pollingInterval = setInterval(() => {
    // ดึงเฉพาะตอนที่ไม่ได้กำลังกดปุ่มอัปเดตสถานะอยู่
    if (!updatingId.value) {
      fetchOrders(true);
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

// ==========================================
// 3. FETCH DATA (API / LocalStorage)
// ==========================================
const fetchOrders = async (isSilent = false) => {
  if (!isSilent) isLoadingInitial.value = true;

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/driver/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // นำงานใหม่สุดขึ้นก่อน
    allOrders.value = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    // 🔙 Fallback: ใช้ LocalStorage (เพื่อให้ต่อกับหน้า Customer ติด)
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    allOrders.value = localOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  } finally {
    isLoadingInitial.value = false;
  }
};

// ==========================================
// 4. COMPUTED PROPERTIES (กรองงาน)
// ==========================================
// คนขับจะเห็นแค่งานที่ "รอรับผ้า(pending)" และ "กำลังส่งคืน(delivering)"
const pickups = computed(() => allOrders.value.filter(t => t.status === 'pending'));
const deliveries = computed(() => allOrders.value.filter(t => t.status === 'delivering'));

// ==========================================
// 5. ACTIONS
// ==========================================
const handleStatusUpdate = async (orderId, currentStatus) => {
  // Logic การเปลี่ยน Status
  // รับผ้า (pending) -> เอาไปซัก (processing)
  // ส่งผ้า (delivering) -> ปิดจ๊อบ (completed)
  const nextStatus = currentStatus === 'pending' ? 'processing' : 'completed';
  
  const confirmMessage = currentStatus === 'pending' 
    ? `ยืนยันว่าได้รับผ้าจากลูกค้าแล้วใช่ไหม?\n(สถานะจะเปลี่ยนเป็น "กำลังซัก" และส่งต่อไปที่แอดมิน)` 
    : `ยืนยันการส่งผ้าและเก็บเงินเรียบร้อยแล้วใช่ไหม?\n(ออเดอร์นี้จะถูกปิด)`;

  if (!confirm(confirmMessage)) return;

  updatingId.value = orderId; // เปิด Spinner ที่ปุ่ม

  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: nextStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchOrders(true); // อัปเดต UI
  } catch (err) {
    // 🔙 Fallback: บันทึกลง LocalStorage
    // จำลอง Delay ให้ดูสมจริง
    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    const index = localOrders.findIndex(o => o.id === orderId);
    
    if (index !== -1) {
      localOrders[index].status = nextStatus;
      localStorage.setItem('myOrders', JSON.stringify(localOrders));
      allOrders.value = localOrders; // อัปเดต State ทันที
    }
  } finally {
    updatingId.value = null; // ปิด Spinner
  }
};

const logout = () => {
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
};

// ==========================================
// 6. HELPER FUNCTIONS
// ==========================================
const getServiceText = (serviceKey) => {
  const map = { wash_dry_fold: 'ซัก อบ พับ', wash_iron: 'ซัก อบ รีด', dry_clean: 'ซักแห้งพิเศษ' };
  return map[serviceKey] || serviceKey || 'บริการทั่วไป';
};

const getServiceIcon = (serviceKey) => {
  const map = { wash_dry_fold: '🧺', wash_iron: '👔', dry_clean: '✨' };
  return map[serviceKey] || '👕';
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>