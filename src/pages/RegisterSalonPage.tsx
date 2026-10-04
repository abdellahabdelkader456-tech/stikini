import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Service = {
  name: string
  price: string
  duration: string
}

type Barber = {
  name: string
  experience: string
  specialties: string[]
  languages: string
  photo: File | null
}

type OpeningHour = {
  from: string
  to: string
  closed: boolean
}

type OpeningHours = {
  saturday: OpeningHour
  sunday: OpeningHour
  monday: OpeningHour
  tuesday: OpeningHour
  wednesday: OpeningHour
  thursday: OpeningHour
  friday: OpeningHour
}

const DAYS = [
  ['saturday', 'السبت'],
  ['sunday', 'الأحد'],
  ['monday', 'الإثنين'],
  ['tuesday', 'الثلاثاء'],
  ['wednesday', 'الأربعاء'],
  ['thursday', 'الخميس'],
  ['friday', 'الجمعة'],
] as const

const TIME_OPTIONS = Array.from({ length: 288 }, (_, index) => {
  const totalMinutes = index * 5
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
})

const createDefaultOpeningHours = (): OpeningHours => ({
  saturday: { from: '09:00', to: '18:00', closed: false },
  sunday: { from: '09:00', to: '18:00', closed: false },
  monday: { from: '09:00', to: '18:00', closed: false },
  tuesday: { from: '09:00', to: '18:00', closed: false },
  wednesday: { from: '09:00', to: '18:00', closed: false },
  thursday: { from: '09:00', to: '18:00', closed: false },
  friday: { from: '09:00', to: '18:00', closed: false },
})

const specialtyOptions = [
  'قص الشعر',
  'التدريج (Fade)',
  'حلاقة اللحية',
  'الحلاقة الكلاسيكية',
  'قص الأطفال',
  'صبغ الشعر',
  'تسريحات الشعر',
  'العناية بالشعر',
]

const createEmptyBarber = (): Barber => ({
  name: '',
  experience: '',
  specialties: [],
  languages: 'العربية',
  photo: null,
})

