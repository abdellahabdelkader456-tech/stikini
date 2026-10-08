import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Scissors,
  LayoutGrid,
} from 'lucide-react'
import { SITE } from '../lib/data'
import { useStore } from '../lib/store'
import { cn, scrollToId } from '../lib/utils'

const NAV_LINKS = [
  { label: 'الرئيسية', to: '/' },
  { label: 'الصالونات', to: '/salons' },
  { label: 'الباقات والأسعار', to: '/pricing' },
  { label: 'الأسئلة الشائعة', to: '/faq' },
  { label: 'تواصل معنا', to: '/contact' },
]

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="stikini">
      <span className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center shadow-gold-soft shrink-0">
        <Scissors className="w-5 h-5 text-ink" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-white/25" />
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-black tracking-tight text-cream',
            compact ? 'text-xl' : 'text-2xl',
          )}
        >
          sti<span className="text-gradient-gold">kini</span>
        </span>

        <span className="text-[10px] text-gold/70 font-medium mt-1 tracking-wide">
          منصة الحجوزات الذكية
        </span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const location = useLocation()

  const { user, isAdmin, logout } = useStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)

    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  /*
   * ADMIN
   * Admin users should never be treated as normal clients.
   */
  const profilePath = isAdmin ? '/admin/account' : '/dashboard'

  return (
   <header className="relative z-40 w-full">
      {/* Top bar */}
      <div
        className={cn(
          'hidden lg:block transition-all duration-300 border-b border-white/5',
          scrolled
            ? 'bg-forest/95 backdrop-blur-xl py-1.5 opacity-0 -translate-y-full h-0 overflow-hidden'
            : 'bg-ink/80 backdrop-blur-md py-2',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[12.5px] text-cream/60">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold/70" />
              {SITE.address}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold/70" />
              {SITE.hours}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${SITE.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 hover:text-gold transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-gold/70" />
              {SITE.phone}
            </a>

            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-1.5 hover:text-gold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-gold/70" />
              {SITE.email}
            </a>

            <div className="flex items-center gap-2.5">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/50 hover:text-gold text-cream/50 transition-all"
                  aria-label="social"
                >
                  <Icon className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={cn(
          'transition-all duration-300',
          scrolled
            ? 'bg-forest/92 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.45)] border-b border-gold/10'
            : 'bg-gradient-to-b from-ink/90 via-ink/70 to-transparent',
        )}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-6">
          <div
            className={cn(
              'flex items-center justify-between transition-all',
              scrolled ? 'h-[72px]' : 'h-[80px]',
            )}
          >
            <Logo compact={scrolled} />

            {/* Desktop navigation */}
            <ul className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to)

                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={cn(
                        'relative px-4 py-2 rounded-xl text-[15px] font-semibold transition-all duration-200',
                        isActive
                          ? 'text-gold bg-gold/10'
                          : 'text-cream/75 hover:text-gold hover:bg-white/5',
                      )}
                    >
                      {link.label}

                      {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-l from-gold-light to-gold-dark" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Account actions */}
            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  {/* ADMIN PANEL */}
                  {isAdmin && (
                    <Link
                      to="/admin/salons"
                      className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gold/25 bg-gold/10 text-gold text-sm font-semibold hover:bg-gold/20 transition-all"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      لوحة الإدارة
                    </Link>
                  )}

                  {/* OWNER CRM */}
                  {!isAdmin && user.type === 'owner' && (
                    <Link
                      to="/crm"
                      className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/12 text-cream/85 text-sm font-semibold hover:border-gold/45 hover:text-gold transition-all"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      لوحة الحلاق CRM
                    </Link>
                  )}

                  {/* USER / ADMIN ACCOUNT */}
                  <Link
                    to={profilePath}
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/25 text-gold text-sm font-semibold hover:bg-gold/20 transition-all"
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-ink text-xs font-black flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </span>

                    <span className="max-w-[110px] truncate">
                      {user.name}
                    </span>
                  </Link>

                  {/* LOGOUT */}
                  <button
                    onClick={logout}
                    className="hidden sm:block px-4 py-2.5 rounded-xl border border-white/10 text-cream/70 text-sm font-semibold hover:border-red-400/40 hover:text-red-300 transition-all"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center px-5 py-2.5 rounded-xl border border-white/12 text-cream/85 text-sm font-semibold hover:border-gold/45 hover:text-gold transition-all"
                  >
                    تسجيل الدخول
                  </Link>

                  <Link
                    to="/register"
                    className="btn-gold hidden sm:flex items-center px-5 py-2.5 rounded-xl text-sm"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden w-11 h-11 rounded-xl border border-white/12 flex items-center justify-center text-cream hover:border-gold/45 hover:text-gold transition-all"
                aria-label="فتح القائمة"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[60] lg:hidden transition-all duration-300',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cn(
            'absolute top-0 right-0 h-full w-[86%] max-w-[360px] bg-forest-light border-l border-gold/15 shadow-2xl transition-transform duration-400 ease-out flex flex-col',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <Logo compact />

            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-cream/70 hover:text-gold hover:border-gold/40 transition-all"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer navigation */}
          <nav className="flex-1 overflow-y-auto p-5">
            <ul className="space-y-1.5">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to)

                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={cn(
                        'flex items-center px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all',
                        isActive
                          ? 'bg-gold/12 text-gold border border-gold/25'
                          : 'text-cream/80 hover:bg-white/5 border border-transparent',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Account section */}
            <div className="mt-6 pt-6 border-t border-white/8 space-y-3">
              {user ? (
                <>
                  {/* ADMIN MOBILE */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/salons"
                        onClick={() => setOpen(false)}
                        className="block w-full text-center py-3.5 rounded-2xl bg-gold/12 border border-gold/25 text-gold font-bold"
                      >
                        لوحة الإدارة
                      </Link>

                      <Link
                        to="/admin/account"
                        onClick={() => setOpen(false)}
                        className="block w-full text-center py-3.5 rounded-2xl border border-gold/20 text-cream/85 font-semibold hover:text-gold hover:border-gold/40 transition-all"
                      >
                        حساب المدير
                      </Link>
                    </>
                  )}

                  {/* OWNER MOBILE */}
                  {!isAdmin && user.type === 'owner' && (
                    <Link
                      to="/crm"
                      onClick={() => setOpen(false)}
                      className="block w-full text-center py-3.5 rounded-2xl border border-white/12 text-cream/85 font-semibold"
                    >
                      لوحة الحلاق CRM
                    </Link>
                  )}

                  {/* NORMAL USER DASHBOARD */}
                  {!isAdmin && (
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="block w-full text-center py-3.5 rounded-2xl bg-gold/12 border border-gold/25 text-gold font-bold"
                    >
                      لوحة التحكم
                    </Link>
                  )}

                  {/* LOGOUT */}
                  <button
                    onClick={() => {
                      logout()
                      setOpen(false)
                    }}
                    className="block w-full text-center py-3.5 rounded-2xl border border-white/10 text-cream/70 font-semibold"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="btn-gold block w-full text-center py-3.5 rounded-2xl"
                  >
                    إنشاء حساب مجاني
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center py-3.5 rounded-2xl border border-white/12 text-cream/85 font-semibold"
                  >
                    تسجيل الدخول
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile contact */}
          <div className="p-5 border-t border-white/8 space-y-2.5 text-[13px] text-cream/55">
            <a
              href={`tel:${SITE.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2.5 hover:text-gold transition-colors"
            >
              <Phone className="w-4 h-4 text-gold/70" />
              {SITE.phone}
            </a>

            <span className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gold/70" />
              {SITE.city}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="relative bg-ink pt-20 pb-8 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />

      <div className="absolute -top-40 right-1/4 w-[520px] h-[520px] rounded-full bg-gold/6 blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          <div className="lg:col-span-1">
            <Logo />

            <p className="mt-6 text-cream/55 text-[14.5px] leading-[2]">
              منصة الحجوزات الذكية التي تربط الزبائن بأفضل الصالونات ومحال الحلاقة في
              الجزائر العاصمة، وتمنح أصحاب الصالونات أدوات إدارة احترافية في مكان واحد.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-cream/55 hover:text-gold hover:border-gold/45 hover:-translate-y-1 transition-all"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn
            title="روابط سريعة"
            links={[
              { label: 'الرئيسية', to: '/' },
              { label: 'تصفح الصالونات', to: '/salons' },
              { label: 'الباقات والأسعار', to: '/pricing' },
              { label: 'لوحة التحكم', to: '/dashboard' },
              { label: 'الأسئلة الشائعة', to: '/faq' },
            ]}
          />

          <FooterColumn
            title="الدعم والمساعدة"
            links={[
              { label: 'تواصل معنا', to: '/contact' },
              { label: 'سياسة الخصوصية', to: '/privacy' },
              { label: 'الشروط والأحكام', to: '/terms' },
              { label: 'تسجيل الدخول', to: '/login' },
              { label: 'إنشاء حساب', to: '/register' },
            ]}
          />

          <div>
            <h4 className="text-lg font-bold text-cream mb-6">تواصل معنا</h4>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-gold" />
                </span>

                <span className="text-cream/55 text-[14px] leading-relaxed pt-1.5">
                  {SITE.address}
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-gold" />
                </span>

                <div className="flex flex-col gap-1 pt-1.5">
                  <a
                    href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                    className="text-cream/55 text-[14px] hover:text-gold transition-colors"
                    dir="ltr"
                  >
                    {SITE.phone}
                  </a>

                  <a
                    href={`tel:${SITE.phone2.replace(/\s/g, '')}`}
                    className="text-cream/55 text-[14px] hover:text-gold transition-colors"
                    dir="ltr"
                  >
                    {SITE.phone2}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-gold" />
                </span>

                <a
                  href={`mailto:${SITE.email}`}
                  className="text-cream/55 text-[14px] hover:text-gold transition-colors pt-1.5"
                  dir="ltr"
                >
                  {SITE.email}
                </a>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-gold" />
                </span>

                <span className="text-cream/55 text-[14px] pt-1.5">
                  {SITE.hours}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-cream/40 text-[13.5px] text-center sm:text-right">
              © {new Date().getFullYear()} stikini — منصة الحجوزات الذكية للصالونات في
              الجزائر العاصمة. جميع الحقوق محفوظة.
            </p>

            <div className="flex items-center gap-2.5">
              <span className="px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold/80 text-[11.5px] font-semibold">
                صُنع في الجزائر 🇩🇿
              </span>

              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/8 text-cream/50 text-[11.5px]">
                الإصدار 2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string }[]
}) {
  return (
    <div>
      <h4 className="text-lg font-bold text-cream mb-6">{title}</h4>

      <ul className="space-y-3.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="group flex items-center gap-2.5 text-cream/55 text-[14.5px] hover:text-gold transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold group-hover:scale-125 transition-all" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  children,
}: {
  eyebrow: string
  title: ReactNode
  description?: string
  align?: 'center' | 'right'
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-right',
      )}
    >
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[12.5px] font-bold tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        {eyebrow}
      </span>

      <h2 className="mt-6 text-[clamp(1.9rem,4.2vw,3rem)] font-black text-cream leading-[1.35]">
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-cream/55 text-[16.5px] leading-[2.1]">
          {description}
        </p>
      )}

      {children}
    </div>
  )
}

export function ScrollButton({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  return (
    <button
      onClick={() => scrollToId(id)}
      className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl border border-white/12 text-cream/85 font-bold hover:border-gold/45 hover:text-gold hover:-translate-y-1 transition-all duration-300"
    >
      {children}
    </button>
  )
}