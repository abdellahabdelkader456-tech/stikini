import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  Cookie,
  Mail,
  ArrowLeft,
  FileCheck2,
  ScrollText,
} from 'lucide-react'
import { SITE } from '../lib/data'

const SECTIONS = [
  {
    icon: Database,
    title: '1. البيانات التي نجمعها',
    content: [
      'نجمع فقط البيانات اللازمة لتشغيل الخدمة: الاسم الكامل، رقم الهاتف، البريد الإلكتروني، وكلمة المرور المشفرة.',
      'بالنسبة لأصحاب الصالونات، قد نجمع معلومات إضافية مثل اسم الصالون، الحي/المنطقة، وعدد كراسي الحلاقة.',
      'لا نجمع أي بيانات حساسة غير مرتبطة بخدمة الحجز وإدارة الحساب.',
    ],
  },
  {
    icon: UserCheck,
    title: '2. كيفية استخدام البيانات',
    content: [
      'تُستخدم البيانات لإنشاء وإدارة حسابك، تنفيذ الحجوزات، إرسال تأكيدات المواعيد، والتواصل معك بخصوص الخدمة.',
      'لا نستخدم بياناتك لأغراض تسويقية دون موافقتك، ولا نبيعها لأي طرف ثالث.',
      'قد نستخدم بيانات مجمعة (غير شخصية) لتحسين جودة المنصة وتجربة المستخدم.',
    ],
  },
  {
    icon: Lock,
    title: '3. حماية البيانات',
    content: [
      'جميع الاتصالات بالمنصة مشفرة عبر بروتوكول HTTPS/SSL.',
      'تُخزن كلمات المرور في صيغة مشفرة (Hash) باستخدام خوارزميات قياسية، ولا يمكن استرجاعها أو قراءتها.',
      'نطبق إجراءات وصول صارمة لضمان أن البيانات المتاحة فقط للأشخاص الذين يحتاجونها لتشغيل الخدمة.',
    ],
  },
  {
    icon: Cookie,
    title: '4. ملفات تعريف الارتباط (Cookies)',
    content: [
      'نستخدم ملفات تعريف ارتباط وتخزين محلي بسيطًا لحفظ جلسة تسجيل دخولك وتفضيلاتك (مثل المواعيد المحفوظة) لتحسين تجربتك.',
      'يمكنك مسح هذه البيانات من إعدادات متصفحك في أي وقت.',
      'لا نستخدم ملفات تتبع إعلانية خارجية.',
    ],
  },
  {
    icon: Eye,
    title: '5. حقوقك',
    content: [
      'يحق لك الاطلاع على بياناتك، تصحيحها، أو طلب حذف حسابك نهائيًا في أي وقت عبر التواصل مع فريق الدعم.',
      'سنستجيب لطلبات الحذف خلال مدة معقولة وفق التشريعات المعمول بها.',
      'يمكنك أيضاً تصدير بياناتك بصيغة رقمية عند الطلب.',
    ],
  },
  {
    icon: Mail,
    title: '6. التواصل بخصوص الخصوصية',
    content: [
      'لأي استفسار يتعلق بسياسة الخصوصية، راسلنا عبر صفحة "تواصل معنا" أو على البريد الإلكتروني المخصص.',
      'نلتزم بالرد على جميع استفسارات الخصوصية خلال 7 أيام عمل كحد أقصى.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/style-3.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.13]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/88 to-forest" />
        </div>
        <div className="absolute top-0 right-1/4 w-[520px] h-[520px] rounded-full bg-gold/9 blur-[130px]" />
        <div className="hero-grid-bg absolute inset-0 opacity-55" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6">
          <nav className="flex items-center gap-2.5 text-[12.5px] text-cream/42 mb-7">
            <Link to="/" className="hover:text-gold transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold/50">/</span>
            <span className="text-gold/85">سياسة الخصوصية</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              شفافية كاملة مع مستخدمينا
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              سياسة <span className="text-gradient-gold">الخصوصية</span>
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              هذه السياسة تشرح بوضوح ماذا نجمع من بيانات، وكيف نستخدمها ونحميها، وما
              هي حقوقك كاملة.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-brand" />
                <span className="text-cream/48 text-[11.5px] font-semibold">
                  متوافقة مع التشريعات الجزائرية
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-brand" />
                <span className="text-cream/48 text-[11.5px] font-semibold">
                  تشفير كامل للبيانات
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-emerald-brand" />
                <span className="text-cream/48 text-[11.5px] font-semibold">
                  آخر تحديث: {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative pb-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          {/* Intro card */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="glass-panel-strong rounded-[26px] p-9 mb-10"
          >
            <div className="flex items-start gap-4">
              <span className="w-13 h-13 rounded-2xl bg-gold/14 border border-gold/26 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-gold" />
              </span>
              <div>
                <h2 className="text-[19px] font-black text-cream leading-[1.5]">
                  التزامنا بحماية خصوصيتك
                </h2>
                <p className="mt-4 text-cream/55 text-[14px] leading-[2.15]">
                  في منصة stikini، نأخذ خصوصيتك على محمل الجد. توضح هذه الصفحة كيفية
                  جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عند استخدام منصتنا
                  للحجز في صالونات الجزائر العاصمة. باستخدامك للمنصة، فإنك توافق
                  على الممارسات الموضحة في هذه السياسة.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sections */}
          <div className="space-y-7">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.09 }}
                className="glass-panel rounded-[24px] overflow-hidden"
              >
                <div className="px-8 py-6 border-b border-white/7">
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/22 flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-gold" />
                    </span>
                    <h2 className="text-[17px] font-black text-cream">{section.title}</h2>
                  </div>
                </div>

                <div className="px-8 py-7">
                  <ul className="space-y-4">
                    {section.content.map((line) => (
                      <li key={line} className="flex items-start gap-3">
                        <span className="w-1.8 h-1.8 rounded-full bg-gold/62 mt-2.5 shrink-0" />
                        <p className="text-cream/55 text-[13.5px] leading-[2.15]">{line}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="mt-12 glass-panel rounded-[26px] p-9"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-7">
              <div>
                <h3 className="text-[19px] font-black text-cream">
                  لديك سؤال حول خصوصيتك؟
                </h3>
                <p className="mt-3 text-cream/52 text-[13.5px] leading-[2]">
                  فريقنا جاهز للإجابة على جميع استفساراتك المتعلقة بحماية البيانات
                  والخصوصية.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[13px] whitespace-nowrap"
                >
                  تواصل معنا
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border border-white/12 text-cream/75 font-bold text-[12.5px] hover:border-gold/42 hover:text-gold transition-all whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  <span dir="ltr">{SITE.email}</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
