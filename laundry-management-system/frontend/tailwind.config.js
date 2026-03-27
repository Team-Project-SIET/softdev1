/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',   // สีเขียวหลัก
        secondary: '#3B82F6', // สีฟ้า
        light: '#FFFFFF',     // สีขาว
        bgGray: '#F3F4F6',    // สีเทาอ่อน (พื้นหลัง)
        dark: '#1F2937'       // สีเทาเข้ม (ตัวหนังสือ)
      }
    },
  },
  plugins: [],
}