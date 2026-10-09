
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type {
  Booking,
  BookingStatus,
  ToastItem,
  User,
  Salon,
  Barber,
  SalonService,
} from './types'

import { generateBookingCode } from './utils'
import { calcPromoDiscount, PROMO_CODES } from './data'
import { supabase } from './supabase'

export interface NewBookingInput {
  salonId: string
  salonName: string
  services: {
    id: string
    name: string
    price: number
    duration: number
  }[]
  barberName: string
  date: string
  time: string
  clientName: string
  phone: string
  email: string
  notes: string
  promoCode?: string
}

interface PublicBooking {
  id: string
  code: string
  salonId: string
  salonName: string
  barberName: string
  date: string
  time: string
  services: {
    id: string
    name: string
    price: number
    duration: number
  }[]
  totalPrice: number
  status: BookingStatus
  createdAt: string
}

interface StoreValue {
  user: User | null
  salons: Salon[]
  bookings: Booking[]
  salonBookings: Booking[]
  allUpcomingBookings: PublicBooking[]
  favorites: string[]
  toasts: ToastItem[]
  authReady: boolean

  register: (input: {
    name: string
    email: string
    phone: string
    password: string
    type: 'client' | 'owner'
  }) => Promise<{
    ok: boolean
    error?: string
    needsEmailConfirmation?: boolean
  }>

  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>

  logout: () => Promise<void>
  loadSalons: () => Promise<void>
  createBooking: (input: NewBookingInput) => Promise<Booking>
  cancelBooking: (id: string) => Promise<void>

  updateSalonBookingStatus: (
    id: string,
    status: Exclude<BookingStatus, 'مؤكد'>,
  ) => Promise<void>

  setOwnerSalon: (salonId: string) => Promise<void>
  toggleFavorite: (salonId: string) => Promise<void>
  isFavorite: (salonId: string) => boolean
  showToast: (
    message: string,
    type?: ToastItem['type'],
  ) => void
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

/* -------------------------------------------------------------------------- */
/* Data mappers                                                               */
/* -------------------------------------------------------------------------- */

const mapProfile = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  type: row.type,
  salonId: row.salon_id ?? undefined,
  createdAt: row.created_at,
})

const mapBooking = (row: any): Booking => ({
  id: row.id,
  code: row.code,
  salonId: row.salon_id,
  salonName: row.salon_name,
  services: Array.isArray(row.services) ? row.services : [],
  barberName: row.barber_name,
  date: row.date,
  time: row.time,
  clientName: row.client_name,
  phone: row.phone,
  email: row.email,
  notes: row.notes ?? '',
  totalPrice: Number(row.total_price ?? 0),
  discount: Number(row.discount ?? 0),
  promoCode: row.promo_code ?? undefined,
  userId: row.user_id ?? undefined,
  status: row.status,
  createdAt: row.created_at,
})

const mapPublicBooking = (row: any): PublicBooking => ({
  id: row.id,
  code: row.code,
  salonId: row.salon_id,
  salonName: row.salon_name,
  barberName: row.barber_name,
  date: row.date,
  time: row.time,
  services: Array.isArray(row.services) ? row.services : [],
  totalPrice: Number(row.total_price ?? 0),
  status: row.status,
  createdAt: row.created_at,
})

