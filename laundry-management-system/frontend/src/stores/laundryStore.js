import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLaundryStore = defineStore('laundry', () => {
  const orders = ref([
    { id: 101, customer: 'คุณสมชาย ใจดี', service: 'ซัก อบ พับ', weight: 5.2, status: 'pending', note: 'แยกผ้าขาว' }
  ])

  // --- เพิ่มฟังก์ชันนี้ลงไป ---
  const addOrder = (newOrder) => {
    orders.value.push(newOrder)
  }
  // -----------------------

  const countByStatus = (status) => orders.value.filter(o => o.status === status).length
  const totalWeight = computed(() => orders.value.reduce((acc, o) => acc + (Number(o.weight) || 0), 0))
  
  const advanceStatus = (id) => {
    const flow = ['pending', 'processing', 'delivering', 'completed']
    const order = orders.value.find(o => o.id === id)
    if (order) {
      const currentIndex = flow.indexOf(order.status)
      if (currentIndex < flow.length - 1) order.status = flow[currentIndex + 1]
    }
  }

  return { 
    orders, 
    countByStatus, 
    totalWeight, 
    advanceStatus,
    addOrder // 🟢 อย่าลืม Return ออกไปใช้งาน
  }
})