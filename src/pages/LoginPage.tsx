import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Star,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { isValidEmail } from '../lib/utils'
import { cn } from '../lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, showToast } = useStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}

    if (!isValidEmail(email)) newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
    if (password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    window.setTimeout(() => {
      const result = login(email, password)
      setLoading(false)

      if (result.ok) {
        showToast('مرحباً بعودتك! تم تسجيل الدخول بنجاح.', 'success')
        navigate('/dashboard')
      } else {
        setErrors({ general: result.error ?? 'حدث خطأ غير متوقع.' })
      }
    }, 750)
  }

  return (
    <section className="relative min-h-screen flex items-center pt-[110px] pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-salon.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.16]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/94 to-forest" />
      </div>
      <div className="absolute top-20 right-1/4 w-[560px] h-[560px] rounded-full bg-gold/10 blur-[140px]" />
      <div className="absolute bottom-0 left-0 w-[460px] h-[460px] rounded-full bg-emerald-brand/7 blur-[130px]" />
      <div className="hero-grid-bg absolute inset-0 opacity-55" />
      <div className="noise-overlay" />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              تسجيل دخول آمن ومشفّر
            </span>

            <h1 className="mt-7 text-[clamp(2.45rem,5vw,3.75rem)] font-black text-cream leading-[1.26]">
              مرحباً بعودتك إلى{' '}
              <span className="text-gradient-gold">stikini</span>
            </h1>

            <p className="mt-6 text-cream/56 text-[17px] leading-[2.1] max-w-[520px]">
              حسابك محفوظ دائماً. سجّل الدخول مرة واحدة وابدأ من حيث توقفت — احجز
              مواعيدك، تابع حجوزاتك، واكتشف أفضل الصالونات في الجزائر العاصمة.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: Zap,
                  title: 'حجز فوري في ثوانٍ',
                  desc: 'احجز موعدك بدون مكالمات هاتفية أو انتظار.',
                },
                {
                  icon: Star,
                  title: 'صالونات موثّقة 100%',
                  desc: 'جميع الصالونات مراجعة من فريق stikini.',
                },
                {
                  icon: ShieldCheck,
                  title: 'بياناتك محمية دائماً',
                  desc: 'جلسات تسجيل دخول دائمة وآمنة.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
                  className="flex items-start gap-4"
                >
                  <span className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </span>
                  <div>
                    <h3 className="text-cream text-[15px] font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-cream/46 text-[12.5px] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[520px] mx-auto lg:mx-0"
          >
            <div className="glass-panel-strong rounded-[30px] overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-9 pb-7 border-b border-white/7">
                <div className="flex items-center gap-3.5">
                  <span className="w-13 h-13 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-ink" />
                  </span>
                  <div>
                    <h2 className="text-[22px] font-black text-cream">تسجيل الدخول</h2>
                    <p className="mt-1 text-cream/42 text-[11.5px]">
                      أدخل بياناتك للوصول إلى حسابك
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 py-8">
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-500/11 border border-red-400/22"
                  >
                    <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-[12px] font-semibold leading-relaxed">
                      {errors.general}
                    </p>
                  </motion.div>
                )}

                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                      البريد الإلكتروني <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/48 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setErrors((prev) => ({ ...prev, email: '', general: '' }))
                        }}
                        placeholder="example@email.com"
                        className={cn('field pr-11', errors.email && 'border-red-400/48')}
                        dir="ltr"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                      كلمة المرور <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/48 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setErrors((prev) => ({ ...prev, password: '', general: '' }))
                        }}
                        placeholder="••••••••"
                        className={cn('field pr-11', errors.password && 'border-red-400/48')}
                        style={{ paddingLeft: '3.5rem' }}
                        dir="ltr"
                        autoComplete="current-password"
                        data-lpignore="true"
                        data-1p-ignore
                        data-bwignore
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-cream/42 hover:text-gold transition-colors"
                        aria-label="إظهار كلمة المرور"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
                        <AlertCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember + forgot */}
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => setRemember((v) => !v)}
                        className={cn(
                          'w-[19px] h-[19px] rounded-[6px] border-2 flex items-center justify-center transition-all',
                          remember
                            ? 'bg-gold border-gold'
                            : 'border-white/16 hover:border-gold/42',
                        )}
                        aria-label="تذكرني"
                      >
                        {remember && <CheckCircle2 className="w-3 h-3 text-ink" />}
                      </button>
                      <span className="text-cream/56 text-[11.5px] font-semibold">
                        تذكّرني دائماً
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.',
                          'info',
                        )
                      }
                      className="text-gold/82 text-[11.5px] font-bold hover:text-gold transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[14.5px] transition-all',
                      loading
                        ? 'bg-gold/42 text-ink/62 cursor-wait'
                        : 'btn-gold',
                    )}
                  >
                    {loading ? (
                      <>
                        <span className="w-4.5 h-4.5 border-2 border-ink/28 border-t-ink rounded-full animate-spin" />
                        جارٍ تسجيل الدخول...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4.5 h-4.5" />
                        تسجيل الدخول
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-cream/32 text-[10.5px] font-semibold">أو</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Register link */}
                <div className="mt-7 text-center">
                  <p className="text-cream/48 text-[12px]">
                    ليس لديك حساب؟{' '}
                    <Link
                      to="/register"
                      className="text-gold font-bold hover:underline underline-offset-4"
                    >
                      أنشئ حساباً جديداً مجاناً
                    </Link>
                  </p>
                </div>

                {/* Demo hint */}
                <div className="mt-6 p-4 rounded-2xl bg-gold/6 border border-gold/14">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-3.5 h-3.5 text-gold/72 shrink-0 mt-0.5" />
                    <p className="text-cream/42 text-[10px] leading-relaxed">
                      للتجربة السريعة: أنشئ حساباً جديداً أو استخدم أي بريد إلكتروني
                      مسجّل مسبقاً. جميع البيانات تُحفظ بشكل دائم وآمن على جهازك.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Bottom links */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-cream/42 text-[11.5px] font-semibold hover:text-gold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                العودة للرئيسية
              </Link>
              <Link
                to="/privacy"
                className="text-cream/42 text-[11.5px] font-semibold hover:text-gold transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link
                to="/terms"
                className="text-cream/42 text-[11.5px] font-semibold hover:text-gold transition-colors"
              >
                الشروط والأحكام
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}