import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  RefreshCw,
  MapPin,
  Phone,
  Scissors,
  Clock,
  Eye,
  Users,
  Image as ImageIcon,
  Instagram,
  Facebook,
  MessageCircle,
  CalendarDays,
  Store,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../lib/store'
import type { Salon } from '../lib/types'
import type { ReactNode } from 'react'

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ').format(price)
}

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

export default function AdminSalonsPage() {
  const {
    user,
    isAdmin,
    pendingSalons,
    loadPendingSalons,
    approveSalon,
    rejectSalon,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)

  /*
   * --------------------------------------------------------------------------
   * Load pending salons
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!isAdmin) return

    const load = async () => {
      setLoading(true)
      await loadPendingSalons()
      setLoading(false)
    }

    void load()
  }, [isAdmin, loadPendingSalons])

  /*
   * --------------------------------------------------------------------------
   * Escape key
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedSalon) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSalon(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedSalon])

  /*
   * --------------------------------------------------------------------------
   * Keep selected salon updated
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedSalon) return

    const updatedSalon = pendingSalons.find(
      (salon) => salon.id === selectedSalon.id,
    )

    if (updatedSalon) {
      setSelectedSalon(updatedSalon)
    }
  }, [pendingSalons, selectedSalon])

  /*
   * --------------------------------------------------------------------------
   * Authentication
   * --------------------------------------------------------------------------
   */

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  /*
   * --------------------------------------------------------------------------
   * Approve salon
   * --------------------------------------------------------------------------
   */

  const handleApprove = async (salonId: string) => {
    setProcessingId(salonId)

    const result = await approveSalon(salonId)

    setProcessingId(null)

    if (!result.ok) {
      alert(result.error || 'حدث خطأ أثناء الموافقة')
      return
    }

    setSelectedSalon(null)
  }

  /*
   * --------------------------------------------------------------------------
   * Reject salon
   * --------------------------------------------------------------------------
   */

  const handleReject = async (salonId: string) => {
    const confirmed = window.confirm(
      'هل أنت متأكد من رفض هذا الصالون؟',
    )

    if (!confirmed) return

    setProcessingId(salonId)

    const result = await rejectSalon(salonId)

    setProcessingId(null)

    if (!result.ok) {
      alert(result.error || 'حدث خطأ أثناء الرفض')
      return
    }

    setSelectedSalon(null)
  }

  /*
   * --------------------------------------------------------------------------
   * Gallery helper
   * --------------------------------------------------------------------------
   */

  const getGalleryImages = (salon: Salon): string[] => {
    const images = [
      salon.image,
      salon.logo,
      ...(salon.gallery || []),
    ]

    return Array.from(
      new Set(
        images.filter(
          (image): image is string =>
            typeof image === 'string' &&
            image.trim().length > 0,
        ),
      ),
    )
  }

  /*
   * --------------------------------------------------------------------------
   * Loading
   * --------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-forest px-5 py-10 text-cream"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-gold/7 blur-[140px]" />
          <div className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-brand/6 blur-[140px]" />
        </div>

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/8">
              <RefreshCw
                className="animate-spin text-gold"
                size={28}
              />
            </div>

            <p className="mt-5 text-lg font-semibold text-cream">
              جاري تحميل طلبات الصالونات...
            </p>

            <p className="mt-2 text-sm text-cream/40">
              يرجى الانتظار قليلاً
            </p>
          </div>
        </div>
      </main>
    )
  }

  /*
   * --------------------------------------------------------------------------
   * Page
   * --------------------------------------------------------------------------
   */

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-forest px-4 py-10 text-cream sm:px-6 lg:px-8"
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[620px] w-[620px] rounded-full bg-gold/7 blur-[150px]" />

        <div className="absolute top-1/2 -left-48 h-[520px] w-[520px] rounded-full bg-emerald-brand/5 blur-[140px]" />

        <div className="absolute inset-0 hero-grid-bg opacity-20" />

        <div className="noise-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}

        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="mb-8"
        >
          <div className="glass-panel-strong overflow-hidden rounded-[28px] border border-gold/12 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/8 px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                  </span>

                  <span className="text-[11px] font-bold tracking-wide text-gold">
                    لوحة الإدارة
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                    <Store className="h-7 w-7 text-gold" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-cream sm:text-3xl">
                      إدارة الصالونات
                    </h1>

                    <p className="mt-1.5 text-sm leading-relaxed text-cream/45">
                      مراجعة طلبات الصالونات قبل الموافقة عليها
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadPendingSalons()
                }}
                className="btn-outline inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5"
              >
                <RefreshCw size={18} />
                تحديث الطلبات
              </button>
            </div>
          </div>
        </motion.header>

        {/* ================================================================ */}
        {/* PENDING COUNTER */}
        {/* ================================================================ */}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-10"
        >
          <div className="relative overflow-hidden rounded-[26px] border border-gold/20 bg-gradient-to-l from-gold/12 via-gold/6 to-transparent p-6">
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                <CalendarDays className="h-6 w-6 text-gold" />
              </div>

              <div>
                <p className="text-lg font-black text-cream">
                  الطلبات المعلقة
                </p>

                <p className="mt-1 text-sm text-cream/45">
                  يوجد حاليًا{' '}
                  <span className="font-black text-gold">
                    {pendingSalons.length}
                  </span>{' '}
                  طلب بانتظار المراجعة
                </p>
              </div>

              <div className="mr-auto flex h-12 min-w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/12 px-4">
                <span className="text-xl font-black text-gold">
                  {pendingSalons.length}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* EMPTY STATE */}
        {/* ================================================================ */}

        {pendingSalons.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="glass-panel rounded-[28px] border border-white/7 p-12 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/15 bg-gold/7">
              <Store className="h-9 w-9 text-gold/60" />
            </div>

            <h2 className="mt-6 text-2xl font-black text-cream">
              لا توجد طلبات معلقة
            </h2>

            <p className="mt-2 text-sm text-cream/40">
              جميع طلبات الصالونات تمت مراجعتها.
            </p>
          </motion.div>
        ) : (
          /* ================================================================ */
          /* SALON CARDS */
          /* ================================================================ */

          <div className="grid gap-7 lg:grid-cols-2">
            {pendingSalons.map((salon, index) => {
              const images = getGalleryImages(salon)

              return (
                <motion.article
                  key={salon.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={fadeUp}
                  custom={index}
                  className="group glass-panel overflow-hidden rounded-[28px] border border-white/7 card-hover"
                >
                  {/* Cover */}
                  <div className="relative h-64 overflow-hidden">
                    {salon.image ? (
                      <img
                        src={salon.image}
                        alt={salon.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-ink/50">
                        <ImageIcon
                          size={58}
                          className="text-cream/15"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

                    {/* Logo */}
                    {salon.logo && (
                      <div className="absolute bottom-5 right-5 h-20 w-20 overflow-hidden rounded-2xl border-2 border-gold/25 bg-white shadow-xl">
                        <img
                          src={salon.logo}
                          alt={`${salon.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Status */}
                    <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ink/75 px-4 py-2 text-xs font-black text-gold backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      قيد المراجعة
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-cream">
                          {salon.name}
                        </h2>

                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-cream/45">
                          {salon.description || 'لا يوجد وصف'}
                        </p>
                      </div>

                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/7 sm:flex">
                        <Store className="h-5 w-5 text-gold" />
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        icon={<MapPin size={17} />}
                        label="العنوان"
                        value={
                          salon.address ||
                          salon.neighborhood ||
                          'غير محدد'
                        }
                      />

                      <InfoItem
                        icon={<Phone size={17} />}
                        label="الهاتف"
                        value={salon.phone || 'غير محدد'}
                      />

                      <InfoItem
                        icon={<Scissors size={17} />}
                        label="الخدمات"
                        value={`${salon.services.length} خدمة`}
                      />

                      <InfoItem
                        icon={<Users size={17} />}
                        label="الحلاقون"
                        value={`${salon.barbers.length} حلاق`}
                      />
                    </div>

                    {/* Images count */}
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/7 bg-ink/35 px-4 py-3.5">
                      <div className="flex items-center gap-2.5 text-sm text-cream/55">
                        <ImageIcon
                          size={18}
                          className="text-gold"
                        />
                        صور الصالون
                      </div>

                      <span className="font-black text-gold">
                        {images.length}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_1fr_0.75fr]">
                      <button
                        type="button"
                        onClick={() => setSelectedSalon(salon)}
                        className="btn-outline inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm"
                      >
                        <Eye size={18} />
                        التفاصيل
                      </button>

                      <button
                        type="button"
                        disabled={processingId === salon.id}
                        onClick={() =>
                          void handleApprove(salon.id)
                        }
                        className="btn-gold inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check size={18} />
                        موافقة
                      </button>

                      <button
                        type="button"
                        disabled={processingId === salon.id}
                        onClick={() =>
                          void handleReject(salon.id)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/8 px-4 py-3.5 text-sm font-bold text-red-300 transition-all duration-300 hover:border-red-400/35 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X size={18} />
                        رفض
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* DETAILS MODAL */}
      {/* ================================================================== */}

      {selectedSalon && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSalon(null)
            }
          }}
        >
          <div className="mx-auto my-3 max-w-6xl overflow-hidden rounded-[30px] border border-gold/15 bg-forest shadow-2xl sm:my-8">
            {/* Modal header */}
            <div className="sticky top-0 z-20 border-b border-white/7 bg-forest/95 px-5 py-5 backdrop-blur-xl sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles
                      size={16}
                      className="text-gold"
                    />

                    <span className="text-[11px] font-bold text-gold">
                      تفاصيل الصالون
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-cream sm:text-2xl">
                    {selectedSalon.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSalon(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-cream/60 transition hover:border-gold/25 hover:bg-gold/10 hover:text-gold"
                >
                  <X size={21} />
                </button>
              </div>
            </div>

            <div className="space-y-10 p-5 sm:p-7">
              {/* ========================================================== */}
              {/* IMAGES */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<ImageIcon size={20} />}
                  title="صور الصالون"
                  count={getGalleryImages(selectedSalon).length}
                />

                {getGalleryImages(selectedSalon).length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {getGalleryImages(selectedSalon).map(
                      (image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group overflow-hidden rounded-[22px] border border-white/7 bg-ink/35"
                        >
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={image}
                              alt={`${selectedSalon.name} - ${index + 1}`}
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  'none'
                              }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />

                            <div className="absolute bottom-3 right-3 rounded-full border border-gold/20 bg-ink/70 px-3 py-1.5 text-[11px] font-bold text-gold backdrop-blur-md">
                              صورة {index + 1}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <EmptyText text="لا توجد صور لهذا الصالون" />
                )}
              </section>

              {/* ========================================================== */}
              {/* SALON INFORMATION */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<Store size={20} />}
                  title="معلومات الصالون"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={<Store size={18} />}
                    label="اسم الصالون"
                    value={selectedSalon.name}
                  />

                  <InfoItem
                    icon={<Scissors size={18} />}
                    label="النوع"
                    value={selectedSalon.type}
                  />

                  <InfoItem
                    icon={<MapPin size={18} />}
                    label="الولاية / المنطقة"
                    value={
                      selectedSalon.neighborhood ||
                      'غير محدد'
                    }
                  />

                  <InfoItem
                    icon={<MapPin size={18} />}
                    label="العنوان"
                    value={
                      selectedSalon.address ||
                      'غير محدد'
                    }
                  />

                  <InfoItem
                    icon={<Phone size={18} />}
                    label="الهاتف"
                    value={
                      selectedSalon.phone ||
                      'غير محدد'
                    }
                  />

                  <InfoItem
                    icon={<Clock size={18} />}
                    label="ساعات العمل"
                    value={
                      selectedSalon.workingHours ||
                      'حسب المواعيد'
                    }
                  />
                </div>

                <div className="mt-4 rounded-[22px] border border-white/7 bg-ink/30 p-5">
                  <p className="mb-2 text-xs font-semibold text-gold/65">
                    الوصف
                  </p>

                  <p className="leading-8 text-cream/60">
                    {selectedSalon.description ||
                      'لا يوجد وصف لهذا الصالون.'}
                  </p>
                </div>
              </section>

              {/* ========================================================== */}
              {/* SERVICES */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<Scissors size={20} />}
                  title="الخدمات"
                  count={selectedSalon.services.length}
                />

                {selectedSalon.services.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedSalon.services.map((service) => (
                      <div
                        key={service.id}
                        className="group rounded-[22px] border border-white/7 bg-ink/30 p-5 transition-all duration-300 hover:border-gold/20 hover:bg-gold/[0.025]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-black text-cream">
                              {service.name}
                            </h4>

                            <p className="mt-1.5 text-xs text-gold/55">
                              {service.category}
                            </p>
                          </div>

                          <span className="whitespace-nowrap text-lg font-black text-gold">
                            {formatPrice(service.price)}{' '}
                            <span className="text-xs font-semibold text-gold/55">
                              دج
                            </span>
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm text-cream/45">
                          <Clock size={15} />
                          {service.duration} دقيقة
                        </div>

                        {service.description && (
                          <p className="mt-3 text-sm leading-7 text-cream/45">
                            {service.description}
                          </p>
                        )}

                        {service.popular && (
                          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/8 px-3 py-1.5 text-[11px] font-bold text-gold">
                            <Sparkles size={12} />
                            خدمة مشهورة
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="لا توجد خدمات مسجلة لهذا الصالون" />
                )}
              </section>

              {/* ========================================================== */}
              {/* BARBERS */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<Users size={20} />}
                  title="الحلاقون"
                  count={selectedSalon.barbers.length}
                />

                {selectedSalon.barbers.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedSalon.barbers.map((barber) => (
                      <div
                        key={barber.id}
                        className="group overflow-hidden rounded-[22px] border border-white/7 bg-ink/30"
                      >
                        <div className="relative h-56 overflow-hidden bg-ink/50">
                          {barber.image ? (
                            <img
                              src={barber.image}
                              alt={barber.name}
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Users
                                size={50}
                                className="text-cream/15"
                              />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                        </div>

                        <div className="p-5">
                          <h4 className="text-lg font-black text-cream">
                            {barber.name}
                          </h4>

                          <p className="mt-1.5 text-sm font-semibold text-gold">
                            {barber.role}
                          </p>

                          <p className="mt-3 text-sm text-cream/45">
                            الخبرة:{' '}
                            <span className="text-cream/65">
                              {barber.experience}
                            </span>
                          </p>

                          <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold text-cream/35">
                              التخصصات
                            </p>

                            {barber.specialties.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {barber.specialties.map(
                                  (specialty, index) => (
                                    <span
                                      key={`${specialty}-${index}`}
                                      className="rounded-full border border-white/7 bg-white/4 px-3 py-1.5 text-[11px] text-cream/55"
                                    >
                                      {specialty}
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-cream/30">
                                لا توجد تخصصات
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="لا يوجد حلاقون مسجلون لهذا الصالون" />
                )}
              </section>

              {/* ========================================================== */}
              {/* WORKING HOURS */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<Clock size={20} />}
                  title="أوقات العمل"
                />

                <div className="rounded-[22px] border border-white/7 bg-ink/30 p-5">
                  {selectedSalon.workingHours ? (
                    <p className="leading-8 text-cream/60">
                      {selectedSalon.workingHours}
                    </p>
                  ) : (
                    <EmptyText text="لا توجد أوقات عمل مسجلة" />
                  )}
                </div>
              </section>

              {/* ========================================================== */}
              {/* CONTACT */}
              {/* ========================================================== */}

              <section>
                <SectionTitle
                  icon={<MessageCircle size={20} />}
                  title="التواصل"
                />

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <ContactRow
                    icon={<Phone size={18} />}
                    label="الهاتف"
                    value={
                      selectedSalon.phone ||
                      'غير متوفر'
                    }
                  />

                  <ContactRow
                    icon={<MessageCircle size={18} />}
                    label="واتساب"
                    value="متوفر من بيانات الصالون"
                  />

                  <ContactRow
                    icon={<Instagram size={18} />}
                    label="Instagram"
                    value="يظهر إذا كان مسجلاً"
                  />

                  <ContactRow
                    icon={<Facebook size={18} />}
                    label="Facebook"
                    value="يظهر إذا كان مسجلاً"
                  />
                </div>
              </section>

              {/* ========================================================== */}
              {/* FINAL ACTIONS */}
              {/* ========================================================== */}

              <section className="border-t border-white/7 pt-7">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={
                      processingId === selectedSalon.id
                    }
                    onClick={() =>
                      void handleApprove(selectedSalon.id)
                    }
                    className="btn-gold flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={20} />
                    الموافقة على الصالون
                  </button>

                  <button
                    type="button"
                    disabled={
                      processingId === selectedSalon.id
                    }
                    onClick={() =>
                      void handleReject(selectedSalon.id)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/8 px-5 py-4 font-black text-red-300 transition-all duration-300 hover:border-red-400/35 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={20} />
                    رفض الصالون
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/*
 * ============================================================================
 * SECTION TITLE
 * ============================================================================
 */

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: ReactNode
  title: string
  count?: number
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/15 bg-gold/7 text-gold">
          {icon}
        </span>

        <h3 className="text-xl font-black text-cream">
          {title}
        </h3>
      </div>

      {typeof count === 'number' && (
        <span className="rounded-full border border-gold/20 bg-gold/8 px-3 py-1 text-xs font-black text-gold">
          {count}
        </span>
      )}
    </div>
  )
}

/*
 * ============================================================================
 * INFO ITEM
 * ============================================================================
 */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-white/7 bg-ink/25 p-4 transition-all duration-300 hover:border-gold/15">
      <div className="mb-2.5 flex items-center gap-2 text-gold">
        {icon}

        <span className="text-[11px] font-semibold text-cream/35">
          {label}
        </span>
      </div>

      <p className="break-words text-sm font-semibold leading-6 text-cream/70">
        {value}
      </p>
    </div>
  )
}

/*
 * ============================================================================
 * CONTACT ROW
 * ============================================================================
 */

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/7 bg-ink/25 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/7 text-gold">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-cream/30">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-cream/60">
          {value}
        </p>
      </div>
    </div>
  )
}

/*
 * ============================================================================
 * EMPTY TEXT
 * ============================================================================
 */

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-ink/25 p-8 text-center text-sm text-cream/35">
      {text}
    </div>
  )
}