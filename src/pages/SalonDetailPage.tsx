import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Star,
  Heart,
  Share2,
  BadgeCheck,
  CalendarCheck,
  Wallet,
  Users,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
} from 'lucide-react'
import { SITE } from '../lib/data'
import { useStore } from '../lib/store'
import { cn, formatPrice, formatDateAr } from '../lib/utils'
import { Stars, PriceLevel, EmptyState } from '../components/SalonCard'

export default function SalonDetailPage() {
const { slug } = useParams()

const {
  salons,
  isFavorite,
  toggleFavorite,
  showToast,
  user,
} = useStore()

const salon = salons.find((s) => s.slug === slug)
  const [activeTab, setActiveTab] = useState<'services' | 'team' | 'reviews' | 'gallery'>(
    'services',
  )
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!salon) {
    return <Navigate to="/salons" replace />
  }

  const fav = isFavorite(salon.id)

  return (
    <>
      {/* Hero */}
      <section className="relative pt-[120px] pb-0 overflow-hidden">
        <div className="absolute inset-0">
          <img src={salon.image} alt="" className="w-full h-full object-cover opacity-[0.26]" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/92 via-forest/82 to-forest" />
        </div>
        <div className="absolute top-0 right-1/3 w-[520px] h-[520px] rounded-full bg-gold/10 blur-[130px]" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <nav className="flex items-center gap-2.5 text-[12.5px] text-cream/42 mb-8">
            <Link to="/" className="hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold/50">/</span>
            <Link to="/salons" className="hover:text-gold transition-colors">
              الصالونات
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">{salon.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* Main image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75 }}
              className="lg:w-[54%] shrink-0"
            >
              <div className="relative rounded-[28px] overflow-hidden gold-ring">
                <img
                  src={salon.image}
                  alt={salon.name}
                  className="w-full h-[340px] sm:h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />

                <div className="absolute top-5 right-5 flex flex-col gap-2.5">
                  {salon.featured && (
                    <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold text-ink text-[11px] font-black">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      صالون مميّز
                    </span>
                  )}
                  {salon.verified && (
                    <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-brand/22 border border-emerald-brand/32 text-emerald-brand text-[11px] font-bold backdrop-blur-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      موثّق 100%
                    </span>
                  )}
                </div>

                <div className="absolute bottom-5 right-5 left-5 flex items-end justify-between gap-4">
                  <div>
                    <span
                      className={cn(
                        'px-3.5 py-2 rounded-full text-[11px] font-bold backdrop-blur-md border',
                        salon.isOpen
                          ? 'bg-emerald-brand/22 text-emerald-brand border-emerald-brand/32'
                          : 'bg-red-500/22 text-red-300 border-red-400/28',
                      )}
                    >
                      {salon.isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/48 backdrop-blur-md border border-white/12">
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <span className="text-white font-black text-[13.5px]">
                      {salon.rating.toFixed(1)}
                    </span>
                    <span className="text-white/52 text-[11px]">
                      ({salon.reviewsCount} تقييم)
                    </span>
                  </div>
                </div>
              </div>

              {/* Gallery strip */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                {salon.gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className="relative h-[74px] rounded-2xl overflow-hidden border border-white/8 hover:border-gold/42 transition-all group"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-112 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-ink/22 group-hover:bg-ink/5 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: -26 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.14 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-full bg-gold/12 border border-gold/22 text-gold text-[11px] font-bold">
                  صالون {salon.type}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/8 text-cream/52 text-[11px] font-semibold">
                  منذ {salon.established}
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(1.95rem,4.4vw,2.95rem)] font-black text-cream leading-[1.3]">
                {salon.name}
              </h1>
              <p className="mt-3 text-gold/82 text-[16px] font-semibold">{salon.tagline}</p>
              <p className="mt-5 text-cream/55 text-[15px] leading-[2.1]">
                {salon.description}
              </p>

              {/* Quick info */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="glass-panel rounded-2xl p-4.5 flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-gold" />
                  </span>
                  <div>
                    <p className="text-cream/42 text-[10.5px] font-semibold mb-1">العنوان</p>
                    <p className="text-cream/78 text-[12.5px] leading-relaxed">
                      {salon.address}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4.5 flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <Phone className="w-4.5 h-4.5 text-gold" />
                  </span>
                  <div>
                    <p className="text-cream/42 text-[10.5px] font-semibold mb-1">
                      رقم الهاتف
                    </p>
                    <a
                      href={`tel:${salon.phone.replace(/\s/g, '')}`}
                      className="text-cream/78 text-[12.5px] hover:text-gold transition-colors"
                      dir="ltr"
                    >
                      {salon.phone}
                    </a>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4.5 flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-gold" />
                  </span>
                  <div>
                    <p className="text-cream/42 text-[10.5px] font-semibold mb-1">
                      ساعات العمل
                    </p>
                    <p className="text-cream/78 text-[12px] leading-relaxed">
                      {salon.workingHours}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4.5 flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                    <Wallet className="w-4.5 h-4.5 text-gold" />
                  </span>
                  <div>
                    <p className="text-cream/42 text-[10.5px] font-semibold mb-1">
                      مستوى الأسعار
                    </p>
                    <div className="pt-1">
                      <PriceLevel level={salon.priceLevel} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-7 flex flex-wrap gap-2.5">
                {salon.features.map((feature) => (
                  <span
                    key={feature}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/8 border border-gold/16 text-cream/62 text-[11.5px] font-semibold"
                  >
                    <BadgeCheck className="w-3.5 h-3.5 text-gold/75" />
                    {feature}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => {
                    toggleFavorite(salon.id)
                    showToast(
                      fav ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة',
                      fav ? 'info' : 'success',
                    )
                  }}
                  className={cn(
                    'inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl border font-bold text-[14px] transition-all',
                    fav
                      ? 'border-red-400/42 bg-red-500/12 text-red-300'
                      : 'border-white/12 text-cream/72 hover:border-gold/42 hover:text-gold',
                  )}
                >
                  <Heart className={cn('w-4.5 h-4.5', fav && 'fill-current')} />
                  {fav ? 'في المفضلة' : 'أضف للمفضلة'}
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({ title: salon.name, url: window.location.href })
                        .catch(() => undefined)
                    } else {
                      navigator.clipboard
                        ?.writeText(window.location.href)
                        .then(() => showToast('تم نسخ رابط الصالون', 'success'))
                        .catch(() => undefined)
                    }
                  }}
                  className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl border border-white/12 text-cream/72 font-bold text-[14px] hover:border-gold/42 hover:text-gold transition-all"
                >
                  <Share2 className="w-4.5 h-4.5" />
                  مشاركة
                </button>
              </div>

              {/* WhatsApp quick contact */}
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-brand/12 border border-emerald-brand/26 text-emerald-brand font-semibold text-[13px] hover:bg-emerald-brand/20 transition-all"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                مراسلة سريعة عبر واتساب
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap gap-2.5 p-2 rounded-[22px] bg-white/3 border border-white/7 w-fit">
            {[
              { key: 'services', label: 'الخدمات والأسعار', icon: Wallet },
              { key: 'team', label: 'فريق العمل', icon: Users },
              { key: 'reviews', label: 'التقييمات', icon: Star },
              { key: 'gallery', label: 'معرض الصور', icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[13.5px] font-bold transition-all',
                    activeTab === tab.key
                      ? 'bg-gold text-ink shadow-gold-soft'
                      : 'text-cream/58 hover:text-gold hover:bg-white/5',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="mt-11">
            {activeTab === 'services' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {salon.services.map((service, i) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: i * 0.07 }}
                    className="group glass-panel rounded-[24px] p-7 card-hover relative overflow-hidden"
                  >
                    {service.popular && (
                      <div className="absolute top-5 left-5 px-3 py-1.5 rounded-full bg-gold/16 border border-gold/28 text-gold text-[10px] font-black">
                        الأكثر طلباً
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="mt-5 text-[17px] font-black text-cream group-hover:text-gold transition-colors">
                      {service.name}
                    </h3>
                    <p className="mt-2.5 text-cream/50 text-[12px] font-semibold">
                      {service.category}
                    </p>
                    <p className="mt-3.5 text-cream/52 text-[13px] leading-[1.95]">
                      {service.description}
                    </p>

                    <div className="mt-6 pt-5 border-t border-white/8 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-gold font-black text-[21px]">
                            {formatPrice(service.price)}
                          </span>
                          <span className="text-cream/42 text-[11px] font-semibold">دج</span>
                        </div>
                        <p className="mt-1 text-cream/38 text-[10.5px]">
                          المدة: {service.duration} دقيقة
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {salon.barbers.map((barber, i) => (
                  <motion.div
                    key={barber.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: i * 0.09 }}
                    className="group glass-panel rounded-[24px] overflow-hidden card-hover"
                  >
                    <div className="relative h-[230px] overflow-hidden">
                      <img
                        src={barber.image}
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[800ms]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/22 to-transparent" />
                      <div className="absolute bottom-4 right-4 left-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/48 backdrop-blur-md border border-white/12 w-fit">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span className="text-white text-[11.5px] font-black">
                            {barber.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-[17px] font-black text-cream">{barber.name}</h3>
                      <p className="mt-1.5 text-gold/82 text-[12px] font-semibold">
                        {barber.role}
                      </p>
                      <p className="mt-1.5 text-cream/42 text-[11px]">{barber.experience}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {barber.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-cream/58 text-[10.5px] font-semibold"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

                      <Link
                        to={`/booking/${salon.slug}`}
                        className="mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gold/24 text-gold text-[12.5px] font-bold hover:bg-gold/12 transition-all"
                      >
                        احجز مع {barber.name.split(' ')[0]}
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="glass-panel rounded-[26px] p-8 sm:p-10 mb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                    <div className="text-center shrink-0">
                      <p className="text-[62px] font-black text-gradient-gold leading-none">
                        {salon.rating.toFixed(1)}
                      </p>
                      <div className="mt-3">
                        <Stars rating={salon.rating} size="md" showValue={false} />
                      </div>
                      <p className="mt-2.5 text-cream/42 text-[12px]">
                        {salon.reviewsCount} تقييم
                      </p>
                    </div>

                    <div className="flex-1 w-full space-y-2.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const pct =
                          star === 5 ? 72 : star === 4 ? 19 : star === 3 ? 6 : star === 2 ? 2 : 1
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-cream/48 text-[11.5px] font-semibold w-8">
                              {star} ★
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/7 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-l from-gold-light to-gold-dark"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-cream/38 text-[10.5px] w-9">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="shrink-0">
                      <Link
                        to={user ? `/booking/${salon.slug}` : '/login'}
                        className="btn-gold inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[13px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {user ? 'احجز وقيّم' : 'سجّل لتقييم'}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {salon.reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.52, delay: i * 0.08 }}
                      className="glass-panel rounded-[22px] p-7"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/28 to-gold/8 border border-gold/22 flex items-center justify-center">
                            <span className="text-gold font-black text-[16px]">
                              {review.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-cream text-[14px] font-bold">{review.name}</p>
                            <p className="text-cream/38 text-[10.5px] mt-0.5">
                              {formatDateAr(review.date)}
                            </p>
                          </div>
                        </div>
                        <Stars rating={review.rating} size="sm" showValue={false} />
                      </div>

                      <p className="mt-5 text-cream/58 text-[13.5px] leading-[2.05]">
                        {review.comment}
                      </p>

                      <div className="mt-5 pt-4 border-t border-white/7">
                        <span className="px-3 py-1.5 rounded-lg bg-gold/8 border border-gold/16 text-gold/78 text-[10.5px] font-semibold">
                          الخدمة: {review.service}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[...salon.gallery, ...salon.gallery].slice(0, 8).map((img, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    onClick={() => setSelectedImage(img)}
                    className="group relative h-[210px] sm:h-[260px] rounded-[22px] overflow-hidden border border-white/8 hover:border-gold/42 transition-all"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-114 transition-transform duration-[850ms]"
                    />
                    <div className="absolute inset-0 bg-ink/22 group-hover:bg-ink/5 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-4 py-2 rounded-full bg-gold text-ink text-[11px] font-black">
                        عرض الصورة
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      {user?.type !== 'owner' && (
        <section className="relative pb-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-6">
            <div className="glass-panel rounded-[28px] p-9 sm:p-12 relative overflow-hidden">
              <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-gold/11 blur-[110px]" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                  <h3 className="text-[clamp(1.65rem,3.4vw,2.35rem)] font-black text-cream leading-[1.4]">
                    جاهز لحجز موعدك في {salon.name}؟
                  </h3>
                  <p className="mt-4 text-cream/55 text-[15px] leading-[2] max-w-2xl">
                    احجز الآن واحصل على تأكيد فوري مع تذكير تلقائي قبل الموعد. بدون رسوم
                    مخفية وبدون انتظار.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3.5 shrink-0">
                  <Link
                    to={`/booking/${salon.slug}`}
                    className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl whitespace-nowrap"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    احجز الآن
                  </Link>
                  <Link
                    to="/salons"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/12 text-cream/78 font-bold hover:border-gold/42 hover:text-gold transition-all whitespace-nowrap"
                  >
                    <ArrowRight className="w-4.5 h-4.5" />
                    صالونات أخرى
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-5 bg-black/88 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32 }}
            className="relative max-w-4xl w-full"
          >
            <img
              src={selectedImage}
              alt=""
              className="w-full max-h-[78vh] object-contain rounded-[22px]"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/62 border border-white/16 flex items-center justify-center text-white hover:bg-black/85 transition-colors"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </>
  )
}