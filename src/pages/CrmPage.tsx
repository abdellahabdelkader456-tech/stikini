import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  Plus,
  Search,
  Star,
  Store,
  Tag,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { SALONS } from '../lib/data'
import { cn, formatDateAr, formatPrice } from '../lib/utils'
import { EmptyState } from '../components/SalonCard'
import type { Booking } from '../lib/types'

type Tab = 'today' | 'all' | 'barbers' | 'services'

const STATUS_ORDER: Record<Booking['status'], number> = { مؤكد: 0, مكتمل: 1, ملغى: 2 }

const sumTotals = (list: Booking[]): number => list.reduce((sum, b) => sum + b.totalPrice, 0)

export default function CrmPage() {
  const { user, salonBookings, updateSalonBookingStatus, setOwnerSalon, showToast } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')

  const salon = SALONS.find((s) => s.id === user?.salonId)
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const sorted = useMemo(
    () =>
      [...salonBookings].sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time),
      ),
    [salonBookings],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((b) => {
      if (tab === 'today' && b.date !== todayIso) return false
      if (!q) return true
      return [b.clientName, b.phone, b.code, b.promoCode ?? ''].some((v) =>
        v.toLowerCase().includes(q),
      )
    })
  }, [sorted, tab, query, todayIso])

  // صفحة خاصة بأصحاب الصالونات فقط
  if (user?.type !== 'owner') return <Navigate to="/dashboard" replace />

  const confirmed = salonBookings.filter((b) => b.status === 'مؤكد')
  const completed = salonBookings.filter((b) => b.status === 'مكتمل')
  const cancelled = salonBookings.filter((b) => b.status === 'ملغى')
  const todayConfirmed = confirmed.filter((b) => b.date === todayIso)
  const completedRevenue = sumTotals(completed)
  const expectedRevenue = sumTotals(confirmed)

  return (
    <>
      {/* Header */}
      <section className="relative pt-[150px] pb-12 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-salon.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/88 to-forest" />
        </div>
        <div className="absolute top-0 right-1/3 w-[520px] h-[520px] rounded-full bg-gold/9 blur-[130px]" />
        <div className="hero-grid-bg absolute inset-0 opacity-55" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gold/11 border border-gold/22 text-gold text-[11.5px] font-bold">
                <LayoutGrid className="w-3.5 h-3.5" />
                لوحة الحلاق CRM
              </span>

              <h1 className="mt-5 text-[clamp(2.15rem,4.8vw,3.25rem)] font-black text-cream leading-[1.26]">
                إدارة <span className="text-gradient-gold">المواعيد</span> والحلاقين
              </h1>

              <p className="mt-4 text-cream/52 text-[15.5px] leading-[1.95]">
                {salon
                  ? `تابع حجوزات ${salon.name} وأكّد المواعيد أو ألغِها من مكان واحد.`
                  : 'اربط حسابك بصالونك لتبدأ في استقبال وإدارة الحجوزات.'}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {salon && (
                <div className="min-w-[250px]">
                  <label className="block text-cream/52 text-[11px] font-semibold mb-2">
                    الصالون المُدار
                  </label>
                  <select
                    className="field"
                    value={salon.id}
                    onChange={(e) => setOwnerSalon(e.target.value)}
                  >
                    {SALONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-white/11 text-cream/72 font-bold text-[13px] hover:border-gold/38 hover:text-gold transition-all"
              >
                لوحة التحكم
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick stats */}
          {salon && (
            <div className="mt-11 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: CalendarCheck,
                  label: 'مواعيد اليوم المؤكدة',
                  value: todayConfirmed.length.toString(),
                  color: '#d4af37',
                  bg: 'rgba(212,175,55,0.12)',
                },
                {
                  icon: Calendar,
                  label: 'مواعيد مؤكدة قادمة',
                  value: confirmed.length.toString(),
                  color: '#00bb7f',
                  bg: 'rgba(0,187,127,0.12)',
                },
                {
                  icon: CheckCircle2,
                  label: 'مواعيد مكتملة',
                  value: completed.length.toString(),
                  color: '#34d9a4',
                  bg: 'rgba(52,217,164,0.12)',
                },
                {
                  icon: XCircle,
                  label: 'مواعيد ملغاة',
                  value: cancelled.length.toString(),
                  color: '#fca5a5',
                  bg: 'rgba(248,113,113,0.12)',
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.58, delay: i * 0.09 }}
                  className="glass-panel rounded-[22px] p-6"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: stat.bg, border: `1px solid ${stat.color}33` }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <p className="mt-5 text-cream/42 text-[11px] font-semibold">{stat.label}</p>
                  <p className="mt-2 text-[26px] font-black text-cream leading-none">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* No salon linked yet */}
          {!salon && (
            <div>
              <h2 className="text-[21px] font-black text-cream mb-2">اختر صالونك</h2>
              <p className="text-cream/46 text-[13px] mb-7">
                اختر الصالون الذي تديره ليظهر لك حجوزاته وتتمكّن من إدارتها.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SALONS.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: i * 0.07 }}
                    className="group glass-panel rounded-[22px] overflow-hidden card-hover"
                  >
                    <div className="relative h-[140px] overflow-hidden">
                      <img
                        src={s.image}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-112 transition-transform duration-[850ms]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/22 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-cream text-[14px] font-bold">{s.name}</h3>
                      <p className="mt-1.5 text-cream/42 text-[10px]">{s.neighborhood}</p>
                      <button
                        onClick={() => setOwnerSalon(s.id)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/12 border border-gold/24 text-gold text-[11px] font-bold hover:bg-gold hover:text-ink transition-all"
                      >
                        <Store className="w-3.5 h-3.5" />
                        إدارة هذا الصالون
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {salon && (
            <>
              {/* Tabs + search */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-9">
                <div className="flex flex-wrap gap-2.5 p-2 rounded-[22px] bg-white/3 border border-white/7 w-fit">
                  {[
                    { key: 'today' as const, label: 'اليوم', icon: Clock },
                    { key: 'all' as const, label: 'كل المواعيد', icon: Calendar },
                    { key: 'barbers' as const, label: 'الحلاقون', icon: Users },
                    { key: 'services' as const, label: 'خدمات', icon: Tag },
                  ].map((t) => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          'flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all',
                          tab === t.key
                            ? 'bg-gold text-ink shadow-gold-soft'
                            : 'text-cream/56 hover:text-gold hover:bg-white/5',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    )
                  })}
                </div>

                {tab !== 'barbers' && tab !== 'services' && (
                  <div className="relative w-full sm:w-[320px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/52 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ابحث بالاسم أو الهاتف أو كود الحجز"
                      className="field"
                      style={{ paddingRight: '2.75rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Appointments */}
              {tab !== 'barbers' && tab !== 'services' && (
                <>
                  {visible.length > 0 ? (
                    <div className="space-y-4">
                      {visible.map((b, i) => {
                        const isConfirmed = b.status === 'مؤكد'
                        return (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.06 }}
                            className={cn(
                              'rounded-[22px] border p-5 sm:p-6 flex flex-wrap items-center justify-between gap-5',
                              isConfirmed
                                ? 'bg-gradient-to-l from-emerald-brand/12 to-emerald-brand/5 border-emerald-brand/22'
                                : 'glass-panel border-white/7',
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-cream text-[16px] font-black">
                                  {b.clientName}
                                </h3>
                                <span
                                  className={cn(
                                    'px-2.5 py-1 rounded-full text-[9.5px] font-bold border',
                                    b.status === 'مؤكد'
                                      ? 'bg-emerald-brand/12 border-emerald-brand/24 text-emerald-brand'
                                      : b.status === 'ملغى'
                                        ? 'bg-red-500/12 border-red-400/24 text-red-300'
                                        : 'bg-gold/12 border-gold/24 text-gold',
                                  )}
                                >
                                  {b.status}
                                </span>
                                {b.promoCode && (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/12 border border-gold/30 text-gold text-[9.5px] font-black"
                                    dir="ltr"
                                  >
                                    {b.promoCode}
                                    <Tag className="w-3 h-3" />
                                  </span>
                                )}
                              </div>

                              <p className="mt-2.5 text-cream/52 text-[11.5px] leading-relaxed">
                                {b.services.map((s) => s.name).join(' + ')} · {b.barberName} ·{' '}
                                <span dir="ltr" className="inline-block">
                                  {b.phone}
                                </span>
                              </p>

                              {b.notes && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-cream/44 text-[11px] italic">
                                  <FileText className="w-3 h-3 text-gold/62 shrink-0" />
                                  {b.notes}
                                </p>
                              )}

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-cream/38 text-[10px]">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-gold/62" />
                                  {formatDateAr(b.date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gold/62" />
                                  {b.time}
                                </span>
                                <span dir="ltr">{b.code}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <p className="text-gold font-black text-[19px]">
                                  {formatPrice(b.totalPrice)} دج
                                </p>
                                {b.discount > 0 && (
                                  <p
                                    className="mt-0.5 text-emerald-brand text-[10.5px] font-bold"
                                    dir="ltr"
                                  >
                                    -{formatPrice(b.discount)} دج
                                  </p>
                                )}
                              </div>

                              {isConfirmed && (
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => updateSalonBookingStatus(b.id, 'مكتمل')}
                                    title="تمت الحلاقة — تسجيل الموعد كمكتمل"
                                    aria-label="تسجيل الموعد كمكتمل"
                                    className="w-11 h-11 rounded-xl bg-emerald-brand/14 border border-emerald-brand/28 text-emerald-brand flex items-center justify-center hover:bg-emerald-brand hover:text-ink transition-all"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `هل تريد إلغاء موعد ${b.clientName}؟`,
                                        )
                                      ) {
                                        updateSalonBookingStatus(b.id, 'ملغى')
                                      }
                                    }}
                                    title="إلغاء الموعد"
                                    aria-label="إلغاء الموعد"
                                    className="w-11 h-11 rounded-xl bg-red-500/12 border border-red-400/24 text-red-300 flex items-center justify-center hover:bg-red-500/30 transition-all"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Calendar}
                      title={
                        tab === 'today' ? 'لا توجد مواعيد اليوم' : 'لا توجد مواعيد مطابقة'
                      }
                      description={
                        query.trim()
                          ? 'لا توجد نتائج مطابقة لبحثك. جرّب اسماً أو رقماً آخر.'
                          : 'ستظهر هنا حجوزات الزبائن في صالونك فور إنشائها عبر المنصة.'
                      }
                    />
                  )}

                  {/* Revenue summary */}
                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    <div className="glass-panel rounded-[22px] p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-12 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-gold" />
                        </span>
                        <p className="text-cream/62 text-[13px] font-bold">
                          إجمالي الإيرادات المكتملة
                        </p>
                      </div>
                      <p className="text-gold font-black text-[24px]">
                        {formatPrice(completedRevenue)} دج
                      </p>
                    </div>
                    <div className="glass-panel rounded-[22px] p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-12 rounded-2xl bg-emerald-brand/12 border border-emerald-brand/22 flex items-center justify-center">
                          <CalendarCheck className="w-5 h-5 text-emerald-brand" />
                        </span>
                        <p className="text-cream/62 text-[13px] font-bold">
                          إيرادات المواعيد المؤكدة
                        </p>
                      </div>
                      <p className="text-emerald-brand font-black text-[24px]">
                        {formatPrice(expectedRevenue)} دج
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Barbers */}
              {tab === 'barbers' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button
                    onClick={() =>
                      showToast(
                        'إضافة حلاق جديد ستكون متاحة قريباً.',
                        'info',
                      )
                    }
                    className="glass-panel rounded-[22px] p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gold/24 hover:border-gold/50 transition-all min-h-[220px]"
                  >
                    <span className="w-14 h-14 rounded-2xl bg-gold/12 border border-gold/24 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gold" />
                    </span>
                    <p className="mt-4 text-gold text-[13.5px] font-bold">
                      إضافة حلاق جديد
                    </p>
                    <p className="mt-1.5 text-cream/42 text-[11px]">
                      أضف عضواً جديداً إلى فريق عملك
                    </p>
                  </button>

                  {salon.barbers.map((barber, i) => {
                    const mine = salonBookings.filter((b) => b.barberName === barber.name)
                    const mineConfirmed = mine.filter((b) => b.status === 'مؤكد').length
                    const mineDone = mine.filter((b) => b.status === 'مكتمل')
                    return (
                      <motion.div
                        key={barber.id}
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: i * 0.09 }}
                        className="glass-panel rounded-[22px] p-6"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={barber.image}
                            alt={barber.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-gold/22"
                          />
                          <div className="min-w-0">
                            <h3 className="text-cream text-[15px] font-black truncate">
                              {barber.name}
                            </h3>
                            <p className="mt-1 text-cream/46 text-[11px]">
                              {barber.role} · {barber.experience}
                            </p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-gold text-[11px] font-bold">
                              <Star className="w-3 h-3 fill-gold" />
                              {barber.rating.toFixed(1)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {barber.specialties.map((sp) => (
                            <span
                              key={sp}
                              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-cream/52 text-[9.5px] font-semibold"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>

                        <div className="mt-5 pt-5 border-t border-white/8 grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-cream text-[18px] font-black">{mineConfirmed}</p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">مؤكدة</p>
                          </div>
                          <div>
                            <p className="text-cream text-[18px] font-black">{mineDone.length}</p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">مكتملة</p>
                          </div>
                          <div>
                            <p className="text-gold text-[15px] font-black leading-[27px]">
                              {formatPrice(sumTotals(mineDone))}
                            </p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">إيراد (دج)</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {(() => {
                    const names = new Set(salon.barbers.map((b) => b.name))
                    const others = salonBookings.filter((b) => !names.has(b.barberName))
                    if (others.length === 0) return null
                    return (
                      <div className="glass-panel rounded-[22px] p-6">
                        <div className="flex items-center gap-4">
                          <span className="w-16 h-16 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                            <Users className="w-6 h-6 text-gold" />
                          </span>
                          <div>
                            <h3 className="text-cream text-[15px] font-black">
                              أول حلاق متاح
                            </h3>
                            <p className="mt-1 text-cream/46 text-[11px]">
                              حجوزات بلا حلاق محدد
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 pt-5 border-t border-white/8 grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-cream text-[18px] font-black">
                              {others.filter((b) => b.status === 'مؤكد').length}
                            </p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">مؤكدة</p>
                          </div>
                          <div>
                            <p className="text-cream text-[18px] font-black">
                              {others.filter((b) => b.status === 'مكتمل').length}
                            </p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">مكتملة</p>
                          </div>
                          <div>
                            <p className="text-gold text-[15px] font-black leading-[27px]">
                              {formatPrice(
                                sumTotals(others.filter((b) => b.status === 'مكتمل')),
                              )}
                            </p>
                            <p className="mt-1 text-cream/40 text-[9.5px]">إيراد (دج)</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Services */}
              {tab === 'services' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button
                    onClick={() =>
                      showToast(
                        'إضافة خدمة جديدة ستكون متاحة قريباً.',
                        'info',
                      )
                    }
                    className="glass-panel rounded-[22px] p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gold/24 hover:border-gold/50 transition-all min-h-[220px]"
                  >
                    <span className="w-14 h-14 rounded-2xl bg-gold/12 border border-gold/24 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gold" />
                    </span>
                    <p className="mt-4 text-gold text-[13.5px] font-bold">
                      إضافة خدمة جديدة
                    </p>
                    <p className="mt-1.5 text-cream/42 text-[11px]">
                      أضف خدمة جديدة إلى قائمة صالونك
                    </p>
                  </button>

                  {salon.services.map((service, i) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: i * 0.07 }}
                      className="glass-panel rounded-[22px] p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="px-2.5 py-1 rounded-lg bg-gold/12 border border-gold/22 text-gold text-[9.5px] font-bold">
                            {service.category}
                          </span>
                          <h3 className="mt-3 text-cream text-[15px] font-black truncate">
                            {service.name}
                          </h3>
                        </div>
                        {service.popular && (
                          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-brand/12 border border-emerald-brand/22 text-emerald-brand text-[9.5px] font-bold">
                            الأكثر طلباً
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-cream/48 text-[11px] leading-relaxed line-clamp-2">
                        {service.description}
                      </p>

                      <div className="mt-5 pt-5 border-t border-white/8 flex items-center justify-between">
                        <div>
                          <span className="text-gold font-black text-[18px]">
                            {formatPrice(service.price)}
                          </span>
                          <span className="text-cream/42 text-[10px] font-semibold"> دج</span>
                        </div>
                        <p className="text-cream/40 text-[10.5px]">
                          المدة: {service.duration} دقيقة
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}