export default function RegisterSalonPage() {
  const [step, setStep] = useState(1)

  // STEP 1
  const [form, setForm] = useState({
    name: '',
    category: '',
    phone: '',
    chairs: '1',
    wilaya: '',
    commune: '',
    address: '',
    description: '',
  })

  // STEP 2
  const [services, setServices] = useState<Service[]>([
    { name: '', price: '', duration: '15' },
  ])

  // STEP 3 — BARBERS
  const [barbers, setBarbers] = useState<Barber[]>([
    createEmptyBarber(),
  ])

  // STEP 4
  const [step4, setStep4] = useState({
    instagram: '',
    facebook: '',
    whatsapp: '',
    openingHours: createDefaultOpeningHours(),
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateService = (
    index: number,
    field: keyof Service,
    value: string,
  ) => {
    setServices((prev) =>
      prev.map((service, i) =>
        i === index ? { ...service, [field]: value } : service,
      ),
    )
  }

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { name: '', price: '', duration: '15' },
    ])
  }

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  const updateBarber = (
    index: number,
    field: keyof Omit<Barber, 'specialties' | 'photo'>,
    value: string,
  ) => {
    setBarbers((prev) =>
      prev.map((barber, i) =>
        i === index ? { ...barber, [field]: value } : barber,
      ),
    )
  }

  const toggleBarberSpecialty = (index: number, specialty: string) => {
    setBarbers((prev) =>
      prev.map((barber, i) => {
        if (i !== index) return barber

        const exists = barber.specialties.includes(specialty)

        return {
          ...barber,
          specialties: exists
            ? barber.specialties.filter((item) => item !== specialty)
            : [...barber.specialties, specialty],
        }
      }),
    )
  }

  const addBarber = () => {
    setBarbers((prev) => [...prev, createEmptyBarber()])
  }

  const removeBarber = (index: number) => {
    setBarbers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleStep2 = () => {
    const hasIncompleteService = services.some(
      (service) => !service.name.trim() || !service.price.trim(),
    )

    if (hasIncompleteService) {
      alert('يرجى إكمال اسم وسعر كل خدمة قبل المتابعة.')
      return
    }

    setStep(3)
  }

  const handleStep3 = () => {
    const hasIncompleteBarber = barbers.some(
      (barber) =>
        !barber.name.trim() ||
        !barber.experience.trim() ||
        barber.specialties.length === 0,
    )

    if (hasIncompleteBarber) {
      alert(
        'يرجى إكمال اسم الحلاق، سنوات الخبرة وتخصص واحد على الأقل لكل حلاق.',
      )
      return
    }

    setStep(4)
  }

  // Upload image to Supabase Storage and return public URL
  const uploadImage = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('salon-images')
      .upload(path, file, {
        upsert: false,
        contentType: file.type || 'image/*',
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage
      .from('salon-images')
      .getPublicUrl(path)

    return data.publicUrl
  }

  const getSafeFileName = (fileName: string) => {
    return fileName.replace(/[^\w.\-]+/g, '-')
  }

  const openingHoursForDatabase = () =>
    Object.fromEntries(
      Object.entries(step4.openingHours).map(([day, hours]) => [
        day,
        hours.closed ? 'مغلق' : `${hours.from} - ${hours.to}`,
      ]),
    )

  const validateOpeningHours = () => {
    for (const [day, hours] of Object.entries(step4.openingHours)) {
      if (hours.closed) continue

      if (hours.from >= hours.to) {
        const label = DAYS.find(([key]) => key === day)?.[1] ?? day
        alert(`وقت الانتهاء يجب أن يكون بعد وقت البداية ليوم ${label}.`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateOpeningHours()) return

    try {
      // 1. Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        alert('يجب تسجيل الدخول أولاً قبل إنشاء الصالون.')
        return
      }

      // 2. Generate salon ID
      const salonId = crypto.randomUUID()

      // 3. Create salon
      const { error: salonError } = await supabase.from('salons').insert({
        id: salonId,
        name: form.name.trim(),
        owner_id: user.id,
        phone: form.phone.trim(),
        chairs: Number(form.chairs),
        address: form.address.trim(),
        description: form.description.trim() || null,
        wilaya: form.wilaya.trim(),
        commune: form.commune.trim(),
        category: form.category,
        instagram: step4.instagram.trim() || null,
        facebook: step4.facebook.trim() || null,
        whatsapp: step4.whatsapp.trim() || null,
        opening_hours: openingHoursForDatabase(),
        status: 'pending',
      })

      if (salonError) {
        throw salonError
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          type: 'owner',
          salon_id: salonId,
        })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      // 4. Upload logo
      let logoUrl: string | null = null

      if (logoFile) {
        const safeName = getSafeFileName(logoFile.name)

        const logoPath = `${user.id}/${salonId}/logo-${crypto.randomUUID()}-${safeName}`

        logoUrl = await uploadImage(logoFile, logoPath)
      }

      // 5. Upload cover
      let coverUrl: string | null = null

      if (coverFile) {
        const safeName = getSafeFileName(coverFile.name)

        const coverPath = `${user.id}/${salonId}/cover-${crypto.randomUUID()}-${safeName}`

        coverUrl = await uploadImage(coverFile, coverPath)
      }

      // 6. Update salon with logo and cover URLs
      if (logoUrl || coverUrl) {
        const salonUpdate: {
          logo_url?: string
          cover_url?: string
        } = {}

        if (logoUrl) {
          salonUpdate.logo_url = logoUrl
        }

        if (coverUrl) {
          salonUpdate.cover_url = coverUrl
        }

        const { error: updateSalonError } = await supabase
          .from('salons')
          .update(salonUpdate)
          .eq('id', salonId)
          .eq('owner_id', user.id)

        if (updateSalonError) {
          throw updateSalonError
        }
      }

      // 7. Save cover in salon_images
      if (coverUrl) {
        const { error: coverImageError } = await supabase
          .from('salon_images')
          .insert({
            salon_id: salonId,
            image_url: coverUrl,
            is_cover: true,
          })

        if (coverImageError) {
          throw coverImageError
        }
      }

      // 8. Upload gallery images
      if (galleryFiles.length > 0) {
        for (let index = 0; index < galleryFiles.length; index++) {
          const file = galleryFiles[index]
          const safeName = getSafeFileName(file.name)

          const galleryPath = `${user.id}/${salonId}/gallery-${index}-${crypto.randomUUID()}-${safeName}`

          const imageUrl = await uploadImage(file, galleryPath)

          const { error: galleryError } = await supabase
            .from('salon_images')
            .insert({
              salon_id: salonId,
              image_url: imageUrl,
              is_cover: false,
            })

          if (galleryError) {
            throw galleryError
          }
        }
      }

      // 9. Save services
      const servicesToInsert = services.map((service) => ({
        salon_id: salonId,
        name: service.name.trim(),
        description: null,
        category: form.category || null,
        price: Number(service.price),
        duration: Number(service.duration),
      }))

      const { error: servicesError } = await supabase
        .from('salon_services')
        .insert(servicesToInsert)

      if (servicesError) {
        throw servicesError
      }

      // 10. Upload barber photos and save barbers
      for (let index = 0; index < barbers.length; index++) {
        const barber = barbers[index]

        let photoUrl: string | null = null

        if (barber.photo) {
          const safeName = getSafeFileName(barber.photo.name)

          const barberPhotoPath = `${user.id}/${salonId}/barber-${index}-${crypto.randomUUID()}-${safeName}`

          photoUrl = await uploadImage(barber.photo, barberPhotoPath)
        }

        const { error: barberError } = await supabase
          .from('salon_barbers')
          .insert({
            salon_id: salonId,
            name: barber.name.trim(),
            experience: Number(barber.experience),
            specialties: barber.specialties,
            languages: barber.languages.trim() || null,
            photo_url: photoUrl,
          })

        if (barberError) {
          throw barberError
        }
      }

      // 11. Success
      console.log('Salon created:', salonId)

      alert(
        'تم إنشاء الصالون بنجاح، وسيتم مراجعته قبل نشره.',
      )

      // Reset form after successful submission
      setStep(1)

      setForm({
        name: '',
        category: '',
        phone: '',
        chairs: '1',
        wilaya: '',
        commune: '',
        address: '',
        description: '',
      })

      setServices([
        {
          name: '',
          price: '',
          duration: '15',
        },
      ])

      setBarbers([
        createEmptyBarber(),
      ])

      setStep4({
        instagram: '',
        facebook: '',
        whatsapp: '',
        openingHours: createDefaultOpeningHours(),
      })

      setLogoFile(null)
      setCoverFile(null)
      setGalleryFiles([])
    } catch (error) {
      console.error('Error creating salon:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'حدث خطأ غير معروف أثناء إنشاء الصالون.'

      alert(`حدث خطأ أثناء إنشاء الصالون:\n${message}`)
    }
  }

  const stepLabels = [
    'المعلومات',
    'الخدمات',
    'الحلاقين',
    'الصور والتواصل',
  ]

  return (
    <div className="min-h-screen bg-forest text-cream pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold text-sm uppercase tracking-[0.2em] mb-3">
            سجّل صالونك
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            أضف صالونك إلى Stikini
          </h1>

          <p className="text-cream/60">
            أكمل المعلومات المطلوبة لإضافة الصالون وفريق الحلاقين
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {stepLabels.map((label, index) => {
            const number = index + 1

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${
                    step >= number
                      ? 'bg-gold text-forest'
                      : 'border border-cream/20 text-cream/40'
                  }`}
                >
                  {number}
                </div>

                <span
                  className={`text-sm ${
                    step >= number ? 'text-gold' : 'text-cream/40'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form
            onSubmit={handleStep1}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold mb-6">
              معلومات الصالون
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">
                  اسم الصالون *
                </label>

                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    updateField('name', e.target.value)
                  }
                  placeholder="مثال: Barber House"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  نوع الصالون *
                </label>

                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    updateField('category', e.target.value)
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                >
                  <option value="">اختر النوع</option>
                  <option value="barber">حلاق رجالي</option>
                  <option value="salon">صالون حلاقة</option>
                  <option value="beauty">صالون تجميل</option>
                  <option value="unisex">صالون للجنسين</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  رقم الهاتف *
                </label>

                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    updateField('phone', e.target.value)
                  }
                  placeholder="05 XX XX XX XX"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  عدد الكراسي *
                </label>

                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={form.chairs}
                  onChange={(e) =>
                    updateField('chairs', e.target.value)
                  }
                  placeholder="مثال: 4"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />

                <p className="text-xs text-cream/50 mt-2">
                  عدد الزبائن الذين يمكن استقبالهم في نفس الوقت عبر كراسي الحلاقة.
                </p>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  الولاية *
                </label>

                <input
                  type="text"
                  required
                  value={form.wilaya}
                  onChange={(e) =>
                    updateField('wilaya', e.target.value)
                  }
                  placeholder="مثال: الجزائر"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  البلدية *
                </label>

                <input
                  type="text"
                  required
                  value={form.commune}
                  onChange={(e) =>
                    updateField('commune', e.target.value)
                  }
                  placeholder="مثال: زرالدة"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-2">
                  العنوان *
                </label>

                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) =>
                    updateField('address', e.target.value)
                  }
                  placeholder="العنوان الكامل للصالون"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-2">
                  وصف الصالون
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateField('description', e.target.value)
                  }
                  placeholder="اكتب وصفاً قصيراً عن الصالون والخدمات التي يقدمها..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                className="bg-gold text-forest font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition"
              >
                التالي →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-2">
              خدمات الصالون
            </h2>

            <p className="text-cream/50 text-sm mb-8">
              أضف الخدمات والأسعار ومدة كل خدمة
            </p>

            <div className="space-y-5">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-xl p-5"
                >
                  <div className="flex justify-between mb-4">
                    <h3 className="font-semibold">
                      الخدمة {index + 1}
                    </h3>

                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-2">
                        اسم الخدمة *
                      </label>

                      <input
                        type="text"
                        required
                        value={service.name}
                        onChange={(e) =>
                          updateService(
                            index,
                            'name',
                            e.target.value,
                          )
                        }
                        placeholder="مثال: قص الشعر"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        السعر (دج) *
                      </label>

                      <input
                        type="number"
                        min="0"
                        required
                        value={service.price}
                        onChange={(e) =>
                          updateService(
                            index,
                            'price',
                            e.target.value,
                          )
                        }
                        placeholder="500"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        المدة (دقيقة) *
                      </label>

                      <select
                        required
                        value={service.duration}
                        onChange={(e) =>
                          updateService(
                            index,
                            'duration',
                            e.target.value,
                          )
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      >
                        {Array.from({ length: 34 }, (_, i) => {
                          const minutes = 15 + i * 5

                          return (
                            <option
                              key={minutes}
                              value={String(minutes)}
                            >
                              {minutes} دقيقة
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addService}
              className="mt-5 w-full border border-dashed border-gold/40 text-gold rounded-xl py-3 hover:bg-gold/5 transition"
            >
              + إضافة خدمة أخرى
            </button>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-white/10 px-7 py-3 rounded-xl text-cream/70 hover:text-cream transition"
              >
                ← السابق
              </button>

              <button
                type="button"
                onClick={handleStep2}
                className="bg-gold text-forest font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition"
              >
                التالي →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — BARBERS */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                الحلاقون وفريق العمل
              </h2>

              <p className="text-cream/50 text-sm">
                أضف كل حلاق مع تخصصاته وخبرته حتى يتمكن الزبون من اختيار الحلاق المناسب عند الحجز.
              </p>
            </div>

            <div className="space-y-6">
              {barbers.map((barber, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-2xl p-5 md:p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold text-lg">
                        الحلاق {index + 1}
                      </h3>

                      <p className="text-xs text-cream/40 mt-1">
                        المعلومات التي ستظهر للزبون
                      </p>
                    </div>

                    {barbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBarber(index)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        حذف الحلاق
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm mb-2">
                        الاسم الكامل *
                      </label>

                      <input
                        type="text"
                        required
                        value={barber.name}
                        onChange={(e) =>
                          updateBarber(
                            index,
                            'name',
                            e.target.value,
                          )
                        }
                        placeholder="مثال: محمد بوعلام"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        سنوات الخبرة *
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="60"
                        required
                        value={barber.experience}
                        onChange={(e) =>
                          updateBarber(
                            index,
                            'experience',
                            e.target.value,
                          )
                        }
                        placeholder="مثال: 7"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        اللغات
                      </label>

                      <input
                        type="text"
                        value={barber.languages}
                        onChange={(e) =>
                          updateBarber(
                            index,
                            'languages',
                            e.target.value,
                          )
                        }
                        placeholder="العربية، الفرنسية"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        صورة الحلاق
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setBarbers((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    photo:
                                      e.target.files?.[0] ||
                                      null,
                                  }
                                : item,
                            ),
                          )
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm"
                      />

                      {barber.photo && (
                        <p className="text-gold text-xs mt-2">
                          {barber.photo.name}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm mb-3">
                        التخصصات والخبرات * — اختر واحداً على الأقل
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {specialtyOptions.map((specialty) => {
                          const checked =
                            barber.specialties.includes(
                              specialty,
                            )

                          return (
                            <label
                              key={specialty}
                              className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition ${
                                checked
                                  ? 'border-gold bg-gold/10 text-gold'
                                  : 'border-white/10 bg-black/10 text-cream/70 hover:border-white/20'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleBarberSpecialty(
                                    index,
                                    specialty,
                                  )
                                }
                                className="sr-only"
                              />

                              <span>{specialty}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addBarber}
              className="mt-6 w-full border border-dashed border-gold/40 text-gold rounded-xl py-3 hover:bg-gold/5 transition"
            >
              + إضافة حلاق آخر
            </button>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="border border-white/10 px-7 py-3 rounded-xl text-cream/70 hover:text-cream transition"
              >
                ← السابق
              </button>

              <button
                type="button"
                onClick={handleStep3}
                className="bg-gold text-forest font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition"
              >
                التالي →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold mb-2">
              الصور والتواصل
            </h2>

            <p className="text-cream/50 text-sm mb-8">
              أضف صور الصالون ومعلومات التواصل وأوقات العمل.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">
                  شعار الصالون
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setLogoFile(
                      e.target.files?.[0] || null,
                    )
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm"
                />

                {logoFile && (
                  <p className="text-gold text-xs mt-2">
                    {logoFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">
                  صورة الغلاف
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCoverFile(
                      e.target.files?.[0] || null,
                    )
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm"
                />

                {coverFile && (
                  <p className="text-gold text-xs mt-2">
                    {coverFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">
                  صور الصالون
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setGalleryFiles(
                      Array.from(
                        e.target.files || [],
                      ),
                    )
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm"
                />

                {galleryFiles.length > 0 && (
                  <p className="text-gold text-xs mt-2">
                    تم اختيار {galleryFiles.length} صور
                  </p>
                )}
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-5">
                معلومات التواصل
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    Instagram
                  </label>

                  <input
                    type="text"
                    value={step4.instagram}
                    onChange={(e) =>
                      setStep4((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    placeholder="@your_salon"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Facebook
                  </label>

                  <input
                    type="text"
                    value={step4.facebook}
                    onChange={(e) =>
                      setStep4((prev) => ({
                        ...prev,
                        facebook: e.target.value,
                      }))
                    }
                    placeholder="facebook.com/..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={step4.whatsapp}
                    onChange={(e) =>
                      setStep4((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    placeholder="05 XX XX XX XX"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-5">
                أوقات العمل
              </h3>

              <div className="space-y-3">
                {DAYS.map(([key, label]) => {
                  const hours = step4.openingHours[key]

                  return (
                    <div
                      key={key}
                      className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_auto] items-center gap-3"
                    >
                      <div className="text-sm text-cream/70">{label}</div>

                      <select
                        value={hours.from}
                        disabled={hours.closed}
                        onChange={(e) =>
                          setStep4((prev) => ({
                            ...prev,
                            openingHours: {
                              ...prev.openingHours,
                              [key]: { ...prev.openingHours[key], from: e.target.value },
                            },
                          }))
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-40"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>من {time}</option>
                        ))}
                      </select>

                      <select
                        value={hours.to}
                        disabled={hours.closed}
                        onChange={(e) =>
                          setStep4((prev) => ({
                            ...prev,
                            openingHours: {
                              ...prev.openingHours,
                              [key]: { ...prev.openingHours[key], to: e.target.value },
                            },
                          }))
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-40"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>إلى {time}</option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2 text-sm text-cream/70 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) =>
                            setStep4((prev) => ({
                              ...prev,
                              openingHours: {
                                ...prev.openingHours,
                                [key]: { ...prev.openingHours[key], closed: e.target.checked },
                              },
                            }))
                          }
                          className="accent-gold"
                        />
                        مغلق
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="border border-white/10 px-7 py-3 rounded-xl text-cream/70 hover:text-cream transition"
              >
                ← السابق
              </button>

              <button
                type="submit"
                className="bg-gold text-forest font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition"
              >
                إنشاء الصالون ✓
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}