import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, BookingStatus, ToastItem, User } from './types'
import { generateBookingCode } from './utils'
import { calcPromoDiscount, PROMO_CODES } from './data'
import { supabase } from './supabase'

export const ownsBooking = (booking: Booking, user: User | null): boolean => {
  if (!user) return false
  return booking.userId === user.id
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
  isReady: boolean
  bookings: Booking[]
  allBookings: Booking[]
  salonBookings: Booking[]
  favorites: string[]
  toasts: ToastItem[]
  register: (input: {
    name: string
    email: string
    phone: string
    password: string
    type: 'client' | 'owner'
  }) => Promise<{ ok: boolean; error?: string; message?: string }>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  createBooking: (
    input: NewBookingInput,
  ) => Promise<{ ok: true; booking: Booking } | { ok: false; error: string }>
  cancelBooking: (id: string) => Promise<void>
  updateSalonBookingStatus: (
    id: string,
    status: Exclude<BookingStatus, 'مؤكد'>,
  ) => Promise<void>
  setOwnerSalon: (salonId: string) => Promise<void>
  toggleFavorite: (salonId: string) => Promise<void>
  isFavorite: (salonId: string) => boolean
  showToast: (message: string, type?: ToastItem['type']) => void
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    type: row.type === 'owner' ? 'owner' : 'client',
    salonId: row.salon_id ? String(row.salon_id) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function mapBooking(row: Record<string, any>): Booking {
  return {
    id: String(row.id),
    code: String(row.code),
    salonId: String(row.salon_id),
    salonName: String(row.salon_name),
    services: Array.isArray(row.services) ? row.services : [],
    barberName: String(row.barber_name),
    date: String(row.date),
    time: String(row.time),
    clientName: String(row.client_name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    notes: String(row.notes ?? ''),
    totalPrice: Number(row.total_price ?? 0),
    discount: Number(row.discount ?? 0),
    promoCode: row.promo_code ? String(row.promo_code) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    status: row.status as BookingStatus,
    createdAt: String(row.created_at),
  }
}

function authErrorMessage(error: { message?: string; status?: number } | null): string {
  const message = error?.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  if (message.includes('email not confirmed')) return 'يجب تأكيد بريدك الإلكتروني أولاً ثم تسجيل الدخول.'
  if (message.includes('user already registered')) return 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.'
  if (message.includes('password')) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'
  return error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])

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

  const loadUserData = useCallback(async (authUserId: string) => {
    const [profileResult, bookingsResult, favoritesResult, publicBookingsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUserId).maybeSingle(),
      supabase.from('bookings').select('*').eq('user_id', authUserId).order('created_at', { ascending: false }),
      supabase.from('favorites').select('salon_id').eq('user_id', authUserId),
      supabase
        .from('public_upcoming_bookings')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true }),
    ])

    if (profileResult.error) throw profileResult.error
    if (bookingsResult.error) throw bookingsResult.error
    if (favoritesResult.error) throw favoritesResult.error
    if (publicBookingsResult.error) throw publicBookingsResult.error

    setUser(profileResult.data ? mapProfile(profileResult.data) : null)
    setAllBookings((publicBookingsResult.data ?? []).map(mapBooking))
    setFavorites((favoritesResult.data ?? []).map((row) => String(row.salon_id)))

    return (bookingsResult.data ?? []).map(mapBooking)
  }, [])

  const refreshPublicBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('public_upcoming_bookings')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (!error) setAllBookings((data ?? []).map(mapBooking))
  }, [])

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error || !data.session) {
        setUser(null)
        setAllBookings([])
        setFavorites([])
        setIsReady(true)
        return
      }

      try {
        await loadUserData(data.session.user.id)
      } catch (loadError) {
        console.error('Failed to load Supabase data:', loadError)
        await supabase.auth.signOut()
        setUser(null)
      } finally {
        if (mounted) setIsReady(true)
      }
    }

    void initialize()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setAllBookings([])
        setFavorites([])
        setIsReady(true)
        return
      }

      window.setTimeout(() => {
        void loadUserData(session.user.id).catch((error) => {
          console.error('Failed to refresh Supabase session data:', error)
        })
      }, 0)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadUserData])

  const [myBookings, setMyBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!user) {
      setMyBookings([])
      return
    }

    const loadMine = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setMyBookings((data ?? []).map(mapBooking))
    }

    void loadMine()
  }, [user])

  const salonBookings = useMemo(
    () =>
      user?.type === 'owner' && user.salonId
        ? myBookings.filter((b) => b.salonId === user.salonId)
        : [],
    [myBookings, user],
  )

  // Owners must see all bookings belonging to their salon, not just their own bookings.
  useEffect(() => {
    if (!user || user.type !== 'owner' || !user.salonId) {
      return
    }

    const loadSalonBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('salon_id', user.salonId)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
      if (!error) setMyBookings((data ?? []).map(mapBooking))
    }

    void loadSalonBookings()
  }, [user])

  const register = useCallback<StoreValue['register']>(async (input) => {
    const email = input.email.trim().toLowerCase()
    const { error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          name: input.name.trim(),
          phone: input.phone.trim(),
          type: input.type,
        },
      },
    })

    if (error) return { ok: false, error: authErrorMessage(error) }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return {
        ok: true,
        message: 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيل الحساب ثم سجّل الدخول.',
      }
    }

    return { ok: true }
  }, [])

  const login = useCallback<StoreValue['login']>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error || !data.user) return { ok: false, error: authErrorMessage(error) }

    try {
      await loadUserData(data.user.id)
    } catch (loadError) {
      console.error(loadError)
      return { ok: false, error: 'تم تسجيل الدخول، لكن تعذر تحميل بيانات الحساب. حاول تحديث الصفحة.' }
    }

    return { ok: true }
  }, [loadUserData])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAllBookings([])
    setMyBookings([])
    setFavorites([])
    showToast('تم تسجيل الخروج بنجاح. نراك قريباً!', 'info')
  }, [showToast])

  const createBooking = useCallback<StoreValue['createBooking']>(
    async (input) => {
      if (!user) {
        return { ok: false, error: 'يجب تسجيل الدخول قبل تأكيد الحجز حتى يتم حفظه في حسابك.' }
      }

      const subtotal = input.services.reduce((sum, s) => sum + s.price, 0)
      const promoCode = input.promoCode?.trim().toUpperCase()
      const validPromo = promoCode && PROMO_CODES[promoCode] ? promoCode : undefined
      const discount = calcPromoDiscount(validPromo, subtotal)
      const bookingId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          code: generateBookingCode(),
          user_id: user.id,
          salon_id: input.salonId,
          salon_name: input.salonName,
          services: input.services,
          barber_name: input.barberName,
          date: input.date,
          time: input.time,
          client_name: input.clientName,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          total_price: subtotal - discount,
          discount,
          promo_code: validPromo ?? null,
          status: 'مؤكد',
        })
        .select('*')
        .single()

      if (error) {
        if (error.code === '23505') {
          return {
            ok: false,
            error: 'عذراً، هذا الموعد لم يعد متاحاً — تم حجزه للتو من طرف زبون آخر. يرجى اختيار توقيت مختلف.',
          }
        }
        console.error('Create booking error:', error)
        return { ok: false, error: 'تعذر حفظ الحجز في قاعدة البيانات. حاول مرة أخرى.' }
      }

      const booking = mapBooking(data)
      setMyBookings((prev) => [booking, ...prev])
      await refreshPublicBookings()
      return { ok: true, booking }
    },
    [refreshPublicBookings, user],
  )

  const cancelBooking = useCallback(
    async (id: string) => {
      if (!user) return
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'ملغى' })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        showToast('تعذر إلغاء الحجز. حاول مرة أخرى.', 'error')
        return
      }

      setMyBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'ملغى' } : b)))
      await refreshPublicBookings()
      showToast('تم إلغاء الحجز بنجاح.', 'info')
    },
    [refreshPublicBookings, showToast, user],
  )

  const updateSalonBookingStatus = useCallback<StoreValue['updateSalonBookingStatus']>(
    async (id, status) => {
      if (!user || user.type !== 'owner' || !user.salonId) {
        showToast('هذه العملية متاحة لصاحب الصالون فقط.', 'error')
        return
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .eq('salon_id', user.salonId)

      if (error) {
        showToast('تعذر تحديث حالة الموعد. حاول مرة أخرى.', 'error')
        return
      }

      setMyBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
      await refreshPublicBookings()
      showToast(status === 'مكتمل' ? 'تم تسجيل الموعد كمكتمل.' : 'تم إلغاء الموعد.', status === 'مكتمل' ? 'success' : 'info')
    },
    [refreshPublicBookings, showToast, user],
  )

  const setOwnerSalon = useCallback(
    async (salonId: string) => {
      if (!user || user.type !== 'owner') return
      const { error } = await supabase.from('profiles').update({ salon_id: salonId }).eq('id', user.id)
      if (error) {
        showToast('تعذر حفظ الصالون في الحساب.', 'error')
        return
      }
      setUser({ ...user, salonId })
      showToast('تم حفظ الصالون في حسابك.', 'success')
    },
    [showToast, user],
  )

  const toggleFavorite = useCallback(
    async (salonId: string) => {
      if (!user) {
        showToast('سجّل الدخول أولاً لحفظ الصالونات المفضلة.', 'info')
        return
      }

      if (favorites.includes(salonId)) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('salon_id', salonId)
        if (error) {
          showToast('تعذر إزالة الصالون من المفضلة.', 'error')
          return
        }
        setFavorites((prev) => prev.filter((id) => id !== salonId))
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, salon_id: salonId })
        if (error && error.code !== '23505') {
          showToast('تعذر حفظ الصالون في المفضلة.', 'error')
          return
        }
        setFavorites((prev) => [...prev, salonId])
      }
    },
    [favorites, showToast, user],
  )

  const isFavorite = useCallback((salonId: string) => favorites.includes(salonId), [favorites])

  const value = useMemo<StoreValue>(
    () => ({
      user,
      isReady,
      bookings: myBookings,
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
      isReady,
      myBookings,
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
