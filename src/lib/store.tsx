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
  Barber,
  Booking,
  BookingService,
  BookingStatus,
  Salon,
  SalonService,
  ToastItem,
  User,
} from './types'

import { PROMO_CODES } from './data'
import { generateBookingCode } from './utils'
import { supabase } from './supabase'

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UserType = 'client' | 'owner'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ownsBooking = (
  booking: Booking,
  user: User | null,
) => {
  if (!user) return false

  return (
    booking.userId === user.id ||
    booking.email.toLowerCase() === user.email.toLowerCase()
  )
}

/* -------------------------------------------------------------------------- */
/* Booking input                                                              */
/* -------------------------------------------------------------------------- */

export interface NewBookingInput {
  salonId: string
  salonName: string
  services: BookingService[]
  barberName: string
  date: string
  time: string
  clientName: string
  phone: string
  email: string
  notes: string
  promoCode?: string
}

/* -------------------------------------------------------------------------- */
/* Store type                                                                 */
/* -------------------------------------------------------------------------- */

interface StoreValue {
  user: User | null
  isReady: boolean

  /* Admin */
  isAdmin: boolean

  pendingSalons: Salon[]

  loadPendingSalons: () => Promise<void>

  approveSalon: (
    salonId: string,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  rejectSalon: (
    salonId: string,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  salons: Salon[]

  allBookings: Booking[]
  bookings: Booking[]
  myBookings: Booking[]
  salonBookings: Booking[]
  ownerSalonBookings: Booking[]

  favorites: string[]

  toasts: ToastItem[]

  login: (
    email: string,
    password: string,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
    isAdmin?: boolean
    userType?: UserType
  }>

  register: (input: {
    name: string
    email: string
    phone: string
    password: string
    type: UserType
  }) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  logout: () => Promise<void>

  createBooking: (
    input: NewBookingInput,
  ) => Promise<
    | {
        ok: true
        booking: Booking
        message?: string
      }
    | {
        ok: false
        error: string
        message?: string
      }
  >

  cancelBooking: (
    bookingId: string,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  updateSalonBookingStatus: (
    bookingId: string,
    status: BookingStatus,
  ) => Promise<{
    ok: boolean
    error?: string
    message?: string
  }>

  refreshPublicBookings: () => Promise<void>

  setOwnerSalon: (
    salonId: string,
  ) => Promise<void>

  toggleFavorite: (
    salonId: string,
  ) => Promise<void>

  isFavorite: (
    salonId: string,
  ) => boolean

  showToast: (
    message: string,
    type?: ToastItem['type'],
  ) => void

  removeToast: (
    id: string,
  ) => void

  dismissToast: (
    id: string,
  ) => void
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const StoreContext = createContext<
  StoreValue | undefined
>(undefined)

/* -------------------------------------------------------------------------- */
/* Profile mapper                                                             */
/* -------------------------------------------------------------------------- */

function mapProfile(row: any): User {
  return {
    id: String(row.id),
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    type: row.type === 'owner' ? 'owner' : 'client',
    salonId: row.salon_id ?? undefined,
    createdAt:
      row.created_at ??
      new Date().toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Booking mapper                                                             */
/* -------------------------------------------------------------------------- */

function mapBooking(row: any): Booking {
  const services: BookingService[] =
    Array.isArray(row.services)
      ? row.services.map((service: any) => ({
          id: String(service.id ?? ''),
          name: String(service.name ?? ''),
          price: Number(service.price ?? 0),
          duration: Number(service.duration ?? 0),
        }))
      : []

  return {
    id: String(row.id),
    code: String(row.code ?? ''),
    salonId: String(row.salon_id ?? ''),
    salonName: String(row.salon_name ?? ''),
    services,
    barberName: String(row.barber_name ?? ''),
    date: String(row.date ?? ''),
    time: String(row.time ?? ''),
    clientName: String(row.client_name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    notes: String(row.notes ?? ''),
    totalPrice: Number(row.total_price ?? 0),
    discount: Number(row.discount ?? 0),
    promoCode: row.promo_code ?? undefined,
    userId: row.user_id ?? undefined,
    status: row.status ?? 'مؤكد',
    createdAt:
      row.created_at ??
      new Date().toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Auth error                                                                 */
/* -------------------------------------------------------------------------- */

function authErrorMessage(error: any): string {
  const message = String(
    error?.message ?? '',
  ).toLowerCase()

  if (
    message.includes(
      'invalid login credentials',
    )
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  }

  if (
    message.includes(
      'email not confirmed',
    )
  ) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً'
  }

  if (
    message.includes(
      'user already registered',
    )
  ) {
    return 'هذا البريد الإلكتروني مسجل بالفعل'
  }

  if (message.includes('password')) {
    return 'كلمة المرور غير صالحة'
  }

  return (
    error?.message ||
    'حدث خطأ غير متوقع'
  )
}

/* -------------------------------------------------------------------------- */
/* Salon slug                                                                 */
/* -------------------------------------------------------------------------- */

function createSalonSlug(
  name: string,
  id: string,
): string {
  const cleanName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')

  return `${cleanName || 'salon'}-${id.slice(0, 8)}`
}

/* -------------------------------------------------------------------------- */
/* Salon mapper                                                               */
/* -------------------------------------------------------------------------- */

function mapSalon(
  salonRow: any,
  servicesRows: any[],
  barbersRows: any[],
  imagesRows: any[],
): Salon {
  /* ------------------------------ Services ------------------------------ */

  const services: SalonService[] =
    servicesRows.map((service: any) => ({
      id: String(service.id),
      name: String(service.name ?? ''),
      category: String(
        service.category ?? 'خدمات',
      ),
      price: Number(service.price ?? 0),
      duration: Number(
        service.duration ?? 0,
      ),
      description: String(
        service.description ?? '',
      ),
      popular: service.popular === true,
    }))

  /* ------------------------------- Barbers ------------------------------- */

  const barbers: Barber[] =
    barbersRows.map((barber: any) => {
      const specialties =
        Array.isArray(barber.specialties)
          ? barber.specialties.map(String)
          : []

      return {
        id: String(barber.id),
        name: String(
          barber.name ?? '',
        ),
        role: String(
          barber.role ?? 'حلاق',
        ),
        experience: `${Number(
          barber.experience ?? 0,
        )} سنوات`,
        rating: Number(
          barber.rating ?? 5,
        ),
        image: String(
          barber.photo_url ?? '',
        ),
        specialties,
      }
    })

  /* -------------------------------- Images -------------------------------- */

  const databaseImages = imagesRows
    .map(
      (image: any) =>
        image.image_url,
    )
    .filter(
      (url: any) =>
        typeof url === 'string' &&
        url.trim().length > 0,
    )
    .map(
      (url: string) =>
        url.trim(),
    )

  const logoImage = String(
    salonRow.logo_url ?? '',
  ).trim()

  const coverFromDatabase =
    imagesRows.find(
      (image: any) =>
        image.is_cover === true ||
        image.type === 'cover' ||
        image.image_type === 'cover',
    )?.image_url

  const coverImage = String(
    salonRow.cover_url ||
      coverFromDatabase ||
      databaseImages[0] ||
      '',
  ).trim()

  const gallery = Array.from(
    new Set(
      [
        logoImage,
        coverImage,
        ...databaseImages,
      ].filter(
        (
          url,
        ): url is string =>
          typeof url === 'string' &&
          url.trim().length > 0,
      ),
    ),
  )

  /* -------------------------------- Type --------------------------------- */

  let type: Salon['type'] = 'رجالية'

  if (
    salonRow.category === 'نسائية' ||
    salonRow.category === 'مختلطة' ||
    salonRow.category === 'رجالية'
  ) {
    type = salonRow.category
  }

  /* --------------------------- Opening hours ----------------------------- */

  let workingHours = 'حسب المواعيد'

  const openingHours =
    salonRow.opening_hours

  if (
    openingHours &&
    typeof openingHours === 'object' &&
    !Array.isArray(openingHours)
  ) {
    const values =
      Object.values(openingHours)

    if (values.length > 0) {
      workingHours = String(
        values[0],
      )
    }
  }

  /* ------------------------------- Result -------------------------------- */

  return {
    id: String(salonRow.id),

    slug: createSalonSlug(
      String(
        salonRow.name ?? 'salon',
      ),
      String(salonRow.id),
    ),

    name: String(
      salonRow.name ?? 'صالون',
    ),

    tagline: String(
      salonRow.description ?? '',
    ),

    description: String(
      salonRow.description ?? '',
    ),

    type,

    neighborhood: String(
      salonRow.commune ||
        salonRow.wilaya ||
        'الجزائر العاصمة',
    ),

    address: String(
      salonRow.address ?? '',
    ),

    phone: String(
      salonRow.phone ?? '',
    ),

    rating: 5,

    reviewsCount: 0,

    priceLevel: 2,

    image: coverImage,

    logo: logoImage,

    gallery,

    services,

    barbers,

    reviews: [],

    features: [],

    workingHours,

    isOpen: true,

    featured: false,

    verified:
      salonRow.status === 'approved',

    established: new Date(
      salonRow.created_at ??
        Date.now(),
    ).getFullYear(),
  }
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function StoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] =
    useState<User | null>(null)

  const [isAdmin, setIsAdmin] =
    useState(false)

  const [pendingSalons, setPendingSalons] =
    useState<Salon[]>([])

  const [isReady, setIsReady] =
    useState(false)

  const [allBookings, setAllBookings] =
    useState<Booking[]>([])

  const [favorites, setFavorites] =
    useState<string[]>([])

  const [toasts, setToasts] =
    useState<ToastItem[]>([])

  const [salons, setSalons] =
    useState<Salon[]>([])

  /* ------------------------------------------------------------------------ */
  /* Toasts                                                                   */
  /* ------------------------------------------------------------------------ */

  const removeToast = useCallback(
    (id: string) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id,
        ),
      )
    },
    [],
  )

  const dismissToast =
    removeToast

  const showToast = useCallback(
    (
      message: string,
      type: ToastItem['type'] = 'info',
    ) => {
      const id = `${Date.now()}-${Math.random()}`

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ])

      window.setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast],
  )

  /* ------------------------------------------------------------------------ */
  /* Load approved salons                                                     */
  /* ------------------------------------------------------------------------ */

  const loadSalons = useCallback(
    async () => {
      try {
        const {
          data: salonRows,
          error: salonError,
        } = await supabase
          .from('salons')
          .select('*')
          .eq('status', 'approved')

        if (salonError) {
          console.error(
            'Error loading salons:',
            salonError,
          )

          setSalons([])
          return
        }

        const mappedSalons: Salon[] = []

        for (const salon of salonRows ?? []) {
          const salonId =
            String(salon.id)

          const [
            servicesResult,
            barbersResult,
            imagesResult,
          ] = await Promise.all([
            supabase
              .from('salon_services')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),

            supabase
              .from('salon_barbers')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),

            supabase
              .from('salon_images')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),
          ])

          if (servicesResult.error) {
            console.error(
              `Services error for salon ${salonId}:`,
              servicesResult.error,
            )
          }

          if (barbersResult.error) {
            console.error(
              `Barbers error for salon ${salonId}:`,
              barbersResult.error,
            )
          }

          if (imagesResult.error) {
            console.error(
              `Images error for salon ${salonId}:`,
              imagesResult.error,
            )
          }

          mappedSalons.push(
            mapSalon(
              salon,
              servicesResult.data ?? [],
              barbersResult.data ?? [],
              imagesResult.data ?? [],
            ),
          )
        }

        setSalons(mappedSalons)
      } catch (error) {
        console.error(
          'Unexpected salon loading error:',
          error,
        )

        setSalons([])
      }
    },
    [],
  )

  /* ------------------------------------------------------------------------ */
  /* Load user                                                                 */
  /* ------------------------------------------------------------------------ */

  const loadUserData = useCallback(
    async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        setFavorites([])
        setPendingSalons([])

        return {
          user: null,
          isAdmin: false,
          userType: null as UserType | null,
        }
      }

      const authUser =
        session.user

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq(
          'id',
          authUser.id,
        )
        .maybeSingle()

      if (profileError) {
        console.error(
          'Profile loading error:',
          profileError,
        )

        setUser(null)
        setIsAdmin(false)
        setFavorites([])

        return {
          user: null,
          isAdmin: false,
          userType: null as UserType | null,
        }
      }

      let mappedUser: User
      let admin = false

      if (profile) {
        mappedUser =
          mapProfile(profile)

        admin =
          profile.is_admin === true
      } else {
        const metadataType =
          authUser.user_metadata
            ?.type === 'owner'
            ? 'owner'
            : 'client'

        mappedUser = {
          id: authUser.id,

          name:
            authUser.user_metadata
              ?.name ||
            authUser.email?.split(
              '@',
            )[0] ||
            '',

          email:
            authUser.email ?? '',

          phone:
            authUser.user_metadata
              ?.phone ?? '',

          type: metadataType,

          salonId:
            authUser.user_metadata
              ?.salon_id ??
            undefined,

          createdAt:
            authUser.created_at ??
            new Date().toISOString(),
        }

        admin = false
      }

      setUser(mappedUser)
      setIsAdmin(admin)

      const {
        data: favoriteRows,
      } = await supabase
        .from('favorites')
        .select('salon_id')
        .eq(
          'user_id',
          authUser.id,
        )

      setFavorites(
        (favoriteRows ?? []).map(
          (row) =>
            String(row.salon_id),
        ),
      )

      return {
        user: mappedUser,
        isAdmin: admin,
        userType:
          mappedUser.type as UserType,
      }
    },
    [],
  )

  /* ------------------------------------------------------------------------ */
  /* Load pending salons - ADMIN                                              */
  /* ------------------------------------------------------------------------ */

  const loadPendingSalons =
    useCallback(async () => {
      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession()

        if (!session?.user) {
          console.error(
            'Pending salons: no authenticated user',
          )

          setPendingSalons([])
          return
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq(
            'id',
            session.user.id,
          )
          .maybeSingle()

        if (profileError) {
          console.error(
            'Admin profile error:',
            profileError,
          )

          setPendingSalons([])
          return
        }

        if (profile?.is_admin !== true) {
          console.error(
            'Current user is not an admin',
          )

          setPendingSalons([])
          return
        }

        const {
          data: salonRows,
          error: salonError,
        } = await supabase
          .from('salons')
          .select('*')
          .eq(
            'status',
            'pending',
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          )

        if (salonError) {
          console.error(
            'PENDING SALONS ERROR:',
            salonError,
          )

          setPendingSalons([])
          return
        }

        console.log(
          'Pending salons:',
          salonRows,
        )

        const mappedSalons: Salon[] = []

        for (const salon of salonRows ?? []) {
          const salonId =
            String(salon.id)

          console.log(
            `Loading data for pending salon: ${salon.name} (${salonId})`,
          )

          const [
            servicesResult,
            barbersResult,
            imagesResult,
          ] = await Promise.all([
            supabase
              .from('salon_services')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),

            supabase
              .from('salon_barbers')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),

            supabase
              .from('salon_images')
              .select('*')
              .eq(
                'salon_id',
                salonId,
              ),
          ])

          if (servicesResult.error) {
            console.error(
              `SERVICES ERROR - ${salon.name}:`,
              servicesResult.error,
            )
          } else {
            console.log(
              `Services for ${salon.name}:`,
              servicesResult.data,
            )
          }

          if (barbersResult.error) {
            console.error(
              `BARBERS ERROR - ${salon.name}:`,
              barbersResult.error,
            )
          } else {
            console.log(
              `Barbers for ${salon.name}:`,
              barbersResult.data,
            )
          }

          if (imagesResult.error) {
            console.error(
              `IMAGES ERROR - ${salon.name}:`,
              imagesResult.error,
            )
          } else {
            console.log(
              `Images for ${salon.name}:`,
              imagesResult.data,
            )
          }

          console.log(
            `Salon URLs for ${salon.name}:`,
            {
              logo_url: salon.logo_url,
              cover_url: salon.cover_url,
            },
          )

          const mappedSalon =
            mapSalon(
              salon,
              servicesResult.data ?? [],
              barbersResult.data ?? [],
              imagesResult.data ?? [],
            )

          console.log(
            `FINAL MAPPED SALON - ${salon.name}:`,
            mappedSalon,
          )

          mappedSalons.push(
            mappedSalon,
          )
        }

        setPendingSalons(
          mappedSalons,
        )
      } catch (error) {
        console.error(
          'Unexpected pending salons loading error:',
          error,
        )

        setPendingSalons([])
      }
    }, [])

  /* ------------------------------------------------------------------------ */
  /* Approve salon                                                            */
  /* ------------------------------------------------------------------------ */

  const approveSalon =
    useCallback(
      async (salonId: string) => {
        try {
          if (!isAdmin) {
            return {
              ok: false,
              error:
                'غير مصرح لك بهذه العملية',
              message:
                'غير مصرح لك بهذه العملية',
            }
          }

          const { error } =
            await supabase
              .from('salons')
              .update({
                status: 'approved',
              })
              .eq(
                'id',
                salonId,
              )

          if (error) {
            console.error(
              'Approve salon error:',
              error,
            )

            return {
              ok: false,
              error: error.message,
              message: error.message,
            }
          }

          await Promise.all([
            loadSalons(),
            loadPendingSalons(),
          ])

          return {
            ok: true,
            message:
              'تمت الموافقة على الصالون بنجاح',
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء الموافقة على الصالون'

          return {
            ok: false,
            error: message,
            message,
          }
        }
      },
      [
        isAdmin,
        loadSalons,
        loadPendingSalons,
      ],
    )

  /* ------------------------------------------------------------------------ */
  /* Reject salon                                                             */
  /* ------------------------------------------------------------------------ */

  const rejectSalon =
    useCallback(
      async (salonId: string) => {
        try {
          if (!isAdmin) {
            return {
              ok: false,
              error:
                'غير مصرح لك بهذه العملية',
              message:
                'غير مصرح لك بهذه العملية',
            }
          }

          const { error } =
            await supabase
              .from('salons')
              .update({
                status: 'rejected',
              })
              .eq(
                'id',
                salonId,
              )

          if (error) {
            console.error(
              'Reject salon error:',
              error,
            )

            return {
              ok: false,
              error: error.message,
              message: error.message,
            }
          }

          await loadPendingSalons()

          return {
            ok: true,
            message:
              'تم رفض الصالون',
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء رفض الصالون'

          return {
            ok: false,
            error: message,
            message,
          }
        }
      },
      [
        isAdmin,
        loadPendingSalons,
      ],
    )

  /* ------------------------------------------------------------------------ */
  /* Refresh bookings                                                         */
  /* ------------------------------------------------------------------------ */

  const refreshPublicBookings =
    useCallback(async () => {
      try {
        const {
          data,
          error,
        } = await supabase
          .from('bookings')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false,
            },
          )

        if (error) {
          console.error(
            'Error loading bookings:',
            error,
          )

          return
        }

        setAllBookings(
          (data ?? []).map(
            mapBooking,
          ),
        )
      } catch (error) {
        console.error(
          'Unexpected booking loading error:',
          error,
        )
      }
    }, [])

  /* ------------------------------------------------------------------------ */
  /* Initialize                                                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true

    const initialize =
      async () => {
        try {
          await loadSalons()
          await loadUserData()
          await refreshPublicBookings()
        } catch (error) {
          console.error(
            'Store initialization error:',
            error,
          )
        } finally {
          if (mounted) {
            setIsReady(true)
          }
        }
      }

    void initialize()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session,
        ) => {
          if (!session) {
            setUser(null)
            setIsAdmin(false)
            setFavorites([])
            setPendingSalons([])
            return
          }

          try {
            await loadUserData()
          } catch (error) {
            console.error(
              'Auth state profile loading error:',
              error,
            )
          }
        },
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [
    loadSalons,
    loadUserData,
    refreshPublicBookings,
  ])

  /* ------------------------------------------------------------------------ */
  /* Login                                                                    */
  /* ------------------------------------------------------------------------ */

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })

        if (error) {
          const message =
            authErrorMessage(error)

          return {
            ok: false,
            error: message,
            message,
          }
        }

        if (!data.user) {
          return {
            ok: false,
            error:
              'تعذر تسجيل الدخول',
            message:
              'تعذر تسجيل الدخول',
          }
        }

        /*
         * IMPORTANT:
         * Read the profile directly after authentication.
         * This prevents LoginPage from depending on React state
         * being updated before navigation.
         */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('type, is_admin')
          .eq(
            'id',
            data.user.id,
          )
          .maybeSingle()

        if (profileError) {
          console.error(
            'Login profile loading error:',
            profileError,
          )

          await supabase.auth.signOut()

          return {
            ok: false,
            error:
              'تعذر تحميل بيانات الحساب.',
            message:
              'تعذر تحميل بيانات الحساب.',
          }
        }

        if (!profile) {
          console.error(
            'No profile found for authenticated user:',
            data.user.id,
          )

          await supabase.auth.signOut()

          return {
            ok: false,
            error:
              'لم يتم العثور على ملف الحساب.',
            message:
              'لم يتم العثور على ملف الحساب.',
          }
        }

        const admin: boolean =
          profile.is_admin === true

        /*
         * Explicitly type this value.
         * This fixes the TypeScript error:
         * string is not assignable to "client" | "owner"
         */
        const userType: UserType =
          profile.type === 'owner'
            ? 'owner'
            : 'client'

        /*
         * Update the global store.
         */
        await loadUserData()

        /*
         * Return role information directly to LoginPage.
         */
        return {
          ok: true,
          message:
            'تم تسجيل الدخول بنجاح',
          isAdmin: admin,
          userType,
        }
      } catch (error) {
        console.error(
          'Login error:',
          error,
        )

        const message =
          authErrorMessage(error)

        return {
          ok: false,
          error: message,
          message,
        }
      }
    },
    [loadUserData],
  )

  /* ------------------------------------------------------------------------ */
  /* Register                                                                 */
  /* ------------------------------------------------------------------------ */

  const register = useCallback(
    async ({
      name,
      email,
      phone,
      password,
      type,
    }: {
      name: string
      email: string
      phone: string
      password: string
      type: UserType
    }) => {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name.trim(),
                phone: phone.trim(),
                type,
              },
            },
          })

        if (error) {
          const message =
            authErrorMessage(error)

          return {
            ok: false,
            error: message,
            message,
          }
        }

        if (!data.user) {
          return {
            ok: false,
            error:
              'تعذر إنشاء الحساب',
            message:
              'تعذر إنشاء الحساب',
          }
        }

        const {
          error: profileError,
        } =
          await supabase
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                type,
              },
              {
                onConflict: 'id',
              },
            )

        if (profileError) {
          console.error(
            'Profile creation error:',
            profileError,
          )
        }

        await loadUserData()

        return {
          ok: true,
          message:
            'تم إنشاء حسابك بنجاح! مرحباً بك في stikini.',
        }
      } catch (error) {
        const message =
          authErrorMessage(error)

        return {
          ok: false,
          error: message,
          message,
        }
      }
    },
    [loadUserData],
  )

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout = async () => {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    setUser(null)
  }

  window.location.href = '/'
}

  /* ------------------------------------------------------------------------ */
  /* Create booking                                                            */
  /* ------------------------------------------------------------------------ */

  const createBooking =
    useCallback(
      async (
        input: NewBookingInput,
      ) => {
        try {
          const {
            data: {
              user: authUser,
            },
          } =
            await supabase.auth.getUser()

          const subtotal =
            input.services.reduce(
              (
                sum,
                service,
              ) =>
                sum +
                Number(
                  service.price,
                ),
              0,
            )

          let discount = 0

          if (input.promoCode) {
            const promo =
              PROMO_CODES[
                input.promoCode
              ]

            if (promo) {
              discount =
                Math.round(
                  subtotal *
                    (promo.percent /
                      100),
                )

              discount =
                Math.min(
                  discount,
                  subtotal,
                )
            }
          }

          const totalPrice =
            Math.max(
              0,
              subtotal - discount,
            )

          const bookingCode =
            generateBookingCode()

          const bookingPayload = {
            code: bookingCode,

            salon_id:
              input.salonId,

            salon_name:
              input.salonName,

            services:
              input.services.map(
                (service) => ({
                  id: service.id,
                  name: service.name,
                  price: service.price,
                  duration:
                    service.duration,
                }),
              ),

            barber_name:
              input.barberName,

            date: input.date,

            time: input.time,

            client_name:
              input.clientName,

            phone: input.phone,

            email: input.email,

            notes: input.notes,

            total_price:
              totalPrice,

            discount,

            promo_code:
              input.promoCode ||
              null,

            user_id:
              authUser?.id ?? null,

            status: 'مؤكد',
          }

          const {
            data,
            error,
          } = await supabase
            .from('bookings')
            .insert(
              bookingPayload,
            )
            .select()
            .single()

          if (error) {
            console.error(
              'Create booking error:',
              error,
            )

            return {
              ok: false as const,
              error:
                error.message,
              message:
                error.message,
            }
          }

          const booking =
            mapBooking(data)

          setAllBookings(
            (current) => [
              booking,
              ...current,
            ],
          )

          return {
            ok: true as const,
            booking,
            message:
              'تم إنشاء الحجز بنجاح',
          }
        } catch (error) {
          console.error(
            'Unexpected create booking error:',
            error,
          )

          const message =
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء إنشاء الحجز'

          return {
            ok: false as const,
            error: message,
            message,
          }
        }
      },
      [],
    )

  /* ------------------------------------------------------------------------ */
  /* Cancel booking                                                            */
  /* ------------------------------------------------------------------------ */

  const cancelBooking =
    useCallback(
      async (
        bookingId: string,
      ) => {
        try {
          const booking =
            allBookings.find(
              (item) =>
                item.id ===
                bookingId,
            )

          if (!booking) {
            return {
              ok: false,
              error:
                'الحجز غير موجود',
              message:
                'الحجز غير موجود',
            }
          }

          if (
            !ownsBooking(
              booking,
              user,
            )
          ) {
            return {
              ok: false,
              error:
                'غير مصرح لك بإلغاء هذا الحجز',
              message:
                'غير مصرح لك بإلغاء هذا الحجز',
            }
          }

          const {
            data,
            error,
          } =
            await supabase
              .from('bookings')
              .update({
                status: 'ملغى',
              })
              .eq(
                'id',
                bookingId,
              )
              .select()
              .single()

          if (error) {
            return {
              ok: false,
              error:
                error.message,
              message:
                error.message,
            }
          }

          const updatedBooking =
            mapBooking(data)

          setAllBookings(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  bookingId
                    ? updatedBooking
                    : item,
              ),
          )

          return {
            ok: true,
            message:
              'تم إلغاء الحجز',
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء إلغاء الحجز'

          return {
            ok: false,
            error: message,
            message,
          }
        }
      },
      [allBookings, user],
    )

  /* ------------------------------------------------------------------------ */
  /* Update booking status                                                     */
  /* ------------------------------------------------------------------------ */

  const updateBookingStatus =
    useCallback(
      async (
        bookingId: string,
        status: BookingStatus,
      ) => {
        try {
          const {
            data,
            error,
          } =
            await supabase
              .from('bookings')
              .update({
                status,
              })
              .eq(
                'id',
                bookingId,
              )
              .select()
              .single()

          if (error) {
            return {
              ok: false,
              error:
                error.message,
              message:
                error.message,
            }
          }

          const updatedBooking =
            mapBooking(data)

          setAllBookings(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  bookingId
                    ? updatedBooking
                    : item,
              ),
          )

          return {
            ok: true,
            message:
              'تم تحديث حالة الحجز',
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'حدث خطأ أثناء تحديث الحجز'

          return {
            ok: false,
            error: message,
            message,
          }
        }
      },
      [],
    )

  const updateSalonBookingStatus =
    updateBookingStatus

  /* ------------------------------------------------------------------------ */
  /* Owner salon                                                               */
  /* ------------------------------------------------------------------------ */

  const setOwnerSalon =
    useCallback(
      async (
        salonId: string,
      ) => {
        if (!user) return

        const { error } =
          await supabase
            .from('profiles')
            .update({
              salon_id: salonId,
            })
            .eq(
              'id',
              user.id,
            )

        if (error) {
          console.error(
            'Set owner salon error:',
            error,
          )

          return
        }

        setUser(
          (current) =>
            current
              ? {
                  ...current,
                  salonId,
                }
              : current,
        )
      },
      [user],
    )

  /* ------------------------------------------------------------------------ */
  /* Favorites                                                                 */
  /* ------------------------------------------------------------------------ */

  const toggleFavorite =
    useCallback(
      async (
        salonId: string,
      ) => {
        if (!user) {
          showToast(
            'يرجى تسجيل الدخول لإضافة الصالون إلى المفضلة',
            'info',
          )

          return
        }

        const alreadyFavorite =
          favorites.includes(
            salonId,
          )

        if (alreadyFavorite) {
          const { error } =
            await supabase
              .from('favorites')
              .delete()
              .eq(
                'user_id',
                user.id,
              )
              .eq(
                'salon_id',
                salonId,
              )

          if (error) {
            console.error(
              'Remove favorite error:',
              error,
            )

            return
          }

          setFavorites(
            (current) =>
              current.filter(
                (id) =>
                  id !== salonId,
              ),
          )
        } else {
          const { error } =
            await supabase
              .from('favorites')
              .insert({
                user_id: user.id,
                salon_id: salonId,
              })

          if (error) {
            console.error(
              'Add favorite error:',
              error,
            )

            return
          }

          setFavorites(
            (current) => [
              ...current,
              salonId,
            ],
          )
        }
      },
      [
        favorites,
        showToast,
        user,
      ],
    )

  const isFavorite =
    useCallback(
      (salonId: string) =>
        favorites.includes(
          salonId,
        ),
      [favorites],
    )

  /* ------------------------------------------------------------------------ */
  /* Derived bookings                                                          */
  /* ------------------------------------------------------------------------ */

  const myBookings =
    useMemo(() => {
      if (!user) return []

      return allBookings.filter(
        (booking) =>
          ownsBooking(
            booking,
            user,
          ),
      )
    }, [
      allBookings,
      user,
    ])

  const ownerSalonBookings =
    useMemo(() => {
      if (!user?.salonId) {
        return []
      }

      return allBookings.filter(
        (booking) =>
          booking.salonId ===
          user.salonId,
      )
    }, [
      allBookings,
      user,
    ])

  const bookings = myBookings

  const salonBookings =
    ownerSalonBookings

  /* ------------------------------------------------------------------------ */
  /* Store value                                                               */
  /* ------------------------------------------------------------------------ */

  const value =
    useMemo<StoreValue>(
      () => ({
        user,
        isReady,
        isAdmin,

        pendingSalons,
        loadPendingSalons,
        approveSalon,
        rejectSalon,

        salons,

        allBookings,
        bookings,
        myBookings,
        salonBookings,
        ownerSalonBookings,

        favorites,

        toasts,

        login,
        register,
        logout,

        createBooking,
        cancelBooking,

        updateBookingStatus,
        updateSalonBookingStatus,

        refreshPublicBookings,

        setOwnerSalon,

        toggleFavorite,
        isFavorite,

        showToast,
        removeToast,
        dismissToast,
      }),
      [
        user,
        isReady,
        isAdmin,

        pendingSalons,
        loadPendingSalons,
        approveSalon,
        rejectSalon,

        salons,

        allBookings,
        bookings,
        myBookings,
        salonBookings,
        ownerSalonBookings,

        favorites,

        toasts,

        login,
        register,
        logout,

        createBooking,
        cancelBooking,

        updateBookingStatus,
        updateSalonBookingStatus,

        refreshPublicBookings,

        setOwnerSalon,

        toggleFavorite,
        isFavorite,

        showToast,
        removeToast,
        dismissToast,
      ],
    )

  return (
    <StoreContext.Provider
      value={value}
    >
      {children}
    </StoreContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useStore(): StoreValue {
  const context =
    useContext(StoreContext)

  if (!context) {
    throw new Error(
      'useStore must be used inside StoreProvider',
    )
  }

  return context
}