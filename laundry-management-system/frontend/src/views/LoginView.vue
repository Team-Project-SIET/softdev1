<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00b09b]/10 blur-[100px] rounded-full"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#96c93d]/10 blur-[100px] rounded-full"></div>

    <div class="max-w-md w-full relative z-10">
      <div class="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:-translate-y-1">
        
        <div class="text-center mb-8">
          <div class="mx-auto w-24 h-24 bg-gradient-to-tr from-[#00b09b] to-[#96c93d] rounded-full flex items-center justify-center shadow-xl mb-6 p-1 transform transition hover:rotate-12 duration-300">
             <div class="bg-white w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vue.png" alt="Vue Logo" class="w-full h-full object-cover p-3" />
             </div>
          </div>
          <h2 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#00b09b] to-[#96c93d] pb-1">ยินดีต้อนรับ</h2>
          <p class="text-gray-500 mt-2 font-medium">เข้าสู่ระบบ NongJames Laundry</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          
          <transition name="fade">
            <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm font-medium flex items-start shadow-sm">
              <span class="mr-2 mt-0.5">⚠️</span> 
              <span>{{ errorMessage }}</span>
            </div>
          </transition>

          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2 ml-1">อีเมล</label>
            <input 
              v-model="form.email" 
              type="email" 
              required 
              class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00b09b] outline-none transition-all bg-gray-50 focus:bg-white text-gray-700" 
              placeholder="admin@nongjames.com">
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2 ml-1 pr-1">
              <label class="block text-gray-700 text-sm font-bold">รหัสผ่าน</label>
              <a href="#" class="text-xs font-bold text-[#00b09b] hover:underline tabindex='-1'">ลืมรหัสผ่าน?</a>
            </div>
            <div class="relative">
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                required 
                class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#96c93d] outline-none transition-all bg-gray-50 focus:bg-white text-gray-700 pr-12" 
                placeholder="••••••••">
              
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
                <span v-if="!showPassword" title="แสดงรหัสผ่าน">👁️</span>
                <span v-else title="ซ่อนรหัสผ่าน">🙈</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading" 
            class="w-full mt-4 bg-gradient-to-r from-[#00b09b] to-[#96c93d] hover:from-emerald-500 hover:to-lime-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2">
            
            <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            
            {{ isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ' }}
          </button>
        </form>

        <div class="mt-8 text-center">
          <p class="text-sm text-gray-500">ยังไม่มีบัญชี? <router-link to="/register" class="text-[#00b09b] font-bold hover:underline">สมัครสมาชิก</router-link></p>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400 text-left">
           <p class="font-bold mb-1 text-gray-500">📌 บัญชีทดสอบระบบ:</p>
           <p>Admin: admin@nongjames.com</p>
           <p>Driver: driver@nongjames.com</p>
           <p>Customer: customer@nongjames.com</p>
           <p class="mt-1 italic">(รหัสผ่านอะไรก็ได้ 6 ตัวขึ้นไป)</p>
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
const showPassword = ref(false);

const form = reactive({
  email: '',
  password: ''
});

const handleLogin = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = ''; 

    // ทำความสะอาด Email: ตัดช่องว่างและทำเป็นตัวพิมพ์เล็กทั้งหมด
    const cleanEmail = form.email.trim().toLowerCase();

    let token, user;
    
    try {
      // 1. ลองเชื่อมต่อกับ Backend API
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: cleanEmail,
        password: form.password
      });
      token = response.data.token;
      user = response.data.user;

      // ⚠️ บังคับเปลี่ยนสถานะ (Override Role) 
      // เพื่อป้องกันกรณีที่ลงทะเบียนใหม่แล้ว Backend ตั้งค่าให้เป็น Customer เสมอ
      if (cleanEmail === 'admin@nongjames.com') user.role = 'admin';
      if (cleanEmail === 'driver@nongjames.com') user.role = 'driver';

    } catch (apiError) {
      // 2. ถ้า Backend ไม่พร้อมทำงาน ให้เข้าโหมดจำลอง (Mock Data)
      console.warn('Backend ไม่ตอบสนอง: กำลังเปลี่ยนไปใช้โหมด Mock Login', apiError.message);
      
      if (form.password.length < 6) {
        throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      }

      // กำหนดค่าเริ่มต้นเป็นลูกค้า
      let role = 'customer';
      let name = 'ลูกค้าทั่วไป';

      // ตรวจสอบอีเมลเพื่อแบ่ง Role ในโหมดจำลอง
      if (cleanEmail === 'admin@nongjames.com') {
        role = 'admin';
        name = 'แอดมินระบบ';
      } else if (cleanEmail === 'driver@nongjames.com') {
        role = 'driver';
        name = 'พนักงานขับรถ';
      }

      user = { id: Math.floor(Math.random() * 1000), name, email: cleanEmail, role };
      token = 'mock-jwt-token-12345';
      
      // หน่วงเวลาให้ดูเหมือนกำลังโหลด
      await new Promise(resolve => setTimeout(resolve, 700));
    }

    if (!token || !user) {
      throw new Error('ข้อมูลจากเซิร์ฟเวอร์ไม่สมบูรณ์ กรุณาลองใหม่');
    }

    // บันทึกข้อมูลลง LocalStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    alert(`✅ เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${user.name || user.email}`);
    
    // 🔀 นำทางผู้ใช้ตามสถานะที่ถูกต้อง (ตรวจสอบแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่)
    const userRole = user.role ? String(user.role).toLowerCase() : 'customer';

    if (userRole === 'admin') {
      router.push('/admin');
    } else if (userRole === 'driver') {
      router.push('/driver');
    } else {
      router.push('/customer');
    }

  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    form.password = ''; // เคลียร์รหัสผ่านให้กรอกใหม่
  } finally {
    isLoading.value = false;
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
</style>