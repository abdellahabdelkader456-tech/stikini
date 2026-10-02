import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Check,
  X,
  RefreshCw,
  MapPin,
  Phone,
  Scissors,
  Clock,
} from 'lucide-react'

import { useStore } from '../lib/store'

export default function AdminSalonsPage() {
  const {
    user,
    isAdmin,
    pendingSalons,
    loadPendingSalons,
    approveSalon,
    rejectSalon,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] =
    useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return

    const load = async () => {
      setLoading(true)
      await loadPendingSalons()
      setLoading(false)
    }

    void load()
  }, [isAdmin, loadPendingSalons])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const handleApprove = async (
    salonId: string,
  ) => {
    setProcessingId(salonId)

    const result =
      await approveSalon(salonId)

    setProcessingId(null)

    if (!result.ok) {
      alert(
        result.error ||
          'حدث خطأ أثناء الموافقة',
      )
    }
  }

  const handleReject = async (
    salonId: string,
  ) => {
    const confirmed = window.confirm(
      'هل أنت متأكد من رفض هذا الصالون؟',
    )

    if (!confirmed) return

    setProcessingId(salonId)

    const result =
      await rejectSalon(salonId)

    setProcessingId(null)

    if (!result.ok) {
      alert(
        result.error ||
          'حدث خطأ أثناء الرفض',
      )
    }
  }

  return (
    <section
      dir="rtl"
      className="min-h-screen bg-forest px-4 pb-20 pt-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-gold">
              لوحة الإدارة
            </p>

            <h1 className="font-display text-4xl font-bold text-cream md:text-5xl">
              طلبات الصالونات
            </h1>

            <p className="mt-3 max-w-2xl text-cream/60">
              راجع طلبات تسجيل الصالونات
              ووافق عليها أو ارفضها قبل ظهورها
              للعملاء.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadPendingSalons()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold transition hover:bg-gold/20"
          >
            <RefreshCw size={18} />
            تحديث الطلبات
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          </div>
        )}

        {/* Empty */}
        {!loading &&
          pendingSalons.length === 0 && (
            <div className="rounded-2xl border border-gold/10 bg-cream/[0.04] p-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Check size={30} />
              </div>

              <h2 className="text-2xl font-bold text-cream">
                لا توجد طلبات معلقة
              </h2>

              <p className="mt-2 text-cream/50">
                جميع طلبات الصالونات تمت مراجعتها.
              </p>
            </div>
          )}

        {/* Salon cards */}
        {!loading &&
          pendingSalons.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {pendingSalons.map(
                (salon) => {
                  const processing =
                    processingId ===
                    salon.id

                  return (
                    <article
                      key={salon.id}
                      className="overflow-hidden rounded-2xl border border-gold/10 bg-cream/[0.04]"
                    >
                      {/* Image */}
                      <div className="relative h-56 overflow-hidden bg-black/20">
                        {salon.image ? (
                          <img
                            src={
                              salon.image
                            }
                            alt={
                              salon.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-cream/30">
                            <Scissors
                              size={48}
                            />
                          </div>
                        )}

                        <div className="absolute right-4 top-4 rounded-full border border-gold/30 bg-forest/90 px-3 py-1.5 text-xs font-semibold text-gold backdrop-blur">
                          قيد المراجعة
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="mb-5">
                          <h2 className="text-2xl font-bold text-cream">
                            {salon.name}
                          </h2>

                          {salon.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-cream/55">
                              {
                                salon.description
                              }
                            </p>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mb-6 grid gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-cream/60">
                            <MapPin
                              size={17}
                              className="shrink-0 text-gold"
                            />
                            <span>
                              {salon.address ||
                                salon.neighborhood ||
                                'غير محدد'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-cream/60">
                            <Phone
                              size={17}
                              className="shrink-0 text-gold"
                            />
                            <span dir="ltr">
                              {salon.phone ||
                                'غير محدد'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-cream/60">
                            <Scissors
                              size={17}
                              className="shrink-0 text-gold"
                            />
                            <span>
                              {salon.services.length}{' '}
                              خدمات
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-cream/60">
                            <Clock
                              size={17}
                              className="shrink-0 text-gold"
                            />
                            <span>
                              {salon.workingHours}
                            </span>
                          </div>
                        </div>

                        {/* Services */}
                        {salon.services.length >
                          0 && (
                          <div className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold text-cream">
                              الخدمات
                            </h3>

                            <div className="flex flex-wrap gap-2">
                              {salon.services
                                .slice(
                                  0,
                                  6,
                                )
                                .map(
                                  (
                                    service,
                                  ) => (
                                    <span
                                      key={
                                        service.id
                                      }
                                      className="rounded-lg border border-cream/10 bg-cream/5 px-3 py-1.5 text-xs text-cream/65"
                                    >
                                      {
                                        service.name
                                      }{' '}
                                      ·{' '}
                                      {
                                        service.price
                                      }{' '}
                                      دج
                                    </span>
                                  ),
                                )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              void handleApprove(
                                salon.id,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-semibold text-forest transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check
                              size={18}
                            />

                            {processing
                              ? 'جاري المعالجة...'
                              : 'موافقة'}
                          </button>

                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              void handleReject(
                                salon.id,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X
                              size={18}
                            />
                            رفض
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}
      </div>
    </section>
  )
}