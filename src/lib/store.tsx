import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, BookingStatus, StoredUser, ToastItem, User } from './types'
import { generateBookingCode } from './utils'
import { calcPromoDiscount, PROMO_CODES } from './data'

const USERS_KEY = 'stikini_users'
const SESSION_KEY = 'stikini_session'
const BOOKINGS_KEY = 'stikini_bookings'
const FAVORITES_KEY = 'stikini_favorites'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — ignore */
  }
}

const toPublicUser = (u: StoredUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  type: u.type,
  salonId: u.salonId,
  createdAt: u.createdAt,
})

/**
 * هل هذا الحجز يخص هذا المستخدم؟
 * - الحجوزات الجديدة تُربط بمعرّف الحساب (userId).
 * - الحجوزات القديمة/حجوزات الزوار (بدون userId) تُنسب فقط لصاحب نفس البريد الإلكتروني.
 */
export const ownsBooking = (booking: Booking, user: User | null): boolean => {
  if (!user) return false
  if (booking.userId) return booking.userId === user.id
  const bookingEmail = (booking.email || '').trim().toLowerCase()
  return bookingEmail !== '' && bookingEmail === user.email.trim().toLowerCase()
}

export interface NewBookingInput {
  salonId: string
  salonName: string
  services: { id: string; name: string; price: number; duration: number }[]
  barberName: string
  date: string
  time: string
  clientName: string
  phone: string
  email: string
  notes: string
  promoCode?: string
}

