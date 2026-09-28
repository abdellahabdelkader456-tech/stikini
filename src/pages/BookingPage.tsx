import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Scissors,
  User,
  Wallet,
  MessageCircle,
  AlertCircle,
  PartyPopper,
  Copy,
  Home,
  CalendarCheck,
  Tag,
} from 'lucide-react'
import { SALONS, SITE, PROMO_CODES, calcPromoDiscount } from '../lib/data'
import { useStore } from '../lib/store'
import {
  cn,
  formatPrice,
  formatDateAr,
  getUpcomingDays,
  getDayName,
  getShortDate,
  TIME_SLOTS,
  isValidName,
  isValidPhone,
  isValidEmail,
} from '../lib/utils'
import type { Booking } from '../lib/types'

const STEPS = [
  { key: 'services', label: 'الخدمات', icon: Scissors },
  { key: 'datetime', label: 'الموعد', icon: Calendar },
  { key: 'details', label: 'بياناتك', icon: User },
  { key: 'confirm', label: 'التأكيد', icon: CheckCircle2 },
]

export default function BookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const salon = SALONS.find((s) => s.slug === slug)
  const { createBooking, user, showToast, allBookings } = useStore()

  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedBarber, setSelectedBarber] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [notes, setNotes] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState('')
  const [promoError, setPromoError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  const days = useMemo(() => getUpcomingDays(14), [])

  // الأوقات المحجوزة فعلياً لنفس الحلاق ونفس اليوم في هذا الصالون (لأي زبون، وليس المستخدم الحالي فقط)
  const bookedTimesForSelection = useMemo(() => {
    if (!salon || !selectedBarber || !date) return new Set<string>()
    return new Set(
      allBookings
        .filter(
          (b) =>
            b.salonId === salon.id &&
            b.barberName === selectedBarber &&
            b.date === date &&
            b.status === 'مؤكد',
        )
        .map((b) => b.time),
    )
  }, [allBookings, salon, selectedBarber, date])

  useEffect(() => {
    if (time && bookedTimesForSelection.has(time)) {
      setTime('')
      setErrors((e) => ({ ...e, time: 'تم حجز هذا التوقيت للتو، يرجى اختيار توقيت آخر' }))
    }
  }, [time, bookedTimesForSelection])

  const chosenServices = useMemo(
    () => salon?.services.filter((s) => selectedServices.includes(s.id)) ?? [],
    [salon, selectedServices],
  )

  const subtotalPrice = chosenServices.reduce((sum, s) => sum + s.price, 0)
  const discountAmount = calcPromoDiscount(appliedPromo, subtotalPrice)
  const totalPrice = subtotalPrice - discountAmount
  const totalDuration = chosenServices.reduce((sum, s) => sum + s.duration, 0)

  if (!salon) {
    return <Navigate to="/salons" replace />
  }

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) {
      setPromoError('يرجى إدخال كود الخصم')
      return
    }
    if (!PROMO_CODES[code]) {
      setAppliedPromo('')
      setPromoError('كود الخصم غير صحيح')
      return
    }
    setAppliedPromo(code)
    setPromoInput(code)
    setPromoError('')
    showToast(`تم تطبيق كود الخصم ${code} (${PROMO_CODES[code].label})`, 'success')
  }

  const removePromo = () => {
    setAppliedPromo('')
    setPromoInput('')
    setPromoError('')
  }

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
    setErrors((e) => ({ ...e, services: '' }))
  }

  const validateStep = (current: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (current === 0) {
      if (selectedServices.length === 0)
        newErrors.services = 'يرجى اختيار خدمة واحدة على الأقل'
      if (!selectedBarber) newErrors.barber = 'يرجى اختيار الحلاق أو المختص'
    }

    if (current === 1) {
      if (!date) newErrors.date = 'يرجى اختيار التاريخ'
      if (!time) newErrors.time = 'يرجى اختيار التوقيت'
    }

    if (current === 2) {
      if (!isValidName(name)) newErrors.name = 'يرجى إدخال اسمك الكامل (3 أحرف على الأقل)'
      if (!isValidPhone(phone)) newErrors.phone = 'يرجى إدخال رقم هاتف صحيح (مثال: 0550123456)'
      if (email.trim() && !isValidEmail(email))
        newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    if (step < 3) setStep(step + 1)
  }

  const goBack = () => {
    if (step > 0) setStep(step - 1)
    else navigate(`/salon/${salon.slug}`)
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setStep(2)
      return
    }

    setSubmitting(true)

    const result = await createBooking({
      salonId: salon.id,
      salonName: salon.name,
      services: chosenServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
      })),
      barberName: selectedBarber,
      date,
      time,
      clientName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      promoCode: appliedPromo || undefined,
    })

    setSubmitting(false)

    if (!result.ok) {
      setTime('')
      setErrors((e) => ({ ...e, time: result.error }))
      setStep(1)
      showToast(result.error, 'error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setConfirmedBooking(result.booking)
    setStep(3)
    showToast('تم تأكيد حجزك بنجاح!', 'success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ---------- CONFIRMATION SCREEN ---------- */
  if (step === 3 && confirmedBooking) {
    return (
      <section className="relative pt-[150px] pb-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[560px] h-[560px] rounded-full bg-gold/11 blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[460px] h-[460px] rounded-full bg-emerald-brand/8 blur-[130px]" />
        <div className="hero-grid-bg absolute inset-0 opacity-50" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="relative w-[104px] h-[104px] mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-brand/18 animate-ping" />
              <div className="relative w-[104px] h-[104px] rounded-full bg-gradient-to-br from-emerald-brand/26 to-emerald-brand/8 border-2 border-emerald-brand/38 flex items-center justify-center">
                <CheckCircle2 className="w-[52px] h-[52px] text-emerald-brand" />
              </div>
            </div>

            <h1 className="mt-8 text-[clamp(2.15rem,5vw,3.15rem)] font-black text-cream leading-[1.28]">
              تم تأكيد حجزك <span className="text-gradient-gold">بنجاح!</span>
            </h1>

            <p className="mt-5 text-cream/58 text-[17px] leading-[2]">
              موعدك محجوز ومؤكد 100%. أظهر رمز الحجز عند وصولك إلى الصالون.
            </p>

            {/* Booking ticket */}
            <div className="mt-11 glass-panel-strong rounded-[28px] overflow-hidden text-right">
              <div className="bg-gradient-to-l from-gold/16 to-gold/4 px-8 py-7 border-b border-gold/18">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-cream/48 text-[11px] font-semibold mb-2">
                      رقم تذكرة الحجز
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[32px] font-black text-gradient-gold tracking-[0.14em]" dir="ltr">
                        {confirmedBooking.code}
                      </span>
                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard
                              .writeText(confirmedBooking.code)
                              .then(() => showToast('تم نسخ رمز الحجز', 'success'))
                              .catch(() => undefined)
                          }
                        }}
                        className="w-9 h-9 rounded-xl bg-gold/14 border border-gold/26 flex items-center justify-center text-gold hover:bg-gold/24 transition-colors"
                        aria-label="نسخ الرمز"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-brand/14 border border-emerald-brand/28">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-brand" />
                    <span className="text-emerald-brand text-[12.5px] font-bold">
                      حجز مؤكد 100%
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-8 space-y-5">
                <DetailRow icon={MapPin} label="الصالون" value={confirmedBooking.salonName} />
                <DetailRow
                  icon={Calendar}
                  label="التاريخ"
                  value={formatDateAr(confirmedBooking.date)}
                />
                <DetailRow icon={Clock} label="التوقيت" value={confirmedBooking.time} />
                <DetailRow
                  icon={User}
                  label="الحلاق / المختص"
                  value={confirmedBooking.barberName}
                />

                <div className="pt-5 border-t border-white/8">
                  <p className="text-cream/48 text-[11px] font-semibold mb-3.5">
                    الخدمات المطلوبة
                  </p>
                  <div className="space-y-2.5">
                    {confirmedBooking.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-4 py-2.5 px-4 rounded-xl bg-white/3.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-brand shrink-0" />
                          <span className="text-cream/72 text-[13px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-cream/38 text-[10.5px]">
                            {s.duration} د
                          </span>
                          <span className="text-gold text-[12.5px] font-bold">
                            {formatPrice(s.price)} دج
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {confirmedBooking.discount > 0 && (
                  <div className="mb-5 flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl bg-emerald-brand/8 border border-emerald-brand/18">
                    <span className="flex items-center gap-2 text-emerald-brand text-[12px] font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      كود الخصم {confirmedBooking.promoCode}
                    </span>
                    <span className="text-emerald-brand text-[12.5px] font-black" dir="ltr">
                      -{formatPrice(confirmedBooking.discount)} دج
                    </span>
                  </div>
                )}

                <div className="pt-5 border-t border-gold/16 flex items-center justify-between">
                  <div>
                    <p className="text-cream/48 text-[11px] font-semibold">
                      المبلغ المطلوب بالصالون
                    </p>
                    <p className="text-cream/38 text-[10px] mt-1">
                      الدفع نقداً أو عبر BaridiMob عند الوصول
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-black text-gradient-gold leading-none">
                      {formatPrice(confirmedBooking.totalPrice)}
                    </span>
                    <span className="text-cream/48 text-[13px] font-semibold">دج</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  `سلام عليكم، أنا ${confirmedBooking.clientName} حجزت عبر stikini كود ${confirmedBooking.code} موعد يوم ${formatDateAr(confirmedBooking.date)} الساعة ${confirmedBooking.time} في ${confirmedBooking.salonName}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-emerald-brand/16 border border-emerald-brand/32 text-emerald-brand font-bold text-[14px] hover:bg-emerald-brand/26 transition-all"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                تأكيد عبر واتساب
              </a>

              <Link
                to={user ? '/dashboard' : '/login'}
                className="btn-gold inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-[14px]"
              >
                <CalendarCheck className="w-4.5 h-4.5" />
                {user ? 'لوحة التحكم' : 'سجّل لمتابعة حجوزاتك'}
              </Link>

              <Link
                to="/salons"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl border border-white/12 text-cream/72 font-bold text-[14px] hover:border-gold/42 hover:text-gold transition-all"
              >
                <Home className="w-4.5 h-4.5" />
                تصفح صالونات أخرى
              </Link>
            </div>

            {/* Party visual */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-11 glass-panel rounded-[24px] p-7"
            >
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-2xl bg-gold/14 border border-gold/26 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-5.5 h-5.5 text-gold" />
                </span>
                <div className="text-right">
                  <h3 className="text-cream text-[15.5px] font-bold">
                    نصائح قبل موعدك
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {[
                      'أحضر قبل الموعد بـ 5 دقائق لتجربة مريحة.',
                      'أظهر رمز الحجز عند الوصول إلى الصالون.',
                      'يمكنك الإلغاء أو التعديل قبل الموعد بوقت كافٍ.',
                    ].map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-2.5 text-cream/52 text-[12.5px] leading-relaxed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand mt-1 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  /* ---------- BOOKING WIZARD ---------- */
  return (
    <>
      <section className="relative pt-[150px] pb-24">
        <div className="absolute top-0 right-1/4 w-[480px] h-[480px] rounded-full bg-gold/8 blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
          {/* Header */}
          <nav className="flex items-center gap-2.5 text-[12.5px] text-cream/42 mb-7">
            <Link to="/" className="hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold/50">/</span>
            <Link to="/salons" className="hover:text-gold transition-colors">
              الصالونات
            </Link>
            <span className="text-gold/50">/</span>
            <Link to={`/salon/${salon.slug}`} className="hover:text-gold transition-colors">
              {salon.name}
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">الحجز</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-9">
            {/* Main wizard */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[clamp(1.85rem,4vw,2.65rem)] font-black text-cream leading-[1.3]">
                احجز موعدك في{' '}
                <span className="text-gradient-gold">{salon.name}</span>
              </h1>
              <p className="mt-3.5 text-cream/52 text-[15px] leading-[1.95]">
                اختر الخدمات والموعد المناسب — التأكيد فوري وبدون أي دفع مسبق.
              </p>

              {/* Stepper */}
              <div className="mt-9 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={s.key} className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <button
                        onClick={() => i < step && setStep(i)}
                        className={cn(
                          'flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl border text-[12px] sm:text-[12.5px] font-bold transition-all whitespace-nowrap',
                          i === step
                            ? 'bg-gold text-ink border-gold'
                            : i < step
                              ? 'bg-emerald-brand/12 text-emerald-brand border-emerald-brand/28 cursor-pointer'
                              : 'bg-white/3.5 text-cream/38 border-white/8',
                        )}
                      >
                        {i < step ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{i + 1}</span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            'w-6 sm:w-9 h-0.5 rounded-full',
                            i < step ? 'bg-emerald-brand/42' : 'bg-white/9',
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  {/* STEP 0 — Services */}
                  {step === 0 && (
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-5">
                          <h2 className="text-[19px] font-black text-cream">
                            اختر الخدمات المطلوبة
                          </h2>
                          <span className="text-cream/42 text-[11.5px]">
                            يمكنك اختيار أكثر من خدمة
                          </span>
                        </div>

                        {errors.services && (
                          <ErrorBanner message={errors.services} />
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                          {salon.services.map((service) => {
                            const isSelected = selectedServices.includes(service.id)
                            return (
                              <button
                                key={service.id}
                                onClick={() => toggleService(service.id)}
                                className={cn(
                                  'text-right p-5 rounded-[20px] border transition-all duration-300',
                                  isSelected
                                    ? 'bg-gold/11 border-gold/42 shadow-gold-soft'
                                    : 'bg-white/3 border-white/8 hover:border-gold/25 hover:bg-white/5',
                                )}
                              >
                                <div className="flex items-start justify-between gap-3.5">
                                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                    <span
                                      className={cn(
                                        'w-[22px] h-[22px] rounded-[7px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                                        isSelected
                                          ? 'bg-gold border-gold'
                                          : 'border-white/16',
                                      )}
                                    >
                                      {isSelected && (
                                        <CheckCircle2 className="w-3 h-3 text-ink" />
                                      )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-cream text-[14px] font-bold">
                                          {service.name}
                                        </h3>
                                        {service.popular && (
                                          <span className="px-2 py-0.5 rounded-md bg-gold/14 border border-gold/22 text-gold text-[9px] font-black">
                                            مميزة
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1.5 text-cream/42 text-[11px]">
                                        {service.category} • {service.duration} دقيقة
                                      </p>
                                      <p className="mt-2 text-cream/48 text-[11.5px] leading-relaxed line-clamp-2">
                                        {service.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0">
                                    <div className="flex items-baseline gap-1">
                                      <span
                                        className={cn(
                                          'font-black text-[17px]',
                                          isSelected ? 'text-gold' : 'text-cream/78',
                                        )}
                                      >
                                        {formatPrice(service.price)}
                                      </span>
                                      <span className="text-cream/38 text-[10px] font-semibold">
                                        دج
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Barber selection */}
                      <div>
                        <h2 className="text-[19px] font-black text-cream mb-5">
                          اختر الحلاق / المختص
                        </h2>

                        {errors.barber && <ErrorBanner message={errors.barber} />}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <button
                            onClick={() => {
                              setSelectedBarber('أول حلاق متاح')
                              setErrors((e) => ({ ...e, barber: '' }))
                            }}
                            className={cn(
                              'p-5 rounded-[20px] border transition-all text-right',
                              selectedBarber === 'أول حلاق متاح'
                                ? 'bg-gold/11 border-gold/42'
                                : 'bg-white/3 border-white/8 hover:border-gold/25',
                            )}
                          >
                            <div className="flex items-center gap-3.5">
                              <span className="w-12 h-12 rounded-2xl bg-gold/14 border border-gold/26 flex items-center justify-center">
                                <User className="w-5 h-5 text-gold" />
                              </span>
                              <div>
                                <h3 className="text-cream text-[13.5px] font-bold">
                                  أول حلاق متاح
                                </h3>
                                <p className="text-cream/42 text-[10.5px] mt-1">
                                  أسرع موعد متاح
                                </p>
                              </div>
                            </div>
                          </button>

                          {salon.barbers.map((barber) => (
                            <button
                              key={barber.id}
                              onClick={() => {
                                setSelectedBarber(barber.name)
                                setErrors((e) => ({ ...e, barber: '' }))
                              }}
                              className={cn(
                                'p-5 rounded-[20px] border transition-all text-right',
                                selectedBarber === barber.name
                                  ? 'bg-gold/11 border-gold/42'
                                  : 'bg-white/3 border-white/8 hover:border-gold/25',
                              )}
                            >
                              <div className="flex items-center gap-3.5">
                                <img
                                  src={barber.image}
                                  alt={barber.name}
                                  className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                                />
                                <div>
                                  <h3 className="text-cream text-[13px] font-bold">
                                    {barber.name}
                                  </h3>
                                  <p className="text-gold/72 text-[10px] mt-1">
                                    {barber.role}
                                  </p>
                                  <p className="text-cream/38 text-[9.5px] mt-0.5">
                                    ⭐ {barber.rating.toFixed(1)} • {barber.experience}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 1 — Date & Time */}
                  {step === 1 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-[19px] font-black text-cream mb-1.5">
                          اختر التاريخ
                        </h2>
                        <p className="text-cream/42 text-[12px] mb-5">
                          المواعيد متاحة لمدة 14 يوماً قادماً
                        </p>

                        {errors.date && <ErrorBanner message={errors.date} />}

                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                          {days.map((d) => (
                            <button
                              key={d}
                              onClick={() => {
                                setDate(d)
                                setErrors((e) => ({ ...e, date: '' }))
                              }}
                              className={cn(
                                'shrink-0 w-[86px] py-3.5 rounded-2xl border text-center transition-all',
                                date === d
                                  ? 'bg-gold text-ink border-gold'
                                  : 'bg-white/3.5 border-white/9 text-cream/62 hover:border-gold/32',
                              )}
                            >
                              <p
                                className={cn(
                                  'text-[10.5px] font-semibold',
                                  date === d ? 'text-ink/72' : 'text-cream/42',
                                )}
                              >
                                {getDayName(d)}
                              </p>
                              <p className="mt-1.5 text-[15px] font-black">
                                {new Date(d).getDate()}
                              </p>
                              <p
                                className={cn(
                                  'text-[9.5px] mt-0.5',
                                  date === d ? 'text-ink/68' : 'text-cream/38',
                                )}
                              >
                                {getShortDate(d).split(' ')[1]}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-[19px] font-black text-cream mb-1.5">
                          اختر التوقيت
                        </h2>
                        <p className="text-cream/42 text-[12px] mb-5">
                          جميع الأوقات بالتوقيت المحلي للجزائر
                        </p>

                        {errors.time && <ErrorBanner message={errors.time} />}

                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                          {TIME_SLOTS.map((slot) => {
                            const isBooked = bookedTimesForSelection.has(slot)
                            return (
                              <button
                                key={slot}
                                disabled={isBooked}
                                onClick={() => {
                                  setTime(slot)
                                  setErrors((e) => ({ ...e, time: '' }))
                                }}
                                className={cn(
                                  'py-3.5 rounded-2xl border text-[13px] font-bold transition-all',
                                  isBooked
                                    ? 'bg-white/2 border-white/6 text-cream/22 cursor-not-allowed line-through'
                                    : time === slot
                                      ? 'bg-gold text-ink border-gold'
                                      : 'bg-white/3.5 border-white/9 text-cream/68 hover:border-gold/32 hover:text-gold',
                                )}
                                dir="ltr"
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Details */}
                  {step === 2 && (
                    <div>
                      <h2 className="text-[19px] font-black text-cream mb-1.5">
                        بياناتك الشخصية
                      </h2>
                      <p className="text-cream/42 text-[12px] mb-7">
                        سنستخدم هذه البيانات لإرسال تأكيد الحجز والتذكيرات
                      </p>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <Field
                          label="الاسم الكامل"
                          icon={User}
                          value={name}
                          onChange={setName}
                          placeholder="مثال: محمد الأمين"
                          error={errors.name}
                          required
                        />
                        <Field
                          label="رقم الهاتف (WhatsApp)"
                          icon={MessageCircle}
                          value={phone}
                          onChange={setPhone}
                          placeholder="0550123456"
                          error={errors.phone}
                          required
                          dir="ltr"
                        />
                        <div className="sm:col-span-2">
                          <Field
                            label="البريد الإلكتروني"
                            icon={MessageCircle}
                            value={email}
                            onChange={setEmail}
                            placeholder="example@email.com"
                            error={errors.email}
                            dir="ltr"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                            ملاحظات أو ستايل مفضل (اختياري)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="أخبر الحلاق عن أي تفاصيل تهمك..."
                            rows={4}
                            className="field resize-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
                            كود الخصم (اختياري)
                          </label>
                          <div className="flex items-stretch gap-3">
                            <div className="relative flex-1">
                              <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/52 pointer-events-none" />
                              <input
                                type="text"
                                value={promoInput}
                                onChange={(e) => {
                                  setPromoInput(e.target.value)
                                  setPromoError('')
                                }}
                                placeholder="مثال: MAISON10"
                                className={cn('field pr-11', promoError && 'border-red-400/52')}
                                dir="ltr"
                                disabled={!!appliedPromo}
                              />
                            </div>
                            {appliedPromo ? (
                              <button
                                type="button"
                                onClick={removePromo}
                                className="px-6 rounded-2xl border border-red-400/24 text-red-300/88 text-[12px] font-bold hover:bg-red-500/12 transition-all"
                              >
                                إزالة
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={applyPromo}
                                className="px-6 rounded-2xl bg-gold/12 border border-gold/24 text-gold text-[12px] font-bold hover:bg-gold hover:text-ink transition-all"
                              >
                                تطبيق
                              </button>
                            )}
                          </div>
                          {promoError && (
                            <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
                              <AlertCircle className="w-3 h-3" />
                              {promoError}
                            </p>
                          )}
                          {appliedPromo && (
                            <p className="mt-2 flex items-center gap-1.5 text-emerald-brand text-[10.5px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              تم تطبيق الكود {appliedPromo} — {PROMO_CODES[appliedPromo].label}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Privacy note */}
                      <div className="mt-7 p-5 rounded-2xl bg-emerald-brand/7 border border-emerald-brand/18">
                        <div className="flex items-start gap-3.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-brand shrink-0 mt-0.5" />
                          <div>
                            <p className="text-emerald-brand text-[12.5px] font-bold">
                              حجزك محمي وآمن عبر منصة stikini
                            </p>
                            <p className="mt-2 text-cream/48 text-[11.5px] leading-relaxed">
                              نجمع فقط البيانات اللازمة لإنشاء الحجز وإدارته. لا نشارك
                              بياناتك مع أي طرف ثالث لأغراض إعلانية.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="mt-9 flex items-center justify-between gap-4">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-white/11 text-cream/68 font-bold text-[13.5px] hover:border-gold/36 hover:text-gold transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  {step === 0 ? 'رجوع للصالون' : 'الخطوة السابقة'}
                </button>

                {step < 2 ? (
                  <button
                    onClick={goNext}
                    className="btn-gold inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-[14px]"
                  >
                    الخطوة التالية
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      'inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-[14px] font-bold transition-all',
                      submitting
                        ? 'bg-gold/42 text-ink/62 cursor-wait'
                        : 'btn-gold',
                    )}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4.5 h-4.5 border-2 border-ink/32 border-t-ink rounded-full animate-spin" />
                        جارٍ التأكيد...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        تأكيد الحجز الفوري
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar summary */}
            <aside className="lg:w-[352px] shrink-0">
              <div className="lg:sticky lg:top-[112px]">
                <div className="glass-panel-strong rounded-[24px] overflow-hidden">
                  <div className="relative h-[132px]">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/42 to-transparent" />
                    <div className="absolute bottom-4 right-5 left-5">
                      <h3 className="text-cream text-[15px] font-black">{salon.name}</h3>
                      <p className="mt-1 text-cream/52 text-[10.5px] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gold/72" />
                        {salon.neighborhood}، الجزائر العاصمة
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-cream text-[13px] font-bold mb-4.5">
                      ملخص الحجز
                    </h4>

                    <div className="space-y-3">
                      <SummaryRow
                        icon={Scissors}
                        label="الخدمات"
                        value={
                          chosenServices.length
                            ? `${chosenServices.length} خدمة مختارة`
                            : 'لم يتم الاختيار بعد'
                        }
                        highlight={chosenServices.length > 0}
                      />
                      <SummaryRow
                        icon={User}
                        label="الحلاق"
                        value={selectedBarber || 'لم يتم الاختيار'}
                        highlight={!!selectedBarber}
                      />
                      <SummaryRow
                        icon={Calendar}
                        label="التاريخ"
                        value={date ? formatDateAr(date) : 'لم يتم الاختيار'}
                        highlight={!!date}
                      />
                      <SummaryRow
                        icon={Clock}
                        label="التوقيت"
                        value={time || 'لم يتم الاختيار'}
                        highlight={!!time}
                      />
                      {totalDuration > 0 && (
                        <SummaryRow
                          icon={Clock}
                          label="المدة التقديرية"
                          value={`${totalDuration} دقيقة`}
                          highlight
                        />
                      )}
                    </div>

                    {/* Selected services list */}
                    {chosenServices.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-white/8">
                        <p className="text-cream/42 text-[10.5px] font-semibold mb-3">
                          الخدمات المختارة
                        </p>
                        <div className="space-y-2">
                          {chosenServices.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3 py-2 px-3.5 rounded-xl bg-white/3.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand shrink-0" />
                                <span className="text-cream/62 text-[11px] truncate">
                                  {s.name}
                                </span>
                              </div>
                              <span className="text-gold text-[11px] font-bold shrink-0">
                                {formatPrice(s.price)} دج
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="mt-6 pt-5 border-t border-gold/16">
                      {discountAmount > 0 && (
                        <div className="mb-4 flex items-center justify-between gap-3 py-2 px-3.5 rounded-xl bg-emerald-brand/8 border border-emerald-brand/18">
                          <span className="flex items-center gap-2 text-emerald-brand text-[11px] font-bold">
                            <Tag className="w-3.5 h-3.5" />
                            {appliedPromo}
                          </span>
                          <span className="text-emerald-brand text-[11.5px] font-black" dir="ltr">
                            -{formatPrice(discountAmount)} دج
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-cream/48 text-[11px] font-semibold">
                            الإجمالي التقديري
                          </p>
                          <p className="text-cream/32 text-[9.5px] mt-1">
                            الدفع يتم في الصالون
                          </p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[26px] font-black text-gradient-gold leading-none">
                            {formatPrice(totalPrice)}
                          </span>
                          <span className="text-cream/42 text-[11px] font-semibold">دج</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="mt-6 pt-5 border-t border-white/8">
                      <p className="text-cream/42 text-[10.5px] font-semibold mb-3">
                        طرق الدفع المقبولة
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['نقداً', 'BaridiMob', 'البطاقة الذهبية'].map((method) => (
                          <span
                            key={method}
                            className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 text-cream/52 text-[9.5px] font-semibold"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 space-y-2.5">
                      {[
                        'حجز مجاني 100% بدون دفع مسبق',
                        'تأكيد فوري عبر SMS وواتساب',
                        'إمكانية الإلغاء قبل الموعد',
                      ].map((badge) => (
                        <div key={badge} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand shrink-0" />
                          <span className="text-cream/48 text-[10.5px]">{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Help card */}
                <div className="mt-4 glass-panel rounded-[20px] p-5">
                  <div className="flex items-start gap-3.5">
                    <span className="w-10 h-10 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4.5 h-4.5 text-gold" />
                    </span>
                    <div>
                      <p className="text-cream text-[11.5px] font-bold">تحتاج مساعدة؟</p>
                      <p className="mt-1.5 text-cream/42 text-[10px] leading-relaxed">
                        فريق الدعم متاح للمساعدة على مدار الساعة.
                      </p>
                      <a
                        href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                        className="mt-2.5 inline-flex items-center gap-1.5 text-gold text-[10.5px] font-bold hover:underline"
                        dir="ltr"
                      >
                        {SITE.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/11 border border-red-400/24"
    >
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-red-300 text-[12px] font-semibold">{message}</p>
    </motion.div>
  )
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  required,
  dir,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  required?: boolean
  dir?: string
}) {
  return (
    <div>
      <label className="block text-cream/62 text-[12px] font-semibold mb-2.5">
        {label}
        {required && <span className="text-gold mr-1">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/52 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn('field pr-11', error && 'border-red-400/52')}
          dir={dir}
        />
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-red-300/88 text-[10.5px]">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gold/62" />
        <span className="text-cream/48 text-[11.5px] font-semibold">{label}</span>
      </div>
      <span className="text-cream/82 text-[12.5px] font-bold">{value}</span>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 text-gold/52" />
        <span className="text-cream/42 text-[10.5px] font-semibold">{label}</span>
      </div>
      <span
        className={cn(
          'text-[11px] font-bold text-left',
          highlight ? 'text-cream/82' : 'text-cream/32',
        )}
      >
        {value}
      </span>
    </div>
  )
}