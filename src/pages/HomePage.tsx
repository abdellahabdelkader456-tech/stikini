import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  PlayCircle,
  Zap,
  ShieldCheck,
  BadgeDollarSign,
  Star,
  MapPin,
  CalendarCheck,
  Users,
  Store,
  Heart,
  Clock,
  Scissors,
  Sparkles,
  Flower2,
  Palette,
  Crown,
  Hand,
  CheckCircle2,
  Quote,
} from 'lucide-react'
import { SectionHeader, ScrollButton } from '../components/Layout'
import { useStore } from '../lib/store'
import { SalonCard, Stars } from '../components/SalonCard'
import {
  SALONS,
  STATS,
  PLATFORM_FEATURES,
  HOW_IT_WORKS,
  TESTIMONIALS,
  PRICING_PLANS,
  FAQS,
  NEIGHBORHOODS,
  SERVICE_CATEGORIES,
} from '../lib/data'
import { formatPrice } from '../lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Zap,
  ShieldCheck,
  BadgeDollarSign,
  Star,
  MapPin,
  CalendarCheck,
  Users,
  Store,
  Heart,
  Clock,
  Scissors,
  Sparkles,
  Flower2,
  Palette,
  Crown,
  Hand,
}

export default function HomePage() {
  const { user } = useStore()
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden pt-[110px] pb-24">
        {/* Background layers */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-salon.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.30]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-forest via-forest/92 to-forest/72" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-forest/85" />
        </div>

        {/* Orbs */}
        <div className="hero-orb w-[620px] h-[620px] bg-gold/12 -top-40 -right-40" />
        <div className="hero-orb w-[520px] h-[520px] bg-emerald-brand/8 bottom-0 -left-48" />
        <div className="absolute inset-0 hero-grid-bg" />
        <div className="noise-overlay" />

        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-14 lg:gap-10 items-center">
            {/* Copy */}
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/10 border border-gold/22 backdrop-blur-md"
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-gold opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-gold" />
                </span>
                <span className="text-gold text-[12.5px] font-bold tracking-wide">
                  المنصة الأولى للحجز الذكي في الجزائر العاصمة
                </span>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="mt-7 text-[clamp(2.55rem,6.4vw,4.9rem)] font-black leading-[1.18] text-cream"
              >
                احجز موعدك في{' '}
                <span className="text-gradient-gold">أفضل الصالونات</span>
                <br />
                بدون انتظار وبدون مكالمات
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="mt-7 text-[clamp(1.05rem,2.1vw,1.32rem)] text-cream/62 leading-[2.15] max-w-[620px]"
              >
                اكتشف مئات الصالونات الموثوقة في الجزائر العاصمة، قارن الأسعار
                والتقييمات، واحجز موعدك في الوقت الذي يناسبك — كل ذلك في أقل من 30
                ثانية.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                {user?.type !== 'owner' && (
                  <Link
                    to={user ? '/salons' : '/register?type=client&redirect=%2Fsalons'}
                    className="btn-gold inline-flex items-center gap-2.5 px-8 py-4.5 rounded-2xl text-[16px]"
                  >
                    تصفح الصالونات واحجز الآن
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                )}
                <ScrollButton id="how-it-works">
                  <PlayCircle className="w-5 h-5 text-gold" />
                  كيف تعمل المنصة؟
                </ScrollButton>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
                className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex -space-x-3 space-x-reverse">
                    {['/images/style-2.jpg', '/images/salon-2.jpg', '/images/style-1.jpg'].map(
                      (src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="w-11 h-11 rounded-full border-[2.5px] border-forest object-cover"
                        />
                      ),
                    )}
                    <span className="w-11 h-11 rounded-full border-[2.5px] border-forest bg-gold text-ink text-[11px] font-black flex items-center justify-center">
                      +12K
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Stars rating={4.9} size="sm" showValue={false} />
                      <span className="text-gold font-black text-[15px]">4.9</span>
                    </div>
                    <p className="text-cream/45 text-[12px] mt-0.5">
                      من أكثر من 12,000 زبون
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-brand" />
                  <p className="text-cream/55 text-[13px] leading-relaxed">
                    صالونات موثّقة
                    <br />
                    ومراجعة 100%
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: -30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[32px] overflow-hidden gold-ring">
                <img
                  src="/images/salon-1.jpg"
                  alt="صالون حلاقة"
                  className="w-full h-[560px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/18 to-transparent" />

                {/* Floating card — top */}
                <div className="absolute top-6 right-6 left-6 glass-panel-strong rounded-2xl p-4 flex items-center gap-3.5">
                  <span className="w-11 h-11 rounded-xl bg-gold/18 border border-gold/28 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-gold" />
                  </span>
                  <div>
                    <p className="text-cream text-[13px] font-bold">حجزك مؤكد</p>
                    <p className="text-cream/50 text-[11px] mt-0.5">
                      اليوم، 15:30 — صالون بريستيج حيدرة
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-brand mr-auto" />
                </div>

                {/* Floating card — bottom */}
                <div className="absolute bottom-6 right-6 left-6 glass-panel-strong rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cream/50 text-[11px] mb-1.5">الخدمة الأكثر طلباً</p>
                      <p className="text-cream text-[15px] font-black">
                        باقة بريستيج الشاملة
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-gold font-black text-[22px]">
                        {formatPrice(2500)}
                      </p>
                      <p className="text-cream/45 text-[11px]">دج</p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-l from-gold-light to-gold-dark" />
                  </div>
                  <p className="mt-2.5 text-cream/40 text-[10.5px]">
                    78% من المواعيد محجوزة هذا الأسبوع
                  </p>
                </div>
              </div>

              {/* Side floating badge */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 float-slow">
                <div className="glass-panel-strong rounded-2xl p-4 flex flex-col items-center gap-2.5 w-[112px]">
                  <span className="w-11 h-11 rounded-full bg-emerald-brand/18 border border-emerald-brand/28 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-brand" />
                  </span>
                  <p className="text-cream text-[13px] font-black">30 ثانية</p>
                  <p className="text-cream/45 text-[10px] text-center leading-relaxed">
                    متوسط وقت
                    <br />
                    الحجز
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5">
          <span className="text-cream/32 text-[11px] tracking-widest">اكتشف المزيد</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/14 flex items-start justify-center p-1.5">
            <motion.span
              animate={{ y: [0, 13, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-gold"
            />
          </div>
        </div>
      </section>

      {/* ============ NEIGHBORHOODS MARQUEE ============ */}
      <section className="relative py-8 border-y border-white/6 bg-ink/50 overflow-hidden">
        <div className="marquee-track gap-4">
          {[...NEIGHBORHOODS, ...NEIGHBORHOODS].map((area, i) => (
            <span
              key={`${area}-${i}`}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/4 border border-white/7 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-gold/70" />
              <span className="text-cream/55 text-[13.5px] font-semibold">{area}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[460px] h-[460px] rounded-full bg-gold/6 blur-[130px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map((stat, i) => {
              const Icon = ICON_MAP[stat.icon] ?? Users
              return (
                <motion.div
                  key={stat.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                  variants={fadeUp}
                  custom={i}
                  className="group glass-panel rounded-[24px] p-8 text-center card-hover"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gold/12 border border-gold/20 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <Icon className="w-6.5 h-6.5 text-gold" />
                  </div>
                  <p className="mt-5 text-[clamp(1.9rem,3.6vw,2.65rem)] font-black text-gradient-gold leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-cream/52 text-[14px] font-semibold">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="relative section-pad overflow-hidden">
        <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-brand/6 blur-[140px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="لماذا stikini؟"
            title={
              <>
                تجربة حجز صُممت لتكون{' '}
                <span className="text-gradient-gold">الأسهل والأسرع</span>
              </>
            }
            description="جمعنا كل ما تحتاجه لحجز موعدك في مكان واحد، بواجهة عربية أنيقة وتجربة استخدام سلسة على جميع الأجهزة."
          />

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((feature, i) => {
              const Icon = ICON_MAP[feature.icon] ?? Zap
              return (
                <motion.div
                  key={feature.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  custom={i}
                  className="group glass-panel rounded-[26px] p-8 card-hover relative overflow-hidden"
                >
                  <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-gold/8 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative">
                    <div className="w-[58px] h-[58px] rounded-[19px] bg-gradient-to-br from-gold/22 to-gold/6 border border-gold/22 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="mt-6 text-[19px] font-black text-cream group-hover:text-gold transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-3.5 text-cream/52 text-[14.5px] leading-[2.05]">
                      {feature.description}
                    </p>
                  </div>
                  <div className="absolute bottom-0 right-0 h-[3px] w-0 bg-gradient-to-l from-gold-light to-gold-dark group-hover:w-full transition-all duration-600" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURED SALONS ============ */}
      <section className="relative section-pad bg-ink/45 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="صالونات مميزة"
            title={
              <>
                صالونات مميزة <span className="text-gradient-gold">تستحق التجربة</span>
              </>
            }
            description="اخترنا لك أفضل الصالونات الموثوقة في الجزائر العاصمة بناءً على جودة الخدمة والتقييمات الحقيقية."
          >
            <div className="mt-9">
              <Link
                to="/salons"
                className="btn-outline inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl"
              >
                عرض جميع الصالونات
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
            </div>
          </SectionHeader>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {SALONS.filter((s) => s.featured)
              .slice(0, 3)
              .map((salon, i) => (
                <motion.div
                  key={salon.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.22 }}
                  variants={fadeUp}
                  custom={i}
                >
                  <SalonCard salon={salon} index={i} />
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="relative section-pad overflow-hidden">
        <div className="absolute top-20 right-0 w-[420px] h-[420px] rounded-full bg-gold/7 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="كيف تعمل المنصة"
            title={
              <>
                أربع خطوات فقط تفصلك عن{' '}
                <span className="text-gradient-gold">موعدك القادم</span>
              </>
            }
            description="صممنا stikini لتكون سهلة وسريعة للجميع — سواء كنت زبوناً تبحث عن موعدك القادم، أو صاحب صالون يريد إدارة أعماله بكفاءة."
          />

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                custom={i}
                className="group relative"
              >
                <div className="glass-panel rounded-[26px] p-8 h-full card-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-[52px] font-black text-gold/16 leading-none group-hover:text-gold/34 transition-colors duration-500">
                      {step.step}
                    </span>
                    <span className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-gold" />
                    </span>
                  </div>
                  <h3 className="mt-6 text-[18px] font-black text-cream">{step.title}</h3>
                  <p className="mt-3 text-cream/52 text-[14px] leading-[2]">
                    {step.description}
                  </p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -left-3.5 w-7 h-px bg-gradient-to-l from-gold/34 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICE CATEGORIES ============ */}
      <section className="relative section-pad bg-ink/45 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="خدمات متنوعة"
            title={
              <>
                كل ما تحتاجه من <span className="text-gradient-gold">خدمات التجميل</span>
              </>
            }
            description="من قص الشعر إلى العناية المتكاملة — استكشف مجموعة واسعة من الخدمات المتوفرة في صالونات الجزائر العاصمة."
          />

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {SERVICE_CATEGORIES.map((cat, i) => {
              const Icon = ICON_MAP[cat.icon] ?? Scissors
              return (
                <motion.div
                  key={cat.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  custom={i}
                  className="group glass-panel rounded-[22px] p-6 text-center card-hover cursor-pointer"
                >
                  <div
                    className="w-[54px] h-[54px] rounded-[18px] flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                    style={{
                      background: `linear-gradient(135deg, ${cat.color}26, ${cat.color}0a)`,
                      border: `1px solid ${cat.color}33`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: cat.color }} />
                  </div>
                  <h3 className="mt-4.5 text-[13.5px] font-black text-cream leading-snug">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-cream/40 text-[11px]">{cat.count} خدمة</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative section-pad overflow-hidden">
        <div className="absolute top-1/4 -right-40 w-[520px] h-[520px] rounded-full bg-gold/7 blur-[140px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="آراء المستخدمين"
            title={
              <>
                ماذا يقول زبائن <span className="text-gradient-gold">الجزائر العاصمة</span>؟
              </>
            }
            description="تجارب حقيقية من مستخدمي منصة stikini في مختلف أحياء العاصمة."
          />

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item, i) => (
              <motion.div
                key={item.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.28 }}
                variants={fadeUp}
                custom={i}
                className="group glass-panel rounded-[26px] p-8 card-hover relative overflow-hidden"
              >
                <div className="absolute top-6 left-6 opacity-12 group-hover:opacity-22 transition-opacity duration-500">
                  <Quote className="w-14 h-14 text-gold" />
                </div>
                <Stars rating={item.rating} size="md" showValue={false} />
                <p className="mt-5 text-cream/62 text-[14.5px] leading-[2.15]">
                  {item.text}
                </p>
                <div className="mt-7 pt-6 border-t border-white/8 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/28 to-gold/8 border border-gold/22 flex items-center justify-center">
                    <span className="text-gold font-black text-[16px]">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-cream text-[14px] font-bold">{item.name}</p>
                    <p className="text-cream/42 text-[11.5px] mt-0.5">
                      {item.role} — {item.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="relative section-pad bg-ink/45 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="الباقات والأسعار"
            title={
              <>
                حلول متكاملة <span className="text-gradient-gold">للزبائن وأصحاب الصالونات</span>
              </>
            }
            description="سواء كنت تبحث عن أفضل صالون لحجز موعدك، أو تدير صالوناً وتريد تنمية أعمالك، stikini تمنحك الأدوات المناسبة."
          />

          <div className="mt-16 grid md:grid-cols-3 gap-7 items-stretch">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
                custom={i}
                className={`relative rounded-[28px] p-9 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-gold/14 to-gold/4 border-2 border-gold/36 shadow-gold-soft lg:-translate-y-3'
                    : 'glass-panel'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-l from-gold-light to-gold-dark text-ink text-[11.5px] font-black whitespace-nowrap shadow-gold-soft">
                    الأكثر طلباً
                  </div>
                )}

                <h3 className="text-[21px] font-black text-cream">{plan.name}</h3>
                <p className="mt-2.5 text-cream/50 text-[13px] leading-relaxed min-h-[42px]">
                  {plan.description}
                </p>

                <div className="mt-7 flex items-end gap-2">
                  <span
                    className={`text-[44px] font-black leading-none ${
                      plan.popular ? 'text-gradient-gold' : 'text-cream'
                    }`}
                  >
                    {plan.price === 0 ? 'مجاني' : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-cream/45 text-[13px] font-semibold pb-1.5">
                      دج / {plan.period}
                    </span>
                  )}
                  {plan.price === 0 && (
                    <span className="text-cream/45 text-[13px] font-semibold pb-1.5">
                      {plan.period}
                    </span>
                  )}
                </div>

                <div className="mt-8 space-y-3.5 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2
                        className={`w-[19px] h-[19px] mt-0.5 shrink-0 ${
                          plan.popular ? 'text-gold' : 'text-emerald-brand'
                        }`}
                      />
                      <span className="text-cream/62 text-[13.5px] leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to={plan.price === 0 ? '/register' : '/contact'}
                  className={`mt-9 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 ${
                    plan.popular
                      ? 'btn-gold'
                      : 'btn-outline'
                  }`}
                >
                  {plan.cta}
                  <ArrowLeft className="w-4.5 h-4.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative section-pad overflow-hidden">
        <div className="absolute top-20 -left-40 w-[480px] h-[480px] rounded-full bg-gold/6 blur-[130px]" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="الأسئلة الشائعة"
            title={
              <>
                كل ما تحتاج معرفته في <span className="text-gradient-gold">مكان واحد</span>
              </>
            }
            description="جمعنا هنا أكثر الأسئلة تكراراً من الزبائن وأصحاب الصالونات."
          />

          <div className="mt-14 space-y-4">
            {FAQS.slice(0, 5).map((faq, i) => (
              <FaqItem key={faq.question} faq={faq} index={i} />
            ))}
          </div>

          <div className="mt-11 text-center">
            <Link
              to="/faq"
              className="btn-outline inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl"
            >
              مشاهدة كل الأسئلة الشائعة
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}

function FaqItem({
  faq,
  index,
}: {
  faq: { category: string; question: string; answer: string }
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay: index * 0.07 }}
      className="group glass-panel rounded-[22px] overflow-hidden"
    >
      <details className="group">
        <summary className="flex items-center justify-between gap-4 p-6 sm:p-7 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-4">
            <span className="w-8 h-8 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-gold text-[12px] font-black">{index + 1}</span>
            </span>
            <div>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-white/5 text-cream/42 text-[10.5px] font-semibold mb-2">
                {faq.category}
              </span>
              <h3 className="text-[16.5px] font-bold text-cream leading-relaxed group-open:text-gold transition-colors">
                {faq.question}
              </h3>
            </div>
          </div>
          <span className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center shrink-0 group-open:rotate-45 group-open:border-gold/40 group-open:bg-gold/12 transition-all duration-400">
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              className="text-cream/55 group-open:text-gold"
            >
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </summary>
        <div className="px-6 sm:px-7 pb-7">
          <div className="pr-12">
            <div className="h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent mb-5" />
            <p className="text-cream/55 text-[14.5px] leading-[2.15]">{faq.answer}</p>
          </div>
        </div>
      </details>
    </motion.div>
  )
}