import { useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Store,
  User,
  Users,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import type {
  Barber,
  SalonService,
} from '../lib/types'

type SalonStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

type DeletionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'postponed'
  | string

interface DeletionRequest {
  id: string
  user_id: string
  reason: string
  status: DeletionStatus
  admin_note: string | null
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  profile?: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    type: string | null
  }
}

interface SalonImage {
  id: string
  salon_id: string
  image_url: string
  is_cover?: boolean
  type?: string | null
  image_type?: string | null
}

interface RawSalon {
  id: string
  name?: string | null
  phone?: string | null
  address?: string | null
  description?: string | null
  wilaya?: string | null
  commune?: string | null
  category?: string | null
  logo_url?: string | null
  cover_url?: string | null
  opening_hours?: unknown
  status?: SalonStatus | null
  created_at?: string | null
}

interface AdminSalon {
  id: string
  slug: string

  name: string
  tagline: string
  description: string

  type: string

  neighborhood: string
  address: string
  phone: string

  rating: number
  reviewsCount: number
  priceLevel: number

  image: string
  logo: string
  gallery: string[]

  services: SalonService[]
  barbers: Barber[]

  reviews: unknown[]
  features: string[]

  workingHours: string
  isOpen: boolean
  featured: boolean
  verified: boolean
  established: number

  status: SalonStatus

  wilaya: string
  commune: string
  category: string

  logo_url: string | null
  cover_url: string | null
  created_at?: string

  images: SalonImage[]
}

const formatDate = (
  value: string | null | undefined,
): string => {
  if (!value) return 'غير محدد'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'غير محدد'
  }

  return date.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (
  value: string | null | undefined,
): string => {
  if (!value) return 'غير محدد'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'غير محدد'
  }

  return date.toLocaleString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getSalonStatusLabel = (
  status: SalonStatus,
): string => {
  switch (status) {
    case 'approved':
      return 'مقبول'

    case 'rejected':
      return 'مرفوض'

    default:
      return 'قيد المراجعة'
  }
}

const getDeletionStatusLabel = (
  status: DeletionStatus,
): string => {
  switch (status) {
    case 'approved':
      return 'تمت الموافقة'

    case 'rejected':
      return 'مرفوض'

    case 'postponed':
      return 'مؤجل'

    default:
      return 'قيد المراجعة'
  }
}

const getDeletionStatusClasses = (
  status: DeletionStatus,
): string => {
  switch (status) {
    case 'approved':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'

    case 'rejected':
      return 'border-red-500/20 bg-red-500/10 text-red-400'

    case 'postponed':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-400'

    default:
      return 'border-gold/20 bg-gold/10 text-gold'
  }
}

const getSalonCoverImage = (
  salon: AdminSalon,
): string | null => {
  if (salon.cover_url?.trim()) {
    return salon.cover_url.trim()
  }

  const coverImage = salon.images.find(
    (image) =>
      image.is_cover === true ||
      image.type === 'cover' ||
      image.image_type === 'cover',
  )

  if (coverImage?.image_url) {
    return coverImage.image_url
  }

  if (salon.images[0]?.image_url) {
    return salon.images[0].image_url
  }

  if (salon.image.trim()) {
    return salon.image.trim()
  }

  if (salon.logo_url?.trim()) {
    return salon.logo_url.trim()
  }

  if (salon.logo.trim()) {
    return salon.logo.trim()
  }

  if (salon.gallery.length > 0) {
    return salon.gallery[0]
  }

  return null
}

const getSalonGallery = (
  salon: AdminSalon,
): string[] => {
  const images = [
    salon.cover_url,
    salon.logo_url,
    salon.image,
    salon.logo,
    ...salon.images.map(
      (image) => image.image_url,
    ),
    ...salon.gallery,
  ]

  return Array.from(
    new Set(
      images.filter(
        (url): url is string =>
          typeof url === 'string' &&
          url.trim().length > 0,
      ),
    ),
  )
}

