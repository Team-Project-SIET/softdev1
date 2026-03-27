<template>
  <div class="w-full space-y-16 pb-10 animate-fade-in">
    
    <section class="relative min-h-[350px] flex items-center rounded-[3rem] overflow-hidden shadow-2xl mx-4 lg:mx-auto max-w-7xl mt-6">
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=2000" alt="Dashboard BG" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#00b09b]/90 to-[#96c93d]/80 backdrop-blur-sm"></div>
      </div>

      <div class="relative z-10 p-10 md:p-20 text-white w-full flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="space-y-4 text-center md:text-left">
          <h1 class="text-4xl md:text-6xl font-black">สวัสดี, {{ user.name?.split(' ')[0] || 'คุณลูกค้า' }} ✨</h1>
          <p class="text-xl text-green-100 font-medium">วันนี้ให้เราดูแลเสื้อผ้าชุดเก่งของคุณชิ้นไหนดีครับ?</p>
          <div class="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
             <div class="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center shadow-lg">
                <p class="text-xs uppercase tracking-widest opacity-80 font-bold">ออเดอร์ทั้งหมด</p>
                <p class="text-3xl font-black">{{ orders.length }} <span class="text-lg font-normal">รายการ</span></p>
             </div>
             <div class="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-center shadow-lg">
                <p class="text-xs uppercase tracking-widest opacity-80 font-bold">สถานะปัจจุบัน</p>
                <p class="text-3xl font-black text-emerald-200">
                  <span v-if="activeOrdersCount > 0">{{ activeOrdersCount }} <span class="text-lg font-normal text-white">กำลังซัก</span></span>
                  <span v-else class="text-white">ว่าง 🧺</span>
                </p>
             </div>
          </div>
        </div>
        
        <div class="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white text-6xl font-black shadow-2xl border-4 border-white/50 shrink-0 transform hover:rotate-12 transition-all duration-300">
           {{ user.name?.charAt(0) || 'U' }}
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-black text-slate-800">เลือกบริการที่ต้องการ</h2>
        <p class="text-slate-500 mt-2 font-medium">สัมผัสประสบการณ์ซักผ้าที่เหนือระดับ ด้วยมาตรฐานโรงแรม 5 ดาว</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
          v-for="service in serviceOptions" 
          :key="service.id"
          @click="selectService(service)"
          class="cursor-pointer group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-4 border-4"
          :class="newOrder.serviceType === service.id ? 'border-[#00b09b] shadow-[#00b09b]/20 shadow-2xl' : 'border-transparent hover:border-[#00b09b]/30'"
        >
          <div class="h-56 overflow-hidden relative">
            <img :src="service.img" :alt="service.title" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div class="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full text-sm font-black text-[#00b09b] shadow-lg">
              ฿{{ service.rate }}/กก.
            </div>
          </div>
          
          <div class="p-8 text-center relative bg-white">
            <div v-if="newOrder.serviceType === service.id" class="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-[#00b09b] text-white rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white animate-bounce-short">
              ✓
            </div>
            
            <h3 class="text-2xl font-black text-slate-800 mb-2 mt-2">{{ service.title }}</h3>
            <p class="text-slate-500 text-sm mb-6 leading-relaxed font-medium">{{ service.desc }}</p>
            
            <div 
              class="inline-block px-8 py-3 rounded-full font-black transition-all text-sm uppercase tracking-widest w-full sm:w-auto"
              :class="newOrder.serviceType === service.id ? 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white shadow-lg shadow-[#00b09b]/40' : 'bg-slate-100 text-slate-500 group-hover:bg-[#00b09b]/10 group-hover:text-[#00b09b]'"
            >
              {{ newOrder.serviceType === service.id ? 'เลือกบริการนี้แล้ว' : 'กดเพื่อเลือก' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      
      <div class="lg:col-span-5 bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 sticky top-10">
        <h3 class="text-2xl font-black text-slate-800 mb-8 flex items-center">
          <span class="bg-emerald-100 p-3 rounded-2xl mr-4 text-2xl shadow-sm">📦</span> 
          ข้อมูลการสั่งซัก
        </h3>
        
        <transition name="fade">
          <div v-if="sysMessage.text" class="mb-6 p-4 rounded-2xl text-sm font-bold flex items-start shadow-sm" :class="sysMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'">
            <span class="mr-3 text-lg mt-0.5">{{ sysMessage.type === 'error' ? '⚠️' : '🎉' }}</span> 
            <span class="leading-relaxed">{{ sysMessage.text }}</span>
          </div>
        </transition>

        <form @submit.prevent="submitOrder" class="space-y-6">
          
          <div v-if="!newOrder.serviceType" class="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl text-sm font-bold text-center mb-6">
            👆 กรุณาเลือกบริการด้านบนก่อนครับ
          </div>

          <div class="space-y-2" :class="{ 'opacity-50 pointer-events-none': !newOrder.serviceType }">
            <label class="font-black text-slate-700 ml-2 text-xs uppercase tracking-wider">น้ำหนักผ้าโดยประมาณ (กิโลกรัม)</label>
            <div class="relative">
              <input 
                v-model.number="newOrder.weight" 
                type="number" 
                step="0.5" 
                min="0.5" 
                required 
                class="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00b09b] focus:ring-4 focus:ring-[#00b09b]/10 outline-none transition-all text-xl font-bold text-slate-800" 
                placeholder="เช่น 2.5">
              <span class="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">กก.</span>
            </div>
          </div>
          
          <div class="space-y-2" :class="{ 'opacity-50 pointer-events-none': !newOrder.serviceType }">
            <label class="font-black text-slate-700 ml-2 text-xs uppercase tracking-wider">หมายเหตุถึงพนักงาน (ถ้ามี)</label>
            <textarea 
              v-model="newOrder.note" 
              rows="2" 
              class="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00b09b] focus:ring-4 focus:ring-[#00b09b]/10 outline-none transition-all text-sm font-medium text-slate-700 resize-none" 
              placeholder="เช่น แยกชุดขาว, ห้ามอบร้อน, น้ำยาปรับผ้านุ่มกลิ่นดอกไม้..."></textarea>
          </div>

          <div class="bg-slate-900 p-6 rounded-3xl flex justify-between items-center shadow-xl mt-8" :class="{ 'opacity-50': !newOrder.serviceType }">
            <div>
              <div class="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">ราคาประเมินเบื้องต้น</div>
              <div class="text-xs text-slate-500 font-medium">อาจมีการปรับเปลี่ยนหน้างาน</div>
            </div>
            <div class="text-3xl font-black text-[#00b09b]">฿{{ estimatedPrice }}</div>
          </div>

          <button 
            type="submit" 
            :disabled="!newOrder.serviceType || !newOrder.weight || newOrder.weight <= 0 || isSubmitting" 
            class="w-full bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white font-black py-5 rounded-2xl shadow-lg hover:shadow-[#00b09b]/40 hover:-translate-y-1 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center gap-3 mt-6">
            
            <svg v-if="isSubmitting" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>🚀</span>
            {{ isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการสั่งซัก' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-7 flex flex-col h-full">
        <div class="flex justify-between items-center mb-6 px-2">
          <h3 class="text-2xl font-black text-slate-800 flex items-center">
            <span class="bg-blue-100 p-3 rounded-2xl mr-4 text-2xl shadow-sm">🕒</span> 
            สถานะผ้าของคุณ
          </h3>
          <button @click="fetchOrders" class="text-slate-400 hover:text-[#00b09b] bg-white hover:bg-[#00b09b]/10 p-3 rounded-full transition-all shadow-sm border border-slate-100" title="รีเฟรชข้อมูล">
            🔄
          </button>
        </div>

        <div v-if="isLoadingOrders" class="flex-grow flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[3rem] border border-slate-100">
           <div class="animate-pulse flex space-x-3 mb-4">
             <div class="w-4 h-4 bg-[#00b09b] rounded-full"></div>
             <div class="w-4 h-4 bg-[#96c93d] rounded-full animation-delay-200"></div>
             <div class="w-4 h-4 bg-[#00b09b] rounded-full animation-delay-400"></div>
           </div>
           <p class="text-slate-400 font-bold text-sm">กำลังดึงข้อมูลตะกร้าผ้า...</p>
        </div>

        <div v-else-if="orders.length === 0" class="flex-grow flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-[3rem] p-10 border-2 border-dashed border-slate-200">
            <div class="text-7xl mb-6 opacity-30 grayscale filter">🧺</div>
            <p class="text-slate-500 font-black text-xl mb-2">ยังไม่มีรายการซักผ้า</p>
            <p class="text-sm text-slate-400 font-medium text-center max-w-xs">เลือกบริการด้านบน และระบุน้ำหนักเพื่อเริ่มต้นให้เราดูแลผ้าของคุณได้เลยครับ</p>
        </div>

        <div v-else class="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-4">
          <div 
            v-for="order in orders" 
            :key="order.id || order._id" 
            class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center group hover:shadow-md hover:border-[#00b09b]/30 transition-all duration-300 gap-4"
          >
            <div class="flex items-center space-x-4 w-full sm:w-auto">
              <div class="w-16 h-16 bg-slate-50 text-[#00b09b] rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 group-hover:bg-[#00b09b]/10 transition-colors">
                {{ getServiceIcon(order.serviceType) }}
              </div>
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-black text-lg text-slate-800 leading-none">{{ getServiceText(order.serviceType) }}</h4>
                  <span v-if="order.id" class="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">#{{ String(order.id).slice(-4) }}</span>
                </div>
                <p class="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                  <span>⚖️ {{ order.weight }} กก.</span>
                  <span>•</span>
                  <span>📅 {{ formatDate(order.date || order.createdAt) }}</span>
                </p>
                <div v-if="order.note" class="mt-2 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-block font-medium border border-amber-100">
                  📝 {{ order.note }}
                </div>
              </div>
            </div>
            
            <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
              <p v-if="order.price" class="text-lg font-black text-slate-800 sm:mb-2">฿{{ order.price }}</p>
              <span class="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm border" :class="getStatusBadge(order.status)">
                ● {{ getStatusText(order.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="w-full bg-white rounded-t-[3rem] p-10 md:p-16 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] border-t border-gray-100 mt-20 max-w-7xl mx-auto mb-0">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="space-y-4">
          <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00b09b] to-[#96c93d] italic tracking-tighter">NongJames<span class="text-slate-800">.</span></h2>
          <p class="text-slate-500 leading-relaxed font-medium text-sm">เราไม่ได้แค่ซักผ้า แต่เราดูแลความมั่นใจของคุณในทุกๆ วัน ด้วยเทคโนโลยีการซักระดับโลกและบริการที่ใส่ใจ</p>
        </div>
        <div class="space-y-4">
          <h4 class="font-black text-slate-800 text-lg uppercase tracking-wider">เมนูหลัก</h4>
          <ul class="space-y-3 text-slate-500 font-bold text-sm">
            <li><a href="#" class="hover:text-[#00b09b] transition-all flex items-center gap-2"><span>👤</span> ข้อมูลส่วนตัว</a></li>
            <li><a href="#" class="hover:text-[#00b09b] transition-all flex items-center gap-2"><span>💳</span> ช่องทางการชำระเงิน</a></li>
            <li><button @click="logout" class="text-red-400 hover:text-red-600 transition-all flex items-center gap-2 mt-4 bg-red-50 px-4 py-2 rounded-xl"><span>🚪</span> ออกจากระบบ</button></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="font-black text-slate-800 text-lg uppercase tracking-wider">ติดต่อเรา (Support)</h4>
          <div class="space-y-2 text-sm">
            <p class="text-slate-600 font-bold flex items-center gap-2"><span class="text-xl">📞</span> 081-234-5678</p>
            <p class="text-slate-600 font-bold flex items-center gap-2"><span class="text-xl">💬</span> Line: @NongJamesLaundry</p>
            <p class="text-slate-600 font-bold flex items-start gap-2"><span class="text-xl">📍</span> <span class="pt-1">99/9 สุขุมวิท กรุงเทพฯ (เปิดทุกวัน 08:00 - 20:00)</span></p>
          </div>
        </div>
      </div>
      <div class="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs font-bold">
        &copy; 2024 NongJames Laundry System. All rights reserved.
      </div>
    </footer>
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
const user = ref({});
const orders = ref([]); 
const isLoadingOrders = ref(true);
const isSubmitting = ref(false);
const sysMessage = ref({ text: '', type: '' });
let pollingInterval = null;

const newOrder = ref({
  serviceType: '',
  weight: '',
  note: ''
});

// ข้อมูลบริการ (Services Data)
const serviceOptions = [
  { id: 'wash_dry_fold', title: 'ซัก อบ พับ', desc: 'ซักสะอาด พับเนี๊ยบ พร้อมใส่กลับบ้าน เหมาะสำหรับเสื้อผ้าใส่ประจำวัน', img: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=800', rate: 40 },
  { id: 'wash_iron', title: 'ซัก อบ รีด', desc: 'ถนอมใยผ้า รีดเรียบกริบระดับโรงแรม 5 ดาว สำหรับชุดทำงานและชุดทางการ', img: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?q=80&w=800', rate: 70 },
  { id: 'dry_clean', title: 'ซักแห้งพิเศษ', desc: 'ดูแลชุดสูท ชุดราตรี และผ้าไหมตัวโปรดด้วยน้ำยาเฉพาะทาง ไร้คราบฝังลึก', img: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=800', rate: 150 }
];

// ==========================================
// 2. COMPUTED PROPERTIES
// ==========================================
const activeOrdersCount = computed(() => {
  return orders.value.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
});

const estimatedPrice = computed(() => {
  if (!newOrder.value.serviceType || !newOrder.value.weight || newOrder.value.weight <= 0) return '0.00';
  const service = serviceOptions.find(s => s.id === newOrder.value.serviceType);
  if (!service) return '0.00';
  return (service.rate * parseFloat(newOrder.value.weight)).toFixed(2);
});

// ==========================================
// 3. LIFECYCLE HOOKS
// ==========================================
onMounted(() => {
  // ตรวจสอบการ Login (Guard)
  const savedUser = localStorage.getItem('user');
  
  if (!savedUser) {
    router.push('/login');
    return;
  }

  user.value = JSON.parse(savedUser);
  
  // โหลดข้อมูลออเดอร์ครั้งแรก
  fetchOrders();

  // 🔄 ระบบ Auto-refresh (ดึงข้อมูลทุก 15 วินาที)
  pollingInterval = setInterval(() => {
    // ดึงเฉพาะตอนที่ไม่ได้กำลังส่งข้อมูลอยู่ เพื่อลดการกระตุก
    if (!isSubmitting.value) {
      fetchOrders(true); // true = silent fetch (ไม่โชว์ loading ให้กวนใจ)
    }
  }, 15000); 
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

// ==========================================
// 4. METHODS (ฟังก์ชันการทำงานหลัก)
// ==========================================
const fetchOrders = async (isSilent = false) => {
  if (!isSilent) isLoadingOrders.value = true;
  
  try {
    const token = localStorage.getItem('token');
    
    // ลองดึงจาก API Backend ก่อน
    const response = await axios.get(`http://localhost:5000/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // เรียงจากออเดอร์ใหม่สุดไปเก่าสุด
    orders.value = response.data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    
  } catch (error) {
    // 🔙 Fallback: ถ้ายังไม่ได้ต่อ API ให้ดึงจาก LocalStorage แทน
    // console.log('ใช้งานโหมด Offline (ดึงข้อมูลจาก LocalStorage)');
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    orders.value = localOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  } finally {
    isLoadingOrders.value = false;
  }
};

const selectService = (service) => {
  newOrder.value.serviceType = service.id;
  sysMessage.value = { text: '', type: '' }; // เคลียร์ข้อความแจ้งเตือนเมื่อเปลี่ยนบริการ
};

const submitOrder = async () => {
  // 🛡️ Validation ป้องกันการกรอกข้อมูลผิดพลาด
  if (!newOrder.value.weight || newOrder.value.weight < 0.5) {
    showMessage('กรุณาระบุน้ำหนักให้ถูกต้อง (ขั้นต่ำ 0.5 กก.) ครับ', 'error');
    return;
  }
  
  isSubmitting.value = true;
  sysMessage.value = { text: '', type: '' };
  
  // สร้าง Payload ข้อมูล
  const payload = {
    customerId: user.value.id || 'CUST-001',
    customerName: user.value.name,
    serviceType: newOrder.value.serviceType,
    weight: newOrder.value.weight,
    note: newOrder.value.note || '-',
    price: estimatedPrice.value,
    status: 'pending',
    date: new Date().toISOString()
  };

  try {
    const token = localStorage.getItem('token');
    
    // พยายามยิงเข้า API
    await axios.post('http://localhost:5000/api/orders', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    showMessage('สั่งซักเรียบร้อย! ระบบกำลังค้นหาคนขับไปรับผ้าครับ 🚀', 'success');
    await fetchOrders(); // โหลดข้อมูลใหม่จากเซิร์ฟเวอร์
    
  } catch (error) {
    // 🔙 Fallback: หาก API ไม่มี ให้เซฟลง LocalStorage แทน
    payload.id = 'ORD-' + Math.floor(1000 + Math.random() * 9000); // สร้าง ID จำลอง
    
    const localOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
    localOrders.unshift(payload); // เอาออเดอร์ใหม่ไว้บนสุด
    localStorage.setItem('myOrders', JSON.stringify(localOrders));
    
    orders.value = localOrders; // อัปเดต UI ทันที
    showMessage('สร้างออเดอร์สำเร็จ! (โหมดทดสอบออฟไลน์) 🚀', 'success');
  } finally {
    isSubmitting.value = false;
    
    // รีเซ็ตฟอร์มให้พร้อมสั่งใหม่
    newOrder.value = { serviceType: '', weight: '', note: '' }; 
    
    // ลบกล่องข้อความแจ้งเตือนอัตโนมัติหลัง 5 วินาที
    setTimeout(() => { sysMessage.value = { text: '', type: '' } }, 5000);
  }
};

const showMessage = (text, type) => {
  sysMessage.value = { text, type };
  // เลื่อนจอไปหาข้อความแจ้งเตือน (กรณีจอมือถือ)
  window.scrollTo({ top: 300, behavior: 'smooth' });
};

const logout = () => {
  if(confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // ลบ Local Order ด้วยก็ได้ (ถ้าต้องการให้เคลียร์หมด)
    // localStorage.removeItem('myOrders'); 
    router.push('/login');
  }
};

// ==========================================
// 5. HELPER FUNCTIONS (ตัวช่วยจัดการ UI)
// ==========================================
const getServiceText = (id) => serviceOptions.find(s => s.id === id)?.title || 'บริการซักรีด';
const getServiceIcon = (id) => {
  const icons = { wash_dry_fold: '🧺', wash_iron: '👔', dry_clean: '✨' };
  return icons[id] || '👕';
};

const formatDate = (dateString) => {
  if (!dateString) return 'วันนี้';
  const d = new Date(dateString);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusText = (s) => {
  const map = { 
    pending: 'รอคนขับไปรับผ้า', 
    processing: 'กำลังดำเนินการซัก', 
    delivering: 'กำลังส่งคืนลูกค้า', 
    completed: 'เสร็จสิ้นเรียบร้อย', 
    cancelled: 'ยกเลิกรายการ' 
  };
  return map[s] || s;
};

const getStatusBadge = (s) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    processing: 'bg-blue-50 text-blue-600 border-blue-200',
    delivering: 'bg-purple-50 text-purple-600 border-purple-200',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200'
  };
  return styles[s] || 'bg-slate-50 text-slate-500 border-slate-200';
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.animate-bounce-short { animation: bounceShort 1s ease-in-out 1; }
@keyframes bounceShort {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -10px); }
}

/* Scrollbar สไตล์โมเดิร์น สำหรับกล่องประวัติ */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.animation-delay-200 { animation-delay: 200ms; }
.animation-delay-400 { animation-delay: 400ms; }

/* ซ่อนลูกศรขึ้นลงใน input type="number" */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>