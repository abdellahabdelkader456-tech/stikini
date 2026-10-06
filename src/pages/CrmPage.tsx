import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
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

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '30',
  })

  const [barberForm, setBarberForm] = useState({
    name: '',
    experience: '0',
    specialties: '',
    photo_url: '',
  })

  useEffect(() => {
    if (!isReady || !user) return

    if (user.type !== 'owner') {
      setLoading(false)
      return
    }

    void loadCrm()
  }, [isReady, user])

  async function loadCrm() {
    if (!user) return

    setLoading(true)

    try {
      // IMPORTANT:
      // The owner is identified by profiles.id -> salons.owner_id.
      // We do not trust a salon id coming from the URL.
      const { data: salonRow, error: salonError } = await supabase
        .from('salons')
        .select('id,name,address,wilaya,commune,category,status')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (salonError) throw salonError

      if (!salonRow) {
        setSalon(null)
        setServices([])
        setBarbers([])
        return
      }

      setSalon(salonRow as Salon)

      const [servicesResult, barbersResult] = await Promise.all([
        supabase
          .from('salon_services')
          .select('id,name,description,category,price,duration')
          .eq('salon_id', salonRow.id)
          .order('name'),

        supabase
          .from('salon_barbers')
          .select('id,name,experience,specialties,photo_url')
          .eq('salon_id', salonRow.id)
          .order('name'),
      ])

      if (servicesResult.error) throw servicesResult.error
      if (barbersResult.error) throw barbersResult.error

      setServices((servicesResult.data ?? []) as Service[])
      setBarbers((barbersResult.data ?? []) as Barber[])
    } catch (error) {
      console.error('CRM loading error:', error)
      showToast('تعذر تحميل بيانات الصالون', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function addService(event: FormEvent) {
    event.preventDefault()

    if (!salon) return

    const price = Number(serviceForm.price)
    const duration = Number(serviceForm.duration)

    if (!serviceForm.name.trim()) {
      showToast('أدخل اسم الخدمة', 'error')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      showToast('أدخل سعراً صحيحاً', 'error')
      return
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      showToast('أدخل مدة صحيحة', 'error')
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('salon_services')
        .insert({
          salon_id: salon.id,
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim() || null,
          category: serviceForm.category.trim() || null,
          price,
          duration,
        })
        .select('id,name,description,category,price,duration')
        .single()

      if (error) throw error

      setServices((current) => [...current, data as Service].sort((a, b) =>
        a.name.localeCompare(b.name, 'ar'),
      ))

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
      showToast('تعذر إضافة الخدمة', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addBarber(event: FormEvent) {
    event.preventDefault()

    if (!salon) return

    const experience = Number(barberForm.experience)

    if (!barberForm.name.trim()) {
      showToast('أدخل اسم الحلاق', 'error')
      return
    }

    if (!Number.isFinite(experience) || experience < 0) {
      showToast('أدخل سنوات خبرة صحيحة', 'error')
      return
    }

    const specialties = barberForm.specialties
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('salon_barbers')
        .insert({
          salon_id: salon.id,
          name: barberForm.name.trim(),
          experience,
          specialties,
          photo_url: barberForm.photo_url.trim() || null,
        })
        .select('id,name,experience,specialties,photo_url')
        .single()

      if (error) throw error

      setBarbers((current) => [...current, data as Barber].sort((a, b) =>
        a.name.localeCompare(b.name, 'ar'),
      ))

      setBarberForm({
        name: '',
        experience: '0',
        specialties: '',
        photo_url: '',
      })
      setBarberModal(false)
      showToast('تمت إضافة الحلاق بنجاح', 'success')
    } catch (error) {
      console.error('Add barber error:', error)
      showToast('تعذر إضافة الحلاق', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteService(id: string) {
    if (!confirm('هل تريد حذف هذه الخدمة؟')) return

    setDeletingId(id)

    try {
      const { error } = await supabase
        .from('salon_services')
        .delete()
        .eq('id', id)
        .eq('salon_id', salon?.id ?? '')

      if (error) throw error

      setServices((current) => current.filter((item) => item.id !== id))
      showToast('تم حذف الخدمة', 'success')
    } catch (error) {
      console.error('Delete service error:', error)
      showToast('تعذر حذف الخدمة', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteBarber(id: string) {
    if (!confirm('هل تريد حذف هذا الحلاق؟')) return

    setDeletingId(id)

    try {
      const { error } = await supabase
        .from('salon_barbers')
        .delete()
        .eq('id', id)
        .eq('salon_id', salon?.id ?? '')

      if (error) throw error

      setBarbers((current) => current.filter((item) => item.id !== id))
      showToast('تم حذف الحلاق', 'success')
    } catch (error) {
      console.error('Delete barber error:', error)
      showToast('تعذر حذف الحلاق', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isReady || loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="bg-white/3.5 rounded-3xl shadow-sm border border-white/8 p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-cream mb-3">تسجيل الدخول مطلوب</h1>
          <p className="text-cream/48 mb-6">يجب تسجيل الدخول للوصول إلى إدارة الصالون.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-5 py-3 text-ink font-semibold"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  if (user.type !== 'owner') {
    return (
      <div dir="rtl" className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="bg-white/3.5 rounded-3xl shadow-sm border border-white/8 p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-cream mb-3">غير مصرح</h1>
          <p className="text-cream/48 mb-6">هذه الصفحة مخصصة لأصحاب الصالونات.</p>
          <Link to="/" className="text-gold font-semibold">العودة للرئيسية</Link>
        </div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div dir="rtl" className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="bg-white/3.5 rounded-3xl shadow-sm border border-white/8 p-8 text-center max-w-lg w-full">
          <BriefcaseBusiness className="w-12 h-12 mx-auto text-gold mb-4" />
          <h1 className="text-2xl font-bold text-cream mb-3">لا يوجد صالون مرتبط بحسابك</h1>
          <p className="text-cream/48 mb-6">
            سجّل صالونك أولاً، وبعد ربطه بحسابك ستتمكن من إدارة الحلاقين والخدمات.
          </p>
          <Link
            to="/register-salon"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-ink font-semibold"
          >
            تسجيل صالون
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-ink text-cream">
      <header className="bg-ink/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-cream/48 mb-1">
              <Link to="/dashboard" className="hover:text-gold">لوحة التحكم</Link>
              <ArrowRight className="w-4 h-4" />
              <span>إدارة الصالون</span>
            </div>
            <h1 className="text-2xl font-bold text-cream">{salon.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-cream/48 mt-2">
              {(salon.commune || salon.wilaya) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {[salon.commune, salon.wilaya].filter(Boolean).join('، ')}
                </span>
              )}
              {salon.category && <span>{salon.category}</span>}
              <span className={`font-semibold ${
                salon.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {salon.status === 'approved' ? 'معتمد' : 'قيد المراجعة'}
              </span>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/8 px-4 py-2.5 text-cream/72 font-semibold hover:bg-white/6"
          >
            <ArrowRight className="w-4 h-4" />
            العودة
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8 space-y-8">
        <div className="h-px bg-gradient-to-l from-transparent via-gold/35 to-transparent" />
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="glass-panel rounded-[22px] border border-white/8 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/48 text-sm">الخدمات</p>
                <p className="text-3xl font-bold text-cream mt-1">{services.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gold/12 text-gold">
                <Scissors className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[22px] border border-white/8 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/48 text-sm">الحلاقون</p>
                <p className="text-3xl font-bold text-cream mt-1">{barbers.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gold/12 text-gold">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel-strong rounded-[24px] border border-white/8 overflow-hidden">
          <div className="p-6 border-b border-white/8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-cream">الخدمات</h2>
              <p className="text-sm text-cream/48 mt-1">أضف الخدمات والأسعار التي يقدمها صالونك.</p>
            </div>
            <button
              onClick={() => setServiceModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-ink font-semibold hover:bg-gold/90"
            >
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </button>
          </div>

          {services.length === 0 ? (
            <div className="p-10 text-center text-cream/48">لم تتم إضافة أي خدمة بعد.</div>
          ) : (
            <div className="divide-y divide-white/8">
              {services.map((service) => (
                <div key={service.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-cream">{service.name}</h3>
                    <p className="text-sm text-cream/48 mt-1">
                      {[service.category, service.duration ? `${service.duration} دقيقة` : null]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                    {service.description && (
                      <p className="text-sm text-cream/38 mt-1">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-bold text-gold">
                      {service.price.toLocaleString('fr-DZ')} دج
                    </span>
                    <button
                      onClick={() => void deleteService(service.id)}
                      disabled={deletingId === service.id}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      aria-label="حذف الخدمة"
                    >
                      {deletingId === service.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-panel-strong rounded-[24px] border border-white/8 overflow-hidden">
          <div className="p-6 border-b border-white/8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-cream">الحلاقون</h2>
              <p className="text-sm text-cream/48 mt-1">أدر فريق الحلاقين الخاص بصالونك.</p>
            </div>
            <button
              onClick={() => setBarberModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-ink font-semibold hover:bg-gold/90"
            >
              <Plus className="w-4 h-4" />
              إضافة حلاق
            </button>
          </div>

          {barbers.length === 0 ? (
            <div className="p-10 text-center text-cream/48">لم تتم إضافة أي حلاق بعد.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {barbers.map((barber) => (
                <div key={barber.id} className="bg-white/3 border border-white/8 rounded-[20px] p-4 flex items-center gap-4 hover:border-gold/25 transition-all">
                  {barber.photo_url ? (
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/6 flex items-center justify-center text-cream/38">
                      <Users className="w-7 h-7" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-cream">{barber.name}</h3>
                    <p className="text-sm text-cream/48 mt-1">
                      {barber.experience} سنوات خبرة
                    </p>
                    {barber.specialties.length > 0 && (
                      <p className="text-xs text-cream/38 mt-1 truncate">
                        {barber.specialties.join('، ')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => void deleteBarber(barber.id)}
                    disabled={deletingId === barber.id}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    aria-label="حذف الحلاق"
                  >
                    {deletingId === barber.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {serviceModal && (
        <Modal title="إضافة خدمة" onClose={() => setServiceModal(false)}>
          <form onSubmit={addService} className="space-y-4">
            <Input
              label="اسم الخدمة"
              value={serviceForm.name}
              onChange={(value) => setServiceForm((f) => ({ ...f, name: value }))}
              placeholder="مثال: قص الشعر"
              required
            />
            <Input
              label="الفئة"
              value={serviceForm.category}
              onChange={(value) => setServiceForm((f) => ({ ...f, category: value }))}
              placeholder="مثال: شعر"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="السعر (دج)"
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={(value) => setServiceForm((f) => ({ ...f, price: value }))}
                placeholder="500"
                required
              />
              <Input
                label="المدة (دقيقة)"
                type="number"
                min="1"
                value={serviceForm.duration}
                onChange={(value) => setServiceForm((f) => ({ ...f, duration: value }))}
                placeholder="30"
                required
              />
            </div>
            <TextArea
              label="الوصف"
              value={serviceForm.description}
              onChange={(value) => setServiceForm((f) => ({ ...f, description: value }))}
              placeholder="وصف مختصر للخدمة"
            />
            <SubmitButton saving={saving} label="إضافة الخدمة" />
          </form>
        </Modal>
      )}

      {barberModal && (
        <Modal title="إضافة حلاق" onClose={() => setBarberModal(false)}>
          <form onSubmit={addBarber} className="space-y-4">
            <Input
              label="اسم الحلاق"
              value={barberForm.name}
              onChange={(value) => setBarberForm((f) => ({ ...f, name: value }))}
              placeholder="مثال: ياسين"
              required
            />
            <Input
              label="سنوات الخبرة"
              type="number"
              min="0"
              value={barberForm.experience}
              onChange={(value) => setBarberForm((f) => ({ ...f, experience: value }))}
              placeholder="3"
            />
            <Input
              label="التخصصات"
              value={barberForm.specialties}
              onChange={(value) => setBarberForm((f) => ({ ...f, specialties: value }))}
              placeholder="قص الشعر، لحية، تدريج"
            />
            <Input
              label="رابط الصورة"
              value={barberForm.photo_url}
              onChange={(value) => setBarberForm((f) => ({ ...f, photo_url: value }))}
              placeholder="https://..."
            />
            <SubmitButton saving={saving} label="إضافة الحلاق" />
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-strong rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cream">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/6 text-cream/48"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
  required,
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
    <label className="block">
      <span className="block text-sm font-semibold text-cream/72 mb-2">{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field w-full rounded-xl border border-white/10 bg-white/4 text-cream px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/15 placeholder:text-cream/25"
      />
    </label>
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
    <label className="block">
      <span className="block text-sm font-semibold text-cream/72 mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="field w-full rounded-xl border border-white/10 bg-white/4 text-cream px-4 py-3 outline-none resize-none focus:border-gold focus:ring-2 focus:ring-gold/15 placeholder:text-cream/25"
      />
    </label>
  )
}

function SubmitButton({
  saving,
  label,
}: {
  saving: boolean
  label: string
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-ink font-bold disabled:opacity-60"
    >
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      {saving ? 'جارٍ الحفظ...' : label}
    </button>
  )
}
