import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Crown,
  Zap,
  ShieldCheck,
  Star,
  MessageCircle,
} from 'lucide-react'
import { SectionHeader } from '../components/Layout'
import { PRICING_PLANS, FAQS, SITE } from '../lib/data'
import { formatPrice, cn } from '../lib/utils'

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/salon-3.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/88 to-forest" />
        </div>
        <div className="absolute top-0 right-1/4 w-[520px] h-[520px] rounded-full bg-gold/9 blur-[130px]" />
        <div className="hero-grid-bg absolute inset-0 opacity-55" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <nav className="flex items-center gap-2.5 text-[12.5px] text-cream/42 mb-7">
            <Link to="/" className="hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">الباقات والأسعار</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              أسعار واضحة وشفافة بدون رسوم خفية
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              حلول متكاملة{' '}
              <span className="text-gradient-gold">للزبائن وأصحاب الصالونات</span>
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              سواء كنت تبحث عن أفضل صالون لحجز موعدك، أو تدير صالوناً وتريد تنمية
              أعمالك، stikini تمنحك الأدوات المناسبة بأسعار تنافسية.
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-11 flex flex-wrap gap-x-8 gap-y-4">
            {[
              { icon: ShieldCheck, label: 'دفع آمن ومشفّر' },
              { icon: Zap, label: 'تفعيل فوري' },
              { icon: Star, label: 'إلغاء في أي وقت' },
              { icon: MessageCircle, label: 'دعم فني متكامل' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2.5">
                <badge.icon className="w-4.5 h-4.5 text-emerald-brand" />
                <span className="text-cream/52 text-[12.5px] font-semibold">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid md:grid-cols-3 gap-7 items-stretch">
            {PRICING_PLANS.map((plan, i) => {
              const Icon = plan.popular ? Crown : plan.price === 0 ? Zap : Sparkles
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.22 }}
                  transition={{ duration: 0.68, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'relative rounded-[28px] p-9 flex flex-col',
                    plan.popular
                      ? 'bg-gradient-to-b from-gold/15 to-gold/4 border-2 border-gold/38 shadow-gold-soft lg:-translate-y-4'
                      : 'glass-panel',
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 right-1/2 translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-l from-gold-light to-gold-dark text-ink text-[11.5px] font-black whitespace-nowrap shadow-gold-soft">
                      الأكثر طلباً
                    </div>
                  )}

                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        'w-[52px] h-[52px] rounded-[18px] flex items-center justify-center',
                        plan.popular
                          ? 'bg-gold text-ink'
                          : 'bg-gold/12 border border-gold/22 text-gold',
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </span>
                    <div>
                      <h3 className="text-[21px] font-black text-cream">{plan.name}</h3>
                      <p className="text-cream/38 text-[10.5px] font-semibold mt-0.5">
                        {plan.nameEn}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-cream/50 text-[13px] leading-[1.95] min-h-[52px]">
                    {plan.description}
                  </p>

                  <div className="mt-7 flex items-end gap-2">
                    <span
                      className={cn(
                        'text-[46px] font-black leading-none',
                        plan.popular ? 'text-gradient-gold' : 'text-cream',
                      )}
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
                          className={cn(
                            'w-[19px] h-[19px] mt-0.5 shrink-0',
                            plan.popular ? 'text-gold' : 'text-emerald-brand',
                          )}
                        />
                        <span className="text-cream/62 text-[13px] leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={plan.price === 0 ? '/register' : '/contact'}
                    className={cn(
                      'mt-9 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300',
                      plan.popular ? 'btn-gold' : 'btn-outline',
                    )}
                  >
                    {plan.cta}
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Comparison note */}
          <div className="mt-16 glass-panel rounded-[26px] p-9">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex items-start gap-4 flex-1">
                <span className="w-13 h-13 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-gold" />
                </span>
                <div>
                  <h3 className="text-cream text-[18px] font-black">
                    ضمان استرداد الأموال
                  </h3>
                  <p className="mt-2.5 text-cream/52 text-[13.5px] leading-[2]">
                    جرّب باقتنا الاحترافية لمدة 14 يوماً. إذا لم تكن راضياً بالكامل،
                    نعيد لك أموالك بدون أسئلة. رضاك هو أولويتنا الأولى.
                  </p>
                </div>
              </div>

              <Link
                to="/contact"
                className="btn-gold inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl whitespace-nowrap"
              >
                تواصل معنا
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="relative pb-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <SectionHeader
            eyebrow="أسئلة حول الأسعار"
            title={
              <>
                أسئلة <span className="text-gradient-gold">شائعة</span>
              </>
            }
            description="كل ما تحتاج معرفته عن الباقات والأسعار والدفع."
          />

          <div className="mt-14 space-y-4">
            {FAQS.slice(0, 5).map((faq, i) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="glass-panel rounded-[22px] overflow-hidden"
              >
                <details className="group">
                  <summary className="flex items-center justify-between gap-4 p-6 sm:p-7 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                        <span className="text-gold text-[12px] font-black">{i + 1}</span>
                      </span>
                      <h3 className="text-[15.5px] font-bold text-cream leading-relaxed group-open:text-gold transition-colors pt-1">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center shrink-0 group-open:rotate-45 group-open:border-gold/40 group-open:bg-gold/12 transition-all duration-300">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="text-cream/55 group-open:text-gold"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 sm:px-7 pb-7">
                    <div className="pr-12">
                      <div className="h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent mb-5" />
                      <p className="text-cream/55 text-[14px] leading-[2.15]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </details>
              </motion.div>
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
