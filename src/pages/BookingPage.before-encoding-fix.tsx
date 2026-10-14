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
  MessageCircle,
  AlertCircle,
  PartyPopper,
  Copy,
  Home,
  CalendarCheck,
} from 'lucide-react'
import { SITE } from '../lib/data'
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
  { key: 'services', label: 'Ø§Ù„Ø®Ø¯Ù…Ø§Øª', icon: Scissors },
  { key: 'datetime', label: 'Ø§Ù„Ù…ÙˆØ¹Ø¯', icon: Calendar },
  { key: 'details', label: 'Ø¨ÙŠØ§Ù†Ø§ØªÙƒ', icon: User },
  { key: 'confirm', label: 'Ø§Ù„ØªØ£ÙƒÙŠØ¯', icon: CheckCircle2 },
]

export default function BookingPage() {
 const { slug } = useParams()
const navigate = useNavigate()

const {
  isReady,
  salons,
  createBooking,
  user,
  showToast,
  publicUpcomingBookings,
} = useStore()

const salon = salons.find((s) => s.slug === slug)

  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedBarber, setSelectedBarber] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  const days = useMemo(() => getUpcomingDays(14), [])

  // Ø§Ù„Ø£ÙˆÙ‚Ø§Øª Ø§Ù„Ù…Ø­Ø¬ÙˆØ²Ø© ÙØ¹Ù„ÙŠØ§Ù‹ Ù„Ù†ÙØ³ Ø§Ù„Ø­Ù„Ø§Ù‚ ÙˆÙ†ÙØ³ Ø§Ù„ÙŠÙˆÙ… ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ØµØ§Ù„ÙˆÙ† (Ù„Ø£ÙŠ Ø²Ø¨ÙˆÙ†ØŒ ÙˆÙ„ÙŠØ³ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ ÙÙ‚Ø·)
  const bookedTimesForSelection = useMemo(() => {
    if (!salon || !selectedBarber || !date) return new Set<string>()
    return new Set(
      publicUpcomingBookings
        .filter(
          (b) =>
            b.salonId === salon.id &&
            b.barberName === selectedBarber &&
            b.date === date &&
            b.status === 'مؤكد',
        )
        .map((b) => b.time),
    )
  }, [publicUpcomingBookings, salon, selectedBarber, date])

  useEffect(() => {
    if (time && bookedTimesForSelection.has(time)) {
      setTime('')
      setErrors((e) => ({ ...e, time: 'ØªÙ… Ø­Ø¬Ø² Ù‡Ø°Ø§ Ø§Ù„ØªÙˆÙ‚ÙŠØª Ù„Ù„ØªÙˆØŒ ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± ØªÙˆÙ‚ÙŠØª Ø¢Ø®Ø±' }))
    }
  }, [time, bookedTimesForSelection])

  const chosenServices = useMemo(
    () => salon?.services.filter((s) => selectedServices.includes(s.id)) ?? [],
    [salon, selectedServices],
  )

  const subtotalPrice = chosenServices.reduce((sum, s) => sum + s.price, 0)
  const totalPrice = subtotalPrice
  const totalDuration = chosenServices.reduce((sum, s) => sum + s.duration, 0)

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading salon...
      </div>
    )
  }

  if (!salon) {
    return <Navigate to="/salons" replace />
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
        newErrors.services = 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø®Ø¯Ù…Ø© ÙˆØ§Ø­Ø¯Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„'
      if (!selectedBarber) newErrors.barber = 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø­Ù„Ø§Ù‚ Ø£Ùˆ Ø§Ù„Ù…Ø®ØªØµ'
    }

    if (current === 1) {
      if (!date) newErrors.date = 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ§Ø±ÙŠØ®'
      if (!time) newErrors.time = 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªÙˆÙ‚ÙŠØª'
    }

    if (current === 2) {
      if (!isValidName(name)) newErrors.name = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù…Ùƒ Ø§Ù„ÙƒØ§Ù…Ù„ (3 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„)'
      if (!isValidPhone(phone)) newErrors.phone = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ù‡Ø§ØªÙ ØµØ­ÙŠØ­ (Ù…Ø«Ø§Ù„: 0550123456)'
      if (email.trim() && !isValidEmail(email))
        newErrors.email = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­'
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
    showToast('ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø­Ø¬Ø²Ùƒ Ø¨Ù†Ø¬Ø§Ø­!', 'success')
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
              ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø­Ø¬Ø²Ùƒ <span className="text-gradient-gold">Ø¨Ù†Ø¬Ø§Ø­!</span>
            </h1>

            <p className="mt-5 text-cream/58 text-[17px] leading-[2]">
              Ù…ÙˆØ¹Ø¯Ùƒ Ù…Ø­Ø¬ÙˆØ² ÙˆÙ…Ø¤ÙƒØ¯ 100%. Ø£Ø¸Ù‡Ø± Ø±Ù…Ø² Ø§Ù„Ø­Ø¬Ø² Ø¹Ù†Ø¯ ÙˆØµÙˆÙ„Ùƒ Ø¥Ù„Ù‰ Ø§Ù„ØµØ§Ù„ÙˆÙ†.
            </p>

            {/* Booking ticket */}
            <div className="mt-11 glass-panel-strong rounded-[28px] overflow-hidden text-right">
              <div className="bg-gradient-to-l from-gold/16 to-gold/4 px-8 py-7 border-b border-gold/18">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-cream/48 text-[11px] font-semibold mb-2">
                      Ø±Ù‚Ù… ØªØ°ÙƒØ±Ø© Ø§Ù„Ø­Ø¬Ø²
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
                              .then(() => showToast('ØªÙ… Ù†Ø³Ø® Ø±Ù…Ø² Ø§Ù„Ø­Ø¬Ø²', 'success'))
                              .catch(() => undefined)
                          }
                        }}
                        className="w-9 h-9 rounded-xl bg-gold/14 border border-gold/26 flex items-center justify-center text-gold hover:bg-gold/24 transition-colors"
                        aria-label="Ù†Ø³Ø® Ø§Ù„Ø±Ù…Ø²"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-brand/14 border border-emerald-brand/28">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-brand" />
                    <span className="text-emerald-brand text-[12.5px] font-bold">
                      Ø­Ø¬Ø² Ù…Ø¤ÙƒØ¯ 100%
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-8 space-y-5">
                <DetailRow icon={MapPin} label="Ø§Ù„ØµØ§Ù„ÙˆÙ†" value={confirmedBooking.salonName} />
                <DetailRow
                  icon={Calendar}
                  label="Ø§Ù„ØªØ§Ø±ÙŠØ®"
                  value={formatDateAr(confirmedBooking.date)}
                />
                <DetailRow icon={Clock} label="Ø§Ù„ØªÙˆÙ‚ÙŠØª" value={confirmedBooking.time} />
                <DetailRow
                  icon={User}
                  label="Ø§Ù„Ø­Ù„Ø§Ù‚ / Ø§Ù„Ù…Ø®ØªØµ"
                  value={confirmedBooking.barberName}
                />

                <div className="pt-5 border-t border-white/8">
                  <p className="text-cream/48 text-[11px] font-semibold mb-3.5">
                    Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©
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
                            {s.duration} Ø¯
                          </span>
                          <span className="text-gold text-[12.5px] font-bold">
                            {formatPrice(s.price)} Ø¯Ø¬
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-gold/16 flex items-center justify-between">
                  <div>
                    <p className="text-cream/48 text-[11px] font-semibold">
                      Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ø¨Ø§Ù„ØµØ§Ù„ÙˆÙ†
                    </p>
                    <p className="text-cream/38 text-[10px] mt-1">
                      Ø§Ù„Ø¯ÙØ¹ Ù†Ù‚Ø¯Ø§Ù‹ Ø£Ùˆ Ø¹Ø¨Ø± BaridiMob Ø¹Ù†Ø¯ Ø§Ù„ÙˆØµÙˆÙ„
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-black text-gradient-gold leading-none">
                      {formatPrice(confirmedBooking.totalPrice)}
                    </span>
                    <span className="text-cream/48 text-[13px] font-semibold">Ø¯Ø¬</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  `Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ…ØŒ Ø£Ù†Ø§ ${confirmedBooking.clientName} Ø­Ø¬Ø²Øª Ø¹Ø¨Ø± stikini ÙƒÙˆØ¯ ${confirmedBooking.code} Ù…ÙˆØ¹Ø¯ ÙŠÙˆÙ… ${formatDateAr(confirmedBooking.date)} Ø§Ù„Ø³Ø§Ø¹Ø© ${confirmedBooking.time} ÙÙŠ ${confirmedBooking.salonName}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-emerald-brand/16 border border-emerald-brand/32 text-emerald-brand font-bold text-[14px] hover:bg-emerald-brand/26 transition-all"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                ØªØ£ÙƒÙŠØ¯ Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨
              </a>

              <Link
                to={user ? '/dashboard' : '/login'}
                className="btn-gold inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-[14px]"
              >
                <CalendarCheck className="w-4.5 h-4.5" />
                {user ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Ø³Ø¬Ù‘Ù„ Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø­Ø¬ÙˆØ²Ø§ØªÙƒ'}
              </Link>

              <Link
                to="/salons"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl border border-white/12 text-cream/72 font-bold text-[14px] hover:border-gold/42 hover:text-gold transition-all"
              >
                <Home className="w-4.5 h-4.5" />
                ØªØµÙØ­ ØµØ§Ù„ÙˆÙ†Ø§Øª Ø£Ø®Ø±Ù‰
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
                    Ù†ØµØ§Ø¦Ø­ Ù‚Ø¨Ù„ Ù…ÙˆØ¹Ø¯Ùƒ
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {[
                      'Ø£Ø­Ø¶Ø± Ù‚Ø¨Ù„ Ø§Ù„Ù…ÙˆØ¹Ø¯ Ø¨Ù€ 5 Ø¯Ù‚Ø§Ø¦Ù‚ Ù„ØªØ¬Ø±Ø¨Ø© Ù…Ø±ÙŠØ­Ø©.',
                      'Ø£Ø¸Ù‡Ø± Ø±Ù…Ø² Ø§Ù„Ø­Ø¬Ø² Ø¹Ù†Ø¯ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„ØµØ§Ù„ÙˆÙ†.',
                      'ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¥Ù„ØºØ§Ø¡ Ø£Ùˆ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ù‚Ø¨Ù„ Ø§Ù„Ù…ÙˆØ¹Ø¯ Ø¨ÙˆÙ‚Øª ÙƒØ§ÙÙ.',
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
              Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©
            </Link>
            <span className="text-gold/50">/</span>
            <Link to="/salons" className="hover:text-gold transition-colors">
              Ø§Ù„ØµØ§Ù„ÙˆÙ†Ø§Øª
            </Link>
            <span className="text-gold/50">/</span>
            <Link to={`/salon/${salon.slug}`} className="hover:text-gold transition-colors">
              {salon.name}
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">Ø§Ù„Ø­Ø¬Ø²</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-9">
            {/* Main wizard */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[clamp(1.85rem,4vw,2.65rem)] font-black text-cream leading-[1.3]">
                Ø§Ø­Ø¬Ø² Ù…ÙˆØ¹Ø¯Ùƒ ÙÙŠ{' '}
                <span className="text-gradient-gold">{salon.name}</span>
              </h1>
              <p className="mt-3.5 text-cream/52 text-[15px] leading-[1.95]">
                Ø§Ø®ØªØ± Ø§Ù„Ø®Ø¯Ù…Ø§Øª ÙˆØ§Ù„Ù…ÙˆØ¹Ø¯ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ â€” Ø§Ù„ØªØ£ÙƒÙŠØ¯ ÙÙˆØ±ÙŠ ÙˆØ¨Ø¯ÙˆÙ† Ø£ÙŠ Ø¯ÙØ¹ Ù…Ø³Ø¨Ù‚.
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
                  {/* STEP 0 â€” Services */}
                  {step === 0 && (
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-5">
                          <h2 className="text-[19px] font-black text-cream">
                            Ø§Ø®ØªØ± Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©
                          </h2>
                          <span className="text-cream/42 text-[11.5px]">
                            ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø®ØªÙŠØ§Ø± Ø£ÙƒØ«Ø± Ù…Ù† Ø®Ø¯Ù…Ø©
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
                                            Ù…Ù…ÙŠØ²Ø©
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1.5 text-cream/42 text-[11px]">
                                        {service.category} â€¢ {service.duration} Ø¯Ù‚ÙŠÙ‚Ø©
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
                                        Ø¯Ø¬
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
                          Ø§Ø®ØªØ± Ø§Ù„Ø­Ù„Ø§Ù‚ / Ø§Ù„Ù…Ø®ØªØµ
                        </h2>

                        {errors.barber && <ErrorBanner message={errors.barber} />}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <button
                            onClick={() => {
                              setSelectedBarber('Ø£ÙˆÙ„ Ø­Ù„Ø§Ù‚ Ù…ØªØ§Ø­')
                              setErrors((e) => ({ ...e, barber: '' }))
                            }}
                            className={cn(
                              'p-5 rounded-[20px] border transition-all text-right',
                              selectedBarber === 'Ø£ÙˆÙ„ Ø­Ù„Ø§Ù‚ Ù…ØªØ§Ø­'
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
                                  Ø£ÙˆÙ„ Ø­Ù„Ø§Ù‚ Ù…ØªØ§Ø­
                                </h3>
                                <p className="text-cream/42 text-[10.5px] mt-1">
                                  Ø£Ø³Ø±Ø¹ Ù…ÙˆØ¹Ø¯ Ù…ØªØ§Ø­
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
                                    â­ {barber.rating.toFixed(1)} â€¢ {barber.experience}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 1 â€” Date & Time */}
                  {step === 1 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-[19px] font-black text-cream mb-1.5">
                          Ø§Ø®ØªØ± Ø§Ù„ØªØ§Ø±ÙŠØ®
                        </h2>
                        <p className="text-cream/42 text-[12px] mb-5">
                          Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ Ù…ØªØ§Ø­Ø© Ù„Ù…Ø¯Ø© 14 ÙŠÙˆÙ…Ø§Ù‹ Ù‚Ø§Ø¯Ù…Ø§Ù‹
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
                          Ø§Ø®ØªØ± Ø§Ù„ØªÙˆÙ‚ÙŠØª
                        </h2>
                        <p className="text-cream/42 text-[12px] mb-5">
                          Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£ÙˆÙ‚Ø§Øª Ø¨Ø§Ù„ØªÙˆÙ‚ÙŠØª Ø§Ù„Ù…Ø­Ù„ÙŠ Ù„Ù„Ø¬Ø²Ø§Ø¦Ø±
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

                  {/* STEP 2 â€” Details */}
                  {step === 2 && (
                    <div>
                      <h2 className="text-[19px] font-black text-cream mb-1.5">
                        Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ø§Ù„Ø´Ø®ØµÙŠØ©
                      </h2>
                      <p className="text-cream/42 text-[12px] mb-7">
                        Ø³Ù†Ø³ØªØ®Ø¯Ù… Ù‡Ø°Ù‡ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ø¥Ø±Ø³Ø§Ù„ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¬Ø² ÙˆØ§Ù„ØªØ°ÙƒÙŠØ±Ø§Øª
                      </p>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <Field
                          label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„"
                          icon={User}
                          value={name}
                          onChange={setName}
                          placeholder="Ù…Ø«Ø§Ù„: Ù…Ø­Ù…Ø¯ Ø§Ù„Ø£Ù…ÙŠÙ†"
                          error={errors.name}
                          required
                        />
                        <Field
                          label="Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ (WhatsApp)"
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
                            label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"
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
                            Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ø³ØªØ§ÙŠÙ„ Ù…ÙØ¶Ù„ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ø£Ø®Ø¨Ø± Ø§Ù„Ø­Ù„Ø§Ù‚ Ø¹Ù† Ø£ÙŠ ØªÙØ§ØµÙŠÙ„ ØªÙ‡Ù…Ùƒ..."
                            rows={4}
                            className="field resize-none"
                          />
                        </div>

                      </div>

                      {/* Privacy note */}
                      <div className="mt-7 p-5 rounded-2xl bg-emerald-brand/7 border border-emerald-brand/18">
                        <div className="flex items-start gap-3.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-brand shrink-0 mt-0.5" />
                          <div>
                            <p className="text-emerald-brand text-[12.5px] font-bold">
                              Ø­Ø¬Ø²Ùƒ Ù…Ø­Ù…ÙŠ ÙˆØ¢Ù…Ù† Ø¹Ø¨Ø± Ù…Ù†ØµØ© stikini
                            </p>
                            <p className="mt-2 text-cream/48 text-[11.5px] leading-relaxed">
                              Ù†Ø¬Ù…Ø¹ ÙÙ‚Ø· Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù„Ø§Ø²Ù…Ø© Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø¬Ø² ÙˆØ¥Ø¯Ø§Ø±ØªÙ‡. Ù„Ø§ Ù†Ø´Ø§Ø±Ùƒ
                              Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ù…Ø¹ Ø£ÙŠ Ø·Ø±Ù Ø«Ø§Ù„Ø« Ù„Ø£ØºØ±Ø§Ø¶ Ø¥Ø¹Ù„Ø§Ù†ÙŠØ©.
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
                  {step === 0 ? 'Ø±Ø¬ÙˆØ¹ Ù„Ù„ØµØ§Ù„ÙˆÙ†' : 'Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©'}
                </button>

                {step < 2 ? (
                  <button
                    onClick={goNext}
                    className="btn-gold inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-[14px]"
                  >
                    Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©
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
                        Ø¬Ø§Ø±Ù Ø§Ù„ØªØ£ÙƒÙŠØ¯...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¬Ø² Ø§Ù„ÙÙˆØ±ÙŠ
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
                        {salon.neighborhood}ØŒ Ø§Ù„Ø¬Ø²Ø§Ø¦Ø± Ø§Ù„Ø¹Ø§ØµÙ…Ø©
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-cream text-[13px] font-bold mb-4.5">
                      Ù…Ù„Ø®Øµ Ø§Ù„Ø­Ø¬Ø²
                    </h4>

                    <div className="space-y-3">
                      <SummaryRow
                        icon={Scissors}
                        label="Ø§Ù„Ø®Ø¯Ù…Ø§Øª"
                        value={
                          chosenServices.length
                            ? `${chosenServices.length} Ø®Ø¯Ù…Ø© Ù…Ø®ØªØ§Ø±Ø©`
                            : 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø¨Ø¹Ø¯'
                        }
                        highlight={chosenServices.length > 0}
                      />
                      <SummaryRow
                        icon={User}
                        label="Ø§Ù„Ø­Ù„Ø§Ù‚"
                        value={selectedBarber || 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±'}
                        highlight={!!selectedBarber}
                      />
                      <SummaryRow
                        icon={Calendar}
                        label="Ø§Ù„ØªØ§Ø±ÙŠØ®"
                        value={date ? formatDateAr(date) : 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±'}
                        highlight={!!date}
                      />
                      <SummaryRow
                        icon={Clock}
                        label="Ø§Ù„ØªÙˆÙ‚ÙŠØª"
                        value={time || 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±'}
                        highlight={!!time}
                      />
                      {totalDuration > 0 && (
                        <SummaryRow
                          icon={Clock}
                          label="Ø§Ù„Ù…Ø¯Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠØ©"
                          value={`${totalDuration} Ø¯Ù‚ÙŠÙ‚Ø©`}
                          highlight
                        />
                      )}
                    </div>

                    {/* Selected services list */}
                    {chosenServices.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-white/8">
                        <p className="text-cream/42 text-[10.5px] font-semibold mb-3">
                          Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©
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
                                {formatPrice(s.price)} Ø¯Ø¬
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="mt-6 pt-5 border-t border-gold/16">

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-cream/48 text-[11px] font-semibold">
                            Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠ
                          </p>
                          <p className="text-cream/32 text-[9.5px] mt-1">
                            Ø§Ù„Ø¯ÙØ¹ ÙŠØªÙ… ÙÙŠ Ø§Ù„ØµØ§Ù„ÙˆÙ†
                          </p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[26px] font-black text-gradient-gold leading-none">
                            {formatPrice(totalPrice)}
                          </span>
                          <span className="text-cream/42 text-[11px] font-semibold">Ø¯Ø¬</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="mt-6 pt-5 border-t border-white/8">
                      <p className="text-cream/42 text-[10.5px] font-semibold mb-3">
                        Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…Ù‚Ø¨ÙˆÙ„Ø©
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Ù†Ù‚Ø¯Ø§Ù‹', 'BaridiMob', 'Ø§Ù„Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„Ø°Ù‡Ø¨ÙŠØ©'].map((method) => (
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
                        'Ø­Ø¬Ø² Ù…Ø¬Ø§Ù†ÙŠ 100% Ø¨Ø¯ÙˆÙ† Ø¯ÙØ¹ Ù…Ø³Ø¨Ù‚',
                        'ØªØ£ÙƒÙŠØ¯ ÙÙˆØ±ÙŠ Ø¹Ø¨Ø± SMS ÙˆÙˆØ§ØªØ³Ø§Ø¨',
                        'Ø¥Ù…ÙƒØ§Ù†ÙŠØ© Ø§Ù„Ø¥Ù„ØºØ§Ø¡ Ù‚Ø¨Ù„ Ø§Ù„Ù…ÙˆØ¹Ø¯',
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
                      <p className="text-cream text-[11.5px] font-bold">ØªØ­ØªØ§Ø¬ Ù…Ø³Ø§Ø¹Ø¯Ø©ØŸ</p>
                      <p className="mt-1.5 text-cream/42 text-[10px] leading-relaxed">
                        ÙØ±ÙŠÙ‚ Ø§Ù„Ø¯Ø¹Ù… Ù…ØªØ§Ø­ Ù„Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¹Ù„Ù‰ Ù…Ø¯Ø§Ø± Ø§Ù„Ø³Ø§Ø¹Ø©.
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

