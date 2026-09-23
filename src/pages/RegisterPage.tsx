import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Store,
  Scissors,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { isValidEmail, isValidPhone, isValidName, cn } from '../lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, showToast } = useStore()
  const [searchParams] = useSearchParams()

  // إذا وصل الزبون من زر "احجز الآن" فإن الرابط يحمل type=client — عندها نفرض حساب
  // الزبون مباشرة بدون عرض أي اختيار، ونعيده بعد التسجيل إلى الصفحة التي كان يقصدها
  const lockedToClient = searchParams.get('type') === 'client'
  const redirectTo = searchParams.get('redirect')

  const [accountType, setAccountType] = useState<'client' | 'owner'>('client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!isValidName(name)) newErrors.name = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)'
    if (!isValidEmail(email)) newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
    if (!isValidPhone(phone)) newErrors.phone = 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456)'
    if (password.length < 8) newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين'
    if (!acceptTerms) newErrors.terms = 'يجب الموافقة على الشروط والأحكام'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    window.setTimeout(() => {
      const result = register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        type: accountType,
      })
      setLoading(false)

      if (result.ok) {
        showToast('تم إنشاء حسابك بنجاح! مرحباً بك في stikini.', 'success')
        navigate(redirectTo || (accountType === 'owner' ? '/dashboard' : '/salons'))
      } else {
        setErrors({ general: result.error ?? 'حدث خطأ غير متوقع.' })
      }
    }, 850)
  }

  return (
    <section className="relative min-h-screen flex items-center pt-[110px] pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/salon-2.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.13]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/95 to-forest" />
      </div>
      <div className="absolute top-16 left-1/4 w-[580px] h-[580px] rounded-full bg-gold/10 blur-[145px]" />
      <div className="absolute bottom-0 right-0 w-[460px] h-[460px] rounded-full bg-emerald-brand/7 blur-[130px]" />
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
              تسجيل مجاني بالكامل
            </span>

            <h1 className="mt-7 text-[clamp(2.45rem,5vw,3.75rem)] font-black text-cream leading-[1.26]">
              انضم إلى منصة{' '}
              <span className="text-gradient-gold">stikini</span>
            </h1>

            <p className="mt-6 text-cream/56 text-[17px] leading-[2.1] max-w-[520px]">
              أنشئ حسابك مجاناً وابدأ رحلتك مع أفضل الصالونات في الجزائر العاصمة.
              بياناتك محفوظة بشكل دائم وآمن على المنصة.
            </p>

            {/* Account type preview */}
            {lockedToClient ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 p-6 rounded-[22px] border bg-gold/11 border-gold/36"
              >
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gold text-ink">
                  <User className="w-5 h-5" />
                </span>
                <h3 className="mt-4 text-cream text-[15px] font-bold">حساب زبون</h3>
                <p className="mt-2 text-cream/46 text-[11.5px] leading-relaxed">
                  احجز مواعيدك، تصفح الصالونات، وتابع حجوزاتك وتقييماتك.
                </p>
              </motion.div>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  {
                    key: 'client' as const,
                    icon: User,
                    title: 'حساب زبون',
                    desc: 'احجز مواعيدك، تصفح الصالونات، وتابع حجوزاتك وتقييماتك.',
                  },
                  {
                    key: 'owner' as const,
                    icon: Store,
                    title: 'حساب صاحب صالون',
                    desc: 'أضف صالونك وأدره بالكامل عبر لوحة تحكم CRM متكاملة.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
                    className={`p-6 rounded-[22px] border transition-all cursor-pointer ${
                      accountType === item.key
                        ? 'bg-gold/11 border-gold/36'
                        : 'bg-white/3.5 border-white/8 hover:border-gold/22'
                    }`}
                    onClick={() => setAccountType(item.key)}
                  >
                    <span
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        accountType === item.key
                          ? 'bg-gold text-ink'
                          : 'bg-gold/12 border border-gold/22 text-gold'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </span>
                    <h3 className="mt-4 text-cream text-[15px] font-bold">{item.title}</h3>
                    <p className="mt-2 text-cream/46 text-[11.5px] leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Trust indicators */}
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
              {['بدون رسوم اشتراك', 'إلغاء في أي وقت', 'دعم فني متكامل'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-brand" />
                  <span className="text-cream/48 text-[11.5px] font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[540px] mx-auto lg:mx-0"
          >
            <div className="glass-panel-strong rounded-[30px] overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-9 pb-7 border-b border-white/7">
                <div className="flex items-center gap-3.5">
                  <span className="w-13 h-13 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-ink" />
                  </span>
                  <div>
                    <h2 className="text-[22px] font-black text-cream">إنشاء حساب جديد</h2>
                    <p className="mt-1 text-cream/42 text-[11.5px]">
                      مجاناً بالكامل — بدون بطاقة بنكية
                    </p>
                  </div>
                </div>

                {/* Account type toggle */}
                {!lockedToClient && (
                  <div className="mt-6 grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-white/4 border border-white/7">
                    {[
                      { key: 'client' as const, label: 'زبون', icon: User },
                      { key: 'owner' as const, label: 'صاحب صالون', icon: Store },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setAccountType(option.key)}
                        className={cn(
                          'flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold transition-all',
                          accountType === option.key
                            ? 'bg-gold text-ink'
                            : 'text-cream/52 hover:text-gold',
                        )}
                      >
                        <option.icon className="w-3.5 h-3.5" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
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
                  {/* Name */}
                  <div>
                    <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                      الاسم الكامل <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/48 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setErrors((p) => ({ ...p, name: '' }))
                        }}
                        placeholder="مثال: محمد الأمين"
                        className={cn('field pr-11', errors.name && 'border-red-400/48')}
                      />
                    </div>
                    {errors.name && (
                      <FieldError message={errors.name} />
                    )}
                  </div>

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
                          setErrors((p) => ({ ...p, email: '' }))
                        }}
                        placeholder="example@email.com"
                        className={cn('field pr-11', errors.email && 'border-red-400/48')}
                        dir="ltr"
                      />
                    </div>
                    {errors.email && <FieldError message={errors.email} />}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                      رقم الهاتف <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/48 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value)
                          setErrors((p) => ({ ...p, phone: '' }))
                        }}
                        placeholder="0550123456"
                        className={cn('field pr-11', errors.phone && 'border-red-400/48')}
                        dir="ltr"
                      />
                    </div>
                    {errors.phone && <FieldError message={errors.phone} />}
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
                          setErrors((p) => ({ ...p, password: '' }))
                        }}
                        placeholder="8 أحرف على الأقل"
                        className={cn('field pr-11', errors.password && 'border-red-400/48')}
                        style={{ paddingLeft: '3.5rem' }}
                        dir="ltr"
                        autoComplete="new-password"
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
                    {errors.password && <FieldError message={errors.password} />}

                    {/* Password strength */}
                    {password.length > 0 && (
                      <div className="mt-2.5">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((level) => {
                            const strength =
                              password.length >= 12
                                ? 4
                                : password.length >= 10
                                  ? 3
                                  : password.length >= 8
                                    ? 2
                                    : 1
                            return (
                              <div
                                key={level}
                                className={cn(
                                  'h-1.5 flex-1 rounded-full transition-colors',
                                  level <= strength
                                    ? strength >= 3
                                      ? 'bg-emerald-brand'
                                      : strength >= 2
                                        ? 'bg-gold'
                                        : 'bg-red-400'
                                    : 'bg-white/9',
                                )}
                              />
                            )
                          })}
                        </div>
                        <p className="mt-1.5 text-cream/38 text-[9.5px]">
                          قوة كلمة المرور:{' '}
                          {password.length >= 10
                            ? 'قوية'
                            : password.length >= 8
                              ? 'متوسطة'
                              : 'ضعيفة'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                      تأكيد كلمة المرور <span className="text-gold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/48 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setErrors((p) => ({ ...p, confirmPassword: '' }))
                        }}
                        placeholder="••••••••"
                        className={cn(
                          'field pr-11',
                          errors.confirmPassword && 'border-red-400/48',
                        )}
                        dir="ltr"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore
                        data-bwignore
                      />
                    </div>
                    {errors.confirmPassword && (
                      <FieldError message={errors.confirmPassword} />
                    )}
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setAcceptTerms((v) => !v)
                          setErrors((p) => ({ ...p, terms: '' }))
                        }}
                        className={cn(
                          'w-[19px] h-[19px] rounded-[6px] border-2 flex items-center justify-center transition-all shrink-0 mt-0.5',
                          acceptTerms
                            ? 'bg-gold border-gold'
                            : errors.terms
                              ? 'border-red-400/62'
                              : 'border-white/16 hover:border-gold/42',
                        )}
                        aria-label="الموافقة على الشروط"
                      >
                        {acceptTerms && <CheckCircle2 className="w-3 h-3 text-ink" />}
                      </button>
                      <span className="text-cream/52 text-[11px] leading-relaxed">
                        أوافق على{' '}
                        <Link
                          to="/terms"
                          className="text-gold/82 font-semibold hover:underline underline-offset-2"
                        >
                          الشروط والأحكام
                        </Link>{' '}
                        و
                        <Link
                          to="/privacy"
                          className="text-gold/82 font-semibold hover:underline underline-offset-2"
                        >
                          {' '}
                          سياسة الخصوصية
                        </Link>{' '}
                        الخاصة بمنصة stikini
                      </span>
                    </label>
                    {errors.terms && <FieldError message={errors.terms} />}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[14.5px] transition-all',
                      loading ? 'bg-gold/42 text-ink/62 cursor-wait' : 'btn-gold',
                    )}
                  >
                    {loading ? (
                      <>
                        <span className="w-4.5 h-4.5 border-2 border-ink/28 border-t-ink rounded-full animate-spin" />
                        جارٍ إنشاء الحساب...
                      </>
                    ) : (
                      <>
                        {accountType === 'owner' ? (
                          <Store className="w-4.5 h-4.5" />
                        ) : (
                          <Scissors className="w-4.5 h-4.5" />
                        )}
                        {accountType === 'owner'
                          ? 'إنشاء حساب صاحب صالون'
                          : 'إنشاء حساب الزبون مجاناً'}
                      </>
                    )}
                  </button>
                </div>

                {/* Login link */}
                <div className="mt-8 pt-6 border-t border-white/7 text-center">
                  <p className="text-cream/48 text-[12px]">
                    لديك حساب بالفعل؟{' '}
                    <Link
                      to="/login"
                      className="text-gold font-bold hover:underline underline-offset-4"
                    >
                      سجّل الدخول الآن
                    </Link>
                  </p>
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

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  )
}