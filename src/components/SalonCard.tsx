import { Link } from 'react-router-dom'
import {
  Star,
  MapPin,
  Clock,
  Heart,
  BadgeCheck,
  ArrowLeft,
  Wallet,
  Phone,
} from 'lucide-react'
import type { Salon } from '../lib/types'
import { useStore } from '../lib/store'
import { cn, formatPrice } from '../lib/utils'

export function Stars({
  rating,
  size = 'sm',
  showValue = true,
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}) {
  const sizeClass = size === 'lg' ? 'w-[18px] h-[18px]' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i <= Math.round(rating)
                ? 'fill-gold text-gold'
                : 'fill-white/10 text-white/15',
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-gold font-bold text-[13px]">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}

export function PriceLevel({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1" title="مستوى الأسعار">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-4 h-1.5 rounded-full',
            i <= level ? 'bg-gold' : 'bg-white/12',
          )}
        />
      ))}
    </div>
  )
}

export function SalonCard({ salon, index = 0 }: { salon: Salon; index?: number }) {
  const { isFavorite, toggleFavorite, showToast, user } = useStore()
  const fav = isFavorite(salon.id)

  return (
    <article
      className="group relative glass-panel rounded-[26px] overflow-hidden card-hover"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative h-[230px] overflow-hidden">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.12]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col items-start gap-2">
          {salon.featured && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-ink text-[11px] font-black shadow-gold-soft">
              <BadgeCheck className="w-3.5 h-3.5" />
              مميّز
            </span>
          )}
          <span
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md',
              salon.isOpen
                ? 'bg-emerald-brand/20 text-emerald-brand border border-emerald-brand/30'
                : 'bg-red-500/20 text-red-300 border border-red-400/25',
            )}
          >
            {salon.isOpen ? 'مفتوح الآن' : 'مغلق'}
          </span>
        </div>

        {/* Favorite */}
        <button
          onClick={() => {
            toggleFavorite(salon.id)
            showToast(
              fav ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة',
              fav ? 'info' : 'success',
            )
          }}
          className={cn(
            'absolute top-4 left-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 border',
            fav
              ? 'bg-red-500/85 border-red-400 text-white scale-105'
              : 'bg-black/35 border-white/15 text-white/80 hover:bg-red-500/70 hover:border-red-400',
          )}
          aria-label="المفضلة"
        >
          <Heart className={cn('w-4.5 h-4.5', fav && 'fill-current')} />
        </button>

        {/* Type */}
        <div className="absolute bottom-4 right-4">
          <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/12 text-white/90 text-[11px] font-semibold">
            صالون {salon.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[19px] font-black text-cream truncate group-hover:text-gold transition-colors">
              {salon.name}
            </h3>
            <p className="mt-1.5 text-cream/50 text-[13px] truncate">{salon.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gold/12 border border-gold/20">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="text-gold font-black text-[13px]">
                {salon.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-cream/35 text-[11px]">
              {salon.reviewsCount} تقييم
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2.5 text-cream/55 text-[13px]">
            <MapPin className="w-4 h-4 text-gold/65 shrink-0" />
            <span className="truncate">
              {salon.neighborhood}، {salon.address}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-cream/55 text-[13px]">
            <Clock className="w-4 h-4 text-gold/65 shrink-0" />
            <span className="truncate">{salon.workingHours}</span>
          </div>
          <div className="flex items-center gap-2.5 text-cream/55 text-[13px]">
            <Phone className="w-4 h-4 text-gold/65 shrink-0" />
            <span dir="ltr" className="text-left">
              {salon.phone}
            </span>
          </div>
        </div>

        {/* Services preview */}
        <div className="mt-5 flex flex-wrap gap-2">
          {salon.services.slice(0, 3).map((s) => (
            <span
              key={s.id}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-cream/60 text-[11.5px]"
            >
              {s.name}
            </span>
          ))}
          {salon.services.length > 3 && (
            <span className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/18 text-gold/85 text-[11.5px] font-semibold">
              +{salon.services.length - 3}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-6 pt-5 border-t border-white/8 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cream/45 text-[11px] mb-1.5">
              <Wallet className="w-3.5 h-3.5 text-gold/60" />
              يبدأ من
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-gold font-black text-[22px]">
                {formatPrice(Math.min(...salon.services.map((s) => s.price)))}
              </span>
              <span className="text-cream/45 text-[12px] font-semibold">دج</span>
            </div>
            <div className="mt-2">
              <PriceLevel level={salon.priceLevel} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {user?.type !== 'owner' && (
              <Link
                to={
                  user
                    ? `/salon/${salon.slug}`
                    : `/register?type=client&redirect=%2Fsalon%2F${salon.slug}`
                }
                className="btn-gold flex items-center gap-2 px-5 py-3 rounded-2xl text-[13.5px] whitespace-nowrap"
              >
                احجز الآن
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <Link
              to={`/salon/${salon.slug}`}
              className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-2xl border border-white/10 text-cream/65 text-[12px] font-semibold hover:border-gold/35 hover:text-gold transition-all"
            >
              التفاصيل
            </Link>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_60px_rgba(212,175,55,0.12)]" />
    </article>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="glass-panel rounded-[28px] p-12 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/18 flex items-center justify-center mx-auto">
        <Icon className="w-9 h-9 text-gold/70" />
      </div>
      <h3 className="mt-6 text-2xl font-black text-cream">{title}</h3>
      <p className="mt-3 text-cream/50 text-[15px] leading-[1.9] max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl mt-7"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}