interface StoreValue {
  user: User | null
  /** حجوزات المستخدم الحالي فقط — لا يرى أي زبون حجوزات غيره */
  bookings: Booking[]
  /** جميع حجوزات المنصة — للعرض العام فقط في "نظرة عامة"، بدون أي إجراء (إلغاء/تأكيد) عليها */
  allBookings: Booking[]
  /** حجوزات الصالون الذي يديره صاحب الحساب (فارغة لغير أصحاب الصالونات) */
  salonBookings: Booking[]
  favorites: string[]
  toasts: ToastItem[]
  register: (input: {
    name: string
    email: string
    phone: string
    password: string
    type: 'client' | 'owner'
  }) => { ok: boolean; error?: string }
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  createBooking: (
    input: NewBookingInput,
  ) => { ok: true; booking: Booking } | { ok: false; error: string }
  /** إلغاء حجز يخص المستخدم الحالي فقط */
  cancelBooking: (id: string) => void
  /** صاحب الصالون: إنهاء (مكتمل) أو إلغاء موعد داخل صالونه فقط */
  updateSalonBookingStatus: (id: string, status: Exclude<BookingStatus, 'مؤكد'>) => void
  /** صاحب الصالون: ربط الحساب بصالون */
  setOwnerSalon: (salonId: string) => void
  toggleFavorite: (salonId: string) => void
  isFavorite: (salonId: string) => boolean
  showToast: (message: string, type?: ToastItem['type']) => void
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = readJSON<{ userId: string } | null>(SESSION_KEY, null)
    if (!session) return null
    const users = readJSON<StoredUser[]>(USERS_KEY, [])
    const found = users.find((u) => u.id === session.userId)
    if (!found) return null
    return toPublicUser(found)
  })

  const [allBookings, setAllBookings] = useState<Booking[]>(() =>
    readJSON<Booking[]>(BOOKINGS_KEY, []),
  )
  const [favorites, setFavorites] = useState<string[]>(() =>
    readJSON<string[]>(FAVORITES_KEY, ['prestige-hydra', 'royal-draria']),
  )
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => writeJSON(FAVORITES_KEY, favorites), [favorites])

  // مزامنة الحجوزات بين التبويبات (مثلاً: صاحب الصالون يلغي موعداً فيظهر للزبون فوراً)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKINGS_KEY) {
        setAllBookings(readJSON<Booking[]>(BOOKINGS_KEY, []))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // نقرأ آخر نسخة من التخزين قبل أي تعديل حتى لا نطمس تغييرات تبويب آخر
  const commitBookings = useCallback((updater: (prev: Booking[]) => Booking[]) => {
    const latest = readJSON<Booking[]>(BOOKINGS_KEY, [])
    const next = updater(latest)
    writeJSON(BOOKINGS_KEY, next)
    setAllBookings(next)
  }, [])

  // ما يراه المستخدم: حجوزاته فقط
  const bookings = useMemo(
    () => (user ? allBookings.filter((b) => ownsBooking(b, user)) : []),
    [allBookings, user],
  )

  // ما يراه صاحب الصالون: حجوزات صالونه فقط
  const salonBookings = useMemo(
    () =>
      user && user.type === 'owner' && user.salonId
        ? allBookings.filter((b) => b.salonId === user.salonId)
        : [],
    [allBookings, user],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastItem['type'] = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4200)
    },
    [],
  )

  const register = useCallback<StoreValue['register']>((input) => {
    const users = readJSON<StoredUser[]>(USERS_KEY, [])
    const email = input.email.trim().toLowerCase()
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.' }
    }
    const newUser: StoredUser = {
      id: `u-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      password: input.password,
      type: input.type,
      createdAt: new Date().toISOString(),
    }
    const next = [...users, newUser]
    writeJSON(USERS_KEY, next)
    writeJSON(SESSION_KEY, { userId: newUser.id })
    setUser(toPublicUser(newUser))
    return { ok: true }
  }, [])

  const login = useCallback<StoreValue['login']>((email, password) => {
    const users = readJSON<StoredUser[]>(USERS_KEY, [])
    const trimmed = email.trim().toLowerCase()
    const found = users.find((u) => u.email.toLowerCase() === trimmed)
    if (!found) {
      return { ok: false, error: 'البريد الإلكتروني غير مسجّل في المنصة.' }
    }
    if (found.password !== password) {
      return { ok: false, error: 'كلمة المرور غير صحيحة. حاول مرة أخرى.' }
    }
    writeJSON(SESSION_KEY, { userId: found.id })
    setUser(toPublicUser(found))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
    showToast('تم تسجيل الخروج بنجاح. نراك قريباً!', 'info')
  }, [showToast])

  const createBooking = useCallback<StoreValue['createBooking']>(
    (input) => {
      // نقرأ آخر نسخة من الحجوزات مباشرة من التخزين (وليس من الحالة القديمة في الذاكرة)
      // حتى نلتقط أي حجز تم في تبويب أو جلسة أخرى في نفس اللحظة
      const latest = readJSON<Booking[]>(BOOKINGS_KEY, [])
      const isTaken = latest.some(
        (b) =>
          b.salonId === input.salonId &&
          b.barberName === input.barberName &&
          b.date === input.date &&
          b.time === input.time &&
          b.status === 'مؤكد',
      )
      if (isTaken) {
        return {
          ok: false,
          error: 'عذراً، هذا الموعد لم يعد متاحاً — تم حجزه للتو من طرف زبون آخر. يرجى اختيار توقيت مختلف.',
        }
      }

      const subtotal = input.services.reduce((sum, s) => sum + s.price, 0)
      const promoCode = input.promoCode?.trim().toUpperCase()
      const validPromo = promoCode && PROMO_CODES[promoCode] ? promoCode : undefined
      const discount = calcPromoDiscount(validPromo, subtotal)
      const booking: Booking = {
        id: `b-${Date.now()}`,
        code: generateBookingCode(),
        salonId: input.salonId,
        salonName: input.salonName,
        services: input.services.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
        })),
        barberName: input.barberName,
        date: input.date,
        time: input.time,
        clientName: input.clientName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        totalPrice: subtotal - discount,
        discount,
        promoCode: validPromo,
        userId: user?.id,
        status: 'مؤكد',
        createdAt: new Date().toISOString(),
      }
      commitBookings((prev) => [booking, ...prev])
      return { ok: true, booking }
    },
    [user, commitBookings],
  )

  const cancelBooking = useCallback(
    (id: string) => {
      const latest = readJSON<Booking[]>(BOOKINGS_KEY, [])
      const target = latest.find((b) => b.id === id)
      if (!target || !ownsBooking(target, user)) {
        showToast('لا يمكنك إلغاء حجز لا يخصّك.', 'error')
        return
      }
      if (target.status !== 'مؤكد') return
      commitBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'ملغى' as const } : b)),
      )
      showToast('تم إلغاء الحجز بنجاح.', 'info')
    },
    [user, commitBookings, showToast],
  )

  const updateSalonBookingStatus = useCallback<StoreValue['updateSalonBookingStatus']>(
    (id, status) => {
      if (!user || user.type !== 'owner' || !user.salonId) {
        showToast('هذه العملية متاحة لصاحب الصالون فقط.', 'error')
        return
      }
      const latest = readJSON<Booking[]>(BOOKINGS_KEY, [])
      const target = latest.find((b) => b.id === id)
      if (!target || target.salonId !== user.salonId) {
        showToast('لا يمكنك تعديل موعد خارج صالونك.', 'error')
        return
      }
      if (target.status !== 'مؤكد') return
      commitBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
      showToast(
        status === 'مكتمل' ? 'تم تسجيل الموعد كمكتمل.' : 'تم إلغاء الموعد.',
        status === 'مكتمل' ? 'success' : 'info',
      )
    },
    [user, commitBookings, showToast],
  )

  const setOwnerSalon = useCallback(
    (salonId: string) => {
      if (!user || user.type !== 'owner') return
      const users = readJSON<StoredUser[]>(USERS_KEY, [])
      const next = users.map((u) => (u.id === user.id ? { ...u, salonId } : u))
      writeJSON(USERS_KEY, next)
      setUser({ ...user, salonId })
    },
    [user],
  )

  const toggleFavorite = useCallback((salonId: string) => {
    setFavorites((prev) =>
      prev.includes(salonId) ? prev.filter((id) => id !== salonId) : [...prev, salonId],
    )
  }, [])

  const isFavorite = useCallback(
    (salonId: string) => favorites.includes(salonId),
    [favorites],
  )

  const value = useMemo<StoreValue>(
    () => ({
      user,
      bookings,
      allBookings,
      salonBookings,
      favorites,
      toasts,
      register,
      login,
      logout,
      createBooking,
      cancelBooking,
      updateSalonBookingStatus,
      setOwnerSalon,
      toggleFavorite,
      isFavorite,
      showToast,
      dismissToast,
    }),
    [
      user,
      bookings,
      allBookings,
      salonBookings,
      favorites,
      toasts,
      register,
      login,
      logout,
      createBooking,
      cancelBooking,
      updateSalonBookingStatus,
      setOwnerSalon,
      toggleFavorite,
      isFavorite,
      showToast,
      dismissToast,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}