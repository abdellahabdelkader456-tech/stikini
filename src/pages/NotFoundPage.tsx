import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft, Scissors, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-[110px] pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-salon.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/94 to-forest" />
      </div>
      <div className="absolute top-1/4 right-1/3 w-[560px] h-[560px] rounded-full bg-gold/10 blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-brand/7 blur-[130px]" />
      <div className="hero-grid-bg absolute inset-0 opacity-55" />
      <div className="noise-overlay" />

      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Big 404 */}
          <div className="relative inline-block">
            <span className="text-[clamp(7rem,18vw,12rem)] font-black leading-none text-gradient-gold opacity-90">
              404
            </span>
            <motion.div
              animate={{ rotate: [0, -12, 12, -8, 0], y: [0, -10, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-6 w-16 h-16 rounded-2xl bg-gold/16 border border-gold/28 flex items-center justify-center"
            >
              <Scissors className="w-8 h-8 text-gold" />
            </motion.div>
          </div>

          <h1 className="mt-6 text-[clamp(1.95rem,4.8vw,2.95rem)] font-black text-cream leading-[1.32]">
            عذراً، الصفحة غير موجودة
          </h1>

          <p className="mt-6 text-cream/55 text-[17px] leading-[2.1] max-w-xl mx-auto">
            الصفحة التي تبحث عنها ربما تم نقلها أو حذفها أو أن الرابط غير صحيح. لا
            تقلق — يمكنك العودة إلى الرئيسية أو متابعة تصفح الصالونات في الجزائر
            العاصمة.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15.5px]"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>

            <Link
              to="/salons"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-white/13 text-cream/82 font-bold text-[15px] hover:border-gold/45 hover:text-gold hover:-translate-y-1 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
              تصفح الصالونات
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-white/13 text-cream/82 font-bold text-[15px] hover:border-gold/45 hover:text-gold hover:-translate-y-1 transition-all duration-300"
            >
              <Compass className="w-5 h-5" />
              اتصل بنا
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-14 pt-10 border-t border-white/8">
            <p className="text-cream/42 text-[12px] font-semibold mb-6">
              روابط سريعة
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'الرئيسية', to: '/' },
                { label: 'الصالونات', to: '/salons' },
                { label: 'الباقات والأسعار', to: '/pricing' },
                { label: 'الأسئلة الشائعة', to: '/faq' },
                { label: 'تواصل معنا', to: '/contact' },
                { label: 'تسجيل الدخول', to: '/login' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-cream/56 text-[12px] font-semibold hover:border-gold/32 hover:text-gold transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Help note */}
          <div className="mt-12 glass-panel rounded-[22px] p-6 max-w-xl mx-auto">
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                <Compass className="w-4.5 h-4.5 text-gold" />
              </span>
              <div className="text-right">
                <p className="text-cream text-[12px] font-bold">
                  هل واجهت مشكلة تقنية؟
                </p>
                <p className="mt-2 text-cream/42 text-[11px] leading-relaxed">
                  إذا كنت تعتقد أن هذه خطأ، يرجى إبلاغ فريق الدعم وسنتولى إصلاحه في
                  أقرب وقت.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
