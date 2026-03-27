<template>
  <div class="w-full space-y-32 pb-20 animate-fade-in-up bg-[#f8fafc]">
    
    <section class="relative min-h-[750px] flex items-center overflow-hidden shadow-2xl rounded-b-[4rem]">
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=2000" alt="Laundry Background" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/30"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="text-left space-y-8 animate-fade-in-left">
          <div class="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(0,176,155,0.3)]">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Premium Laundry & Dry Cleaning
          </div>
          <h1 class="text-5xl md:text-7xl font-black text-white leading-[1.1] drop-shadow-2xl">
            ยกระดับ <br>
            ความสะอาด <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-[#96c93d] to-emerald-200">เพื่อคุณโดยเฉพาะ</span>
          </h1>
          <p class="text-lg md:text-xl text-gray-300 max-w-lg font-light leading-relaxed border-l-4 border-[#00b09b] pl-6">
            มากกว่าการซักผ้า คือการดูแลภาพลักษณ์ของคุณ ด้วยเทคโนโลยีถนอมใยผ้าขั้นสุด และบริการรับ-ส่งถึงที่ ตลอด 24 ชั่วโมง
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-4">
            <router-link :to="getHeroLink()" class="relative overflow-hidden group bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white font-bold py-5 px-10 rounded-2xl shadow-[0_20px_40px_rgba(0,176,155,0.4)] transform transition hover:-translate-y-1 text-center text-lg">
              <span class="relative z-10">{{ isLoggedIn ? 'เข้าสู่ระบบจัดการ 🚀' : 'เรียกใช้บริการทันที' }}</span>
              <div class="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </router-link>
            <a href="#about" class="bg-white/5 backdrop-blur-md border border-white/20 text-white font-bold py-5 px-10 rounded-2xl hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2">
              <span>อ่านเพิ่มเติม</span> <span class="text-xl">↓</span>
            </a>
          </div>
        </div>
        
        <div class="hidden lg:flex justify-end items-center relative">
          <div class="absolute top-10 right-20 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl animate-pulse-slow z-20">
            <div class="flex items-center gap-4">
              <div class="text-4xl">⭐</div>
              <div>
                <p class="text-white font-bold text-xl">4.9/5.0</p>
                <p class="text-gray-300 text-sm">รีวิวจากลูกค้ากว่า 10,000+</p>
              </div>
            </div>
          </div>
          <div class="w-96 h-96 bg-gradient-to-tr from-[#00b09b]/40 to-[#96c93d]/40 blur-[80px] rounded-full absolute"></div>
          <img src="https://images.unsplash.com/photo-1582735689369-cafce27b05eb?auto=format&fit=crop&q=80&w=800" class="w-[400px] h-[550px] object-cover rounded-[3rem] border-8 border-white/10 shadow-2xl relative z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-700" alt="Laundry Hero" />
        </div>
      </div>
    </section>

    <section id="about" class="w-full max-w-7xl mx-auto px-6 lg:px-12 scroll-mt-32">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div class="relative h-[600px]">
          <div class="absolute top-0 right-0 w-4/5 h-4/5 rounded-[3rem] overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover" alt="Shirts" />
          </div>
          <div class="absolute bottom-0 left-0 w-3/5 h-3/5 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-8 border-white">
            <img src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=600" class="w-full h-full object-cover" alt="Folding Clothes" />
          </div>
          <div class="absolute top-1/2 left-[-20px] bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-gray-100 animate-bounce-slow">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-black">15+</div>
            <div>
              <p class="font-bold text-gray-800">ปีแห่งประสบการณ์</p>
              <p class="text-sm text-gray-500">ผู้เชี่ยวชาญด้านเนื้อผ้า</p>
            </div>
          </div>
        </div>
        
        <div class="space-y-8">
          <h4 class="text-[#00b09b] font-bold tracking-widest uppercase">About Our Quality</h4>
          <h2 class="text-4xl md:text-5xl font-black text-slate-800 leading-[1.2]">
            เราให้ความสำคัญกับ <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00b09b] to-[#96c93d]">ทุกเส้นใยของคุณ</span>
          </h2>
          <p class="text-gray-500 text-lg leading-relaxed">
            NongJames Laundry นำเสนอบริการดูแลเสื้อผ้าแบบครบวงจร ด้วยเทคโนโลยีเครื่องซักอุตสาหกรรมระดับโลก นำเข้าน้ำยาปรับผ้านุ่มออร์แกนิคที่อ่อนโยนต่อผิว และระบบคัดแยกผ้าด้วย AI เพื่อป้องกันสีตกและเนื้อผ้าเสียหาย
          </p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div class="flex gap-4 items-start">
              <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-2xl shrink-0">🌿</div>
              <div>
                <h4 class="font-bold text-slate-800 text-lg">Eco-Friendly</h4>
                <p class="text-sm text-gray-500 mt-1">น้ำยาซักผ้าสกัดจากธรรมชาติ 100%</p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-12 h-12 rounded-xl bg-lime-50 flex items-center justify-center text-lime-600 text-2xl shrink-0">⏱️</div>
              <div>
                <h4 class="font-bold text-slate-800 text-lg">Express 24h</h4>
                <p class="text-sm text-gray-500 mt-1">บริการด่วนพิเศษ คืนผ้าภายใน 1 วัน</p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-2xl shrink-0">🚚</div>
              <div>
                <h4 class="font-bold text-slate-800 text-lg">Free Delivery</h4>
                <p class="text-sm text-gray-500 mt-1">รับ-ส่งฟรี ในระยะทาง 10 กิโลเมตร</p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 text-2xl shrink-0">🛡️</div>
              <div>
                <h4 class="font-bold text-slate-800 text-lg">Fully Insured</h4>
                <p class="text-sm text-gray-500 mt-1">รับประกันความเสียหายทุกชิ้น</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <div class="text-center mb-16 space-y-4">
        <h4 class="text-[#00b09b] font-bold tracking-widest uppercase">Our Premium Services</h4>
        <h2 class="text-4xl md:text-5xl font-black text-slate-800">บริการที่คุณเลือกได้</h2>
        <div class="w-24 h-1.5 bg-gradient-to-r from-[#00b09b] to-[#96c93d] mx-auto rounded-full"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div v-for="(item, i) in services" :key="i" class="bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(0,176,155,0.15)] transform hover:-translate-y-2 transition-all duration-500 group border border-slate-100 flex flex-col relative">
          <div class="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg font-bold text-slate-800">
            เริ่มต้น <span class="text-[#00b09b]">{{ item.price }}</span>
          </div>
          
          <div class="h-72 overflow-hidden relative">
            <img :src="item.img" :alt="item.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
            <h3 class="absolute bottom-6 left-6 text-3xl font-black text-white drop-shadow-lg">{{ item.title }}</h3>
          </div>
          <div class="p-8 flex flex-col flex-grow bg-white">
            <p class="text-slate-500 mb-8 leading-relaxed flex-grow text-lg">{{ item.desc }}</p>
            <div class="pt-6 border-t border-slate-100">
              <router-link :to="getHeroLink()" class="flex items-center justify-between w-full text-slate-800 font-bold group-hover:text-[#00b09b] transition-colors text-lg">
                จองบริการนี้ 
                <span class="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transform group-hover:translate-x-2 transition-all">→</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full bg-slate-900 py-24 relative overflow-hidden">
      <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#00b09b]/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#96c93d]/20 blur-[120px] rounded-full"></div>
      
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 space-y-24">
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-white/10">
          <div v-for="(stat, i) in stats" :key="i" class="text-center px-4 group">
            <div class="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-4 group-hover:from-emerald-300 group-hover:to-lime-300 transition-all duration-500">{{ stat.number }}</div>
            <div class="text-gray-400 font-bold uppercase tracking-widest text-sm">{{ stat.label }}</div>
          </div>
        </div>

        <div class="border-t border-white/10 pt-24">
          <div class="text-center mb-16 space-y-4">
            <h2 class="text-4xl font-black text-white">ขั้นตอนการทำงานของเรา</h2>
            <p class="text-gray-400 text-lg">สะดวก รวดเร็ว ตรวจสอบได้ทุกขั้นตอน</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            <div class="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div v-for="(step, i) in steps" :key="i" class="relative text-center space-y-6 group">
              <div class="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center text-4xl transform group-hover:scale-110 group-hover:bg-[#00b09b] transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-slate-700 group-hover:border-emerald-400 relative z-10">
                {{ step.icon }}
              </div>
              <div>
                <div class="text-[#96c93d] font-black text-lg mb-2">STEP 0{{ i + 1 }}</div>
                <h3 class="text-2xl font-bold text-white mb-3">{{ step.title }}</h3>
                <p class="text-slate-400 text-sm leading-relaxed px-2">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <div class="text-center mb-16 space-y-4">
        <h4 class="text-[#00b09b] font-bold tracking-widest uppercase">Pricing Packages</h4>
        <h2 class="text-4xl md:text-5xl font-black text-slate-800">แพ็กเกจสุดคุ้ม</h2>
        <div class="w-24 h-1.5 bg-[#00b09b] mx-auto rounded-full"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl hover:shadow-2xl transition-all">
          <h3 class="text-2xl font-bold text-slate-800 mb-2">Basic Wash</h3>
          <p class="text-slate-500 mb-6">เหมาะสำหรับคนโสด ซักรายสัปดาห์</p>
          <div class="text-5xl font-black text-slate-800 mb-8">฿590<span class="text-lg text-slate-400 font-normal"> / เดือน</span></div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> ซัก อบ พับ 30 ชิ้น/เดือน</li>
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> ฟรี รับ-ส่ง 2 ครั้ง</li>
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> น้ำยามาตรฐาน</li>
          </ul>
          <button class="w-full py-4 rounded-xl font-bold text-[#00b09b] bg-emerald-50 hover:bg-emerald-100 transition-colors">เลือกแพ็กเกจนี้</button>
        </div>

        <div class="bg-slate-900 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,176,155,0.3)] transform md:-translate-y-4 border-2 border-[#00b09b] relative overflow-hidden">
          <div class="absolute top-6 right-[-30px] bg-gradient-to-r from-[#00b09b] to-[#96c93d] text-white text-xs font-black uppercase tracking-widest py-1 px-10 rotate-45 shadow-lg">ยอดฮิต</div>
          <h3 class="text-2xl font-bold text-white mb-2">Premium Family</h3>
          <p class="text-slate-400 mb-6">ครอบคลุมทุกการดูแล สำหรับครอบครัว</p>
          <div class="text-5xl font-black text-white mb-8">฿1,290<span class="text-lg text-slate-400 font-normal"> / เดือน</span></div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-3">✔</span> ซัก อบ รีด 80 ชิ้น/เดือน</li>
            <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-3">✔</span> ฟรี รับ-ส่ง ไม่จำกัดครั้ง</li>
            <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-3">✔</span> น้ำยาพรีเมียม / ออร์แกนิค</li>
            <li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-3">✔</span> ซักแห้งชุดสูท ฟรี 2 ชุด</li>
          </ul>
          <button class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#00b09b] to-[#96c93d] hover:shadow-lg transform transition hover:-translate-y-1">เลือกแพ็กเกจนี้</button>
        </div>

        <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl hover:shadow-2xl transition-all">
          <h3 class="text-2xl font-bold text-slate-800 mb-2">Pay Per Item</h3>
          <p class="text-slate-500 mb-6">ซักน้อย จ่ายตามจริง ประหยัดกว่า</p>
          <div class="text-5xl font-black text-slate-800 mb-8">฿20<span class="text-lg text-slate-400 font-normal"> / ชิ้น</span></div>
          <ul class="space-y-4 mb-8">
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> ไม่มีขั้นต่ำในการส่งซัก</li>
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> ค่าบริการรับ-ส่ง 50 บาท/รอบ</li>
            <li class="flex items-center text-slate-600"><span class="text-emerald-500 mr-3">✔</span> คิดราคาตามประเภทผ้า</li>
          </ul>
          <button class="w-full py-4 rounded-xl font-bold text-[#00b09b] bg-emerald-50 hover:bg-emerald-100 transition-colors">ดูราคาประเมิน</button>
        </div>
      </div>
    </section>

    <section class="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h4 class="text-[#00b09b] font-bold tracking-widest uppercase mb-2">Our Gallery</h4>
          <h2 class="text-4xl font-black text-slate-800">ผลงานและความประทับใจ</h2>
        </div>
        <button class="px-6 py-3 border-2 border-slate-200 rounded-full font-bold text-slate-600 hover:border-[#00b09b] hover:text-[#00b09b] transition-colors">
          ดูรูปภาพทั้งหมด
        </button>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px]">
        <div v-for="(img, i) in gallery" :key="i" 
             :class="['rounded-3xl overflow-hidden shadow-md group cursor-pointer relative', i === 0 || i === 5 ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1']">
          <img :src="img.src" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" alt="Gallery" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <p class="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{{ img.caption }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
        <div class="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=2000')] opacity-10 mix-blend-overlay object-cover"></div>
        <div class="relative z-10 space-y-8">
          <h2 class="text-4xl md:text-5xl font-black text-white">พร้อมที่จะให้เราดูแลเสื้อผ้าของคุณแล้วหรือยัง?</h2>
          <p class="text-xl text-slate-300 max-w-2xl mx-auto">สมัครสมาชิกวันนี้ รับส่วนลดทันที 20% สำหรับการใช้บริการครั้งแรก พร้อมสิทธิพิเศษอีกมากมาย</p>
          <div class="flex justify-center gap-4">
            <router-link to="/register" class="bg-white text-slate-900 font-black py-4 px-10 rounded-2xl shadow-xl hover:scale-105 transition-transform text-lg">สมัครสมาชิกเลย</router-link>
          </div>
        </div>
      </div>
    </section>

    <footer class="w-full bg-white border-t border-slate-200 mt-20 pt-20 pb-10 px-6 lg:px-12">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
        <div class="space-y-6 lg:col-span-2">
          <h2 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00b09b] to-[#96c93d] italic tracking-tighter">NongJames.</h2>
          <p class="text-slate-500 leading-relaxed max-w-sm text-lg">บริการซักรีดระดับพรีเมียม ที่ใส่ใจทุกรายละเอียดของเส้นใยผ้า เพื่อส่งมอบความมั่นใจให้คุณในทุกๆ วัน</p>
          <div class="flex space-x-4 pt-2">
             <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#00b09b] hover:text-white transition-all cursor-pointer font-bold text-xl">f</div>
             <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#00b09b] hover:text-white transition-all cursor-pointer font-bold text-xl">ig</div>
             <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#00b09b] hover:text-white transition-all cursor-pointer font-bold text-xl">in</div>
          </div>
        </div>
        <div class="space-y-6">
          <h4 class="font-bold text-slate-800 text-xl border-b-2 border-[#00b09b] inline-block pb-2">Quick Links</h4>
          <ul class="space-y-4 text-slate-500 font-medium">
            <li><a href="#" class="hover:text-[#00b09b] transition-all flex items-center gap-2"><span class="text-[#96c93d]">▸</span> หน้าหลัก</a></li>
            <li><a href="#services" class="hover:text-[#00b09b] transition-all flex items-center gap-2"><span class="text-[#96c93d]">▸</span> บริการของเรา</a></li>
            <li><router-link to="/login" class="hover:text-[#00b09b] transition-all flex items-center gap-2"><span class="text-[#96c93d]">▸</span> เข้าสู่ระบบ</router-link></li>
          </ul>
        </div>
        <div class="space-y-6">
          <h4 class="font-bold text-slate-800 text-xl border-b-2 border-[#00b09b] inline-block pb-2">Contact</h4>
          <div class="space-y-4">
            <p class="text-slate-500 font-medium flex items-start gap-3">
              <span class="text-2xl mt-1">📍</span> 
              <span>99/9 ถนนสุขุมวิท แขวงคลองเตย<br>เขตคลองเตย กรุงเทพฯ 10110</span>
            </p>
            <p class="text-slate-500 font-medium flex items-center gap-3">
              <span class="text-2xl">📞</span> 
              <span class="text-lg">081-234-5678</span>
            </p>
            <p class="text-slate-500 font-medium flex items-center gap-3">
              <span class="text-2xl">✉️</span> 
              <span>hello@nongjames.com</span>
            </p>
          </div>
        </div>
      </div>
      <div class="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm font-medium">
        <div>© {{ new Date().getFullYear() }} NongJames Premium Laundry. All rights reserved.</div>
        <div class="flex gap-6">
          <a href="#" class="hover:text-slate-600">Privacy Policy</a>
          <a href="#" class="hover:text-slate-600">Terms of Service</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isLoggedIn = ref(false);
const userRole = ref('');

onMounted(() => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      isLoggedIn.value = true;
      userRole.value = user.role || 'customer';
    } catch (e) {
      isLoggedIn.value = false;
    }
  }
});

