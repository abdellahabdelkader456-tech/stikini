import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScrollText,
  UserCheck,
  CreditCard,
  Store,
  ShieldAlert,
  RefreshCw,
  Mail,
  ArrowLeft,
  FileCheck2,
  Scale,
} from 'lucide-react'
import { SITE } from '../lib/data'

const SECTIONS = [
  {
    icon: ScrollText,
    title: '1. مقدمة',
    content: [
      'باستخدامك منصة stikini، فإنك توافق على هذه الشروط. إذا كنت لا توافق على أي بند، يرجى عدم استخدام المنصة.',
      'تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت، وسيتم إشعار المستخدمين بالتغييرات الجوهرية.',
    ],
  },
  {
    icon: UserCheck,
    title: '2. حسابات المستخدمين',
    content: [
      'أنت مسؤول عن تقديم معلومات صحيحة ودقيقة عند إنشاء الحساب، وعن الحفاظ على سرية بيانات الدخول الخاصة بك.',
      'حساب الصالون مخصص لصاحب الصالون أو الشخص المخول قانونياً بإدارته.',
      'يُمنع إنشاء أكثر من حساب واحد لنفس الشخص دون إذن مسبق من المنصة.',
    ],
  },
  {
    icon: CreditCard,
    title: '3. الحجوزات والدفع',
    content: [
      'الحجز عبر المنصة مجاني للزبون، والدفع يتم مباشرة في الصالون حسب الأسعار المعلنة.',
      'الالتزام بمواعيد الحجز المؤكدة مسؤولية الطرفين: الصالون يلتزم بتقديم الخدمة في الوقت المحدد، والزبون يلتزم بالحضور أو الإلغاء المسبق.',
      'قد تختلف سياسات الإلغاء والاسترداد من صالون لآخر، ويُرجى الاطلاع عليها قبل الحجز.',
    ],
  },
  {
    icon: Store,
    title: '4. مسؤولية الصالونات',
    content: [
      'الصالونات المسجلة مسؤولة عن دقة معلوماتها (الأسعار، ساعات العمل، الخدمات) وتحديثها دورياً.',
      'تحتفظ المنصة بحق مراجعة طلبات الانضمام وتعليق أو إزالة المحتوى المخالف.',
      'الصالون مسؤول عن جودة الخدمة المقدمة داخل مقره.',
    ],
  },
  {
    icon: ShieldAlert,
    title: '5. الاستخدام المقبول',
    content: [
      'يُمنع استخدام المنصة لأي غرض غير قانوني، أو لإرسال معلومات مضللة، أو لإلحاق الضرر بالمنصة أو مستخدميها.',
      'يُمنع محاولة الوصول غير المصرح به لأنظمة المنصة أو بيانات المستخدمين الآخرين.',
      'يُمنع استخدام أدوات آلية (bots) للوصول إلى المنصة دون إذن كتابي مسبق.',
    ],
  },
  {
    icon: RefreshCw,
    title: '6. تعديل الشروط',
    content: [
      'قد نحدّث هذه الشروط من وقت لآخر، وسنعلن عن التغييرات الجوهرية عبر المنصة.',
      'استمرارك في الاستخدام بعد نشر التعديلات يعني موافقتك على النسخة المحدّثة.',
      'يُنصح بمراجعة هذه الصفحة دورياً للبقاء على اطلاع بأحدث الشروط.',
    ],
  },
]

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-[168px] pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/salon-1.jpg"
            alt=""
            className="w-full h-full object-cover opacity-[0.12]"
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
            <span className="text-gold/85">الشروط والأحكام</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gold/11 border border-gold/22 text-gold text-[12px] font-bold">
              <Scale className="w-3.5 h-3.5" />
              قواعد الاستخدام والالتزامات
            </span>

            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,3.85rem)] font-black text-cream leading-[1.24]">
              الشروط <span className="text-gradient-gold">والأحكام</span>
            </h1>

            <p className="mt-5 text-cream/55 text-[17px] leading-[2.05]">
              هذه الشروط تنظم العلاقة بينك وبين منصة stikini وتوضح حقوق والتزامات كل
              طرف.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-brand" />
                <span className="text-cream/48 text-[11.5px] font-semibold">
                  شروط واضحة وشفافة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-brand" />
                <span className="text-cream/48 text-[11.5px] font-semibold">
                  حماية حقوق جميع الأطراف
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-brand" />
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
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="glass-panel-strong rounded-[26px] p-9 mb-10"
          >
            <div className="flex items-start gap-4">
              <span className="w-13 h-13 rounded-2xl bg-gold/14 border border-gold/26 flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6 text-gold" />
              </span>
              <div>
                <h2 className="text-[19px] font-black text-cream leading-[1.5]">
                  اتفاقية الاستخدام
                </h2>
                <p className="mt-4 text-cream/55 text-[14px] leading-[2.15]">
                  تحكم هذه الاتفاقية استخدامك لمنصة stikini — منصة الحجوزات الذكية
                  للصالونات ومحال الحلاقة في الجزائر العاصمة. يرجى قراءة هذه الشروط
                  بعناية قبل استخدام المنصة، فاستخدامك لها يعني موافقتك الكاملة على
                  جميع البنود المذكورة أدناه.
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

          {/* Summary bullets */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.62 }}
            className="mt-10 glass-panel rounded-[26px] p-9"
          >
            <h3 className="text-[18px] font-black text-cream mb-6">
              ملخص الالتزامات الأساسية
            </h3>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
              {[
                'تقديم معلومات صحيحة ودقيقة عند التسجيل.',
                'الحفاظ على سرية بيانات الدخول الخاصة بك.',
                'الالتزام بمواعيد الحجز المؤكدة.',
                'احترام المنصة والمستخدمين الآخرين.',
                'عدم استخدام المنصة لأغراض غير قانونية.',
                'تحديث معلومات الصالون دورياً (لأصحاب الصالونات).',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-1.8 h-1.8 rounded-full bg-emerald-brand/68 mt-2.5 shrink-0" />
                  <p className="text-cream/55 text-[12.5px] leading-[2]">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="mt-10 glass-panel rounded-[26px] p-9"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-7">
              <div>
                <h3 className="text-[19px] font-black text-cream">
                  لديك سؤال حول الشروط؟
                </h3>
                <p className="mt-3 text-cream/52 text-[13.5px] leading-[2]">
                  فريقنا جاهز للتوضيح والإجابة على أي استفسار يتعلق بهذه الشروط.
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
