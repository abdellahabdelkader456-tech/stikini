import { FormEvent, useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { motion } from 'framer-motion'

import {
  Calendar,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Wallet,
  Users,
  CalendarCheck,
  Scissors,
  Heart,
  Settings,
  Bell,
  Store,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Tag,
  Loader2,
} from 'lucide-react'

import { useStore } from '../lib/store'

import { SALONS, STATS } from '../lib/data'

import { formatDateAr, formatPrice, cn } from '../lib/utils'

import { EmptyState, Stars } from '../components/SalonCard'

import { supabase } from '../lib/supabase'

export default function DashboardPage() {
  const {
    user,
    bookings,
    allBookings,
    favorites,
    cancelBooking,
    showToast,
  } = useStore()

  const isOwner = user?.type === 'owner'

  const [activeTab, setActiveTab] = useState<
    'overview' | 'bookings' | 'favorites' | 'settings'
  >(isOwner ? 'settings' : 'overview')

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

    const checkDeletionRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('account_deletion_requests')
          .select('id,status')
          .eq('user_id', user.id)
          .in('status', ['pending', 'postponed'])
          .maybeSingle()

        if (error) {
          console.error('Deletion request check error:', error)
          return
        }

        setHasPendingDeletionRequest(Boolean(data))
      } catch (error) {
        console.error('Deletion request check error:', error)
      }
    }

    checkDeletionRequest()
  }, [user, isOwner])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()

    if (!user || !isOwner) return

    const name = profileForm.name.trim()
    const email = profileForm.email.trim()
    const phone = profileForm.phone.trim()

    if (!name) {
      showToast('يرجى إدخال الاسم الكامل', 'error')
      return
    }

    if (!email) {
      showToast('يرجى إدخال البريد الإلكتروني', 'error')
      return
    }

    setProfileSaving(true)

    try {
      const emailChanged =
        email.toLowerCase() !== user.email.toLowerCase()

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email,
        })

        if (authError) {
          throw authError
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          email,
          phone: phone || null,
        })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      setProfileForm({
        name,
        email,
        phone,
      })

      if (emailChanged) {
        showToast(
          'تم حفظ المعلومات. قد يطلب منك تأكيد البريد الإلكتروني الجديد.',
          'success',
        )
      } else {
        showToast('تم تحديث معلومات الحساب بنجاح.', 'success')
      }
    } catch (error) {
      console.error('Profile update error:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'تعذر تحديث معلومات الحساب'

      showToast(message, 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  async function submitDeletionRequest(event: FormEvent) {
    event.preventDefault()

    if (!user || !isOwner) return

    const reason = deleteReason.trim()

    if (!reason) {
      showToast('يرجى كتابة سبب طلب حذف الحساب', 'error')
      return
    }

    setDeleteSubmitting(true)

    try {
      const { data: existingRequest, error: existingError } =
        await supabase
          .from('account_deletion_requests')
          .select('id,status')
          .eq('user_id', user.id)
          .in('status', ['pending', 'postponed'])
          .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existingRequest) {
        setHasPendingDeletionRequest(true)
        setDeleteModal(false)

        showToast(
          'لديك بالفعل طلب حذف قيد المراجعة.',
          'error',
        )

        return
      }

      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason,
          status: 'pending',
        })

      if (error) {
        throw error
      }

      setDeleteReason('')
      setDeleteModal(false)
      setHasPendingDeletionRequest(true)

      showToast(
        'تم إرسال طلب حذف الحساب إلى الإدارة للمراجعة.',
        'success',
      )
    } catch (error) {
      console.error('Deletion request error:', error)

      showToast(
        'تعذر إرسال طلب حذف الحساب.',
        'error',
      )
    } finally {
      setDeleteSubmitting(false)
    }
  }

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
                <Store className="w-3.5 h-3.5" />

                {isOwner ? 'حساب صاحب صالون' : 'حساب زبون'}
              </span>

              <h1 className="mt-5 text-[clamp(2.15rem,4.8vw,3.25rem)] font-black text-cream leading-[1.26]">
                مرحباً،{' '}
                <span className="text-gradient-gold">
                  {user?.name}
                </span>{' '}
                👋
              </h1>

              <p className="mt-4 text-cream/52 text-[15.5px] leading-[1.95]">
                {isOwner
                  ? 'أدر حجوزاتك وفريق عملك وتقييماتك من مكان واحد.'
                  : 'تابع حجوزاتك، اكتشف صالونات جديدة، واحجز موعدك القادم بسهولة.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isOwner && (
                <Link
                  to="/salons"
                  className="btn-gold inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[13.5px]"
                >
                  <CalendarCheck className="w-4.5 h-4.5" />
                  احجز موعد جديد
                </Link>
              )}

              {!isOwner && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-white/11 text-cream/72 font-bold text-[13px] hover:border-gold/38 hover:text-gold transition-all"
                >
                  <Settings className="w-4 h-4" />
                  إعدادات الحساب
                </button>
              )}
            </div>
          </div>

          {!isOwner && (
            <div className="mt-11 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.58,
                    delay: index * 0.09,
                  }}
                  className="glass-panel rounded-[22px] p-6"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: stat.bg,
                      border: `1px solid ${stat.color}33`,
                    }}
                  >
                    <stat.icon
                      className="w-5 h-5"
                      style={{ color: stat.color }}
                    />
                  </div>

                  <p className="mt-5 text-cream/42 text-[11px] font-semibold">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-[26px] font-black text-cream leading-none">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {!isOwner && (
            <div className="flex flex-wrap gap-2.5 p-2 rounded-[22px] bg-white/3 border border-white/7 w-fit mb-9">
              {[
                {
                  key: 'overview' as const,
                  label: 'نظرة عامة',
                  icon: BarChart3,
                },
                {
                  key: 'bookings' as const,
                  label: 'حجوزاتي',
                  icon: Calendar,
                },
                {
                  key: 'favorites' as const,
                  label: 'المفضلة',
                  icon: Heart,
                },
                {
                  key: 'settings' as const,
                  label: 'الإعدادات',
                  icon: Settings,
                },
              ].map((tab) => {
                const Icon = tab.icon

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all',
                      activeTab === tab.key
                        ? 'bg-gold text-ink shadow-gold-soft'
                        : 'text-cream/56 hover:text-gold hover:bg-white/5',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-[21px] font-black text-cream">
                      الحجوزات القادمة
                    </h2>

                    <p className="mt-1.5 text-cream/35 text-[10.5px]">
                      أحدث حجوزات المنصة المؤكدة — بدون بيانات الاتصال الخاصة بالزبائن الآخرين.
                    </p>
                  </div>
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
                        transition={{
                          duration: 0.52,
                          delay: index * 0.09,
                        }}
                        className="glass-panel rounded-[22px] p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div className="flex items-start gap-4">
                            <div className="w-13 h-13 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                              <Scissors className="w-5 h-5 text-gold" />
                            </div>

                            <div>
                              <h3 className="text-cream text-[15.5px] font-bold">
                                {booking.salonName}
                              </h3>

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                                <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                  <Calendar className="w-3 h-3 text-gold/62" />
                                  {formatDateAr(booking.date)}
                                </span>

                                <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                  <Clock className="w-3 h-3 text-gold/62" />
                                  {booking.time}
                                </span>

                                <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                  <Users className="w-3 h-3 text-gold/62" />
                                  {booking.barberName}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {booking.services.map((service) => (
                                  <span
                                    key={service.id}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-cream/52 text-[9.5px] font-semibold"
                                  >
                                    {service.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-brand/12 border border-emerald-brand/24 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-brand" />

                              <span className="text-emerald-brand text-[10px] font-bold">
                                {booking.status}
                              </span>
                            </div>

                            <p className="mt-3 text-gold font-black text-[18px]">
                              {formatPrice(booking.totalPrice)} دج
                            </p>

                            <p
                              className="mt-1 text-cream/32 text-[9px]"
                              dir="ltr"
                            >
                              {booking.code}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllUpcoming((value) => !value)
                        }
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border border-gold/28 bg-gold/7 text-gold text-[12px] font-bold hover:bg-gold/12 hover:border-gold/42 transition-all"
                      >
                        {showAllUpcoming
                          ? 'إظهار آخر 3 حجوزات'
                          : 'عرض كل الحجوزات القادمة'}

                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="لا توجد حجوزات نشطة حالياً"
                    description="اختر الخدمة والوقت المناسب في صفحة الصالونات لتحصل على حجز مؤكد فوراً."
                    actionLabel="احجز موعدك الآن"
                    actionTo="/salons"
                  />
                )}
              </div>

              <div className="space-y-6">
                <div className="glass-panel rounded-[22px] overflow-hidden">
                  <div className="relative h-[112px]">
                    <img
                      src="/images/style-1.jpg"
                      alt=""
                      className="w-full h-full object-cover opacity-62"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/32 to-transparent" />
                  </div>

                  <div className="px-6 pb-6 -mt-10">
                    <div className="w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-gold-light to-gold-dark border-[3px] border-forest flex items-center justify-center">
                      <span className="text-ink text-[24px] font-black">
                        {user?.name?.charAt(0)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-cream text-[16px] font-black">
                      {user?.name}
                    </h3>

                    <p
                      className="mt-1 text-cream/42 text-[11px]"
                      dir="ltr"
                    >
                      {user?.email}
                    </p>

                    <p
                      className="mt-1 text-cream/42 text-[11px]"
                      dir="ltr"
                    >
                      {user?.phone}
                    </p>

                    <div className="mt-5 pt-5 border-t border-white/8">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-gold/12 border border-gold/22 text-gold text-[9.5px] font-bold">
                          عضو منذ{' '}
                          {new Date(
                            user?.createdAt ?? Date.now(),
                          ).getFullYear()}
                        </span>

                        <span className="px-3 py-1.5 rounded-full bg-emerald-brand/12 border border-emerald-brand/22 text-emerald-brand text-[9.5px] font-bold">
                          حساب موثّق
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-[22px] p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                      <Bell className="w-4.5 h-4.5 text-gold" />
                    </span>

                    <h3 className="text-cream text-[14px] font-bold">
                      آخر التحديثات
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        icon: TrendingUp,
                        title: 'خصم 20% على باقات الحلاقة',
                        desc: 'لفترة محدودة في صالونات الجزائر العاصمة',
                        time: 'منذ ساعتين',
                        color: '#00bb7f',
                      },
                      {
                        icon: Star,
                        title: 'صالونات جديدة انضمت',
                        desc: 'اكتشف 5 صالونات جديدة في حي حيدرة',
                        time: 'منذ 5 ساعات',
                        color: '#d4af37',
                      },
                      {
                        icon: MessageCircle,
                        title: 'تذكير بالموعد',
                        desc: 'لديك موعد قادم — لا تنسَ إحضار رمز الحجز',
                        time: 'منذ يوم',
                        color: '#f5d77f',
                      },
                    ].map((notification) => (
                      <div
                        key={notification.title}
                        className="flex items-start gap-3.5"
                      >
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `${notification.color}18`,
                            border: `1px solid ${notification.color}2e`,
                          }}
                        >
                          <notification.icon
                            className="w-3.5 h-3.5"
                            style={{
                              color: notification.color,
                            }}
                          />
                        </span>

                        <div>
                          <p className="text-cream text-[11.5px] font-bold">
                            {notification.title}
                          </p>

                          <p className="mt-1 text-cream/42 text-[10px] leading-relaxed">
                            {notification.desc}
                          </p>

                          <p className="mt-1.5 text-cream/28 text-[9px]">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[22px] p-6">
                  <h3 className="text-cream text-[14px] font-bold mb-5">
                    إحصائيات المنصة
                  </h3>

                  <div className="space-y-4">
                    {STATS.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-cream/48 text-[11px]">
                          {stat.label}
                        </span>

                        <span className="text-gold text-[12px] font-black">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeTab === 'bookings' && (
            <div>
              <h2 className="text-[21px] font-black text-cream mb-6">
                جميع حجوزاتي
              </h2>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.52,
                        delay: index * 0.07,
                      }}
                      className="glass-panel rounded-[22px] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="flex items-start gap-4">
                          <div className="w-13 h-13 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                            <Scissors className="w-5 h-5 text-gold" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-cream text-[15px] font-bold">
                                {booking.salonName}
                              </h3>

                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-full text-[9px] font-bold border',
                                  booking.status === 'مؤكد'
                                    ? 'bg-emerald-brand/12 border-emerald-brand/24 text-emerald-brand'
                                    : booking.status === 'ملغى'
                                      ? 'bg-red-500/12 border-red-400/24 text-red-300'
                                      : 'bg-gold/12 border-gold/24 text-gold',
                                )}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                              <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                <Calendar className="w-3 h-3 text-gold/62" />
                                {formatDateAr(booking.date)}
                              </span>

                              <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                <Clock className="w-3 h-3 text-gold/62" />
                                {booking.time}
                              </span>

                              <span className="flex items-center gap-1.5 text-cream/48 text-[11px]">
                                <Users className="w-3 h-3 text-gold/62" />
                                {booking.barberName}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {booking.services.map((service) => (
                                <span
                                  key={service.id}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-cream/52 text-[9.5px] font-semibold"
                                >
                                  {service.name} —{' '}
                                  {formatPrice(service.price)} دج
                                </span>
                              ))}
                            </div>

                            <p
                              className="mt-2.5 text-cream/32 text-[9px]"
                              dir="ltr"
                            >
                              كود الحجز: {booking.code}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="flex flex-col items-end">
                            <p className="text-gold font-black text-[19px]">
                              {formatPrice(booking.totalPrice)} دج
                            </p>

                            {booking.discount > 0 && (
                              <p className="mt-1 flex items-center justify-end gap-1.5 text-emerald-brand text-[10px] font-bold">
                                <Tag className="w-3 h-3" />
                                {booking.promoCode} · -
                                {formatPrice(booking.discount)} دج
                              </p>
                            )}
                          </div>

                          {booking.status === 'مؤكد' && (
                            <button
                              onClick={() =>
                                cancelBooking(booking.id)
                              }
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-400/24 text-red-300/88 text-[10.5px] font-bold hover:bg-red-500/12 transition-all"
                            >
                              <XCircle className="w-3 h-3" />
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
                  description="لم تقم بأي حجز حتى الآن. اكتشف أفضل الصالونات في الجزائر العاصمة واحجز موعدك الأول."
                  actionLabel="تصفح الصالونات"
                  actionTo="/salons"
                />
              )}
            </div>
          )}

          {/* Favorites */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-[21px] font-black text-cream mb-6">
                الصالونات المفضلة
              </h2>

              {favorites.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SALONS.filter((salon) =>
                    favorites.includes(salon.id),
                  ).map((salon, index) => (
                    <motion.div
                      key={salon.id}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.55,
                        delay: index * 0.09,
                      }}
                      className="group glass-panel rounded-[22px] overflow-hidden card-hover"
                    >
                      <div className="relative h-[168px] overflow-hidden">
                        <img
                          src={salon.image}
                          alt={salon.name}
                          className="w-full h-full object-cover group-hover:scale-112 transition-transform duration-[850ms]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/22 to-transparent" />

                        <div className="absolute bottom-3 right-4 left-4">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/48 backdrop-blur-md border border-white/12 w-fit">
                            <Star className="w-3 h-3 fill-gold text-gold" />

                            <span className="text-white text-[10.5px] font-black">
                              {salon.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-cream text-[14px] font-bold">
                          {salon.name}
                        </h3>

                        <p className="mt-1.5 text-cream/42 text-[10px] flex items-center gap-1.5">
                          <MapPin className="w-2.5 h-2.5 text-gold/62" />
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
                          className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/12 border border-gold/24 text-gold text-[11px] font-bold hover:bg-gold hover:text-ink transition-all"
                        >
                          عرض التفاصيل
                          <ArrowLeft className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="لا توجد صالونات مفضلة"
                  description="أضف الصالونات التي تعجبك إلى المفضلة للوصول إليها بسرعة في أي وقت."
                  actionLabel="تصفح الصالونات"
                  actionTo="/salons"
                />
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h2 className="text-[21px] font-black text-cream mb-6">
                إعدادات الحساب
              </h2>

              {isOwner && (
                <>
                  {/* Owner profile card */}
                  <div className="glass-panel rounded-[22px] overflow-hidden mb-6">
                    <div className="relative h-[112px]">
                      <img
                        src="/images/style-1.jpg"
                        alt=""
                        className="w-full h-full object-cover opacity-62"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/32 to-transparent" />
                    </div>

                    <div className="px-6 pb-6 -mt-10">
                      <div className="w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-gold-light to-gold-dark border-[3px] border-forest flex items-center justify-center">
                        <span className="text-ink text-[24px] font-black">
                          {profileForm.name?.charAt(0) || '?'}
                        </span>
                      </div>

                      <h3 className="mt-4 text-cream text-[16px] font-black">
                        {profileForm.name}
                      </h3>

                      <p
                        className="mt-1 text-cream/42 text-[11px]"
                        dir="ltr"
                      >
                        {profileForm.email}
                      </p>

                      <p
                        className="mt-1 text-cream/42 text-[11px]"
                        dir="ltr"
                      >
                        {profileForm.phone || 'لا يوجد رقم هاتف'}
                      </p>

                      <div className="mt-5 pt-5 border-t border-white/8">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1.5 rounded-full bg-gold/12 border border-gold/22 text-gold text-[9.5px] font-bold">
                            عضو منذ{' '}
                            {new Date(
                              user?.createdAt ?? Date.now(),
                            ).getFullYear()}
                          </span>

                          <span className="px-3 py-1.5 rounded-full bg-emerald-brand/12 border border-emerald-brand/22 text-emerald-brand text-[9.5px] font-bold">
                            حساب موثّق
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal information */}
                  <form
                    onSubmit={saveProfile}
                    className="glass-panel rounded-[22px] overflow-hidden"
                  >
                    <div className="px-7 py-6 border-b border-white/7">
                      <h3 className="text-cream text-[15px] font-bold">
                        المعلومات الشخصية
                      </h3>

                      <p className="mt-1.5 text-cream/42 text-[11px]">
                        قم بتحديث معلومات حسابك الشخصية.
                      </p>
                    </div>

                    <div className="px-7 py-7 space-y-5">
                      <div>
                        <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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
                        />
                      </div>

                      <div>
                        <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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
                        />
                      </div>

                      <div>
                        <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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

                      <div className="pt-5 border-t border-white/7">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {profileSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}

                          {profileSaving
                            ? 'جاري الحفظ...'
                            : 'حفظ التغييرات'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Danger zone */}
                  <div className="mt-6 glass-panel rounded-[22px] p-7 border border-red-400/16">
                    <h3 className="text-red-300 text-[14px] font-bold">
                      منطقة الخطر
                    </h3>

                    <p className="mt-2 text-cream/42 text-[11px] leading-relaxed">
                      طلب حذف الحساب لا يؤدي إلى الحذف مباشرة.
                      سيتم إرسال الطلب إلى الإدارة للمراجعة قبل اتخاذ
                      أي إجراء.
                    </p>

                    {hasPendingDeletionRequest ? (
                      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gold/8 border border-gold/18 p-4">
                        <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />

                        <div>
                          <p className="text-gold text-[11.5px] font-bold">
                            طلب حذف قيد المراجعة
                          </p>

                          <p className="mt-1 text-cream/42 text-[10px] leading-relaxed">
                            لديك بالفعل طلب حذف حساب قيد المراجعة
                            من طرف الإدارة.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteModal(true)}
                        className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-400/26 text-red-300/88 text-[12px] font-bold hover:bg-red-500/11 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        طلب حذف الحساب
                      </button>
                    )}
                  </div>
                </>
              )}

              {!isOwner && (
                <div className="glass-panel rounded-[22px] overflow-hidden">
                  <div className="px-7 py-6 border-b border-white/7">
                    <h3 className="text-cream text-[15px] font-bold">
                      المعلومات الشخصية
                    </h3>

                    <p className="mt-1.5 text-cream/42 text-[11px]">
                      معلومات حسابك الحالية.
                    </p>
                  </div>

                  <div className="px-7 py-7 space-y-5">
                    <div>
                      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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
                      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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
                      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
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

      {/* Delete account request modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteModal(false)
            }
          }}
        >
          <div
            className="w-full max-w-lg glass-panel-strong rounded-[26px] border border-red-400/20 overflow-hidden"
            dir="rtl"
          >
            <div className="px-7 py-6 border-b border-white/7 flex items-start justify-between gap-5">
              <div>
                <h3 className="text-red-300 text-[17px] font-black">
                  طلب حذف الحساب
                </h3>

                <p className="mt-2 text-cream/42 text-[11px] leading-relaxed">
                  سيتم إرسال طلبك إلى الإدارة للمراجعة. لن يتم حذف
                  حسابك مباشرة.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-cream/55 hover:text-cream hover:border-white/15 transition-all"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={submitDeletionRequest}
              className="px-7 py-7"
            >
              <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
                سبب طلب حذف الحساب
              </label>

              <textarea
                value={deleteReason}
                onChange={(event) =>
                  setDeleteReason(event.target.value)
                }
                placeholder="اكتب سبب طلب حذف حسابك..."
                rows={5}
                className="field resize-none"
                disabled={deleteSubmitting}
              />

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={deleteSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-500/12 border border-red-400/25 text-red-300 text-[12px] font-bold hover:bg-red-500/18 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleteSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}

                  {deleteSubmitting
                    ? 'جاري إرسال الطلب...'
                    : 'إرسال طلب الحذف'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(false)}
                  disabled={deleteSubmitting}
                  className="flex-1 px-6 py-3.5 rounded-2xl border border-white/10 text-cream/65 text-[12px] font-bold hover:border-gold/25 hover:text-gold transition-all disabled:opacity-60"
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