function mapSalon(
  salonRow: any,
  servicesRows: any[],
  barbersRows: any[],
  imagesRows: any[],
): Salon {
  const services: SalonService[] = servicesRows.map((service) => ({
    id: String(service.id),
    name: service.name ?? '',
    category: service.category ?? 'خدمات',
    price: Number(service.price ?? 0),
    duration: Number(service.duration ?? 30),
    description: service.description ?? '',
  }))

  const barbers: Barber[] = barbersRows.map((barber) => ({
    id: String(barber.id),
    name: barber.name ?? '',
    role: 'حلاق',
    experience: `${Number(barber.experience ?? 0)} سنوات`,
    rating: 5,
    image: barber.photo_url ?? '',
    specialties: Array.isArray(barber.specialties)
      ? barber.specialties.map(String)
      : [],
  }))

  const gallery = imagesRows
    .map((item) => item.image_url)
    .filter((url): url is string => Boolean(url))

  const image =
    salonRow.cover_url ||
    imagesRows.find((item) => item.is_cover)?.image_url ||
    gallery[0] ||
    ''

  const category = salonRow.category

  const type: Salon['type'] =
    category === 'نسائية' ||
    category === 'مختلطة' ||
    category === 'رجالية'
      ? category
      : 'رجالية'

  let workingHours = 'حسب المواعيد'
  const openingHours = salonRow.opening_hours

  if (
    openingHours &&
    typeof openingHours === 'object' &&
    !Array.isArray(openingHours)
  ) {
    const firstHours = Object.values(openingHours)[0]

    if (firstHours) {
      workingHours = String(firstHours)
    }
  }

  const id = String(salonRow.id)

  const cleanName = String(salonRow.name ?? 'salon')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')

  return {
    id,
    slug: `${cleanName || 'salon'}-${id.slice(0, 8)}`,
    name: salonRow.name ?? 'صالون',
    tagline: salonRow.description ?? '',
    description: salonRow.description ?? '',
    type,
    neighborhood:
      salonRow.commune ||
      salonRow.wilaya ||
      'الجزائر العاصمة',
    address: salonRow.address ?? '',
    phone: salonRow.phone ?? '',
    rating: 5,
    reviewsCount: 0,
    priceLevel: 2,
    image,
    gallery,
    services,
    barbers,
    reviews: [],
    features: [],
    workingHours,
    isOpen: true,
    featured: false,
    verified: salonRow.status === 'approved',
    established: new Date(
      salonRow.created_at ?? Date.now(),
    ).getFullYear(),
  }
}

const getErrorMessage = (
  error: any,
  fallback: string,
): string => {
  const message = String(error?.message ?? '').trim()

  if (!message) return fallback

  if (/already registered|already exists|duplicate/i.test(message)) {
    return 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.'
  }

  return message
}

/* -------------------------------------------------------------------------- */
/* Store provider                                                             */
/* -------------------------------------------------------------------------- */

