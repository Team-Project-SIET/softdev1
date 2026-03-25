import Navbar      from '@/components/home/Navbar'
import Hero        from '@/components/home/Hero'
import Stats       from '@/components/home/Stats'
import Services    from '@/components/home/Services'
import HowItWorks  from '@/components/home/HowItWorks'
import WhyChoose   from '@/components/home/WhyChoose'
import Testimonials from '@/components/home/Testimonials'
import Blog        from '@/components/home/Blog'
import CTABanner   from '@/components/home/CTABanner'
import Footer      from '@/components/home/Footer'

export default function HomePage() {
  return (
    <main className="bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <Blog />
      <CTABanner />
      <Footer />
    </main>
  )
}
