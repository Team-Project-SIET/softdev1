import { createApp } from 'vue'
import { createPinia } from 'pinia' // ต้องมีบรรทัดนี้
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia() // สร้างอินสแตนซ์

app.use(pinia) // 🟢 ต้องลงทะเบียนก่อน router
app.use(router)
app.mount('#app')