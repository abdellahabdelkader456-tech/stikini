import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, MapPin, Store, X, ArrowLeft } from 'lucide-react'
import { SalonCard, EmptyState } from '../components/SalonCard'
import { InteractiveMap } from '../components/InteractiveMap'
import { SALONS, NEIGHBORHOODS } from '../lib/data'
import { cn } from '../lib/utils'
import { useStore } from '../lib/store'

const TYPES = ['الكل', 'رجالية', 'نسائية'] as const
const SORTS = [
  { value: 'featured', label: 'المميزة أولاً' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'reviews', label: 'الأكثر تقييمات' },
  { value: 'price-low', label: 'السعر: من الأقل' },
  { value: 'price-high', label: 'السعر: من الأعلى' },
] as const

export default function SalonsPage() {
  const { user } = useStore()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('الكل')
  const [neighborhood, setNeighborhood] = useState('كل الأحياء')
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('featured')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = [...SALONS]

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.neighborhood.toLowerCase().includes(q) ||
          s.services.some((srv) => srv.name.toLowerCase().includes(q)),
      )
    }

    if (type !== 'الكل') {
      list = list.filter((s) => s.type === type)
    }

    if (neighborhood !== 'كل الأحياء') {
      list = list.filter((s) => s.neighborhood === neighborhood)
    }

    switch (sort) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'reviews':
        list.sort((a, b) => b.reviewsCount - a.reviewsCount)
        break
      case 'price-low':
        list.sort(
          (a, b) =>
            Math.min(...a.services.map((s) => s.price)) -
            Math.min(...b.services.map((s) => s.price)),
        )
        break
      case 'price-high':
        list.sort(
          (a, b) =>
            Math.max(...b.services.map((s) => s.price)) -
            Math.max(...a.services.map((s) => s.price)),
        )
        break
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured))
    }

    return list
  }, [query, type, neighborhood, sort])

  const hasActiveFilters =
    query.trim() !== '' || type !== 'الكل' || neighborhood !== 'كل الأحياء' || sort !== 'featured'

  const resetFilters = () => {
    setQuery('')
    setType('الكل')
    setNeighborhood('كل الأحياء')
    setSort('featured')
  }

  return (
    <>
      {/* Hero header */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-salon.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.18]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/88 to-forest" />
        </div>
        <div className="absolute top-0 right-1/4 w-[520px] h-[520px] rounded-full bg-gold/9 blur-[130px]" />
        <div className="hero-grid-bg absolute inset-0 opacity-60" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <nav className="flex items-center gap-2.5 text-[12.5px] text-cream/42 mb-7">
            <Link to="/" className="hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">الصالونات</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[12px] font-bold">
              <Store className="w-3.5 h-3.5" />
              {SALONS.length} صالون موثّق في الجزائر العاصمة
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              اكتشف أفضل <span className="text-gradient-gold">الصالونات</span>
              <br />واحجز موعدك
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              مئات الصالونات الموثوقة بانتظارك. استخدم البحث والفلاتر للعثور على الخيار
              الأنسب لك في مختلف أحياء العاصمة.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-10 max-w-3xl">
            <div className="glass-panel-strong rounded-[22px] p-2.5 flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-gold/70 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن صالون، خدمة، أو حي..."
                  className="flex-1 bg-transparent py-4 text-cream text-[15px] placeholder:text-cream/32 outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-cream/55 hover:text-cream transition-colors"
                    aria-label="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  'flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-[14px] transition-all sm:w-auto',
                  showFilters
                    ? 'bg-gold text-ink'
                    : 'btn-outline',
                )}
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
                الفلاتر
              </button>
            </div>

            {/* Filter panel */}
            <motion.div
              initial={false}
              animate={{
                height: showFilters ? 'auto' : 0,
                opacity: showFilters ? 1 : 0,
                marginTop: showFilters ? 16 : 0,
              }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="glass-panel rounded-[22px] p-6 space-y-6">
                <div>
                  <label className="block text-cream/62 text-[12.5px] font-bold mb-3">
                    نوع الصالون
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          'px-5 py-2.5 rounded-xl text-[13px] font-semibold border transition-all',
                          type === t
                            ? 'bg-gold text-ink border-gold'
                            : 'bg-white/4 border-white/10 text-cream/62 hover:border-gold/32 hover:text-gold',
                        )}
                      >
                        {t === 'الكل' ? 'الكل' : `صالون ${t}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-cream/62 text-[12.5px] font-bold mb-3">
                    <MapPin className="w-3.5 h-3.5 inline ml-1.5 text-gold/70" />
                    الحي / المنطقة
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {['كل الأحياء', ...NEIGHBORHOODS.slice(0, 10)].map((area) => (
                      <button
                        key={area}
                        onClick={() => setNeighborhood(area)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-[12px] font-semibold border transition-all',
                          neighborhood === area
                            ? 'bg-gold/16 text-gold border-gold/42'
                            : 'bg-white/4 border-white/8 text-cream/52 hover:border-gold/25 hover:text-gold/85',
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-cream/62 text-[12.5px] font-bold mb-3">
                    ترتيب حسب
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {SORTS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSort(s.value)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-[12px] font-semibold border transition-all',
                          sort === s.value
                            ? 'bg-emerald-brand/16 text-emerald-brand border-emerald-brand/38'
                            : 'bg-white/4 border-white/8 text-cream/52 hover:border-emerald-brand/25',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Interactive map */}
          <div className="mb-14">
            <InteractiveMap salons={SALONS} />
          </div>

          {/* Results bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-9">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center">
                <Store className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream text-[15px] font-bold">
                  تم العثور على{' '}
                  <span className="text-gold">{filtered.length}</span> صالون
                </p>
                <p className="text-cream/42 text-[11.5px] mt-0.5">
                  محدَّث لحظياً عبر منصة stikini
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-cream/62 text-[12.5px] font-semibold hover:border-gold/35 hover:text-gold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                إعادة تعيين الفلاتر
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map((salon, i) => (
                <motion.div
                  key={salon.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.62, delay: (i % 3) * 0.09 }}
                >
                  <SalonCard salon={salon} index={i} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="لا توجد نتائج مطابقة"
              description="جرّب تعديل كلمات البحث أو الفلاتر للعثور على الصالون المناسب لك. نضيف صالونات جديدة يومياً في مختلف أحياء الجزائر العاصمة."
              actionLabel="إعادة تعيين الفلاتر"
              actionTo="/salons"
            />
          )}

          {/* CTA — لا تظهر للزبون بعد إنشاء الحساب وتسجيل الدخول */}
          {user?.type !== 'client' && (
            <div className="mt-20 glass-panel rounded-[28px] p-9 sm:p-12 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gold/11 blur-[100px]" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <h3 className="text-[clamp(1.65rem,3.4vw,2.35rem)] font-black text-cream leading-[1.4]">
                    لم تجد صالوناً في منطقتك؟
                  </h3>
                  <p className="mt-4 text-cream/55 text-[15.5px] leading-[2]">
                    نضيف صالونات جديدة يومياً عبر stikini في جميع أحياء الجزائر العاصمة.
                    سجّل صالونك مجاناً وابدأ في استقبال الحجوزات.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3.5 shrink-0">
                  <Link
                    to="/register"
                    className="btn-gold inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl whitespace-nowrap"
                  >
                    سجّل صالونك مجاناً
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/12 text-cream/78 font-bold hover:border-gold/42 hover:text-gold transition-all whitespace-nowrap"
                  >
                    تواصل معنا
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}