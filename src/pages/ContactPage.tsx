import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Building2,
  Handshake,
  Headphones,
  ArrowLeft,
} from 'lucide-react'
import { SITE } from '../lib/data'
import { isValidEmail, isValidName, isValidPhone, cn } from '../lib/utils'

const SUBJECTS = [
  'استفسار عام',
  'حجز موعد',
  'مشكلة تقنية',
  'انضمام صالون جديد',
  'شراكة أو اقتراح',
  'أخرى',
]

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!isValidName(name)) newErrors.name = 'يرجى إدخال الاسم الكامل'
    if (!isValidEmail(email)) newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
    if (phone.trim() && !isValidPhone(phone))
      newErrors.phone = 'يرجى إدخال رقم هاتف صحيح'
    if (message.trim().length < 20)
      newErrors.message = 'يرجى كتابة رسالة أكثر تفصيلاً (20 حرفاً على الأقل)'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 900)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-salon.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.14]"
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
            <span className="text-gold/85">تواصل معنا</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <Headphones className="w-3.5 h-3.5" />
              فريق الدعم يرد خلال 24 ساعة
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              نحن هنا <span className="text-gradient-gold">لمساعدتك</span>
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              سؤال عن الحجز؟ مشكلة في حسابك؟ تريد انضمام صالونك؟ راسلنا وسيتواصل معك
              فريقنا في أقرب وقت.
            </p>
          </div>

          {/* Contact cards */}
          <div className="mt-11 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: MapPin,
                title: 'العنوان',
                value: SITE.address,
                sub: 'الجزائر العاصمة، الجزائر',
              },
              {
                icon: Phone,
                title: 'الهاتف',
                value: SITE.phone,
                sub: SITE.phone2,
                link: `tel:${SITE.phone.replace(/\s/g, '')}`,
              },
              {
                icon: Mail,
                title: 'البريد الإلكتروني',
                value: SITE.email,
                sub: SITE.supportEmail,
                link: `mailto:${SITE.email}`,
              },
              {
                icon: Clock,
                title: 'ساعات العمل',
                value: SITE.hours,
                sub: 'دعم على مدار الساعة',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.58, delay: i * 0.09 }}
                className="glass-panel rounded-[22px] p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="mt-4.5 text-cream text-[13px] font-bold">{card.title}</h3>
                {card.link ? (
                  <a
                    href={card.link}
                    className="mt-2 block text-cream/62 text-[11.5px] leading-relaxed hover:text-gold transition-colors"
                    dir={card.title === 'الهاتف' ? 'ltr' : undefined}
                    style={card.title === 'الهاتف' ? { textAlign: 'right' } : undefined}
                  >
                    {card.value}
                  </a>
                ) : (
                  <p className="mt-2 text-cream/62 text-[11.5px] leading-relaxed">
                    {card.value}
                  </p>
                )}
                <p className="mt-1.5 text-cream/38 text-[10px]" dir="ltr">
                  {card.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + info */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10">
            {/* Form */}
            <div>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55 }}
                  className="glass-panel-strong rounded-[28px] p-12 text-center"
                >
                  <div className="relative w-[92px] h-[92px] mx-auto">
                    <div className="absolute inset-0 rounded-full bg-emerald-brand/18 animate-ping" />
                    <div className="relative w-[92px] h-[92px] rounded-full bg-gradient-to-br from-emerald-brand/26 to-emerald-brand/8 border-2 border-emerald-brand/38 flex items-center justify-center">
                      <CheckCircle2 className="w-[46px] h-[46px] text-emerald-brand" />
                    </div>
                  </div>

                  <h2 className="mt-8 text-[28px] font-black text-cream leading-[1.3]">
                    تم استلام رسالتك بنجاح!
                  </h2>
                  <p className="mt-4 text-cream/55 text-[15px] leading-[2] max-w-md mx-auto">
                    شكراً لتواصلك معنا. سيقوم فريق الدعم بالرد على بريدك الإلكتروني
                    ({email}) في أقرب وقت.
                  </p>

                  <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setName('')
                        setEmail('')
                        setPhone('')
                        setMessage('')
                        setSubject(SUBJECTS[0])
                      }}
                      className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[13.5px]"
                    >
                      <Send className="w-4 h-4" />
                      إرسال رسالة أخرى
                    </button>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border border-white/12 text-cream/75 font-bold text-[13px] hover:border-gold/42 hover:text-gold transition-all"
                    >
                      العودة للرئيسية
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel-strong rounded-[28px] overflow-hidden">
                  <div className="px-8 pt-9 pb-7 border-b border-white/7">
                    <div className="flex items-center gap-3.5">
                      <span className="w-13 h-13 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center">
                        <Send className="w-6 h-6 text-ink" />
                      </span>
                      <div>
                        <h2 className="text-[22px] font-black text-cream">
                          أرسل رسالتك
                        </h2>
                        <p className="mt-1 text-cream/42 text-[11.5px]">
                         املأ النموذج وسيتواصل معك فريقنا خلال 24 ساعة
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="px-8 py-8">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <ContactField
                        label="الاسم الكامل"
                        value={name}
                        onChange={setName}
                        placeholder="مثال: محمد الأمين"
                        error={errors.name}
                        required
                      />
                      <ContactField
                        label="البريد الإلكتروني"
                        value={email}
                        onChange={setEmail}
                        placeholder="example@email.com"
                        error={errors.email}
                        required
                        dir="ltr"
                        type="email"
                      />
                      <ContactField
                        label="رقم الهاتف"
                        value={phone}
                        onChange={setPhone}
                        placeholder="0550123456"
                        error={errors.phone}
                        dir="ltr"
                        type="tel"
                      />

                      <div>
                        <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                          الموضوع <span className="text-gold">*</span>
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="field"
                        >
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                          رسالتك <span className="text-gold">*</span>
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => {
                            setMessage(e.target.value)
                            setErrors((p) => ({ ...p, message: '' }))
                          }}
                          placeholder="اكتب رسالتك هنا بالتفصيل..."
                          rows={6}
                          className={cn(
                            'field resize-none',
                            errors.message && 'border-red-400/48',
                          )}
                        />
                        {errors.message && (
                          <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
                            <AlertCircle className="w-3 h-3" />
                            {errors.message}
                          </p>
                        )}
                        <p className="mt-2 text-cream/32 text-[9.5px]">
                          {message.length} / 1000 حرف
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        'mt-7 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[14.5px] transition-all',
                        loading
                          ? 'bg-gold/42 text-ink/62 cursor-wait'
                          : 'btn-gold',
                      )}
                    >
                      {loading ? (
                        <>
                          <span className="w-4.5 h-4.5 border-2 border-ink/28 border-t-ink rounded-full animate-spin" />
                          جارٍ الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4.5 h-4.5" />
                          إرسال الرسالة
                        </>
                      )}
                    </button>

                    <div className="mt-6 p-4 rounded-2xl bg-emerald-brand/7 border border-emerald-brand/16">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand shrink-0 mt-0.5" />
                        <p className="text-cream/42 text-[10px] leading-relaxed">
                          بياناتك محمية ولن تُستخدم إلا للرد على استفسارك. نحن نحترم
                          خصوصيتك ونلتزم بسياسة حماية البيانات.
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick contact */}
              <div className="glass-panel rounded-[24px] p-7">
                <h3 className="text-cream text-[17px] font-black mb-6">
                  تواصل سريع
                </h3>

                <div className="space-y-4">
                  <a
                    href={`https://wa.me/${SITE.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-brand/9 border border-emerald-brand/20 hover:bg-emerald-brand/16 transition-all group"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-emerald-brand/18 border border-emerald-brand/28 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-emerald-brand" />
                    </span>
                    <div>
                      <p className="text-cream text-[13px] font-bold">واتساب</p>
                      <p className="mt-1 text-cream/42 text-[10.5px]">
                        رد سريع خلال دقائق
                      </p>
                    </div>
                  </a>

                  <a
                    href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gold/8 border border-gold/18 hover:bg-gold/15 transition-all group"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-gold/16 border border-gold/26 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-gold" />
                    </span>
                    <div>
                      <p className="text-cream text-[13px] font-bold">اتصل بنا</p>
                      <p className="mt-1 text-cream/42 text-[10.5px]" dir="ltr">
                        {SITE.phone}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${SITE.email}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/7 transition-all group"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-white/7 border border-white/12 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-cream/62" />
                    </span>
                    <div>
                      <p className="text-cream text-[13px] font-bold">البريد الإلكتروني</p>
                      <p className="mt-1 text-cream/42 text-[10.5px]" dir="ltr">
                        {SITE.email}
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Office info */}
              <div className="glass-panel rounded-[24px] overflow-hidden">
                <div className="relative h-[168px]">
                  <img
                    src="/images/style-1.jpg"
                    alt=""
                    className="w-full h-full object-cover opacity-58"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/32 to-transparent" />
                  <div className="absolute bottom-4 right-5 left-5">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4.5 h-4.5 text-gold" />
                      <h3 className="text-cream text-[15px] font-black">
                        مقر stikini
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gold/72 shrink-0 mt-1" />
                    <div>
                      <p className="text-cream/62 text-[11.5px] leading-relaxed">
                        {SITE.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gold/72 shrink-0 mt-1" />
                    <div>
                      <p className="text-cream/62 text-[11.5px] leading-relaxed">
                        {SITE.hours}
                      </p>
                      <p className="mt-1 text-cream/38 text-[10px]">
                        الجمعة: مغلق
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/8">
                    <div className="flex items-center gap-2.5">
                      <Handshake className="w-4 h-4 text-gold/72" />
                      <p className="text-cream/52 text-[10.5px] leading-relaxed">
                        نخدم جميع أحياء الجزائر العاصمة
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ link */}
              <div className="glass-panel rounded-[24px] p-7">
                <div className="flex items-start gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5 text-gold" />
                  </span>
                  <div>
                    <h3 className="text-cream text-[14px] font-bold">
                      هل لديك سؤال سريع؟
                    </h3>
                    <p className="mt-2 text-cream/42 text-[11px] leading-relaxed">
                      قد تجد إجابتك فوراً في صفحة الأسئلة الشائعة.
                    </p>
                    <Link
                      to="/faq"
                      className="mt-4 inline-flex items-center gap-2 text-gold text-[11.5px] font-bold hover:underline underline-offset-4"
                    >
                      تصفح الأسئلة الشائعة
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function ContactField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  dir,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  required?: boolean
  dir?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
        {label}
        {required && <span className="text-gold mr-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('field', error && 'border-red-400/48')}
        dir={dir}
      />
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}
