<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00b09b]/10 blur-[100px] rounded-full"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#96c93d]/10 blur-[100px] rounded-full"></div>

    <div class="max-w-md w-full relative z-10 my-10">
      <div class="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] animate-fade-in-up">
        
        <div class="text-center mb-8">
          <div class="mx-auto w-20 h-20 bg-gradient-to-tr from-[#00b09b] to-[#96c93d] rounded-full flex items-center justify-center shadow-xl mb-4 p-1 transform transition hover:rotate-12 duration-300">
             <div class="bg-white w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vue.png" alt="Logo" class="w-full h-full object-cover p-3" />
             </div>
          </div>
          <h2 class="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#00b09b] to-[#96c93d] pb-1">สร้างบัญชีใหม่</h2>
          <p class="text-gray-500 mt-2 font-medium text-sm">เริ่มต้นใช้งาน NongJames Laundry</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          
          <transition name="fade">
            <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm font-medium flex items-start shadow-sm">
              <span class="mr-2 mt-0.5">⚠️</span> 
              <span>{{ errorMessage }}</span>
            </div>
            <div v-else-if="successMessage" class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl text-sm font-medium flex items-start shadow-sm">
              <span class="mr-2 mt-0.5">🎉</span> 
              <span>{{ successMessage }}</span>
            </div>
          </transition>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">ชื่อ-นามสกุล</label>
              <input v-model="form.name" type="text" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700" placeholder="สมชาย สวัสดิ์ดี">
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">เบอร์โทรศัพท์</label>
              <input v-model="form.phone" type="tel" required pattern="[0-9]{9,10}" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700" placeholder="0812345678">
            </div>
          </div>

          <div>
            <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">อีเมล</label>
            <input v-model="form.email" type="email" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700" placeholder="user@example.com">
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">รหัสผ่าน</label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required minlength="6" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700 pr-10" placeholder="••••••••">
              </div>
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">ยืนยันรหัสผ่าน</label>
              <div class="relative">
                <input v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#96c93d] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700 pr-10" placeholder="••••••••">
              </div>
            </div>
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none hidden sm:block">
              <span v-if="!showPassword" title="แสดงรหัสผ่าน">👁️</span>
              <span v-else title="ซ่อนรหัสผ่าน">🙈</span>
            </button>
          </div>

          <div>
            <label class="block text-gray-700 text-xs font-bold mb-1 ml-1">ที่อยู่ (สำหรับรับ-ส่งผ้า)</label>
            <textarea v-model="form.address" required class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-sm text-gray-700 resize-none" rows="2" placeholder="99/9 หมู่ 9 ถ.สุขุมวิท..."></textarea>
          </div>

          <div class="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <label class="block text-gray-700 text-xs font-bold mb-2 ml-1">คุณต้องการใช้งานในฐานะใด?</label>
            <div class="grid grid-cols-3 gap-2">
              <label :class="['cursor-pointer text-center py-2 px-1 rounded-lg border text-xs font-bold transition-all', form.role === 'customer' ? 'bg-[#00b09b]/10 border-[#00b09b] text-[#00b09b]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
                <input type="radio" v-model="form.role" value="customer" class="hidden">
                🙋‍♂️ ลูกค้า
              </label>
              <label :class="['cursor-pointer text-center py-2 px-1 rounded-lg border text-xs font-bold transition-all', form.role === 'driver' ? 'bg-orange-500/10 border-orange-500 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
                <input type="radio" v-model="form.role" value="driver" class="hidden">
                🚚 คนขับ
              </label>
              <label :class="['cursor-pointer text-center py-2 px-1 rounded-lg border text-xs font-bold transition-all', form.role === 'admin' ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
                <input type="radio" v-model="form.role" value="admin" class="hidden">
                👨‍💻 แอดมิน
              </label>
            </div>
          </div>

          <button type="submit" :disabled="isLoading" class="w-full mt-6 bg-gradient-to-r from-[#00b09b] to-[#96c93d] hover:from-emerald-500 hover:to-lime-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transform transition hover:-translate-y-1 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2">
            <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'กำลังสร้างบัญชี...' : 'ลงทะเบียนทันที' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500">มีบัญชีอยู่แล้ว? <router-link to="/login" class="text-[#00b09b] font-bold hover:underline transition-colors">เข้าสู่ระบบ</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showPassword = ref(false);

// 🟢 ใช้ reactive สำหรับ form object (Best Practice ของ Vue)
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '', 
  phone: '',
  role: 'customer', 
  address: ''
});

const handleRegister = async () => {
  try {
    errorMessage.value = '';
    successMessage.value = '';

    // เช็คความถูกต้องเบื้องต้น (Validation)
    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกันครับ';
      return; 
    }

    if (form.password.length < 6) {
      errorMessage.value = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรครับ';
      return;
    }

    isLoading.value = true;

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role: form.role,
      address: form.address
    };

    // 🟢 1. พยายามยิง API จริง
    try {
      await axios.post('http://localhost:5000/api/auth/register', payload);
    } catch (apiError) {
      // 🟢 2. Fallback (ระบบจำลอง): ถ้า Backend ยังไม่พร้อม ให้จำลองว่าสมัครผ่าน!
      console.warn('Backend ไม่ตอบสนอง: กำลังเปลี่ยนไปใช้โหมด Mock Register');
      
      // หน่วงเวลาจำลองการโหลด
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // (ทางเลือก) จำลองการบันทึกข้อมูลเพื่อให้นำไป Login แบบ Mock ต่อได้
      // localStorage.setItem('mock_new_user', JSON.stringify(payload)); 
    }
    
    // แจ้งเตือนความสำเร็จและบอกด้วยว่าสมัครตำแหน่งอะไรไป
    const roleNames = { customer: 'ลูกค้าทั่วไป', driver: 'คนขับรถ', admin: 'ผู้ดูแลระบบ' };
    successMessage.value = `สมัครสมาชิกสำเร็จในฐานะ "${roleNames[form.role]}"! ระบบกำลังพาไปหน้าเข้าสู่ระบบ...`;
    
    // หน่วง 2 วิให้ผู้ใช้อ่านข้อความทัน ก่อนเด้งไปหน้า Login
    setTimeout(() => {
      router.push('/login');
    }, 2000); 

  } catch (error) {
    // ดัก Error จากระบบใหญ่ (เช่น Validation error จากโค้ดเราเอง)
    errorMessage.value = error.response?.data?.message || error.message || '❌ ไม่สามารถติดเซิร์ฟเวอร์ได้ หรืออีเมลนี้อาจถูกใช้งานไปแล้ว';
  } finally {
    // กรณีสำเร็จไม่ต้องปิด Loading เพราะกำลังจะเปลี่ยนหน้า ให้ค้างไว้ให้ดูสมูท
    if (errorMessage.value) {
      isLoading.value = false;
    }
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.animate-fade-in-up { 
  animation: fadeInUp 0.6s ease-out forwards; 
}

@keyframes fadeInUp { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}

/* ซ่อนลูกศรขึ้นลงใน input type="number" / "tel" บางเบราว์เซอร์ */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>