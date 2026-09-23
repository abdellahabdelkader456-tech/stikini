const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// الأشهر بالتقويم الميلادي المعتمد في الجزائر (من الفرنسية)
export const ALGERIAN_MONTHS = [
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export const formatPrice = (n: number): string => new Intl.NumberFormat('en-US').format(n)

export const formatDateAr = (iso: string): string => {
  const d = new Date(iso)
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${ALGERIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export const getDayName = (iso: string): string => AR_DAYS[new Date(iso).getDay()]

export const getShortDate = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getDate()} ${ALGERIAN_MONTHS[d.getMonth()]}`
}

export const getUpcomingDays = (count: number): string[] => {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export const TIME_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '12:00',
  '13:30',
  '14:15',
  '15:00',
  '15:45',
  '16:30',
  '17:15',
  '18:00',
  '18:45',
  '19:30',
]

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const isValidPhone = (phone: string): boolean =>
  /^(0)(5|6|7)[0-9]{8}$/.test(phone.replace(/[\s-]/g, ''))

export const isValidName = (name: string): boolean => name.trim().length >= 3

export const generateBookingCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `STK-${code}`
}

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ')

export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export const scrollToId = (id: string): void => {
  const el = document.getElementById(id)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 110
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}
