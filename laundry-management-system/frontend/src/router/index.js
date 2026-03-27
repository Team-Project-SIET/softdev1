import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminView from '../views/AdminView.vue'
import CustomerView from '../views/CustomerView.vue'
import DriverView from '../views/DriverView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  
  // 🟢 กลุ่มหน้าที่ 1: "ห้ามคน Login แล้วเข้า" (Guest Only)
  { path: '/login', name: 'login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { requiresGuest: true } },
  
  // 🔴 กลุ่มหน้าที่ 2: "ต้อง Login" + "ต้องมี Role ที่ถูกต้อง"
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/customer', name: 'customer', component: CustomerView, meta: { requiresAuth: true, role: 'customer' } },
  { path: '/driver', name: 'driver', component: DriverView, meta: { requiresAuth: true, role: 'driver' } },

  // 🟡 กลุ่มหน้าที่ 3: "หน้า 404 Not Found" (Catch-all) ป้องกันคนพิมพ์ URL มั่ว
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🛡️ ระบบด่านตรวจ (Navigation Guard) อัปเกรดใหม่!
router.beforeEach((to, from, next) => {
  // 1. อ่านเงื่อนไขของหน้าที่กำลังจะไป
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  
  // 2. ดึงข้อมูลจาก LocalStorage อย่างปลอดภัย
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let userRole = null;

  // 🧹 3. ตรวจสอบและซ่อมแซมข้อมูล
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      userRole = user?.role || null;
    } catch (e) {
      console.error("🚨 ข้อมูลผู้ใช้ในระบบเสียหาย กำลังล้างข้อมูล...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // แจ้งเตือน App.vue ให้รีเซ็ตเมนู (ทำงานคู่กับ Event ใน App.vue ที่ผมเคยปรับให้)
      window.dispatchEvent(new Event('auth-updated'));
    }
  }

  // ผู้ใช้จะถือว่า Auth ผ่านก็ต่อเมื่อมีทั้ง Token และ Role ที่อ่านค่าได้
  const isAuthenticated = !!token && !!userRole;

  // 🚪 กฎข้อที่ 1: หน้าที่ต้อง Login แต่ผู้ใช้ยังไม่ได้ Login
  if (requiresAuth && !isAuthenticated) {
    alert("🔒 กรุณาเข้าสู่ระบบก่อนใช้งานเมนูนี้ครับ");
    return next('/login');
  }

  // 🛑 กฎข้อที่ 2: หน้า Login/Register แต่ผู้ใช้ Login เข้ามาแล้ว
  if (requiresGuest && isAuthenticated) {
    // เตะกลับไปหน้าแดชบอร์ดของตัวเองตาม Role
    if (userRole === 'admin') return next('/admin');
    if (userRole === 'driver') return next('/driver');
    return next('/customer');
  }

  // 👮 กฎข้อที่ 3: ตรวจสอบสิทธิ์การเข้าถึง (Role Check)
  if (requiresAuth && isAuthenticated) {
    const requiredRole = to.meta.role;
    
    // ถ้าหน้าที่กำลังจะไปมีการกำหนด Role ไว้ และ Role ของผู้ใช้ไม่ตรงกัน
    if (requiredRole && requiredRole !== userRole) {
      alert("⛔ ขออภัยครับ คุณไม่มีสิทธิ์เข้าถึงพื้นที่นี้!");
      
      // ✨ UX Improvement: เตะกลับไปหน้าพื้นที่ทำงานของตัวเอง แทนที่จะเตะไปหน้าแรก
      if (userRole === 'admin') return next('/admin');
      if (userRole === 'driver') return next('/driver');
      return next('/customer');
    }
  }

  // ✅ ผ่านทุกด่าน ปล่อยให้โหลดหน้าต่างปกติได้
  next();
})

export default router