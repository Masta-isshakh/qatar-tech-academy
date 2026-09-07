import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { markdownToHtml } from '@/lib/markdown'
import { site } from '@/lib/site'
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
    title: t('privacyTitle'),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { ar: '/ar/privacy', en: '/en/privacy' },
    },
  }
}

const AR = `
## من نحن
أكاديمية قطر للتقنية ("الأكاديمية"، "نحن") مؤسسة تدريب تقني في الدوحة، دولة قطر. هذا الإشعار يوضح كيف نجمع بياناتك الشخصية ونستخدمها ونحميها، وفقاً للقانون رقم (١٣) لسنة ٢٠١٦ بشأن حماية خصوصية البيانات الشخصية.

## البيانات التي نجمعها
- **بيانات التسجيل**: الاسم، رقم الجوال، البريد الإلكتروني، المهنة، الجامعة أو جهة العمل، والرقم الشخصي إذا اخترت تزويدنا به.
- **بيانات الاهتمام**: الاسم ورقم الجوال والجهة والرسالة عند تعبئة نماذج التواصل.
- **بيانات الاستخدام**: صفحات الموقع التي تزورها، وذلك فقط بعد موافقتك على ملفات تعريف الارتباط التحليلية.

## لماذا نستخدمها
لمعالجة طلب تسجيلك، وتحديد موعد اختبار القبول، والتواصل معك عبر الواتساب أو الهاتف أو البريد الإلكتروني بخصوص دفعتك، ولإصدار شهاداتك، وللالتزام بمتطلبات الجهات المانحة للشهادات.

## الأساس القانوني
نعالج بياناتك بناءً على موافقتك الصريحة عند التسجيل، وبما هو ضروري لتنفيذ العلاقة التعاقدية بيننا.

## من نشاركها معه
- الجهات المانحة للشهادات (مثل Pearson VUE وEC-Council وCompTIA وCisco) عند تسجيلك في اختبار.
- مزوّدو الخدمات التقنية الذين يشغّلون بنيتنا (Amazon Web Services) ومنصات التواصل (Meta WhatsApp Business).
لا نبيع بياناتك الشخصية لأي طرف.

## نقل البيانات خارج قطر
تُخزَّن بياناتك على بنية Amazon Web Services. قد يتم النقل أو المعالجة خارج دولة قطر بضمانات تعاقدية مناسبة.

## مدة الاحتفاظ
نحتفظ ببيانات التسجيل مدة خمس سنوات من آخر تفاعل، وببيانات الاهتمام مدة سنتين، ثم تُحذف أو تُجهَّل.

## حقوقك
لك الحق في الوصول إلى بياناتك وتصحيحها ومحوها وسحب موافقتك في أي وقت. للممارسة، راسلنا على البريد الإلكتروني أدناه وسنرد خلال ثلاثين يوماً.

## الأمن
نستخدم التشفير أثناء النقل وأثناء التخزين، وضوابط وصول قائمة على الأدوار، ولا يطّلع على بياناتك إلا الموظفون الذين يحتاجونها لعملهم.

## ملفات تعريف الارتباط
نستخدم ملفات ضرورية لتشغيل الموقع، وملفات تحليلية لا تُحمَّل إلا بعد موافقتك من الشريط الظاهر عند أول زيارة. تقدر تغيّر رأيك بمسح بيانات الموقع من متصفحك.

## التواصل
لأي استفسار أو شكوى بخصوص الخصوصية، راسلنا على البريد المذكور في صفحة التواصل.
`

const EN = `
## Who we are
Qatar Tech Education ("the academy", "we") is a technology training institution in Doha, State of Qatar. This notice explains how we collect, use and protect your personal data under Law No. 13 of 2016 on the Protection of Personal Data Privacy.

## What we collect
- **Registration data**: name, mobile number, e-mail, occupation, university or employer, and your Qatar ID if you choose to give it.
- **Enquiry data**: name, mobile number, organisation and message when you fill in a contact form.
- **Usage data**: which pages you visit — collected only after you accept analytics cookies.

## Why we use it
To process your registration, schedule your entry test, contact you by WhatsApp, phone or e-mail about your cohort, issue your certificates, and meet the requirements of the certification bodies.

## Legal basis
We process your data on the basis of the consent you give at registration, and as necessary to perform our agreement with you.

## Who we share it with
- Certification bodies (such as Pearson VUE, EC-Council, CompTIA and Cisco) when you are entered for an exam.
- Technology providers running our infrastructure (Amazon Web Services) and messaging (Meta WhatsApp Business).
We do not sell your personal data.

## Transfers outside Qatar
Your data is stored on Amazon Web Services infrastructure and may be transferred or processed outside Qatar under appropriate contractual safeguards.

## How long we keep it
Registration data is kept for five years from your last interaction; enquiry data for two years. After that it is deleted or anonymised.

## Your rights
You may access, correct or erase your data and withdraw consent at any time. Write to the address on the contact page and we will respond within thirty days.

## Security
Data is encrypted in transit and at rest, access is role-based, and only staff who need your data for their work can see it.

## Cookies
Essential cookies keep the site working. Analytics cookies load only after you accept them in the banner shown on your first visit; clearing your site data resets that choice.

## Contact
For any privacy question or complaint, write to the address on the contact page.
`

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('legal')
  const html = markdownToHtml(locale === 'ar' ? AR : EN)

  return (
    <Section>
      <article className="prose-qte mx-auto">
        <h1 className="text-3xl md:text-4xl">{t('privacyTitle')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('lastUpdated', { date: formatDate(new Date(), locale) })} · {site.email}
        </p>
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t('placeholderNote')}
        </p>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Section>
  )
}
