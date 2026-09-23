import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MapPin, Scissors, Star } from 'lucide-react'
import type { Salon } from '../lib/types'
import { cn, formatPrice } from '../lib/utils'
import { useStore } from '../lib/store'

/** مواقع الدبابيس على الخريطة (نسب مئوية) حسب موقع كل حي في الجزائر العاصمة */
const PIN_POSITIONS: Record<string, { top: string; left: string }> = {
  'lamsa-bouzareah': { top: '20%', left: '24%' },
  'nour-beauty': { top: '38%', left: '34%' },
  'maqs-centre': { top: '30%', left: '54%' },
  'prestige-hydra': { top: '54%', left: '44%' },
  'elite-bab-ewar': { top: '40%', left: '80%' },
  'royal-draria': { top: '74%', left: '22%' },
}

export function InteractiveMap({ salons }: { salons: Salon[] }) {
  const [selected, setSelected] = useState<Salon | undefined>(salons[0])

  return (
    <div className="relative w-full glass-panel rounded-[28px] overflow-hidden p-5 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-brand animate-ping" />
            <h3 className="text-[17px] sm:text-[20px] font-black text-cream">
              خريطة الصالونات التفاعلية في الجزائر العاصمة
            </h3>
          </div>
          <p className="mt-1.5 text-cream/46 text-[12px]">
            انقر على أي صالون على الخريطة للاطلاع على الأوقات المتاحة والحجز الفوري
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-brand/10 border border-emerald-brand/24 text-emerald-brand text-[11.5px] font-bold">
          {salons.length} صالونات معتمدة
          <MapPin className="w-3.5 h-3.5 text-gold" />
        </span>
      </div>

      {/* Map canvas */}
      <div
        dir="ltr"
        className="relative w-full h-[380px] sm:h-[440px] rounded-[22px] bg-ink/70 overflow-hidden border border-white/8"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      >
        {/* Roads & areas */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M 0,220 Q 250,170 500,240 T 1000,200"
            fill="none"
            stroke="#d4af37"
            strokeWidth="4"
            strokeDasharray="6 6"
          />
          <path d="M 320,0 Q 400,250 440,500" fill="none" stroke="#1f5a47" strokeWidth="5" />
          <path d="M 100,380 Q 400,330 800,420" fill="none" stroke="#1f5a47" strokeWidth="3" />
          <ellipse cx="230" cy="330" rx="150" ry="75" fill="#0e9d6c" opacity="0.28" />
        </svg>

        {/* Landmarks */}
        <span className="absolute top-[8%] left-[56%] text-[10px] font-bold text-gold-light/75 bg-ink/75 px-2 py-0.5 rounded-md border border-gold/25 pointer-events-none">
          🌊 خليج الجزائر
        </span>
        <span className="absolute top-[88%] left-[12%] text-[10px] font-bold text-emerald-brand/75 bg-ink/75 px-2 py-0.5 rounded-md border border-emerald-brand/25 pointer-events-none">
          🌲 المساحات الخضراء
        </span>
        <span className="absolute top-[52%] left-[62%] text-[10px] font-bold text-gold-light/75 bg-ink/75 px-2 py-0.5 rounded-md border border-gold/25 pointer-events-none">
          🛣️ الطريق السريع
        </span>

        {/* Pins */}
        {salons.map((salon) => {
          const pos = PIN_POSITIONS[salon.id] ?? { top: '50%', left: '50%' }
          const active = selected?.id === salon.id
          return (
            <div
              key={salon.id}
              style={{ top: pos.top, left: pos.left }}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2',
                active ? 'z-30' : 'z-20',
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(salon)}
                aria-label={salon.name}
                className={cn(
                  'group relative flex items-center justify-center transition-all',
                  active ? 'scale-125' : 'hover:scale-110',
                )}
              >
                {active && (
                  <span className="absolute -inset-2 rounded-full bg-gold/40 animate-ping" />
                )}
                <span
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all',
                    active
                      ? 'bg-gold text-ink border-white ring-4 ring-gold/30'
                      : 'bg-forest-lighter text-gold-light border-emerald-brand/30 hover:border-gold',
                  )}
                >
                  <Scissors className="w-5 h-5 -rotate-45" />
                </span>
                <span
                  dir="rtl"
                  className={cn(
                    'absolute -top-7 whitespace-nowrap text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-md transition-all',
                    active
                      ? 'bg-gold text-ink border-white font-black'
                      : 'bg-ink/90 text-cream border-white/12 opacity-80 group-hover:opacity-100',
                  )}
                >
                  {salon.name}
                </span>
              </button>
            </div>
          )
        })}

        {/* Selected salon card (desktop overlay) */}
        <AnimatePresence mode="wait">
          {selected && (
            <SalonPopup
              key={selected.id}
              salon={selected}
              className="hidden sm:block absolute bottom-3 right-3 w-[340px] z-40"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Selected salon card (mobile, under the map) */}
      <div className="sm:hidden">
        <AnimatePresence mode="wait">
          {selected && (
            <SalonPopup key={selected.id} salon={selected} className="block w-full" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SalonPopup({ salon, className }: { salon: Salon; className?: string }) {
  const { user } = useStore()
  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'bg-forest/95 backdrop-blur-md p-4 rounded-2xl border-2 border-gold shadow-2xl space-y-3 text-right',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={salon.image}
            alt={salon.name}
            className="w-12 h-12 rounded-xl object-cover border border-white/12 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-[13px] font-black text-cream truncate">{salon.name}</h4>
            <p className="text-[11px] text-cream/50">{salon.neighborhood}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-bold text-gold-light bg-gold/10 px-2.5 py-1 rounded-md border border-gold/24 shrink-0">
          <span>{salon.rating.toFixed(1)}</span>
          <Star className="w-3 h-3 fill-current" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-white/8">
        <span className="text-cream/50">
          تبدأ من:{' '}
          <strong className="text-cream">
            {formatPrice(Math.min(...salon.services.map((s) => s.price)))} دج
          </strong>
        </span>
        <span className={cn('font-bold', salon.isOpen ? 'text-emerald-brand' : 'text-red-300')}>
          {salon.isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {user?.type !== 'owner' && (
          <Link
            to={user ? `/booking/${salon.slug}` : `/register?type=client&redirect=%2Fbooking%2F${salon.slug}`}
            className="btn-gold flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px]"
          >
            <Scissors className="w-3.5 h-3.5" />
            احجز موعدك الآن
          </Link>
        )}
        <Link
          to={`/salon/${salon.slug}`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/12 text-cream/72 text-[11.5px] font-bold hover:border-gold/40 hover:text-gold transition-all"
        >
          التفاصيل
          <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  )
}