export function StoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [salons, setSalons] = useState<Salon[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [salonBookings, setSalonBookings] = useState<Booking[]>([])
  const [allUpcomingBookings, setAllUpcomingBookings] =
    useState<PublicBooking[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [authReady, setAuthReady] = useState(false)

  /* ------------------------------------------------------------------------ */
  /* Toasts                                                                   */
  /* ------------------------------------------------------------------------ */

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (
      message: string,
      type: ToastItem['type'] = 'success',
    ) => {
      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      setToasts((prev) => [...prev, { id, message, type }])

      window.setTimeout(() => {
        setToasts((prev) =>
          prev.filter((toast) => toast.id !== id),
        )
      }, 4200)
    },
    [],
  )

  /* ------------------------------------------------------------------------ */
  /* Load approved salons and their related data                              */
  /* ------------------------------------------------------------------------ */

  const loadSalons = useCallback(async () => {
    try {
      const { data: salonRows, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('status', 'approved')

      if (salonError) throw salonError

      const mappedSalons = await Promise.all(
        (salonRows ?? []).map(async (salon) => {
          const salonId = String(salon.id)

          const [servicesResult, barbersResult, imagesResult] =
            await Promise.all([
              supabase
                .from('salon_services')
                .select('*')
                .eq('salon_id', salonId),

              supabase
                .from('salon_barbers')
                .select('*')
                .eq('salon_id', salonId),

              supabase
                .from('salon_images')
                .select('*')
                .eq('salon_id', salonId),
            ])

          if (servicesResult.error) {
            console.error(
              '[stikini] Failed to load salon services:',
              servicesResult.error,
            )
          }

          if (barbersResult.error) {
            console.error(
              '[stikini] Failed to load salon barbers:',
              barbersResult.error,
            )
          }

          if (imagesResult.error) {
            console.error(
              '[stikini] Failed to load salon images:',
              imagesResult.error,
            )
          }

          return mapSalon(
            salon,
            servicesResult.data ?? [],
            barbersResult.data ?? [],
            imagesResult.data ?? [],
          )
        }),
      )

      setSalons(mappedSalons)
    } catch (error) {
      console.error('[stikini] Failed to load salons:', error)
      setSalons([])
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Load user profile                                                        */
  /* ------------------------------------------------------------------------ */

  const loadProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,email,phone,type,salon_id,created_at')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return mapProfile(data)
    },
    [],
  )

  /* ------------------------------------------------------------------------ */
  /* Load bookings, favorites, and public upcoming bookings                   */
  /* ------------------------------------------------------------------------ */

  const refreshData = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setBookings([])
        setSalonBookings([])
        setFavorites([])
        setAllUpcomingBookings([])
        return
      }

      const bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      const favoritesQuery = supabase
        .from('favorites')
        .select('salon_id')
        .eq('user_id', currentUser.id)

      const publicQuery = supabase.rpc(
        'get_upcoming_public_bookings',
      )

      const [mineResult, favoritesResult, publicResult] =
        await Promise.all([
          bookingsQuery,
          favoritesQuery,
          publicQuery,
        ])

      if (mineResult.error) throw mineResult.error
      if (favoritesResult.error) throw favoritesResult.error
      if (publicResult.error) throw publicResult.error

      setBookings((mineResult.data ?? []).map(mapBooking))

      setFavorites(
        (favoritesResult.data ?? []).map(
          (row: { salon_id: string }) => row.salon_id,
        ),
      )

      // Public overview: confirmed future bookings only.
      // The RPC must never return client contact information.
      const now = new Date()

      const todayIso = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')

      setAllUpcomingBookings(
        (publicResult.data ?? [])
          .map(mapPublicBooking)
          .filter(
            (booking: PublicBooking) =>
              booking.status === 'مؤكد' &&
              booking.date >= todayIso,
          ),
      )

      if (
        currentUser.type === 'owner' &&
        currentUser.salonId
      ) {
        const ownerResult = await supabase
          .from('bookings')
          .select('*')
          .eq('salon_id', currentUser.salonId)
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (ownerResult.error) throw ownerResult.error

        setSalonBookings(
          (ownerResult.data ?? []).map(mapBooking),
        )
      } else {
        setSalonBookings([])
      }
    },
    [],
  )

  /* ------------------------------------------------------------------------ */
  /* Restore session and listen for authentication changes                    */
  /* ------------------------------------------------------------------------ */

 
  useEffect(() => {
    let active = true
    let requestId = 0

    const syncSession = async (session: any) => {
      const currentRequestId = ++requestId

      try {
        if (!session?.user) {
          setUser(null)
          setBookings([])
          setSalonBookings([])
          setFavorites([])
          setAllUpcomingBookings([])
          setAuthReady(true)
          return
        }

        const profile = await loadProfile(session.user.id)

        if (!active || currentRequestId !== requestId) return

        setUser(profile)

        // Let the dashboard open without waiting for its secondary data.
        setAuthReady(true)

        // Load bookings and favorites in the background.
        void refreshData(profile).catch((error) => {
          console.error(
            '[stikini] Failed to refresh account data:',
            error,
          )
        })
      } catch (error) {
        console.error(
          '[stikini] Failed to load account profile:',
          error,
        )

        if (active && currentRequestId === requestId) {
          setAuthReady(true)
        }
      }
    }

    // Start loading salons independently of authentication.
    void loadSalons()

    // Subscribe without awaiting Supabase requests inside its callback.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          if (active) {
            void syncSession(session)
          }
        }, 0)
      },
    )

    // Restore the current session.
    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error
        if (!active) return

        await syncSession(data.session)
      } catch (error) {
        console.error(
          '[stikini] Failed to restore Supabase session:',
          error,
        )

        if (active) setAuthReady(true)
      }
    }

    void bootstrap()

    return () => {
      active = false
      requestId++
      listener.subscription.unsubscribe()
    }
  }, [loadSalons, loadProfile, refreshData])


  /* ------------------------------------------------------------------------ */
  /* Register                                                                 */
  /* ------------------------------------------------------------------------ */

  const register = useCallback<StoreValue['register']>(
    async (input) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          options: {
            data: {
              name: input.name.trim(),
              phone: input.phone.trim(),
              type: input.type,
            },
          },
        })

        if (error) {
          return {
            ok: false,
            error: getErrorMessage(
              error,
              'تعذر إنشاء الحساب.',
            ),
          }
        }

        if (!data.user) {
          return { ok: false, error: 'تعذر إنشاء الحساب.' }
        }

        if (!data.session) {
          return {
            ok: true,
            needsEmailConfirmation: true,
          }
        }

        const profile = await loadProfile(data.user.id)

        if (!profile) {
          return {
            ok: false,
            error:
              'تم إنشاء الحساب، لكن ملف المستخدم غير موجود. تحقق من إعدادات إنشاء profiles في Supabase.',
          }
        }

        setUser(profile)
        await refreshData(profile)

        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          error: getErrorMessage(
            error,
            'تعذر الاتصال بقاعدة البيانات.',
          ),
        }
      }
    },
    [loadProfile, refreshData],
  )

  /* ------------------------------------------------------------------------ */
  /* Login                                                                    */
  /* ------------------------------------------------------------------------ */

  const login = useCallback<StoreValue['login']>(
    async (email, password) => {
      try {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          })

        if (error) {
          return {
            ok: false,
            error: getErrorMessage(
              error,
              'تعذر تسجيل الدخول.',
            ),
          }
        }

        if (!data.user) {
          return { ok: false, error: 'تعذر تسجيل الدخول.' }
        }

        const profile = await loadProfile(data.user.id)

        if (!profile) {
          await supabase.auth.signOut()

          return {
            ok: false,
            error:
              'تم تسجيل الدخول لكن ملف الحساب غير موجود. تحقق من جدول profiles وإعدادات Supabase.',
          }
        }

        setUser(profile)
        await refreshData(profile)

        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          error: getErrorMessage(
            error,
            'تعذر الاتصال بقاعدة البيانات.',
          ),
        }
      }
    },
    [loadProfile, refreshData],
  )

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      showToast(
        getErrorMessage(error, 'تعذر تسجيل الخروج.'),
        'error',
      )
      return
    }

    setUser(null)
    setBookings([])
    setSalonBookings([])
    setFavorites([])
    setAllUpcomingBookings([])

    showToast(
      'تم تسجيل الخروج بنجاح. نراك قريباً!',
      'info',
    )
  }, [showToast])

  /* ------------------------------------------------------------------------ */
  /* Create booking                                                           */
  /* ------------------------------------------------------------------------ */

  const createBooking = useCallback<StoreValue['createBooking']>(
    async (input) => {
      if (!user) {
        throw new Error(
          'يجب تسجيل الدخول قبل تأكيد الحجز.',
        )
      }

      const { data: conflicts, error: conflictError } =
        await supabase
          .from('bookings')
          .select('id')
          .eq('salon_id', input.salonId)
          .eq('barber_name', input.barberName)
          .eq('date', input.date)
          .eq('time', input.time)
          .eq('status', 'مؤكد')
          .limit(1)

      if (conflictError) throw conflictError

      if (conflicts && conflicts.length > 0) {
        throw new Error(
          'هذا الموعد محجوز بالفعل لهذا الحلاق. اختر وقتاً آخر من فضلك.',
        )
      }

      const subtotal = input.services.reduce(
        (sum, service) => sum + service.price,
        0,
      )

      const promoCode = input.promoCode
        ?.trim()
        .toUpperCase()

      const validPromo =
        promoCode && PROMO_CODES[promoCode]
          ? promoCode
          : undefined

      const discount = calcPromoDiscount(
        validPromo,
        subtotal,
      )

      const code = generateBookingCode()

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          code,
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
          throw new Error(
            'هذا الموعد حُجز للتو من زبون آخر. اختر وقتاً آخر من فضلك.',
          )
        }

        throw error
      }

      const booking = mapBooking(data)

      await refreshData(user)

      return booking
    },
    [refreshData, user],
  )

  /* ------------------------------------------------------------------------ */
  /* Cancel own booking                                                       */
  /* ------------------------------------------------------------------------ */

  const cancelBooking = useCallback<StoreValue['cancelBooking']>(
    async (id) => {
      if (!user) return

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'ملغى' })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('status', 'مؤكد')

      if (error) {
        showToast(
          getErrorMessage(error, 'تعذر إلغاء الحجز.'),
          'error',
        )
        return
      }

      await refreshData(user)

      showToast('تم إلغاء الحجز بنجاح.', 'info')
    },
    [refreshData, showToast, user],
  )

  /* ------------------------------------------------------------------------ */
  /* Update booking status for salon owner                                    */
  /* ------------------------------------------------------------------------ */

  const updateSalonBookingStatus = useCallback<
    StoreValue['updateSalonBookingStatus']
  >(
    async (id, status) => {
      if (
        !user ||
        user.type !== 'owner' ||
        !user.salonId
      ) {
        showToast(
          'هذه العملية متاحة لصاحب الصالون فقط.',
          'error',
        )
        return
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .eq('salon_id', user.salonId)
        .eq('status', 'مؤكد')

      if (error) {
        showToast(
          getErrorMessage(
            error,
            'تعذر تحديث الحجز.',
          ),
          'error',
        )
        return
      }

      await refreshData(user)

      showToast(
        status === 'مكتمل'
          ? 'تم تسجيل الموعد كمكتمل.'
          : 'تم إلغاء الموعد.',
        status === 'مكتمل' ? 'success' : 'info',
      )
    },
    [refreshData, showToast, user],
  )

  /* ------------------------------------------------------------------------ */
  /* Set owner's salon                                                        */
  /* ------------------------------------------------------------------------ */

  const setOwnerSalon = useCallback(
    async (salonId: string) => {
      if (!user || user.type !== 'owner') return

      const { data, error } = await supabase
        .from('profiles')
        .update({ salon_id: salonId })
        .eq('id', user.id)
        .select(
          'id,name,email,phone,type,salon_id,created_at',
        )
        .single()

      if (error) {
        showToast(
          getErrorMessage(error, 'تعذر حفظ الصالون.'),
          'error',
        )
        return
      }

      const nextUser = mapProfile(data)

      setUser(nextUser)
      await refreshData(nextUser)

      showToast('تم حفظ الصالون المُدار.', 'success')
    },
    [refreshData, showToast, user],
  )

  /* ------------------------------------------------------------------------ */
  /* Favorites                                                                */
  /* ------------------------------------------------------------------------ */

  const toggleFavorite = useCallback(
    async (salonId: string) => {
      if (!user) {
        showToast(
          'سجّل الدخول أولاً لحفظ المفضلة.',
          'info',
        )
        return
      }

      const alreadyFavorite = favorites.includes(salonId)

      if (alreadyFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('salon_id', salonId)

        if (error) {
          showToast(
            getErrorMessage(
              error,
              'تعذر تحديث المفضلة.',
            ),
            'error',
          )
          return
        }

        setFavorites((prev) =>
          prev.filter((id) => id !== salonId),
        )
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            salon_id: salonId,
          })

        if (error) {
          showToast(
            getErrorMessage(
              error,
              'تعذر تحديث المفضلة.',
            ),
            'error',
          )
          return
        }

        setFavorites((prev) => [...prev, salonId])
      }
    },
    [favorites, showToast, user],
  )

  const isFavorite = useCallback(
    (salonId: string) => favorites.includes(salonId),
    [favorites],
  )

  /* ------------------------------------------------------------------------ */
  /* Context value                                                            */
  /* ------------------------------------------------------------------------ */

  const value = useMemo<StoreValue>(
    () => ({
      user,
      salons,
      bookings,
      salonBookings,
      allUpcomingBookings,
      favorites,
      toasts,
      authReady,
      register,
      login,
      logout,
      loadSalons,
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
      salons,
      bookings,
      salonBookings,
      allUpcomingBookings,
      favorites,
      toasts,
      authReady,
      register,
      login,
      logout,
      loadSalons,
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

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Store hook                                                                 */
/* -------------------------------------------------------------------------- */

export function useStore(): StoreValue {
  const context = useContext(StoreContext)

  if (!context) {
    throw new Error(
      'useStore must be used within StoreProvider',
    )
  }

  return context
}
