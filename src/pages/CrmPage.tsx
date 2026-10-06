import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
  ArrowRight,
  Upload,
  BriefcaseBusiness,
  Loader2,
  MapPin,
  Plus,
  Scissors,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'

type Salon = {
  id: string
  name: string
  address: string | null
  wilaya: string | null
  commune: string | null
  category: string | null
  status: string | null
}

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  duration: number
}

type Barber = {
  id: string
  name: string
  experience: number
  specialties: string[]
  photo_url: string | null
}

function formatPrice(price: number) {
  return `${Number(price || 0).toLocaleString('fr-DZ')} DA`
}

export default function CrmPage() {
  const { user, isReady, showToast } = useStore()

  const [salon, setSalon] = useState<Salon | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])

  const [loading, setLoading] = useState(true)

  const [serviceModal, setServiceModal] = useState(false)
  const [barberModal, setBarberModal] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [barberImageFile, setBarberImageFile] = useState<File | null>(null)
  const [barberPreview, setBarberPreview] = useState('')

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '30',
  })

  const [barberForm, setBarberForm] = useState({
    name: '',
    experience: '',
    specialties: '',
  })

  useEffect(() => {
    if (!isReady) return

    if (!user) {
      setLoading(false)
      return
    }

    loadCrm()
  }, [isReady, user])

  async function loadCrm() {
    if (!user) return

    setLoading(true)

    try {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select(
          'id,name,address,wilaya,commune,category,status',
        )
        .eq('owner_id', user.id)
        .maybeSingle()

      if (salonError) {
        throw salonError
      }

      setSalon(salonData)

      if (!salonData) {
        setServices([])
        setBarbers([])
        return
      }

      const [servicesResult, barbersResult] =
        await Promise.all([
          supabase
            .from('salon_services')
            .select(
              'id,name,description,category,price,duration',
            )
            .eq('salon_id', salonData.id)
            .order('name', { ascending: true }),

          supabase
            .from('salon_barbers')
            .select(
              'id,name,experience,specialties,photo_url',
            )
            .eq('salon_id', salonData.id)
            .order('name', { ascending: true }),
        ])

      if (servicesResult.error) {
        throw servicesResult.error
      }

      if (barbersResult.error) {
        throw barbersResult.error
      }

      setServices(
        (servicesResult.data ?? []).map((service) => ({
          id: String(service.id),
          name: service.name ?? '',
          description: service.description ?? null,
          category: service.category ?? null,
          price: Number(service.price ?? 0),
          duration: Number(service.duration ?? 30),
        })),
      )

      setBarbers(
        (barbersResult.data ?? []).map((barber) => ({
          id: String(barber.id),
          name: barber.name ?? '',
          experience: Number(barber.experience ?? 0),
          specialties: Array.isArray(barber.specialties)
            ? barber.specialties
            : [],
          photo_url: barber.photo_url ?? null,
        })),
      )
    } catch (error) {
      console.error('CRM loading error:', error)

      showToast(
        'تعذر تحميل بيانات إدارة الصالون',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  async function addService(event: FormEvent) {
    event.preventDefault()

    if (!user || !salon) return

    const name = serviceForm.name.trim()
    const description = serviceForm.description.trim()
    const category = serviceForm.category.trim()
    const price = Number(serviceForm.price)
    const duration = Number(serviceForm.duration)

    if (!name) {
      showToast('يرجى إدخال اسم الخدمة', 'error')
      return
    }

    if (Number.isNaN(price) || price < 0) {
      showToast('يرجى إدخال سعر صحيح', 'error')
      return
    }

    if (Number.isNaN(duration) || duration <= 0) {
      showToast('يرجى إدخال مدة صحيحة', 'error')
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('salon_services')
        .insert({
          salon_id: salon.id,
          name,
          description: description || null,
          category: category || null,
          price,
          duration,
        })
        .select(
          'id,name,description,category,price,duration',
        )
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setServices((current) => [
          ...current,
          {
            id: String(data.id),
            name: data.name ?? '',
            description: data.description ?? null,
            category: data.category ?? null,
            price: Number(data.price ?? 0),
            duration: Number(data.duration ?? 30),
          },
        ])
      }

      setServiceForm({
        name: '',
        description: '',
        category: '',
        price: '',
        duration: '30',
      })

      setServiceModal(false)

      showToast('تمت إضافة الخدمة بنجاح', 'success')
    } catch (error) {
      console.error('Add service error:', error)

      showToast(
        'تعذر إضافة الخدمة',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteService(serviceId: string) {
    if (!salon) return

    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذه الخدمة؟',
    )

    if (!confirmed) return

    setDeletingId(serviceId)

    try {
      const { error } = await supabase
        .from('salon_services')
        .delete()
        .eq('id', serviceId)
        .eq('salon_id', salon.id)

      if (error) {
        throw error
      }

      setServices((current) =>
        current.filter((service) => service.id !== serviceId),
      )

      showToast('تم حذف الخدمة بنجاح', 'success')
    } catch (error) {
      console.error('Delete service error:', error)

      showToast(
        'تعذر حذف الخدمة',
        'error',
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function addBarber(event: FormEvent) {
    event.preventDefault()

    if (!user || !salon) return

    const name = barberForm.name.trim()
    const experience = Number(barberForm.experience)

    const specialties = barberForm.specialties
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!name) {
      showToast('يرجى إدخال اسم الحلاق', 'error')
      return
    }

    if (
      Number.isNaN(experience) ||
      experience < 0
    ) {
      showToast(
        'يرجى إدخال سنوات خبرة صحيحة',
        'error',
      )
      return
    }

    setSaving(true)

    try {
      let photoUrl: string | null = null

      if (barberImageFile) {
        const extension =
          barberImageFile.name.split('.').pop() || 'jpg'

        const filePath = `barbers/${salon.id}/${crypto.randomUUID()}.${extension}`

        const { error: uploadError } =
          await supabase.storage
            .from('salon-images')
            .upload(filePath, barberImageFile, {
              upsert: false,
            })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } =
          supabase.storage
            .from('salon-images')
            .getPublicUrl(filePath)

        photoUrl = publicUrlData.publicUrl
      }

      const { data, error } = await supabase
        .from('salon_barbers')
        .insert({
          salon_id: salon.id,
          name,
          experience,
          specialties,
          photo_url: photoUrl,
        })
        .select(
          'id,name,experience,specialties,photo_url',
        )
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setBarbers((current) => [
          ...current,
          {
            id: String(data.id),
            name: data.name ?? '',
            experience: Number(data.experience ?? 0),
            specialties: Array.isArray(data.specialties)
              ? data.specialties
              : [],
            photo_url: data.photo_url ?? null,
          },
        ])
      }

      setBarberForm({
        name: '',
        experience: '',
        specialties: '',
      })

      setBarberImageFile(null)
      setBarberPreview('')
      setBarberModal(false)

      showToast(
        'تمت إضافة الحلاق بنجاح',
        'success',
      )
    } catch (error) {
      console.error('Add barber error:', error)

      showToast(
        'تعذر إضافة الحلاق',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteBarber(barberId: string) {
    if (!salon) return

    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذا الحلاق؟',
    )

    if (!confirmed) return

    setDeletingId(barberId)

    try {
      const { error } = await supabase
        .from('salon_barbers')
        .delete()
        .eq('id', barberId)
        .eq('salon_id', salon.id)

      if (error) {
        throw error
      }

      setBarbers((current) =>
        current.filter((barber) => barber.id !== barberId),
      )

      showToast(
        'تم حذف الحلاق بنجاح',
        'success',
      )
    } catch (error) {
      console.error('Delete barber error:', error)

      showToast(
        'تعذر حذف الحلاق',
        'error',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleBarberImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(
        'يرجى اختيار صورة صحيحة',
        'error',
      )
      return
    }

    setBarberImageFile(file)

    const previewUrl = URL.createObjectURL(file)
    setBarberPreview(previewUrl)
  }

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />

          <p className="text-cream/55 text-sm">
            جاري تحميل لوحة إدارة الصالون...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-ink flex items-center justify-center px-5"
        dir="rtl"
      >
        <div className="glass-panel rounded-[24px] p-8 max-w-md w-full text-center">
          <h1 className="text-cream text-xl font-black">
            يجب تسجيل الدخول
          </h1>

          <p className="mt-3 text-cream/45 text-sm">
            قم بتسجيل الدخول للوصول إلى إدارة الصالون.
          </p>

          <Link
            to="/login"
            className="btn-gold mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm"
          >
            تسجيل الدخول
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (user.type !== 'owner') {
    return (
      <div
        className="min-h-screen bg-ink flex items-center justify-center px-5"
        dir="rtl"
      >
        <div className="glass-panel rounded-[24px] p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-400/20 flex items-center justify-center">
            <X className="w-6 h-6 text-red-300" />
          </div>

          <h1 className="mt-5 text-cream text-xl font-black">
            غير مسموح بالدخول
          </h1>

          <p className="mt-3 text-cream/45 text-sm leading-relaxed">
            هذه الصفحة مخصصة لأصحاب الصالونات فقط.
          </p>

          <Link
            to="/dashboard"
            className="btn-outline mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm"
          >
            العودة إلى الحساب
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div
        className="min-h-screen bg-ink pt-[150px] pb-20 px-5"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-[28px] p-8 sm:p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <BriefcaseBusiness className="w-7 h-7 text-gold" />
            </div>

            <h1 className="mt-6 text-2xl font-black text-cream">
              لا يوجد صالون مرتبط بحسابك
            </h1>

            <p className="mt-3 text-cream/45 text-sm leading-relaxed max-w-xl mx-auto">
              سجّل صالونك أولاً حتى تتمكن من إدارة الخدمات
              والحلاقين ومعلومات الصالون من لوحة التحكم.
            </p>

            <Link
              to="/register-salon"
              className="btn-gold mt-7 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm"
            >
              تسجيل صالون
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-ink pt-[130px] pb-20"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-cream/45 hover:text-gold text-[11px] font-semibold transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              العودة إلى لوحة الحساب
            </Link>

            <div className="mt-5 flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <BriefcaseBusiness className="w-5 h-5 text-gold" />
              </span>

              <div>
                <p className="text-gold text-[10px] font-bold">
                  STIKINI CRM
                </p>

                <h1 className="mt-1 text-3xl sm:text-4xl font-black text-cream">
                  إدارة الصالون
                </h1>
              </div>
            </div>

            <p className="mt-4 text-cream/45 text-sm leading-relaxed">
              أدر خدمات الصالون والحلاقين ومعلوماته من مكان واحد.
            </p>
          </div>

          <div className="glass-panel rounded-2xl px-5 py-4 min-w-[260px]">
            <p className="text-cream/35 text-[10px] font-semibold">
              الصالون الحالي
            </p>

            <h2 className="mt-1.5 text-cream font-black text-[15px]">
              {salon.name}
            </h2>

            <div className="mt-2 flex items-center gap-1.5 text-cream/45 text-[10px]">
              <MapPin className="w-3 h-3 text-gold" />

              {salon.commune || salon.wilaya || 'الموقع غير محدد'}
            </div>
          </div>
        </div>

        {/* Salon information */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-black text-cream">
                معلومات الصالون
              </h2>

              <p className="mt-1.5 text-cream/38 text-[11px]">
                المعلومات الأساسية الخاصة بالصالون.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold">
              {salon.status || 'قيد المراجعة'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              icon={<Scissors className="w-4 h-4" />}
              label="اسم الصالون"
              value={salon.name}
            />

            <InfoCard
              icon={<MapPin className="w-4 h-4" />}
              label="الولاية"
              value={salon.wilaya || 'غير محددة'}
            />

            <InfoCard
              icon={<MapPin className="w-4 h-4" />}
              label="البلدية"
              value={salon.commune || 'غير محددة'}
            />

            <InfoCard
              icon={<BriefcaseBusiness className="w-4 h-4" />}
              label="التصنيف"
              value={salon.category || 'غير محدد'}
            />
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Scissors className="w-5 h-5" />}
            label="الخدمات"
            value={services.length}
          />

          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="الحلاقون"
            value={barbers.length}
          />

          <StatCard
            icon={<BriefcaseBusiness className="w-5 h-5" />}
            label="حالة الصالون"
            value={salon.status || 'غير محدد'}
          />

          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="الموقع"
            value={salon.wilaya || 'غير محدد'}
          />
        </section>

        {/* Services */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-cream">
                الخدمات
              </h2>

              <p className="mt-1.5 text-cream/38 text-[11px]">
                أضف وعدّل الخدمات والأسعار والمدة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setServiceModal(true)}
              className="btn-gold inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[12px]"
            >
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </button>
          </div>

          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="glass-panel rounded-[22px] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5 text-gold" />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteService(service.id)
                      }
                      disabled={deletingId === service.id}
                      className="w-9 h-9 rounded-xl border border-red-400/15 text-red-300/70 flex items-center justify-center hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-50"
                      title="حذف الخدمة"
                    >
                      {deletingId === service.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h3 className="mt-5 text-cream font-black text-[15px]">
                    {service.name}
                  </h3>

                  {service.category && (
                    <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-gold/8 border border-gold/15 text-gold text-[9px] font-bold">
                      {service.category}
                    </span>
                  )}

                  {service.description && (
                    <p className="mt-3 text-cream/42 text-[10.5px] leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-white/7 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-cream/30 text-[9px]">
                        السعر
                      </p>

                      <p className="mt-1 text-gold font-black text-[16px]">
                        {formatPrice(service.price)} دج
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-cream/30 text-[9px]">
                        المدة
                      </p>

                      <p className="mt-1 text-cream/70 text-[12px] font-bold">
                        {service.duration} دقيقة
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCrmState
              icon={<Scissors className="w-6 h-6" />}
              title="لا توجد خدمات بعد"
              description="أضف أول خدمة ليتمكن الزبائن من رؤيتها عند الحجز."
              action={
                <button
                  type="button"
                  onClick={() => setServiceModal(true)}
                  className="btn-gold inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px]"
                >
                  <Plus className="w-4 h-4" />
                  إضافة أول خدمة
                </button>
              }
            />
          )}
        </section>

        {/* Barbers */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-cream">
                فريق العمل
              </h2>

              <p className="mt-1.5 text-cream/38 text-[11px]">
                أدر الحلاقين والخبرات والتخصصات.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBarberModal(true)}
              className="btn-gold inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[12px]"
            >
              <Plus className="w-4 h-4" />
              إضافة حلاق
            </button>
          </div>

          {barbers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className="glass-panel rounded-[22px] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center">
                        {barber.photo_url ? (
                          <img
                            src={barber.photo_url}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-gold" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-cream font-black text-[14px]">
                          {barber.name}
                        </h3>

                        <p className="mt-1 text-cream/40 text-[10px]">
                          {barber.experience} سنوات خبرة
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteBarber(barber.id)
                      }
                      disabled={deletingId === barber.id}
                      className="w-9 h-9 rounded-xl border border-red-400/15 text-red-300/70 flex items-center justify-center hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-50"
                      title="حذف الحلاق"
                    >
                      {deletingId === barber.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {barber.specialties.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {barber.specialties.map(
                        (specialty) => (
                          <span
                            key={specialty}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-cream/55 text-[9.5px] font-semibold"
                          >
                            {specialty}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyCrmState
              icon={<Users className="w-6 h-6" />}
              title="لا يوجد حلاقون بعد"
              description="أضف أعضاء فريقك ليظهروا للزبائن أثناء اختيار موعد الحجز."
              action={
                <button
                  type="button"
                  onClick={() => setBarberModal(true)}
                  className="btn-gold inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px]"
                >
                  <Plus className="w-4 h-4" />
                  إضافة أول حلاق
                </button>
              }
            />
          )}
        </section>
      </div>

      {/* Service modal */}
      {serviceModal && (
        <Modal
          title="إضافة خدمة جديدة"
          onClose={() => {
            if (!saving) {
              setServiceModal(false)
            }
          }}
        >
          <form
            onSubmit={addService}
            className="space-y-5"
          >
            <Input
              label="اسم الخدمة"
              value={serviceForm.name}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="مثال: قص الشعر"
              required
            />

            <Input
              label="التصنيف"
              value={serviceForm.category}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  category: value,
                }))
              }
              placeholder="مثال: حلاقة"
            />

            <TextArea
              label="الوصف"
              value={serviceForm.description}
              onChange={(value) =>
                setServiceForm((current) => ({
                  ...current,
                  description: value,
                }))
              }
              placeholder="وصف مختصر للخدمة..."
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="السعر"
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={(value) =>
                  setServiceForm((current) => ({
                    ...current,
                    price: value,
                  }))
                }
                placeholder="مثال: 800"
                required
              />

              <Input
                label="المدة بالدقائق"
                type="number"
                min="1"
                value={serviceForm.duration}
                onChange={(value) =>
                  setServiceForm((current) => ({
                    ...current,
                    duration: value,
                  }))
                }
                placeholder="30"
                required
              />
            </div>

            <SubmitButton
              loading={saving}
              label="إضافة الخدمة"
            />
          </form>
        </Modal>
      )}

      {/* Barber modal */}
      {barberModal && (
        <Modal
          title="إضافة حلاق"
          onClose={() => {
            if (!saving) {
              setBarberModal(false)
            }
          }}
        >
          <form
            onSubmit={addBarber}
            className="space-y-5"
          >
            <Input
              label="اسم الحلاق"
              value={barberForm.name}
              onChange={(value) =>
                setBarberForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="مثال: محمد"
              required
            />

            <Input
              label="سنوات الخبرة"
              type="number"
              min="0"
              value={barberForm.experience}
              onChange={(value) =>
                setBarberForm((current) => ({
                  ...current,
                  experience: value,
                }))
              }
              placeholder="مثال: 5"
              required
            />

            <Input
              label="التخصصات"
              value={barberForm.specialties}
              onChange={(value) =>
                setBarberForm((current) => ({
                  ...current,
                  specialties: value,
                }))
              }
              placeholder="قص الشعر، اللحية، التصفيف"
            />

            <BarberImageField
              preview={barberPreview}
              onChange={handleBarberImage}
              onRemove={() => {
                setBarberImageFile(null)
                setBarberPreview('')
              }}
            />

            <SubmitButton
              loading={saving}
              label="إضافة الحلاق"
            />
          </form>
        </Modal>
      )}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="glass-panel rounded-[20px] p-5">
      <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/18 flex items-center justify-center text-gold">
        {icon}
      </div>

      <p className="mt-4 text-cream/32 text-[9px] font-semibold">
        {label}
      </p>

      <p className="mt-1.5 text-cream text-[13px] font-bold">
        {value}
      </p>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="glass-panel rounded-[20px] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/18 flex items-center justify-center text-gold">
          {icon}
        </div>

        <span className="text-gold text-xl font-black">
          {value}
        </span>
      </div>

      <p className="mt-4 text-cream/42 text-[10px] font-semibold">
        {label}
      </p>
    </div>
  )
}

function EmptyCrmState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="glass-panel rounded-[24px] p-8 sm:p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 border border-gold/18 flex items-center justify-center text-gold">
        {icon}
      </div>

      <h3 className="mt-5 text-cream text-[16px] font-black">
        {title}
      </h3>

      <p className="mt-2 text-cream/40 text-[11px] leading-relaxed max-w-md mx-auto">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
      dir="rtl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto glass-panel-strong rounded-[26px] border border-gold/12">
        <div className="sticky top-0 z-10 px-7 py-6 border-b border-white/7 bg-ink/90 backdrop-blur-xl flex items-center justify-between gap-4">
          <h2 className="text-cream text-[17px] font-black">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-cream/55 hover:text-cream hover:border-gold/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-7 py-7">{children}</div>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  min?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        required={required}
        className="field"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="field resize-none"
      />
    </div>
  )
}

function BarberImageField({
  preview,
  onChange,
  onRemove,
}: {
  preview: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  return (
    <div>
      <label className="block text-cream/58 text-[11px] font-semibold mb-2.5">
        صورة الحلاق
      </label>

      {preview ? (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/10">
          <img
            src={preview}
            alt="معاينة صورة الحلاق"
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-red-500/70 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="relative flex flex-col items-center justify-center gap-3 h-40 rounded-2xl border border-dashed border-gold/20 bg-gold/5 cursor-pointer hover:bg-gold/8 transition-all">
          <Upload className="w-6 h-6 text-gold" />

          <div className="text-center">
            <p className="text-cream text-[11px] font-bold">
              رفع صورة
            </p>

            <p className="mt-1 text-cream/35 text-[9px]">
              PNG أو JPG
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      )}
    </div>
  )
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean
  label: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-gold w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}

      {loading ? 'جاري الحفظ...' : label}
    </button>
  )
}