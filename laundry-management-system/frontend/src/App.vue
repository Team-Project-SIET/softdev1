<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#00b09b] selection:text-white">

    <header class="bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white shadow-xl sticky top-0 z-50">
      <div class="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        
        <router-link to="/" class="flex items-center space-x-3 group">
          <div class="w-11 h-11 sm:w-13 sm:h-13 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-all duration-300 p-1.5 overflow-hidden">
            <img 
            src="https://cdn3d.iconscout.com/3d/free/thumb/free-vuejs-3d-icon-png-download-3640297.png?f=webp" 
            alt="Logo" 
            class="w-full h-full object-contain" 
            @error="(e) => e.target.src = 'https://via.placeholder.com/150?text=ERROR'"
          />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-black tracking-tighter leading-none">NongJames</h1>
            <p class="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">Premium Laundry</p>
          </div>
        </router-link>

        <div class="hidden md:flex items-center space-x-6">
          <nav class="flex items-center space-x-1 text-sm font-bold">
            <router-link to="/" class="nav-link">หน้าแรก</router-link>

            <router-link v-if="isLoggedIn && userRole === 'customer'" to="/customer" class="nav-link">
              🧺 สั่งซักผ้า
            </router-link>

            <router-link v-if="isLoggedIn && userRole === 'admin'" to="/admin" class="nav-link text-yellow-200 hover:text-yellow-100">
              🛠️ จัดการระบบ
            </router-link>

            <router-link v-if="isLoggedIn && userRole === 'driver'" to="/driver" class="nav-link text-orange-100 hover:text-white">
              🚚 งานวิ่งรถ
            </router-link>
          </nav>

          <div class="flex items-center space-x-4 border-l border-white/20 pl-6">
            <template v-if="!isLoggedIn">
              <router-link to="/login" class="text-sm font-bold hover:text-white transition-all">เข้าสู่ระบบ</router-link>
              <router-link to="/register" class="bg-white text-[#00b09b] px-6 py-2 rounded-full text-sm font-black shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all active:scale-95">
                สมัครสมาชิก
              </router-link>
            </template>

            <template v-else>
              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <p class="text-xs font-black leading-none mb-1">{{ userName }}</p>
                  <span class="text-[9px] bg-black/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{{ userRole }}</span>
                </div>
                <button @click="handleLogout" class="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md">
                  ออกจากระบบ
                </button>
              </div>
            </template>
          </div>
        </div>

        <button @click="toggleMobileMenu" class="md:hidden text-white p-2 focus:outline-none bg-white/10 rounded-lg active:scale-95 transition-transform">
          <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <transition name="slide-down">
        <div v-if="isMobileMenuOpen" class="md:hidden bg-slate-900 border-t border-white/10 shadow-2xl absolute w-full left-0">
          <div class="px-4 py-6 space-y-4 flex flex-col">
            
            <div v-if="isLoggedIn" class="bg-white/10 p-4 rounded-2xl flex items-center justify-between mb-2">
               <div>
                  <p class="text-sm font-black text-white">{{ userName }}</p>
                  <span class="text-[10px] text-[#00b09b] font-bold uppercase tracking-widest">{{ userRole }}</span>
               </div>
               <button @click="handleLogout" class="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">ออกจากระบบ</button>
            </div>

            <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">🏠 หน้าแรก</router-link>
            <router-link v-if="isLoggedIn && userRole === 'customer'" to="/customer" class="mobile-nav-link" @click="closeMobileMenu">🧺 สั่งซักผ้า</router-link>
            <router-link v-if="isLoggedIn && userRole === 'admin'" to="/admin" class="mobile-nav-link text-yellow-400" @click="closeMobileMenu">🛠️ จัดการระบบ (Admin)</router-link>
            <router-link v-if="isLoggedIn && userRole === 'driver'" to="/driver" class="mobile-nav-link text-orange-400" @click="closeMobileMenu">🚚 งานวิ่งรถ (Driver)</router-link>

            <div v-if="!isLoggedIn" class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 mt-4">
              <router-link to="/login" class="bg-white/10 text-center py-3 rounded-xl text-sm font-bold text-white" @click="closeMobileMenu">เข้าสู่ระบบ</router-link>
              <router-link to="/register" class="bg-[#00b09b] text-center py-3 rounded-xl text-sm font-black text-white shadow-lg" @click="closeMobileMenu">สมัครสมาชิก</router-link>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <main class="flex-grow w-full py-8 sm:py-10 px-4 md:px-0 flex flex-col relative">
      <div class="container mx-auto flex-grow flex flex-col">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </div>
    </main>

    <footer class="bg-slate-900 text-slate-400 py-8 text-center text-xs mt-auto border-t border-slate-800">
       <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="font-bold tracking-wide">&copy; {{ new Date().getFullYear() }} NongJames Premium Laundry. All rights reserved.</p>
          <div class="flex gap-4 font-medium">
             <a href="#" class="hover:text-white transition-colors">ข้อตกลงและเงื่อนไข</a>
             <a href="#" class="hover:text-white transition-colors">ติดต่อเรา</a>
          </div>
       </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// States
const isLoggedIn = ref(false);
const userName = ref('');
const userRole = ref('');
const isMobileMenuOpen = ref(false);

// ----------------------------------------------------
// 1. ระบบ Auth เช็คสเตตัส 
// ----------------------------------------------------
const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      isLoggedIn.value = true;
      userName.value = user.name || 'User';
      userRole.value = user.role || 'customer';
    } catch (e) {
      clearAuthData();
    }
  } else {
    clearAuthData();
  }
};

const clearAuthData = () => {
  isLoggedIn.value = false;
  userName.value = '';
  userRole.value = '';
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// เช็คทันทีตอนโหลดแอปครั้งแรก
onMounted(() => {
  checkAuthStatus();
  // Custom Event Listener: รับสัญญาณเวลา Login สำเร็จจากคอมโพเนนต์อื่น
  window.addEventListener('auth-updated', checkAuthStatus);
});

// เช็คซ้ำเวลาเปลี่ยนหน้า
watch(() => route.path, () => {
  checkAuthStatus();
  closeMobileMenu(); // ปิดเมนูมือถือเวลาเปลี่ยนหน้าเสมอ
});

// ----------------------------------------------------
// 2. ระบบจัดการเมนู และ Logout
// ----------------------------------------------------
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    clearAuthData();
    closeMobileMenu();
    await router.push('/login');
    window.dispatchEvent(new Event('auth-updated')); 
  }
};
</script>

<style>
/* CSS สำหรับ Desktop Nav */
.nav-link {
  @apply px-4 py-2 rounded-xl transition-all duration-200 hover:bg-white/20;
}

/* CSS สำหรับ Mobile Nav */
.mobile-nav-link {
  @apply block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all;
}

/* 🌀 Page Transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* 📱 Mobile Menu Dropdown Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.9);
}

/* 🎨 Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #00b09b;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #008f7e;
}
</style>