const mapSalon = (
  row: RawSalon,
  services: SalonService[],
  barbers: Barber[],
  images: SalonImage[],
): AdminSalon => {
  const salonId = String(row.id)

  const cleanName = String(
    row.name ?? 'salon',
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')

  const gallery = Array.from(
    new Set(
      [
        row.cover_url,
        row.logo_url,
        ...images.map(
          (image) => image.image_url,
        ),
      ].filter(
        (url): url is string =>
          typeof url === 'string' &&
          url.trim().length > 0,
      ),
    ),
  )

  const coverImage =
    row.cover_url ||
    images.find(
      (image) =>
        image.is_cover === true ||
        image.type === 'cover' ||
        image.image_type === 'cover',
    )?.image_url ||
    images[0]?.image_url ||
    row.logo_url ||
    ''

  let salonType = 'رجالية'

  if (
    row.category === 'رجالية' ||
    row.category === 'نسائية' ||
    row.category === 'مختلطة'
  ) {
    salonType = row.category
  }

  return {
    id: salonId,

    slug: `${cleanName || 'salon'}-${salonId.slice(0, 8)}`,

    name: String(
      row.name ?? 'صالون',
    ),

    tagline: String(
      row.description ?? '',
    ),

    description: String(
      row.description ?? '',
    ),

    type: salonType,

    neighborhood: String(
      row.commune ||
        row.wilaya ||
        'الجزائر العاصمة',
    ),

    address: String(
      row.address ?? '',
    ),

    phone: String(
      row.phone ?? '',
    ),

    rating: 5,

    reviewsCount: 0,

    priceLevel: 2,

    image: String(
      coverImage,
    ),

    logo: String(
      row.logo_url ?? '',
    ),

    gallery,

    services,

    barbers,

    reviews: [],

    features: [],

    workingHours:
      'حسب المواعيد',

    isOpen: true,

    featured: false,

    verified:
      row.status === 'approved',

    established:
      new Date(
        row.created_at ??
          Date.now(),
      ).getFullYear(),

    status:
      row.status ?? 'pending',

    wilaya: String(
      row.wilaya ?? '',
    ),

    commune: String(
      row.commune ?? '',
    ),

    category: String(
      row.category ?? '',
    ),

    logo_url:
      row.logo_url ?? null,

    cover_url:
      row.cover_url ?? null,

    created_at:
      row.created_at ??
      undefined,

    images,
  }
}

export default function AdminSalonsPage() {
  const [salons, setSalons] =
    useState<AdminSalon[]>([])

  const [
    deletionRequests,
    setDeletionRequests,
  ] = useState<DeletionRequest[]>(
    [],
  )

  const [loading, setLoading] =
    useState(true)

  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(true)

  const [
    processingSalon,
    setProcessingSalon,
  ] = useState<string | null>(
    null,
  )

  const [
    processingRequest,
    setProcessingRequest,
  ] = useState<string | null>(
    null,
  )

  const [searchTerm, setSearchTerm] =
    useState('')

  const [activeTab, setActiveTab] =
    useState<
      'salons' | 'deletions'
    >('salons')

  const [
    selectedSalon,
    setSelectedSalon,
  ] = useState<AdminSalon | null>(
    null,
  )

  const [
    selectedDeletionRequest,
    setSelectedDeletionRequest,
  ] = useState<DeletionRequest | null>(
    null,
  )

  const [adminNote, setAdminNote] =
    useState('')

  const loadSalons = async () => {
    setLoading(true)

    try {
      const {
        data,
        error,
      } = await supabase
        .from('salons')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

      if (error) {
        console.error(
          'Error loading salons:',
          error,
        )

        setSalons([])
        return
      }

      const rows =
        (data ?? []) as RawSalon[]

      const enrichedSalons: AdminSalon[] =
        []

      for (const salon of rows) {
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
            )
            .order('name'),

          supabase
            .from('salon_barbers')
            .select('*')
            .eq(
              'salon_id',
              salonId,
            )
            .order('name'),

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
            `Services error for ${salon.name}:`,
            servicesResult.error,
          )
        }

        if (barbersResult.error) {
          console.error(
            `Barbers error for ${salon.name}:`,
            barbersResult.error,
          )
        }

        if (imagesResult.error) {
          console.error(
            `Images error for ${salon.name}:`,
            imagesResult.error,
          )
        }

        const services =
          (
            servicesResult.data ??
            []
          ).map(
            (service: any) => ({
              id: String(
                service.id,
              ),
              name: String(
                service.name ??
                  '',
              ),
              category: String(
                service.category ??
                  'خدمات',
              ),
              price: Number(
                service.price ??
                  0,
              ),
              duration: Number(
                service.duration ??
                  0,
              ),
              description:
                String(
                  service.description ??
                    '',
                ),
              popular:
                service.popular ===
                true,
            }),
          ) as SalonService[]

        const barbers =
          (
            barbersResult.data ??
            []
          ).map(
            (barber: any) => {
              const specialties =
                Array.isArray(
                  barber.specialties,
                )
                  ? barber.specialties.map(
                      String,
                    )
                  : []

              return {
                id: String(
                  barber.id,
                ),
                name: String(
                  barber.name ??
                    '',
                ),
                role: String(
                  barber.role ??
                    'حلاق',
                ),
                experience: `${Number(
                  barber.experience ??
                    0,
                )} سنوات`,
                rating: Number(
                  barber.rating ??
                    5,
                ),
                image: String(
                  barber.photo_url ??
                    '',
                ),
                specialties,
              }
            },
          ) as Barber[]

        const images =
          (
            imagesResult.data ??
            []
          ).map(
            (image: any) => ({
              id: String(
                image.id,
              ),
              salon_id: String(
                image.salon_id ??
                  salonId,
              ),
              image_url: String(
                image.image_url ??
                  '',
              ),
              is_cover:
                image.is_cover ===
                true,
              type:
                image.type ??
                null,
              image_type:
                image.image_type ??
                null,
            }),
          ) as SalonImage[]

        enrichedSalons.push(
          mapSalon(
            salon,
            services,
            barbers,
            images,
          ),
        )
      }

      setSalons(
        enrichedSalons,
      )
    } catch (error) {
      console.error(
        'Unexpected salons error:',
        error,
      )

      setSalons([])
    } finally {
      setLoading(false)
    }
  }

  const loadDeletionRequests = async () => {
  setLoadingRequests(true)

  try {
    const {
      data: requests,
      error: requestsError,
    } = await supabase
      .from('account_deletion_requests')
      .select(`
        id,
        user_id,
        reason,
        status,
        admin_note,
        requested_at,
        reviewed_at,
        reviewed_by
      `)
      .order('requested_at', {
        ascending: false,
      })

    if (requestsError) {
      console.error(
        'Error loading deletion requests:',
        requestsError,
      )
      setDeletionRequests([])
      return
    }

    const requestRows =
      (requests ?? []) as DeletionRequest[]

    if (requestRows.length === 0) {
      setDeletionRequests([])
      return
    }

    const userIds = Array.from(
      new Set(
        requestRows
          .map((request) =>
            String(request.user_id ?? '').trim(),
          )
          .filter(Boolean),
      ),
    )

    if (userIds.length === 0) {
      setDeletionRequests(requestRows)
      return
    }

    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        'id, name, email, phone, type',
      )
      .in('id', userIds)

    if (profilesError) {
      console.error(
        'Error loading profiles for deletion requests:',
        profilesError,
      )

      setDeletionRequests(requestRows)
      return
    }

    const profileMap = new Map<
      string,
      DeletionRequest['profile']
    >()

    for (const profile of profiles ?? []) {
      profileMap.set(
        String(profile.id).trim(),
        {
          id: String(profile.id),
          name: profile.name ?? null,
          email: profile.email ?? null,
          phone: profile.phone ?? null,
          type: profile.type ?? null,
        },
      )
    }

    const enrichedRequests =
      requestRows.map((request) => {
        const userId = String(
          request.user_id ?? '',
        ).trim()

        return {
          ...request,
          profile:
            profileMap.get(userId),
        }
      })

    console.log(
      'Deletion requests with profiles:',
      enrichedRequests,
    )

    setDeletionRequests(
      enrichedRequests,
    )
  } catch (error) {
    console.error(
      'Unexpected deletion request error:',
      error,
    )

    setDeletionRequests([])
  } finally {
    setLoadingRequests(false)
  }
}

  const refreshAll = async () => {
    await Promise.all([
      loadSalons(),
      loadDeletionRequests(),
    ])
  }

  useEffect(() => {
    void refreshAll()
  }, [])

  const filteredSalons =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase()

      if (!search) {
        return salons
      }

      return salons.filter(
        (salon) =>
          [
            salon.name,
            salon.address,
            salon.wilaya,
            salon.commune,
            salon.phone,
            salon.category,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(
                  value,
                )
                  .toLowerCase()
                  .includes(
                    search,
                  ),
            ),
      )
    }, [
      salons,
      searchTerm,
    ])

  const pendingSalons =
    salons.filter(
      (salon) =>
        salon.status ===
        'pending',
    )

  const pendingDeletionRequests =
    deletionRequests.filter(
      (request) =>
        request.status ===
        'pending',
    )

  const handleSalonStatus =
    async (
      salonId: string,
      status: SalonStatus,
    ) => {
      setProcessingSalon(
        salonId,
      )

      try {
        const { error } =
          await supabase
            .from('salons')
            .update({
              status,
            })
            .eq(
              'id',
              salonId,
            )

        if (error) {
          console.error(
            'Error updating salon:',
            error,
          )

          window.alert(
            'حدث خطأ أثناء تحديث حالة الصالون.',
          )

          return
        }

        setSalons(
          (current) =>
            current.map(
              (salon) =>
                salon.id ===
                salonId
                  ? {
                      ...salon,
                      status,
                      verified:
                        status ===
                        'approved',
                    }
                  : salon,
            ),
        )

        setSelectedSalon(
          (current) =>
            current &&
            current.id ===
              salonId
              ? {
                  ...current,
                  status,
                  verified:
                    status ===
                    'approved',
                }
              : current,
        )
      } catch (error) {
        console.error(
          'Unexpected salon status error:',
          error,
        )

        window.alert(
          'حدث خطأ غير متوقع.',
        )
      } finally {
        setProcessingSalon(
          null,
        )
      }
    }

  const handleDeletionDecision =
    async (
      request: DeletionRequest,
      status:
        | 'approved'
        | 'rejected',
    ) => {
      setProcessingRequest(
        request.id,
      )

      try {
        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          window.alert(
            'يجب تسجيل الدخول بحساب المدير.',
          )

          return
        }

        const reviewedAt =
          new Date().toISOString()

        const { error } =
          await supabase
            .from(
              'account_deletion_requests',
            )
            .update({
              status,
              admin_note:
                adminNote.trim() ||
                null,
              reviewed_at:
                reviewedAt,
              reviewed_by:
                user.id,
            })
            .eq(
              'id',
              request.id,
            )

        if (error) {
          console.error(
            'Error updating deletion request:',
            error,
          )

          window.alert(
            'حدث خطأ أثناء تحديث طلب حذف الحساب.',
          )

          return
        }

        const updatedRequest: DeletionRequest =
          {
            ...request,
            status,
            admin_note:
              adminNote.trim() ||
              null,
            reviewed_at:
              reviewedAt,
            reviewed_by:
              user.id,
          }

        setDeletionRequests(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                request.id
                  ? updatedRequest
                  : item,
            ),
        )

        setSelectedDeletionRequest(
          updatedRequest,
        )

        setAdminNote('')
      } catch (error) {
        console.error(
          'Unexpected deletion decision error:',
          error,
        )

        window.alert(
          'حدث خطأ غير متوقع.',
        )
      } finally {
        setProcessingRequest(
          null,
        )
      }
    }

  return (
 <main
  dir="rtl"
  className="min-h-screen bg-forest px-4 pb-6 pt-0 text-cream sm:px-6 sm:pb-8 lg:px-8"
>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                <Store className="h-5 w-5 text-gold" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-cream sm:text-3xl">
                  إدارة المنصة
                </h1>

                <p className="mt-1 text-sm text-cream/55">
                  إدارة الصالونات وطلبات حذف الحسابات
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void refreshAll()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm font-semibold text-gold transition hover:border-gold/40 hover:bg-gold/10"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/10 p-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'salons',
              )
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab ===
              'salons'
                ? 'bg-gold text-forest'
                : 'text-cream/65 hover:bg-white/5 hover:text-cream'
            }`}
          >
            <Store className="h-4 w-4" />

            الصالونات

            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
              {pendingSalons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'deletions',
              )
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab ===
              'deletions'
                ? 'bg-gold text-forest'
                : 'text-cream/65 hover:bg-white/5 hover:text-cream'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />

            طلبات حذف الحساب

            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
              {
                pendingDeletionRequests.length
              }
            </span>
          </button>
        </div>

        {activeTab ===
          'salons' && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={
                  <Store className="h-5 w-5" />
                }
                label="إجمالي الصالونات"
                value={
                  salons.length
                }
              />

              <StatCard
                icon={
                  <Clock3 className="h-5 w-5" />
                }
                label="قيد المراجعة"
                value={
                  pendingSalons.length
                }
              />

              <StatCard
                icon={
                  <Check className="h-5 w-5" />
                }
                label="المقبولة"
                value={
                  salons.filter(
                    (salon) =>
                      salon.status ===
                      'approved',
                  ).length
                }
              />
            </div>

            <div className="mb-6 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35" />

                <input
                  type="text"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchTerm(
                      event.target
                        .value,
                    )
                  }
                  placeholder="ابحث عن صالون..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-4 pr-10 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/40"
                />
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : filteredSalons.length ===
              0 ? (
              <EmptyState
                icon={
                  <Store className="h-8 w-8" />
                }
                title="لا توجد صالونات"
                description="لم يتم العثور على أي صالونات مطابقة."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredSalons.map(
                  (salon) => {
                    const image =
                      getSalonCoverImage(
                        salon,
                      )

                    return (
                      <div
                        key={
                          salon.id
                        }
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/10 transition hover:border-gold/20"
                      >
                        <div className="relative h-48 overflow-hidden bg-black/20">
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                salon.name
                              }
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-cream/20" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                          <div className="absolute right-3 top-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                salon.status ===
                                'approved'
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : salon.status ===
                                      'rejected'
                                    ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                    : 'border-gold/20 bg-gold/10 text-gold'
                              }`}
                            >
                              {getSalonStatusLabel(
                                salon.status,
                              )}
                            </span>
                          </div>

                          {salon.logo_url && (
                            <div className="absolute bottom-3 right-3 h-14 w-14 overflow-hidden rounded-xl border-2 border-cream/20 bg-forest">
                              <img
                                src={
                                  salon.logo_url
                                }
                                alt={
                                  salon.name
                                }
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <h2 className="truncate text-lg font-bold text-cream">
                            {salon.name}
                          </h2>

                          <div className="mt-2 flex items-center gap-2 text-sm text-cream/50">
                            <MapPin className="h-4 w-4 shrink-0 text-gold" />

                            <span className="truncate">
                              {salon.address ||
                                salon.commune ||
                                salon.wilaya ||
                                'العنوان غير محدد'}
                            </span>
                          </div>

                          <div className="my-5 grid grid-cols-3 gap-2">
                            <InfoBox
                              label="الخدمات"
                              value={String(
                                salon
                                  .services
                                  .length,
                              )}
                            />

                            <InfoBox
                              label="الحلاقين"
                              value={String(
                                salon
                                  .barbers
                                  .length,
                              )}
                            />

                            <InfoBox
                              label="الصور"
                              value={String(
                                getSalonGallery(
                                  salon,
                                ).length,
                              )}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSalon(
                                  salon,
                                )
                              }
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-cream transition hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                              التفاصيل
                            </button>

                            {salon.status ===
                              'pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    processingSalon ===
                                    salon.id
                                  }
                                  onClick={() =>
                                    void handleSalonStatus(
                                      salon.id,
                                      'approved',
                                    )
                                  }
                                  className="rounded-xl bg-gold px-3 py-2.5 text-forest transition hover:bg-gold/90 disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processingSalon ===
                                    salon.id
                                  }
                                  onClick={() =>
                                    void handleSalonStatus(
                                      salon.id,
                                      'rejected',
                                    )
                                  }
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </>
        )}

        {activeTab ===
          'deletions' && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={
                  <AlertTriangle className="h-5 w-5" />
                }
                label="طلبات الحذف"
                value={
                  deletionRequests.length
                }
              />

              <StatCard
                icon={
                  <Clock3 className="h-5 w-5" />
                }
                label="قيد المراجعة"
                value={
                  pendingDeletionRequests.length
                }
              />

              <StatCard
                icon={
                  <Check className="h-5 w-5" />
                }
                label="تمت الموافقة"
                value={
                  deletionRequests.filter(
                    (request) =>
                      request.status ===
                      'approved',
                  ).length
                }
              />
            </div>

            {loadingRequests ? (
              <LoadingState />
            ) : deletionRequests.length ===
              0 ? (
              <EmptyState
                icon={
                  <AlertTriangle className="h-8 w-8" />
                }
                title="لا توجد طلبات حذف"
                description="ستظهر طلبات حذف الحساب هنا."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-right">
                    <thead className="border-b border-white/10 bg-black/20">
                      <tr>
                        <th className="px-5 py-4 text-xs text-cream/50">
                          المستخدم
                        </th>

                        <th className="px-5 py-4 text-xs text-cream/50">
                          السبب
                        </th>

                        <th className="px-5 py-4 text-xs text-cream/50">
                          التاريخ
                        </th>

                        <th className="px-5 py-4 text-xs text-cream/50">
                          الحالة
                        </th>

                        <th className="px-5 py-4 text-xs text-cream/50">
                          الإجراء
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {deletionRequests.map(
                        (request) => (
                          <tr
                            key={
                              request.id
                            }
                            className="hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                                  <User className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="font-semibold text-cream">
                                    {request
                                      .profile
                                      ?.name ||
                                      'بدون اسم'}
                                  </p>

                                  <p className="text-xs text-cream/40">
                                    {request
                                      .profile
                                      ?.email ||
                                      request.user_id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-xs px-5 py-4">
                              <p className="truncate text-sm text-cream/60">
                                {
                                  request.reason
                                }
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-cream/50">
                              {formatDate(
                                request.requested_at,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDeletionStatusClasses(
                                  request.status,
                                )}`}
                              >
                                {getDeletionStatusLabel(
                                  request.status,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeletionRequest(
                                    request,
                                  )

                                  setAdminNote(
                                    request.admin_note ??
                                      '',
                                  )
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/10"
                              >
                                <Eye className="h-4 w-4" />
                                مراجعة
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Salon Details Modal */}
      {selectedSalon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedSalon(
              null,
            )
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-forest shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-forest/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-cream">
                  {selectedSalon.name}
                </h2>

                <p className="mt-1 text-xs text-cream/40">
                  تفاصيل الصالون والخدمات والحلاقين والصور
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSalon(
                    null,
                  )
                }
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-cream/60 hover:text-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {getSalonCoverImage(
                selectedSalon,
              ) ? (
                <div className="mb-6 h-72 overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={
                      getSalonCoverImage(
                        selectedSalon,
                      ) as string
                    }
                    alt={
                      selectedSalon.name
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-6 flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <ImageIcon className="h-12 w-12 text-cream/20" />
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  icon={
                    <Store className="h-4 w-4" />
                  }
                  label="اسم الصالون"
                  value={
                    selectedSalon.name
                  }
                />

                <DetailItem
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="العنوان"
                  value={
                    selectedSalon.address ||
                    'غير محدد'
                  }
                />

                <DetailItem
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="الهاتف"
                  value={
                    selectedSalon.phone ||
                    'غير محدد'
                  }
                />

                <DetailItem
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="الولاية"
                  value={
                    selectedSalon.wilaya ||
                    'غير محدد'
                  }
                />

                <DetailItem
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="البلدية"
                  value={
                    selectedSalon.commune ||
                    'غير محدد'
                  }
                />

                <DetailItem
                  icon={
                    <Store className="h-4 w-4" />
                  }
                  label="التصنيف"
                  value={
                    selectedSalon.category ||
                    selectedSalon.type ||
                    'غير محدد'
                  }
                />
              </div>

              {/* Description */}
              {selectedSalon.description && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gold">
                    وصف الصالون
                  </h3>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-cream/65">
                    {
                      selectedSalon.description
                    }
                  </p>
                </div>
              )}

              {/* Services */}
              <section className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-cream">
                    الخدمات
                  </h3>

                  <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    {
                      selectedSalon
                        .services
                        .length
                    }{' '}
                    خدمات
                  </span>
                </div>

                {selectedSalon.services
                  .length === 0 ? (
                  <EmptySection message="لا توجد خدمات مسجلة لهذا الصالون." />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {selectedSalon.services.map(
                      (service) => (
                        <div
                          key={
                            service.id
                          }
                          className="rounded-2xl border border-white/10 bg-black/10 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold text-cream">
                                {
                                  service.name
                                }
                              </h4>

                              <p className="mt-1 text-xs text-gold/70">
                                {
                                  service.category
                                }
                              </p>
                            </div>

                            <span className="rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">
                              {Number(
                                service.price ??
                                  0,
                              ).toLocaleString(
                                'ar-DZ',
                              )}{' '}
                              دج
                            </span>
                          </div>

                          {service.description && (
                            <p className="mt-3 text-sm leading-6 text-cream/50">
                              {
                                service.description
                              }
                            </p>
                          )}

                          <div className="mt-3 flex items-center gap-2 text-xs text-cream/35">
                            <Clock3 className="h-3.5 w-3.5" />

                            {Number(
                              service.duration ??
                                0,
                            )}{' '}
                            دقيقة
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* Barbers */}
              <section className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-cream">
                    الحلاقون
                  </h3>

                  <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    {
                      selectedSalon
                        .barbers
                        .length
                    }{' '}
                    حلاقين
                  </span>
                </div>

                {selectedSalon.barbers
                  .length === 0 ? (
                  <EmptySection message="لا يوجد حلاقون مسجلون لهذا الصالون." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedSalon.barbers.map(
                      (barber) => (
                        <div
                          key={
                            barber.id
                          }
                          className="overflow-hidden rounded-2xl border border-white/10 bg-black/10"
                        >
                          <div className="h-48 bg-black/20">
                            {barber.image ? (
                              <img
                                src={
                                  barber.image
                                }
                                alt={
                                  barber.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <User className="h-12 w-12 text-cream/15" />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h4 className="font-bold text-cream">
                              {
                                barber.name
                              }
                            </h4>

                            <p className="mt-1 text-xs text-gold">
                              {
                                barber.role
                              }
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <InfoBox
                                label="الخبرة"
                                value={
                                  barber.experience ||
                                  'غير محدد'
                                }
                              />

                              <InfoBox
                                label="التقييم"
                                value={`${Number(
                                  barber.rating ??
                                    5,
                                ).toFixed(
                                  1,
                                )}/5`}
                              />
                            </div>

                            {barber.specialties?.length >
                              0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {barber.specialties.map(
                                  (
                                    specialty,
                                    index,
                                  ) => (
                                    <span
                                      key={`${barber.id}-${index}`}
                                      className="rounded-full bg-gold/5 px-2.5 py-1 text-[11px] text-gold/75"
                                    >
                                      {
                                        specialty
                                      }
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* Gallery */}
              <section className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-cream">
                    صور الصالون
                  </h3>

                  <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    {
                      getSalonGallery(
                        selectedSalon,
                      ).length
                    }{' '}
                    صور
                  </span>
                </div>

                {getSalonGallery(
                  selectedSalon,
                ).length === 0 ? (
                  <EmptySection message="لا توجد صور مرفوعة لهذا الصالون." />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {getSalonGallery(
                      selectedSalon,
                    ).map(
                      (
                        image,
                        index,
                      ) => (
                        <div
                          key={`${image}-${index}`}
                          className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                        >
                          <img
                            src={
                              image
                            }
                            alt={`${selectedSalon.name} ${index + 1}`}
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* Salon Actions */}
              <div className="mt-7 flex gap-3">
                {selectedSalon.status !==
                  'approved' && (
                  <button
                    type="button"
                    disabled={
                      processingSalon ===
                      selectedSalon.id
                    }
                    onClick={() =>
                      void handleSalonStatus(
                        selectedSalon.id,
                        'approved',
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-forest hover:bg-gold/90 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    قبول الصالون
                  </button>
                )}

                {selectedSalon.status !==
                  'rejected' && (
                  <button
                    type="button"
                    disabled={
                      processingSalon ===
                      selectedSalon.id
                    }
                    onClick={() =>
                      void handleSalonStatus(
                        selectedSalon.id,
                        'rejected',
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    رفض الصالون
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Request Modal */}
      {selectedDeletionRequest && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedDeletionRequest(
              null,
            )
            setAdminNote('')
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-forest shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-cream">
                  طلب حذف الحساب
                </h2>

                <p className="text-xs text-cream/40">
                  مراجعة طلب المستخدم
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDeletionRequest(
                    null,
                  )
                  setAdminNote('')
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-cream/60 hover:text-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <User className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-cream">
                      {selectedDeletionRequest
                        .profile
                        ?.name ||
                        'مستخدم بدون اسم'}
                    </p>

                    <p className="text-xs text-cream/40">
                      {selectedDeletionRequest
                        .profile
                        ?.email ||
                        selectedDeletionRequest.user_id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-cream">
                    سبب الطلب
                  </h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getDeletionStatusClasses(
                      selectedDeletionRequest.status,
                    )}`}
                  >
                    {getDeletionStatusLabel(
                      selectedDeletionRequest.status,
                    )}
                  </span>
                </div>

                <p className="mb-3 text-xs text-cream/40">
                  {formatDateTime(
                    selectedDeletionRequest.requested_at,
                  )}
                </p>

                <p className="whitespace-pre-wrap text-sm leading-7 text-cream/70">
                  {
                    selectedDeletionRequest.reason
                  }
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-note"
                  className="mb-2 block text-sm font-semibold text-cream"
                >
                  ملاحظة المدير
                </label>

                <textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(
                    event,
                  ) =>
                    setAdminNote(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder="اكتب ملاحظة حول القرار..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/25 focus:border-gold/40"
                />
              </div>

              {selectedDeletionRequest.status ===
              'pending' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={
                      processingRequest ===
                      selectedDeletionRequest.id
                    }
                    onClick={() =>
                      void handleDeletionDecision(
                        selectedDeletionRequest,
                        'approved',
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-forest hover:bg-gold/90 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    الموافقة
                  </button>

                  <button
                    type="button"
                    disabled={
                      processingRequest ===
                      selectedDeletionRequest.id
                    }
                    onClick={() =>
                      void handleDeletionDecision(
                        selectedDeletionRequest,
                        'rejected',
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    رفض
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-cream/45">
                  تمت مراجعة هذا الطلب مسبقًا.
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-gold/10 bg-gold/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />

                <p className="text-xs leading-6 text-cream/45">
                  يتم هنا تسجيل قرار المدير فقط. حذف المستخدم من Supabase Auth لا يتم تلقائيًا من هذه الصفحة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
          {icon}
        </div>

        <span className="text-2xl font-bold text-cream">
          {value}
        </span>
      </div>

      <p className="text-sm text-cream/50">
        {label}
      </p>
    </div>
  )
}

function InfoBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[11px] text-cream/35">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-cream/75">
        {value}
      </p>
    </div>
  )
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-gold/70">
        {icon}

        <span>{label}</span>
      </div>

      <p className="break-words text-sm text-cream/70">
        {value}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-black/10">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-gold" />

        <p className="text-sm text-cream/45">
          جاري تحميل البيانات...
        </p>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/10 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/10 bg-gold/5 text-gold/60">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-cream">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-cream/40">
        {description}
      </p>
    </div>
  )
}

function EmptySection({
  message,
}: {
  message: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-6 text-center">
      <p className="text-sm text-cream/40">
        {message}
      </p>
    </div>
  )
}