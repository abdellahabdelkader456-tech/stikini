
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Scissors,
  Settings,
  Star,
  Store,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'

import { useStore } from '../lib/store'
import { SALONS, STATS } from '../lib/data'
import { formatDateAr, formatPrice, cn } from '../lib/utils'
import { EmptyState, Stars } from '../components/SalonCard'
import { supabase } from '../lib/supabase'

type DashboardTab = 'overview' | 'bookings' | 'history' | 'favorites' | 'settings'

export default function DashboardPage() {
  const {
    user,
    bookings,
    allBookings,
    favorites,
    cancelBooking,
    showToast,
    sharedHistoricalBookings,
    refreshSharedHistoricalBookings,
  } = useStore()

  const isOwner = user?.type === 'owner'

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [profileSaving, setProfileSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [hasPendingDeletionRequest, setHasPendingDeletionRequest] =
    useState(false)

  useEffect(() => {
    if (!user) return

    setProfileForm({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
    })

    if (user.type === 'owner') {
      setActiveTab('settings')
    }
  }, [user])

  const activeBookings = bookings.filter(
    (booking) => booking.status === 'مؤكد',
  )

  const completedBookings = bookings.filter(
    (booking) => booking.status === 'مكتمل',
  )

  const totalSpent = bookings
    .filter((booking) => booking.status !== 'ملغى')
    .reduce((sum, booking) => sum + booking.totalPrice, 0)

  useEffect(() => {
    if (!user || !isOwner) return

    let cancelled = false

    async function checkDeletionRequest() {
      try {
        const { data, error } = await supabase
          .from('account_deletion_requests')
          .select('id,status')
          .eq('user_id', user?.id)
          .in('status', ['pending', 'postponed'])
          .maybeSingle()

        if (error) {
          console.error('Deletion request check error:', error)
          return
        }

        if (!cancelled) {
          setHasPendingDeletionRequest(Boolean(data))
        }
      } catch (error) {
        console.error('Deletion request check error:', error)
      }
    }

    void checkDeletionRequest()

    return () => {
      cancelled = true
    }
  }, [user, isOwner])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user || !isOwner) return

    const name = profileForm.name.trim()
    const email = profileForm.email.trim()
    const phone = profileForm.phone.trim()

    if (!name || !email) {
      showToast('يرجى إدخال الاسم الكامل والبريد الإلكتروني', 'error')
      return
    }

    setProfileSaving(true)

    try {
      const emailChanged =
        email.toLowerCase() !== (user.email ?? '').toLowerCase()

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email })

        if (error) throw error
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          email,
          phone: phone || null,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      setProfileForm({ name, email, phone })

      showToast(
        emailChanged
          ? 'تم حفظ المعلومات. قد تحتاج إلى تأكيد البريد الإلكتروني الجديد.'
          : 'تم تحديث معلومات الحساب بنجاح.',
        'success',
      )
    } catch (error) {
      console.error('Profile update error:', error)

      showToast(
        error instanceof Error
          ? error.message
          : 'تعذر تحديث معلومات الحساب',
        'error',
      )
    } finally {
      setProfileSaving(false)
    }
  }

  async function submitDeletionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user || !isOwner) return

    const reason = deleteReason.trim()

    if (!reason) {
      showToast('يرجى كتابة سبب طلب حذف الحساب', 'error')
      return
    }

    setDeleteSubmitting(true)

    try {
      const { data: existingRequest, error: existingError } = await supabase
        .from('account_deletion_requests')
        .select('id,status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'postponed'])
        .maybeSingle()

      if (existingError) throw existingError

      if (existingRequest) {
        setHasPendingDeletionRequest(true)
        setDeleteModal(false)
        showToast('لديك بالفعل طلب حذف قيد المراجعة.', 'error')
        return
      }

      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason,
          status: 'pending',
        })

      if (error) throw error

      setDeleteReason('')
      setDeleteModal(false)
      setHasPendingDeletionRequest(true)

      showToast(
        'تم إرسال طلب حذف الحساب إلى الإدارة للمراجعة.',
        'success',
      )
    } catch (error) {
      console.error('Deletion request error:', error)
      showToast('تعذر إرسال طلب حذف الحساب.', 'error')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const tabs: {
    key: DashboardTab
    label: string
    icon: typeof Calendar
  }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { key: 'bookings', label: 'حجوزاتي', icon: Calendar },
    { key: 'history', label: 'الحجوزات القديمة', icon: Clock },
    { key: 'favorites', label: 'المفضلة', icon: Heart },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden pt-[150px] pb-12">
        <div className="absolute inset-0">
          <img
            src="/images/hero-salon.jpg"
            alt=""
            className="h-full w-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/88 to-forest" />
        </div>

        <div className="hero-grid-bg absolute inset-0 opacity-55" />
        <div className="absolute right-1/3 top-0 h-[520px] w-[520px] rounded-full bg-gold/9 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-gold/22 bg-gold/11 px-4 py-2 text-[11.5px] font-bold text-gold">
                <Store className="h-3.5 w-3.5" />
                {isOwner ? 'حساب صاحب صالون' : 'حساب زبون'}
              </span>

              <h1 className="mt-5 text-[clamp(2.15rem,4.8vw,3.25rem)] font-black leading-[1.26] text-cream">
                مرحباً،{' '}
                <span className="text-gradient-gold">{user?.name}</span> 👋
              </h1>

              <p className="mt-4 text-[15.5px] leading-[1.95] text-cream/52">
                {isOwner
                  ? 'أدر حجوزاتك وفريق عملك وتقييماتك من مكان واحد.'
                  : 'تابع حجوزاتك، اكتشف صالونات جديدة، واحجز موعدك القادم بسهولة.'}
              </p>
            </div>

            {!isOwner && (
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/salons"
                  className="btn-gold inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-[13.5px]"
                >
                  <CalendarCheck className="h-4 w-4" />
                  احجز موعد جديد
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/11 px-6 py-3.5 text-[13px] font-bold text-cream/72 transition-all hover:border-gold/38 hover:text-gold"
                >
                  <Settings className="h-4 w-4" />
                  إعدادات الحساب
                </button>
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="mt-11 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  icon: Calendar,
                  label: 'الحجوزات النشطة',
                  value: activeBookings.length.toString(),
                  color: '#d4af37',
                  bg: 'rgba(212,175,55,0.12)',
                },
                {
                  icon: CheckCircle2,
                  label: 'حجوزات مكتملة',
                  value: completedBookings.length.toString(),
                  color: '#00bb7f',
                  bg: 'rgba(0,187,127,0.12)',
                },
                {
                  icon: Wallet,
                  label: 'إجمالي المصروف',
                  value: `${formatPrice(totalSpent)} دج`,
                  color: '#f5d77f',
                  bg: 'rgba(245,215,127,0.12)',
                },
                {
                  icon: Heart,
                  label: 'الصالونات المفضلة',
                  value: favorites.length.toString(),
                  color: '#34d9a4',
                  bg: 'rgba(52,217,164,0.12)',
                },
              ].map((stat, index) => {
                const Icon = stat.icon

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="glass-panel rounded-[22px] p-6"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: stat.bg,
                        border: `1px solid ${stat.color}33`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: stat.color }}
                      />
                    </div>

                    <p className="mt-5 text-[11px] font-semibold text-cream/42">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-[26px] font-black leading-none text-cream">
                      {stat.value}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dashboard content */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          {!isOwner && (
            <div className="mb-9 flex w-fit max-w-full flex-wrap gap-2.5 rounded-[22px] border border-white/7 bg-white/3 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key)

                      if (tab.key === 'history') {
                        void refreshSharedHistoricalBookings()
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-[12px] font-bold transition-all sm:px-6 sm:text-[13px]',
                      activeTab === tab.key
                        ? 'bg-gold text-ink shadow-gold-soft'
                        : 'text-cream/56 hover:bg-white/5 hover:text-gold',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && !isOwner && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-[21px] font-black text-cream">
                    الحجوزات القادمة
                  </h2>
                  <p className="mt-1.5 text-[10.5px] text-cream/35">
                    أحدث الحجوزات المتاحة للعرض دون بيانات الاتصال الخاصة بالزبائن.
                  </p>
                </div>

                {allBookings.length > 0 ? (
                  <div className="space-y-4">
                    {(showAllUpcoming
                      ? allBookings
                      : allBookings.slice(0, 3)
                    ).map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="glass-panel rounded-[22px] p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/22 bg-gold/12">
                              <Scissors className="h-5 w-5 text-gold" />
                            </div>

                            <div>
                              <h3 className="text-[15px] font-bold text-cream">
                                {booking.salonName}
                              </h3>

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cream/48">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-gold/62" />
                                  {formatDateAr(booking.date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 text-gold/62" />
                                  {booking.time}
                                </span>
                                {booking.barberName && (
                                  <span className="flex items-center gap-1.5">
                                    <Users className="h-3 w-3 text-gold/62" />
                                    {booking.barberName}
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {booking.services.map((service, index) => (
                                  <span
                                    key={`${booking.id}-${service.id || index}`}
                                    className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-[9.5px] font-semibold text-cream/52"
                                  >
                                    {service.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-brand/24 bg-emerald-brand/12 px-3 py-1.5 text-[10px] font-bold text-emerald-brand">
                              <CheckCircle2 className="h-3 w-3" />
                              {booking.status}
                            </span>
                            <p className="mt-3 text-[18px] font-black text-gold">
                              {formatPrice(booking.totalPrice)} دج
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllUpcoming((value) => !value)}
                        className="inline-flex items-center gap-2.5 rounded-2xl border border-gold/28 bg-gold/7 px-7 py-3.5 text-[12px] font-bold text-gold transition-all hover:border-gold/42 hover:bg-gold/12"
                      >
                        {showAllUpcoming
                          ? 'إظهار آخر 3 حجوزات'
                          : 'عرض كل الحجوزات القادمة'}
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="لا توجد حجوزات نشطة حالياً"
                    description="اختر الخدمة والوقت المناسب في صفحة الصالونات لتحصل على حجز مؤكد."
                    actionLabel="احجز موعدك الآن"
                    actionTo="/salons"
                  />
                )}
              </div>

              <div className="space-y-6">
                <div className="glass-panel overflow-hidden rounded-[22px]">
                  <div className="relative h-[112px]">
                    <img
                      src="/images/style-1.jpg"
                      alt=""
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/32 to-transparent" />
                  </div>

                  <div className="-mt-10 px-6 pb-6">
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border-[3px] border-forest bg-gradient-to-br from-gold-light to-gold-dark">
                      <span className="text-[24px] font-black text-ink">
                        {user?.name?.charAt(0) || '?'}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[16px] font-black text-cream">
                      {user?.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-cream/42" dir="ltr">
                      {user?.email}
                    </p>
                    <p className="mt-1 text-[11px] text-cream/42" dir="ltr">
                      {user?.phone}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-5">
                      <span className="rounded-full border border-gold/22 bg-gold/12 px-3 py-1.5 text-[9.5px] font-bold text-gold">
                        عضو منذ{' '}
                        {new Date(user?.createdAt ?? Date.now()).getFullYear()}
                      </span>
                      <span className="rounded-full border border-emerald-brand/22 bg-emerald-brand/12 px-3 py-1.5 text-[9.5px] font-bold text-emerald-brand">
                        حساب موثّق
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-[22px] p-6">
                  <h3 className="mb-5 text-[14px] font-bold text-cream">
                    إحصائيات المنصة
                  </h3>
                  <div className="space-y-4">
                    {STATS.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-[11px] text-cream/48">
                          {stat.label}
                        </span>
                        <span className="text-[12px] font-black text-gold">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[22px] p-6">
                  <h3 className="mb-4 text-[14px] font-bold text-cream">
                    آخر التحديثات
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-4 w-4 text-gold" />
                      <div>
                        <p className="text-[11.5px] font-bold text-cream">
                          اكتشف صالونات جديدة
                        </p>
                        <p className="mt-1 text-[10px] text-cream/42">
                          تصفح الخدمات واختر الموعد الذي يناسبك.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="mt-0.5 h-4 w-4 text-gold" />
                      <div>
                        <p className="text-[11.5px] font-bold text-cream">
                          احفظ صالوناتك المفضلة
                        </p>
                        <p className="mt-1 text-[10px] text-cream/42">
                          ارجع إليها بسهولة من تبويب المفضلة.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal bookings */}
          {activeTab === 'bookings' && !isOwner && (
            <div>
              <h2 className="mb-6 text-[21px] font-black text-cream">
                جميع حجوزاتي
              </h2>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.04 }}
                      className="glass-panel rounded-[22px] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/22 bg-gold/12">
                            <Scissors className="h-5 w-5 text-gold" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-[15px] font-bold text-cream">
                                {booking.salonName}
                              </h3>
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[9px] font-bold',
                                  booking.status === 'مؤكد'
                                    ? 'border-emerald-brand/24 bg-emerald-brand/12 text-emerald-brand'
                                    : booking.status === 'ملغى'
                                      ? 'border-red-400/24 bg-red-500/12 text-red-300'
                                      : 'border-gold/24 bg-gold/12 text-gold',
                                )}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cream/48">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-gold/62" />
                                {formatDateAr(booking.date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-gold/62" />
                                {booking.time}
                              </span>
                              {booking.barberName && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3 w-3 text-gold/62" />
                                  {booking.barberName}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {booking.services.map((service, index) => (
                                <span
                                  key={`${booking.id}-${service.id || index}`}
                                  className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-[9.5px] font-semibold text-cream/52"
                                >
                                  {service.name} — {formatPrice(service.price)} دج
                                </span>
                              ))}
                            </div>

                            <p className="mt-2.5 text-[9px] text-cream/32" dir="ltr">
                              كود الحجز: {booking.code || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-3">
                          <p className="text-[19px] font-black text-gold">
                            {formatPrice(booking.totalPrice)} دج
                          </p>

                          {booking.discount > 0 && (
                            <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-brand">
                              <Tag className="h-3 w-3" />
                              {booking.promoCode
                                ? `${booking.promoCode} · `
                                : ''}
                              -{formatPrice(booking.discount)} دج
                            </p>
                          )}

                          {booking.status === 'مؤكد' && (
                            <button
                              type="button"
                              onClick={() => void cancelBooking(booking.id)}
                              className="flex items-center gap-1.5 rounded-xl border border-red-400/24 px-4 py-2 text-[10.5px] font-bold text-red-300/90 transition-all hover:bg-red-500/12"
                            >
                              <XCircle className="h-3 w-3" />
                              إلغاء الحجز
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="لا توجد حجوزات بعد"
                  description="لم تقم بأي حجز حتى الآن. اكتشف الصالونات واحجز موعدك الأول."
                  actionLabel="تصفح الصالونات"
                  actionTo="/salons"
                />
              )}
            </div>
          )}

          {/* Shared historical bookings */}
          {activeTab === 'history' && !isOwner && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-[21px] font-black text-cream">
                    الحجوزات القديمة
                  </h2>
                  <p className="mt-2 text-[11px] leading-relaxed text-cream/42">
                    سجل الحجوزات السابقة في المنصة دون عرض بيانات الاتصال الخاصة بالزبائن.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void refreshSharedHistoricalBookings()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/28 bg-gold/7 px-4 py-2.5 text-[11px] font-bold text-gold transition-all hover:bg-gold/12"
                >
                  <Clock className="h-3.5 w-3.5" />
                  تحديث السجل
                </button>
              </div>

              {sharedHistoricalBookings.length > 0 ? (
                <div className="space-y-4">
                  {sharedHistoricalBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(index * 0.04, 0.3),
                      }}
                      className="glass-panel rounded-[22px] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/22 bg-gold/12">
                            <Scissors className="h-5 w-5 text-gold" />
                          </div>

                          <div>
                            <h3 className="text-[15px] font-bold text-cream">
                              {booking.salonName || 'صالون'}
                            </h3>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cream/48">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-gold/62" />
                                {formatDateAr(booking.date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-gold/62" />
                                {booking.time || '—'}
                              </span>
                              {booking.barberName && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3 w-3 text-gold/62" />
                                  {booking.barberName}
                                </span>
                              )}
                            </div>

                            {booking.services.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {booking.services.map((service, index) => (
                                  <span
                                    key={`${booking.id}-${service.id || index}`}
                                    className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-[9.5px] font-semibold text-cream/52"
                                  >
                                    {service.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-3">
                          <span
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-[10px] font-bold',
                              booking.status === 'مؤكد'
                                ? 'border-emerald-brand/24 bg-emerald-brand/12 text-emerald-brand'
                                : booking.status === 'ملغى'
                                  ? 'border-red-400/24 bg-red-500/12 text-red-300'
                                  : 'border-gold/24 bg-gold/12 text-gold',
                            )}
                          >
                            {booking.status || 'غير محدد'}
                          </span>

                          <p className="text-[18px] font-black text-gold">
                            {formatPrice(booking.totalPrice)} دج
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel rounded-[22px] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/22 bg-gold/12">
                    <Calendar className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="mt-4 text-[14px] font-bold text-cream">
                    لا توجد حجوزات قديمة لعرضها
                  </h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-cream/42">
                    ستظهر هنا الحجوزات التي يكون تاريخها قبل اليوم عند توفرها في السجل المشترك.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Favorites */}
          {activeTab === 'favorites' && !isOwner && (
            <div>
              <h2 className="mb-6 text-[21px] font-black text-cream">
                الصالونات المفضلة
              </h2>

              {favorites.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {SALONS.filter((salon) => favorites.includes(salon.id)).map(
                    (salon, index) => (
                      <motion.div
                        key={salon.id}
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: index * 0.06 }}
                        className="glass-panel group overflow-hidden rounded-[22px]"
                      >
                        <div className="relative h-[168px] overflow-hidden">
                          <img
                            src={salon.image}
                            alt={salon.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-black/48 px-2.5 py-1.5">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            <span className="text-[10.5px] font-black text-white">
                              {salon.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="text-[14px] font-bold text-cream">
                            {salon.name}
                          </h3>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-cream/42">
                            <MapPin className="h-3 w-3 text-gold/62" />
                            {salon.neighborhood}، الجزائر العاصمة
                          </p>
                          <div className="mt-3">
                            <Stars
                              rating={salon.rating}
                              size="sm"
                              showValue={false}
                            />
                          </div>
                          <Link
                            to={`/salon/${salon.slug}`}
                            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gold/24 bg-gold/12 py-2.5 text-[11px] font-bold text-gold transition-all hover:bg-gold hover:text-ink"
                          >
                            عرض التفاصيل
                            <ArrowLeft className="h-3 w-3" />
                          </Link>
                        </div>
                      </motion.div>
                    ),
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="لا توجد صالونات مفضلة"
                  description="أضف الصالونات التي تعجبك إلى المفضلة للوصول إليها بسرعة."
                  actionLabel="تصفح الصالونات"
                  actionTo="/salons"
                />
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h2 className="mb-6 text-[21px] font-black text-cream">
                إعدادات الحساب
              </h2>

              {isOwner ? (
                <>
                  <div className="glass-panel mb-6 overflow-hidden rounded-[22px]">
                    <div className="relative h-[112px]">
                      <img
                        src="/images/style-1.jpg"
                        alt=""
                        className="h-full w-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/32 to-transparent" />
                    </div>

                    <div className="-mt-10 px-6 pb-6">
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border-[3px] border-forest bg-gradient-to-br from-gold-light to-gold-dark">
                        <span className="text-[24px] font-black text-ink">
                          {profileForm.name.charAt(0) || '?'}
                        </span>
                      </div>

                      <h3 className="mt-4 text-[16px] font-black text-cream">
                        {profileForm.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-cream/42" dir="ltr">
                        {profileForm.email}
                      </p>
                      <p className="mt-1 text-[11px] text-cream/42" dir="ltr">
                        {profileForm.phone || 'لا يوجد رقم هاتف'}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={saveProfile}
                    className="glass-panel overflow-hidden rounded-[22px]"
                  >
                    <div className="border-b border-white/7 px-7 py-6">
                      <h3 className="text-[15px] font-bold text-cream">
                        المعلومات الشخصية
                      </h3>
                      <p className="mt-1.5 text-[11px] text-cream/42">
                        قم بتحديث معلومات حسابك الشخصية.
                      </p>
                    </div>

                    <div className="space-y-5 px-7 py-7">
                      <div>
                        <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="field"
                          autoComplete="name"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="field"
                          dir="ltr"
                          autoComplete="email"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          className="field"
                          dir="ltr"
                          autoComplete="tel"
                        />
                      </div>

                      <div className="border-t border-white/7 pt-5">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="btn-gold inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {profileSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {profileSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="glass-panel mt-6 rounded-[22px] border border-red-400/16 p-7">
                    <h3 className="text-[14px] font-bold text-red-300">
                      منطقة الخطر
                    </h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-cream/42">
                      طلب حذف الحساب لا يؤدي إلى الحذف مباشرة. سيتم إرسال الطلب إلى الإدارة للمراجعة قبل اتخاذ أي إجراء.
                    </p>

                    {hasPendingDeletionRequest ? (
                      <div className="mt-5 rounded-2xl border border-gold/18 bg-gold/8 p-4">
                        <p className="text-[11.5px] font-bold text-gold">
                          طلب حذف قيد المراجعة
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-cream/42">
                          لديك بالفعل طلب حذف حساب قيد المراجعة من طرف الإدارة.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteModal(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-red-400/26 px-6 py-3 text-[12px] font-bold text-red-300/90 transition-all hover:bg-red-500/11"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        طلب حذف الحساب
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-panel overflow-hidden rounded-[22px]">
                  <div className="border-b border-white/7 px-7 py-6">
                    <h3 className="text-[15px] font-bold text-cream">
                      المعلومات الشخصية
                    </h3>
                    <p className="mt-1.5 text-[11px] text-cream/42">
                      معلومات حسابك الحالية.
                    </p>
                  </div>

                  <div className="space-y-5 px-7 py-7">
                    <div>
                      <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        value={user?.name ?? ''}
                        className="field"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={user?.email ?? ''}
                        className="field"
                        dir="ltr"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={user?.phone ?? ''}
                        className="field"
                        dir="ltr"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Account deletion request modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteSubmitting) {
              setDeleteModal(false)
            }
          }}
        >
          <div
            className="glass-panel-strong w-full max-w-lg overflow-hidden rounded-[26px] border border-red-400/20"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-5 border-b border-white/7 px-7 py-6">
              <div>
                <h3 className="text-[17px] font-black text-red-300">
                  طلب حذف الحساب
                </h3>
                <p className="mt-2 text-[11px] leading-relaxed text-cream/42">
                  سيتم إرسال طلبك إلى الإدارة للمراجعة. لن يتم حذف حسابك مباشرة.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                disabled={deleteSubmitting}
                aria-label="إغلاق النافذة"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-cream/55 transition-all hover:border-white/15 hover:text-cream disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitDeletionRequest} className="px-7 py-7">
              <label className="mb-2.5 block text-[11px] font-semibold text-cream/58">
                سبب طلب حذف الحساب
              </label>

              <textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="اكتب سبب طلب حذف حسابك..."
                rows={5}
                className="field resize-none"
                disabled={deleteSubmitting}
                required
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={deleteSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-500/12 px-6 py-3.5 text-[12px] font-bold text-red-300 transition-all hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {deleteSubmitting
                    ? 'جاري إرسال الطلب...'
                    : 'إرسال طلب الحذف'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(false)}
                  disabled={deleteSubmitting}
                  className="flex-1 rounded-2xl border border-white/10 px-6 py-3.5 text-[12px] font-bold text-cream/65 transition-all hover:border-gold/25 hover:text-gold disabled:opacity-60"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}