const getHeroLink = () => {
  if (!isLoggedIn.value) return '/register';
  if (userRole.value === 'admin') return '/admin';
  if (userRole.value === 'driver') return '/driver';
  return '/customer';
};

const services = [
  { price: '฿80', title: 'Wash & Fold', desc: 'บริการซัก อบแห้ง และพับอย่างเป็นระเบียบ เหมาะสำหรับเสื้อผ้าใส่เล่นทั่วไปในชีวิตประจำวัน', img: 'https://images.unsplash.com/photo-1563805042-7684c8e9e5cb?auto=format&fit=crop&q=80&w=800' },
  { price: '฿120', title: 'Wash & Iron', desc: 'ซักสะอาดพร้อมรีดเรียบกริบด้วยเตารีดไอน้ำระดับอุตสาหกรรม เสริมบุคลิกให้ชุดทำงานของคุณ', img: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&q=80&w=800' },
  { price: '฿250', title: 'Dry Cleaning', desc: 'ซักแห้งด้วยน้ำยาชนิดพิเศษ สำหรับชุดสูท ชุดราตรี หรือผ้าไหมที่ต้องการการดูแลระดับสูงสุด', img: 'https://images.unsplash.com/photo-1582735689369-cafce27b05eb?auto=format&fit=crop&q=80&w=800' }
];

const stats = [
  { number: '15+', label: 'Years of Experience' },
  { number: '50K+', label: 'Happy Customers' },
  { number: '100%', label: 'Eco-Friendly Products' },
  { number: '24/7', label: 'Online Support' }
];

const steps = [
  { icon: '📱', title: 'Booking', desc: 'กดจองบริการผ่านเว็บไซต์ เลือกเวลาที่คุณสะดวก' },
  { icon: '🚚', title: 'Pickup', desc: 'พนักงานขับรถเข้ารับผ้าถึงหน้าประตูบ้าน' },
  { icon: '✨', title: 'Cleaning', desc: 'คัดแยกและทำความสะอาดด้วยมาตรฐานสูงสุด' },
  { icon: '🎁', title: 'Delivery', desc: 'จัดส่งเสื้อผ้าที่หอม สะอาด พร้อมใช้งานทันที' }
];

// 🟢 อัปเดตลิงก์แกลลอรี่ ใช้ภาพที่รันติดชัวร์ 100%
const gallery = [
  { src: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=1000', caption: 'หน้าร้านและจุดรับบริการ' },
  { src: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=800', caption: 'การพับผ้าอย่างเป็นระเบียบ' },
  { src: 'https://images.unsplash.com/photo-1582735689369-cafce27b05eb?auto=format&fit=crop&q=80&w=800', caption: 'ดูแลเสื้อผ้าสีขาว' },
  { src: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&q=80&w=800', caption: 'บริการรีดเรียบกริบ' },
  { src: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&q=80&w=800', caption: 'ราวแขวนชุดที่พร้อมส่งคืน' },
  { src: 'https://images.unsplash.com/photo-1563805042-7684c8e9e5cb?auto=format&fit=crop&q=80&w=1000', caption: 'ผ้าปูที่นอนและเครื่องนอน' },
  { src: 'https://images.unsplash.com/photo-1583847268964-b28ce8f31586?auto=format&fit=crop&q=80&w=800', caption: 'ตะกร้าผ้าเตรียมซัก' },
  { src: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&q=80&w=800', caption: 'เครื่องซักผ้าอุตสาหกรรม' }
];
</script>

<style scoped>
@keyframes fade-in-left {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-fade-in-left {
  animation: fade-in-left 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
</style>