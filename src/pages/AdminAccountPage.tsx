import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

type Profile = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  type: string | null
  is_admin: boolean | null
}

export default function AdminAccountPage() {
  const { user, logout } = useStore()

  const [profile, setProfile] = useState<Profile | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [originalEmail, setOriginalEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!authUser) {
          if (mounted) {
            setError('لم يتم العثور على حساب المدير.')
            setLoading(false)
          }

          return
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, phone, type, is_admin')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!mounted) return

        if (!data) {
          setError('تعذر العثور على بيانات الملف الشخصي.')
          setLoading(false)
          return
        }

        setProfile(data)

        setName(data.name ?? '')
        setPhone(data.phone ?? '')

        const authEmail = authUser.email ?? ''
        const profileEmail = data.email ?? ''

        setEmail(authEmail || profileEmail)
        setOriginalEmail(authEmail || profileEmail)

        setLoading(false)
      } catch (err) {
        console.error('Admin account load error:', err)

        if (mounted) {
          setError('حدث خطأ أثناء تحميل بيانات الحساب.')
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profile) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      setError('يرجى إدخال الاسم.')
      return
    }

    if (!trimmedEmail) {
      setError('يرجى إدخال البريد الإلكتروني.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      /*
       * 1. Update Auth email if it changed.
       */
      if (trimmedEmail !== originalEmail) {
        const { error: authUpdateError } =
          await supabase.auth.updateUser({
            email: trimmedEmail,
          })

        if (authUpdateError) {
          throw authUpdateError
        }

        /*
         * Supabase may require email confirmation.
         * We still keep the profile email synchronized with
         * the requested email.
         */
      }

      /*
       * 2. Update the profile information.
       */
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || null,
        })
        .eq('id', profile.id)
        .select('id, name, email, phone, type, is_admin')
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(data)

      setName(data.name ?? '')
      setPhone(data.phone ?? '')
      setEmail(trimmedEmail)
      setOriginalEmail(trimmedEmail)

      setEditing(false)

      if (trimmedEmail !== originalEmail) {
        setMessage(
          'تم تحديث المعلومات. إذا طلب Supabase تأكيد البريد الإلكتروني، تحقق من بريدك الإلكتروني.'
        )
      } else {
        setMessage('تم تحديث معلومات الحساب بنجاح.')
      }
    } catch (err) {
      console.error('Admin account update error:', err)

      const message =
        err instanceof Error
          ? err.message
          : 'تعذر تحديث معلومات الحساب.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return

    setName(profile.name ?? '')
    setPhone(profile.phone ?? '')
    setEmail(originalEmail)

    setEditing(false)
    setError('')
    setMessage('')
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-[110px]">
        <div className="w-10 h-10 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
      </div>
    )
  }

  return (
    <section className="min-h-screen pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <div className="mb-8">
          <Link
            to="/admin/salons"
            className="inline-flex items-center gap-2 text-cream/70 hover:text-gold transition-colors"
          >
            <ArrowLeft size={18} />
            العودة إلى لوحة الإدارة
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <ShieldCheck
                className="text-gold"
                size={25}
              />
            </div>

            <div>
              <p className="text-gold text-sm font-semibold">
                حساب الإدارة
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold text-cream">
                حساب المدير
              </h1>
            </div>
          </div>

          <p className="text-cream/60 max-w-2xl">
            إدارة معلومات حساب المدير في منصة Stikini.
          </p>
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 flex items-start gap-3 text-emerald-300">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <span>{message}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Main profile card */}
          <div className="rounded-3xl border border-white/10 bg-black/10 backdrop-blur-sm overflow-hidden">

            {/* Card header */}
            <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-cream">
                  المعلومات الشخصية
                </h2>

                <p className="text-sm text-cream/50 mt-1">
                  معلومات حساب المدير
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true)
                    setMessage('')
                    setError('')
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-4 py-2.5 text-gold hover:bg-gold/15 transition-colors"
                >
                  <Edit3 size={17} />
                  تعديل
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>

              <div className="p-6 sm:p-8 space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-sm text-cream/60 mb-2">
                    الاسم
                  </label>

                  {editing ? (
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40"
                      />

                      <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pr-11 pl-4 text-cream outline-none focus:border-gold/40 transition-colors"
                        placeholder="اسم المدير"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-cream">
                      {profile?.name || 'غير محدد'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-cream/60 mb-2">
                    البريد الإلكتروني
                  </label>

                  {editing ? (
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40"
                      />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pr-11 pl-4 text-cream outline-none focus:border-gold/40 transition-colors"
                        placeholder="admin@example.com"
                      />

                      <p className="mt-2 text-xs text-cream/40">
                        تغيير البريد الإلكتروني قد يتطلب تأكيدًا من
                        البريد الجديد.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-cream break-all">
                      {email || 'غير محدد'}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-cream/60 mb-2">
                    رقم الهاتف
                  </label>

                  {editing ? (
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40"
                      />

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pr-11 pl-4 text-cream outline-none focus:border-gold/40 transition-colors"
                        placeholder="رقم الهاتف"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-cream">
                      {profile?.phone || 'غير محدد'}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm text-cream/60 mb-2">
                    الدور
                  </label>

                  <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3.5 flex items-center gap-3">
                    <ShieldCheck
                      size={19}
                      className="text-gold"
                    />

                    <div>
                      <p className="text-gold font-semibold">
                        Administrator
                      </p>

                      <p className="text-xs text-cream/45 mt-0.5">
                        صلاحيات إدارة المنصة
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm text-cream/60 mb-2">
                    الحالة
                  </label>

                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3.5 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />

                    <span className="text-emerald-300 font-medium">
                      الحساب نشط
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit buttons */}
              {editing && (
                <div className="px-6 sm:px-8 py-5 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:justify-end">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-cream/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <X size={18} />
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-forest hover:brightness-105 transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-forest/30 border-t-forest animate-spin" />
                        جارٍ الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        حفظ التغييرات
                      </>
                    )}
                  </button>

                </div>
              )}
            </form>
          </div>

          {/* Side panel */}
          <aside className="space-y-5">

            {/* Admin information */}
            <div className="rounded-3xl border border-gold/15 bg-gold/5 p-6">

              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
                <ShieldCheck
                  className="text-gold"
                  size={24}
                />
              </div>

              <h3 className="text-lg font-bold text-cream mb-2">
                حساب المدير
              </h3>

              <p className="text-sm leading-6 text-cream/55">
                هذا الحساب مخصص لإدارة منصة Stikini ومراجعة
                الصالونات وطلبات المستخدمين. لا يتم عرض وظائف
                الحجز الخاصة بالعملاء لهذا الحساب.
              </p>
            </div>

            {/* Quick access */}
            <div className="rounded-3xl border border-white/10 bg-black/10 p-6">

              <h3 className="font-bold text-cream mb-4">
                الوصول السريع
              </h3>

              <div className="space-y-2">

                <Link
                  to="/admin/salons"
                  className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-cream/70 hover:text-gold hover:border-gold/20 transition-colors"
                >
                  لوحة الإدارة
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-right rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-red-300/80 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                >
                  تسجيل الخروج
                </button>

              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}