import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  HelpCircle,
  MessageCircle,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react'
import { FAQS, SITE } from '../lib/data'
import { cn } from '../lib/utils'

const CATEGORIES = ['الكل', ...Array.from(new Set(FAQS.map((f) => f.category)))]

export default function FaqPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const filtered = FAQS.filter((faq) => {
    const matchesQuery =
      !query.trim() ||
      faq.question.toLowerCase().includes(query.trim().toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory = category === 'الكل' || faq.category === category
    return matchesQuery && matchesCategory
  })

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/salon-4.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.13]"
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
            <span className="text-gold/85">الأسئلة الشائعة</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              مركز المساعدة والدعم
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              كيف يمكننا <span className="text-gradient-gold">مساعدتك</span>؟
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              ابحث عن إجابات لأسئلتك أو تصفح الفئات المختلفة. فريق الدعم جاهز
              لمساعدتك في أي وقت.
            </p>
          </div>

          {/* Search */}
          <div className="mt-10 max-w-2xl">
            <div className="glass-panel-strong rounded-[22px] p-2.5 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-gold/70 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن سؤال أو كلمة مفتاحية..."
                  className="flex-1 bg-transparent py-4 text-cream text-[15px] placeholder:text-cream/32 outline-none"
                />
              </div>
              <div className="px-6 py-4 rounded-2xl bg-gold text-ink font-bold text-[13px] whitespace-nowrap">
                {filtered.length} نتيجة
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-[12px] font-bold border transition-all',
                  category === cat
                    ? 'bg-gold text-ink border-gold'
                    : 'bg-white/4 border-white/9 text-cream/58 hover:border-gold/32 hover:text-gold',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="relative pb-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((faq, i) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.32 }}
                  transition={{ duration: 0.55, delay: (i % 5) * 0.07 }}
                  className={cn(
                    'glass-panel rounded-[22px] overflow-hidden transition-all duration-300',
                    openIndex === i && 'border-gold/26',
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-6 sm:p-7 text-right"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all',
                          openIndex === i
                            ? 'bg-gold text-ink'
                            : 'bg-gold/12 border border-gold/22',
                        )}
                      >
                        <HelpCircle
                          className={cn(
                            'w-4 h-4',
                            openIndex === i ? 'text-ink' : 'text-gold',
                          )}
                        />
                      </span>
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white/5 text-cream/42 text-[10px] font-semibold mb-2">
                          {faq.category}
                        </span>
                        <h3
                          className={cn(
                            'text-[16px] font-bold leading-relaxed transition-colors',
                            openIndex === i ? 'text-gold' : 'text-cream',
                          )}
                        >
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300',
                        openIndex === i
                          ? 'rotate-45 border-gold/42 bg-gold/12'
                          : 'border-white/11',
                      )}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className={openIndex === i ? 'text-gold' : 'text-cream/52'}
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    className="accordion-body"
                    style={{
                      maxHeight: openIndex === i ? '420px' : '0px',
                      opacity: openIndex === i ? 1 : 0,
                      marginTop: openIndex === i ? '0px' : '0px',
                    }}
                  >
                    <div className="px-6 sm:px-7 pb-7">
                      <div className="pr-13">
                        <div className="h-px bg-gradient-to-l from-transparent via-gold/22 to-transparent mb-5" />
                        <p className="text-cream/56 text-[14.5px] leading-[2.2]">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-[26px] p-12 text-center">
              <div className="w-18 h-18 rounded-3xl bg-gold/11 border border-gold/18 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gold/68" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-cream">
                لم نجد نتائج مطابقة
              </h3>
              <p className="mt-3 text-cream/50 text-[14.5px] leading-[1.95] max-w-md mx-auto">
                جرّب تعديل كلمات البحث أو تواصل مع فريق الدعم مباشرة للحصول على
                المساعدة.
              </p>
              <button
                onClick={() => {
                  setQuery('')
                  setCategory('الكل')
                }}
                className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl mt-7"
              >
                إعادة تعيين البحث
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="relative rounded-[30px] overflow-hidden">
            <img
              src="/images/style-3.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-[0.18]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-forest via-forest/92 to-forest/80" />
            <div className="absolute top-0 left-1/4 w-[420px] h-[420px] rounded-full bg-gold/11 blur-[110px]" />

            <div className="relative px-9 py-14 sm:px-14 sm:py-16">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-gold/14 border border-gold/26 flex items-center justify-center">
                      <Sparkles className="w-5.5 h-5.5 text-gold" />
                    </span>
                    <h2 className="text-[clamp(1.85rem,3.8vw,2.65rem)] font-black text-cream leading-[1.32]">
                      لم تجد ما تبحث عنه؟
                    </h2>
                  </div>

                  <p className="mt-5 text-cream/55 text-[15.5px] leading-[2.05]">
                    فريق stikini جاهز للإجابة على جميع استفساراتك — تواصل معنا مباشرة
                    وسنعود إليك خلال 24 ساعة كحد أقصى.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                    <a
                      href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2.5 text-cream/58 text-[12.5px] font-semibold hover:text-gold transition-colors"
                    >
                      <Phone className="w-4 h-4 text-gold/72" />
                      <span dir="ltr">{SITE.phone}</span>
                    </a>
                    <a
                      href={`mailto:${SITE.email}`}
                      className="flex items-center gap-2.5 text-cream/58 text-[12.5px] font-semibold hover:text-gold transition-colors"
                    >
                      <Mail className="w-4 h-4 text-gold/72" />
                      <span dir="ltr">{SITE.email}</span>
                    </a>
                    <span className="flex items-center gap-2.5 text-cream/58 text-[12.5px] font-semibold">
                      <Clock className="w-4 h-4 text-gold/72" />
                      {SITE.hours}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3.5 shrink-0">
                  <Link
                    to="/contact"
                    className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل معنا الآن
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-white/13 text-cream/82 font-bold text-[14px] hover:border-gold/42 hover:text-gold transition-all"
                  >
                    أنشئ حسابك
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
