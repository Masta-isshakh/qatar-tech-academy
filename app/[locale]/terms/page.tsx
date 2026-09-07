import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { markdownToHtml } from '@/lib/markdown'
import { formatDate } from '@/lib/utils'
import { Section } from '@/components/site/section'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return {
    title: t('termsTitle'),
    alternates: { canonical: `/${locale}/terms`, languages: { ar: '/ar/terms', en: '/en/terms' } },
  }
}

const AR = `
## قبول الشروط
باستخدامك لهذا الموقع أو التسجيل في أي من برامجنا، فإنك توافق على هذه الشروط.

## التسجيل والقبول
التسجيل عبر الموقع طلب وليس قبولاً. القبول مشروط باجتياز اختبار القبول وتوفر مقعد في الدفعة. مقاعد كل دفعة محدودة، وتُخصَّص وفق ترتيب الاستحقاق.

## الرسوم والدفع
تُعرض الرسوم بالريال القطري وتشمل مواد التدريب واستخدام المعامل. رسوم اختبارات الشهادات العالمية غير مشمولة إلا إذا نُصَّ على ذلك صراحة في صفحة المسار.

## الإلغاء والاسترداد
- الإلغاء قبل ١٤ يوماً من بداية الدفعة: استرداد كامل.
- الإلغاء بين ٧ و١٤ يوماً: استرداد ٥٠٪.
- الإلغاء بعد بداية الدفعة: لا يوجد استرداد، ويمكن تأجيل مقعدك لدفعة واحدة لاحقة.

## سلوك المتدرب والسلامة
المعامل تحتوي على معدات كهربائية وميكانيكية وطائرات مسيّرة. الالتزام بتعليمات السلامة إلزامي، وللأكاديمية إنهاء مشاركة أي متدرب يعرّض نفسه أو غيره للخطر دون استرداد.

## الاستخدام المشروع
تدريب الأمن السيبراني يجري داخل بيئة معزولة مخصصة لهذا الغرض. أي استخدام للأدوات أو المعارف خارج هذه البيئة ودون تصريح مكتوب من مالك النظام محظور تماماً وقد يعرّضك للمساءلة القانونية.

## الطائرات المسيّرة
جميع عمليات الطيران تجري بترخيص من هيئة الطيران المدني القطري وداخل المناطق المصرّح بها فقط.

## الملكية الفكرية
المواد التدريبية والفيديوهات والتماري ملك للأكاديمية أو للجهات المرخِّصة لها، ولا يجوز إعادة نشرها أو بيعها.

## الشهادات
شهادة الأكاديمية تُمنح بعد استيفاء الحضور والتقييم. الشهادات العالمية تمنحها الجهات المانحة وفق شروطها، والأكاديمية لا تضمن اجتيازك للاختبار.

## حدود المسؤولية
تُقدَّم الخدمة كما هي. لا تتحمل الأكاديمية مسؤولية أي خسارة غير مباشرة، وتقتصر مسؤوليتها في جميع الأحوال على قيمة الرسوم المدفوعة.

## القانون الواجب التطبيق
تخضع هذه الشروط لقوانين دولة قطر، وتختص محاكم الدوحة بأي نزاع.
`

const EN = `
## Acceptance
By using this site or registering for any of our programmes you agree to these terms.

## Registration and admission
Registering through the site is an application, not an admission. Admission depends on passing the entry test and a seat being available. Cohort seats are limited and allocated on merit.

## Fees and payment
Fees are shown in Qatari Riyals and cover training materials and lab use. International certification exam fees are not included unless the track page says otherwise.

## Cancellation and refunds
- Cancelling more than 14 days before the cohort starts: full refund.
- Cancelling 7–14 days before: 50% refund.
- Cancelling after the cohort starts: no refund, but your seat may be deferred once to a later cohort.

## Conduct and safety
The labs contain electrical and mechanical equipment and unmanned aircraft. Following safety instructions is mandatory, and the academy may end the participation of any learner who endangers themselves or others, without refund.

## Lawful use
Cybersecurity training takes place inside an isolated range built for the purpose. Using those tools or techniques outside that environment without the written authorisation of the system owner is strictly prohibited and may expose you to criminal liability.

## Drones
All flights are conducted under Qatar Civil Aviation Authority permits and only in permitted areas.

## Intellectual property
Training materials, videos and exercises belong to the academy or its licensors and may not be republished or resold.

## Certificates
The academy certificate is awarded on meeting attendance and assessment requirements. International certifications are awarded by their bodies under their own rules; we do not guarantee that you will pass.

## Limitation of liability
The service is provided as is. The academy is not liable for indirect loss, and its liability is in all cases limited to the fees you have paid.

## Governing law
These terms are governed by the laws of the State of Qatar, and the courts of Doha have jurisdiction over any dispute.
`

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('legal')
  const html = markdownToHtml(locale === 'ar' ? AR : EN)

  return (
    <Section>
      <article className="prose-qte mx-auto">
        <h1 className="text-3xl md:text-4xl">{t('termsTitle')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('lastUpdated', { date: formatDate(new Date(), locale) })}
        </p>
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t('placeholderNote')}
        </p>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Section>
  )
}
