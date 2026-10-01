import { useState, type FormEvent } from 'react'

type Service = {
  name: string
  price: string
  duration: string
}

type OpeningHours = {
  saturday: string
  sunday: string
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
}

export default function RegisterSalonPage() {
  const [step, setStep] = useState(1)

  // STEP 1
  const [form, setForm] = useState({
    name: '',
    category: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    description: '',
  })

  // STEP 2
  const [services, setServices] = useState<Service[]>([
    {
      name: '',
      price: '',
      duration: '30',
    },
  ])

  // STEP 3
  const [step3, setStep3] = useState({
    instagram: '',
    facebook: '',
    whatsapp: '',
    openingHours: {
      saturday: '',
      sunday: '',
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
    } as OpeningHours,
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])

  // STEP 1 field update
  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // STEP 2 service update
  const updateService = (
    index: number,
    field: keyof Service,
    value: string
  ) => {
    setServices((prev) =>
      prev.map((service, i) =>
        i === index
          ? {
              ...service,
              [field]: value,
            }
          : service
      )
    )
  }

  // Add service
  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        name: '',
        price: '',
        duration: '30',
      },
    ])
  }

  // Remove service
  const removeService = (index: number) => {
    setServices((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  // STEP 1 → STEP 2
  const handleStep1 = (e: FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  // Final submit for now
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    console.log('Salon information:', form)
    console.log('Services:', services)
    console.log('Social media:', step3)
    console.log('Logo:', logoFile)
    console.log('Cover:', coverFile)
    console.log('Gallery:', galleryFiles)

    alert('تم تجهيز بيانات الصالون بنجاح')
  }

  return (
    <div className="min-h-screen bg-forest text-cream pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="text-center mb-10">

          <p className="text-gold text-sm uppercase tracking-[0.2em] mb-3">
            سجّل صالونك
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            أضف صالونك إلى Stikini
          </h1>

          <p className="text-cream/60">
            أكمل المعلومات المطلوبة لإضافة صالونك
          </p>

        </div>

        {/* ========================= */}
        {/* STEP INDICATOR */}
        {/* ========================= */}

        <div className="flex items-center justify-center mb-10">

          {/* STEP 1 */}

          <div className="flex items-center">

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1
                  ? 'bg-gold text-forest'
                  : 'border border-cream/20 text-cream/40'
              }`}
            >
              1
            </div>

            <span
              className={`mx-3 text-sm ${
                step >= 1
                  ? 'text-gold'
                  : 'text-cream/40'
              }`}
            >
              المعلومات
            </span>

          </div>

          <div className="w-16 h-px bg-cream/20 mx-2" />

          {/* STEP 2 */}

          <div className="flex items-center">

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2
                  ? 'bg-gold text-forest'
                  : 'border border-cream/20 text-cream/40'
              }`}
            >
              2
            </div>

            <span
              className={`mx-3 text-sm ${
                step >= 2
                  ? 'text-gold'
                  : 'text-cream/40'
              }`}
            >
              الخدمات
            </span>

          </div>

          <div className="w-16 h-px bg-cream/20 mx-2" />

          {/* STEP 3 */}

          <div className="flex items-center">

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3
                  ? 'bg-gold text-forest'
                  : 'border border-cream/20 text-cream/40'
              }`}
            >
              3
            </div>

            <span
              className={`ml-3 text-sm ${
                step >= 3
                  ? 'text-gold'
                  : 'text-cream/40'
              }`}
            >
              الصور
            </span>

          </div>

        </div>

        {/* ================================================== */}
        {/* STEP 1 */}
        {/* ================================================== */}

        {step === 1 && (

          <form
            onSubmit={handleStep1}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >

            <h2 className="text-xl font-semibold mb-6">
              معلومات الصالون
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Salon name */}

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

              {/* Category */}

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

                  <option value="">
                    اختر النوع
                  </option>

                  <option value="barber">
                    حلاق رجالي
                  </option>

                  <option value="salon">
                    صالون حلاقة
                  </option>

                  <option value="beauty">
                    صالون تجميل
                  </option>

                  <option value="unisex">
                    صالون للجنسين
                  </option>

                </select>

              </div>

              {/* Phone */}

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

              {/* Wilaya */}

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

              {/* Commune */}

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

              {/* Address */}

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

              {/* Description */}

              <div className="md:col-span-2">

                <label className="block text-sm mb-2">
                  وصف الصالون
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="اكتب وصفاً قصيراً عن الصالون والخدمات التي يقدمها..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold resize-none"
                />

              </div>

            </div>

            {/* Next */}

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

        {/* ================================================== */}
        {/* STEP 2 */}
        {/* ================================================== */}

        {step === 2 && (

          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >

            <h2 className="text-xl font-semibold mb-2">
              خدمات الصالون
            </h2>

            <p className="text-cream/50 text-sm mb-8">
              أضف الخدمات والأسعار ومدة كل خدمة
            </p>

            {/* Services */}

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
                        onClick={() =>
                          removeService(index)
                        }
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        حذف
                      </button>

                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Service name */}

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
                            e.target.value
                          )
                        }
                        placeholder="مثال: قص الشعر"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />

                    </div>

                    {/* Price */}

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
                            e.target.value
                          )
                        }
                        placeholder="500"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      />

                    </div>

                    {/* Duration */}

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
                            e.target.value
                          )
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                      >

                        <option value="15">
                          15 دقيقة
                        </option>

                        <option value="30">
                          30 دقيقة
                        </option>

                        <option value="45">
                          45 دقيقة
                        </option>

                        <option value="60">
                          60 دقيقة
                        </option>

                        <option value="90">
                          90 دقيقة
                        </option>

                        <option value="120">
                          120 دقيقة
                        </option>

                      </select>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* Add service */}

            <button
              type="button"
              onClick={addService}
              className="mt-5 w-full border border-dashed border-gold/40 text-gold rounded-xl py-3 hover:bg-gold/5 transition"
            >
              + إضافة خدمة أخرى
            </button>

            {/* Navigation */}

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
                onClick={() => setStep(3)}
                className="bg-gold text-forest font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition"
              >
                التالي →
              </button>

            </div>

          </div>

        )}

        {/* ================================================== */}
        {/* STEP 3 */}
        {/* ================================================== */}

        {step === 3 && (

          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >

            <h2 className="text-xl font-semibold mb-2">
              الصور والتواصل
            </h2>

            <p className="text-cream/50 text-sm mb-8">
              أضف صور الصالون ومعلومات التواصل وأوقات العمل
            </p>

            {/* ======================== */}
            {/* IMAGES */}
            {/* ======================== */}

            <div className="space-y-6">

              {/* Logo */}

              <div>

                <label className="block text-sm mb-2">
                  شعار الصالون
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setLogoFile(
                      e.target.files?.[0] || null
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

              {/* Cover */}

              <div>

                <label className="block text-sm mb-2">
                  صورة الغلاف
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCoverFile(
                      e.target.files?.[0] || null
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

              {/* Gallery */}

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
                        e.target.files || []
                      )
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

            {/* ======================== */}
            {/* SOCIAL MEDIA */}
            {/* ======================== */}

            <div className="mt-10">

              <h3 className="text-lg font-semibold mb-5">
                معلومات التواصل
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Instagram */}

                <div>

                  <label className="block text-sm mb-2">
                    Instagram
                  </label>

                  <input
                    type="text"
                    value={step3.instagram}
                    onChange={(e) =>
                      setStep3((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    placeholder="@your_salon"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                  />

                </div>

                {/* Facebook */}

                <div>

                  <label className="block text-sm mb-2">
                    Facebook
                  </label>

                  <input
                    type="text"
                    value={step3.facebook}
                    onChange={(e) =>
                      setStep3((prev) => ({
                        ...prev,
                        facebook: e.target.value,
                      }))
                    }
                    placeholder="facebook.com/..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                  />

                </div>

                {/* WhatsApp */}

                <div>

                  <label className="block text-sm mb-2">
                    WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={step3.whatsapp}
                    onChange={(e) =>
                      setStep3((prev) => ({
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

            {/* ======================== */}
            {/* OPENING HOURS */}
            {/* ======================== */}

            <div className="mt-10">

              <h3 className="text-lg font-semibold mb-5">
                أوقات العمل
              </h3>

              <div className="space-y-3">

                {[
                  ['saturday', 'السبت'],
                  ['sunday', 'الأحد'],
                  ['monday', 'الإثنين'],
                  ['tuesday', 'الثلاثاء'],
                  ['wednesday', 'الأربعاء'],
                  ['thursday', 'الخميس'],
                  ['friday', 'الجمعة'],
                ].map(([key, label]) => (

                  <div
                    key={key}
                    className="flex items-center gap-4"
                  >

                    <div className="w-24 text-sm text-cream/70">
                      {label}
                    </div>

                    <input
                      type="text"
                      value={
                        step3.openingHours[
                          key as keyof OpeningHours
                        ]
                      }
                      onChange={(e) =>
                        setStep3((prev) => ({
                          ...prev,
                          openingHours: {
                            ...prev.openingHours,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      placeholder="09:00 - 18:00"
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold"
                    />

                  </div>

                ))}

              </div>

            </div>

            {/* ======================== */}
            {/* FINAL BUTTONS */}
            {/* ======================== */}

            <div className="flex justify-between mt-10">

              <button
                type="button"
                onClick={() => setStep(2)}
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