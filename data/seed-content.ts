/**
 * Bilingual seed content for the academy.
 *
 * This file has two jobs:
 *  1. `scripts/seed.ts` upserts it into the Amplify Data backend.
 *  2. The public pages fall back to it when the backend is not configured yet
 *     (no `amplify_outputs.json`), so the site always renders.
 *
 * Track copy is carried over verbatim from the original product seed
 * (QatarTechEducation/app/src/data/seed.ts) — do not paraphrase it here.
 */

export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type CohortStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'RUNNING' | 'DONE'
export type PartnerKind = 'MANUFACTURER' | 'CERTIFICATION' | 'CORPORATE' | 'UNIVERSITY'

export type SeedModule = {
  titleEn: string
  titleAr: string
  labEn: string
  labAr: string
  hours: number
}

export type SeedCourse = {
  titleEn: string
  titleAr: string
  hours: number
  level: Level
  modules: SeedModule[]
}

export type SeedCert = {
  name: string
  body: string
  examPriceUsd: number
  url?: string
  examOnSite?: boolean
}

export type SeedTrainer = {
  name: string
  titleEn: string
  titleAr: string
  bioEn: string
  bioAr: string
  credentials: string[]
  photoKey: string
  country: string
}

export type SeedCohort = {
  code: string
  startDate: string
  endDate: string
  scheduleEn: string
  scheduleAr: string
  seats: number
  seatsLeft: number
  status: CohortStatus
}

export type SeedTrack = {
  slug: string
  order: number
  titleEn: string
  titleAr: string
  taglineEn: string
  taglineAr: string
  descriptionEn: string
  descriptionAr: string
  accentColor: string
  priceQar: number
  durationWeeks: number
  isComingSoon?: boolean
  examVoucherIncluded: boolean
  heroImageKey: string
  videoKey: string
  videoUrl?: string
  certifications: SeedCert[]
  courses: SeedCourse[]
  trainers: SeedTrainer[]
  cohorts: SeedCohort[]
}

export const HERO_VIDEO_KEY = 'public/videos/hero.mp4'
export const PLAN_VIDEO_KEY = 'public/videos/plan.mp4'

/** Cohort dates are relative to seeding time so the demo data never looks stale. */
function cohortDates(monthsFromNow: number, weeks: number) {
  const start = new Date()
  start.setMonth(start.getMonth() + monthsFromNow, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + weeks * 7)
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
}

function cohortsFor(prefix: string, weeks: number): SeedCohort[] {
  const evening = {
    scheduleEn: 'Sun–Thu 18:00–21:00',
    scheduleAr: 'الأحد – الخميس ٦:٠٠ – ٩:٠٠ مساءً',
  }
  const weekend = {
    scheduleEn: 'Fri–Sat 09:00–15:00',
    scheduleAr: 'الجمعة – السبت ٩:٠٠ صباحاً – ٣:٠٠ مساءً',
  }
  return [
    {
      code: `${prefix}-01`,
      ...cohortDates(1, weeks),
      ...evening,
      seats: 20,
      seatsLeft: 6,
      status: 'OPEN',
    },
    {
      code: `${prefix}-02`,
      ...cohortDates(3, weeks),
      ...weekend,
      seats: 20,
      seatsLeft: 18,
      status: 'OPEN',
    },
    {
      code: `${prefix}-03`,
      ...cohortDates(5, weeks),
      ...evening,
      seats: 20,
      seatsLeft: 20,
      status: 'DRAFT',
    },
  ]
}

export const seedTracks: SeedTrack[] = [
  {
    slug: 'robotics',
    order: 1,
    accentColor: '#8A1538',
    priceQar: 9000,
    durationWeeks: 10,
    examVoucherIncluded: true,
    heroImageKey: '/images/tracks/robotics.jpg',
    videoKey: 'public/videos/robotics.mp4',
    titleEn: 'Robotics & Drones',
    titleAr: 'الروبوتات والدرونز',
    taglineEn: 'Build robots and drones with your own hands, from the first part to flight.',
    taglineAr: 'ابنِ روبوتات ودرونز بيدك… من أول قطعة لين الطيران.',
    descriptionEn:
      'Desktop and industrial cobots, mobile robots, remote-controlled heavy machinery demos, PX4 drone builds, mapping and agricultural drones, and a health-robotics corner (rehabilitation and hospital robots). Trainers certified by Japanese, Korean, Chinese and European manufacturers. Drones are flown under QCAA permits in our netted cage and permitted areas.',
    descriptionAr:
      'أذرع تعاونية مكتبية وصناعية، روبوتات متحركة، معدات ثقيلة تُدار عن بُعد، بناء درونز على PX4، درونز مسح وزراعة، وركن للروبوتات الصحية (تأهيل ومستشفيات). مدربون معتمدون من مصنّعين يابانيين وكوريين وصينيين وأوروبيين. الطيران بترخيص هيئة الطيران المدني داخل قفص شبكي ومناطق مصرّح بها.',
    certifications: [
      {
        name: 'Manufacturer cobot certificates (Doosan / JAKA / Dobot)',
        body: 'Vendor',
        examPriceUsd: 0,
      },
      { name: 'Festo Didactic Mechatronics', body: 'Festo', examPriceUsd: 0 },
      { name: 'Arduino Certification', body: 'Arduino', examPriceUsd: 30 },
      { name: 'QCAA UAS operator permit (guided)', body: 'QCAA', examPriceUsd: 0 },
      { name: 'DJI Enterprise training certificate', body: 'DJI (via dealer)', examPriceUsd: 0 },
    ],
    courses: [
      {
        titleEn: 'Robotics Foundations (hands-on)',
        titleAr: 'أساسيات الروبوتات (عملي)',
        hours: 60,
        level: 'BEGINNER',
        modules: [
          {
            titleEn: 'Electronics & microcontrollers',
            titleAr: 'الإلكترونيات والمتحكمات',
            labEn: 'Build a sensor-driven motor controller',
            labAr: 'بناء متحكم محرك يعمل بالحساسات',
            hours: 12,
          },
          {
            titleEn: 'Desktop 6-axis arm',
            titleAr: 'ذراع مكتبية 6 محاور',
            labEn: 'Assemble and program a pick-and-place routine',
            labAr: 'تركيب الذراع وبرمجة مهمة التقاط ووضع',
            hours: 16,
          },
          {
            titleEn: 'Mobile robots & ROS 2',
            titleAr: 'الروبوتات المتحركة وROS 2',
            labEn: 'Autonomous navigation on a LIMO/quadruped',
            labAr: 'تنقّل ذاتي على روبوت متحرك/رباعي',
            hours: 16,
          },
          {
            titleEn: 'Industrial cell & safety',
            titleAr: 'الخلية الصناعية والسلامة',
            labEn: 'Program a 25 kg cobot behind guarding',
            labAr: 'برمجة ذراع صناعية 25 كغ خلف الحماية',
            hours: 16,
          },
        ],
      },
      {
        titleEn: 'Drone Builder & Pilot',
        titleAr: 'بناء وقيادة الدرونز',
        hours: 50,
        level: 'INTERMEDIATE',
        modules: [
          {
            titleEn: 'Airframe, motors, ESCs, batteries',
            titleAr: 'الهيكل والمحركات والبطاريات',
            labEn: 'Build an X500 quadcopter',
            labAr: 'بناء كوادكوبتر X500',
            hours: 14,
          },
          {
            titleEn: 'Flight controller & PX4 tuning',
            titleAr: 'الفلايت كنترولر وضبط PX4',
            labEn: 'Configure, calibrate, first caged flight',
            labAr: 'إعداد ومعايرة وأول طيران داخل القفص',
            hours: 14,
          },
          {
            titleEn: 'Missions: mapping & inspection',
            titleAr: 'المهام: المسح والفحص',
            labEn: 'Plan and fly a mapping mission (permitted area)',
            labAr: 'تخطيط وتنفيذ مهمة مسح في منطقة مصرّح بها',
            hours: 12,
          },
          {
            titleEn: 'Regulation & permits (QCAA)',
            titleAr: 'الأنظمة والتراخيص',
            labEn: 'Prepare an operator permit file',
            labAr: 'تجهيز ملف ترخيص مشغّل',
            hours: 10,
          },
        ],
      },
    ],
    trainers: [
      {
        name: 'Kenji Tanaka',
        titleEn: 'Lead robotics instructor',
        titleAr: 'المدرب الرئيسي للروبوتات',
        bioEn:
          'Fifteen years commissioning industrial cells in Japan and the Gulf; certified by three cobot manufacturers.',
        bioAr:
          'خمسة عشر عاماً في تشغيل الخلايا الصناعية في اليابان والخليج؛ معتمد من ثلاثة مصنّعين للأذرع التعاونية.',
        credentials: ['Doosan certified', 'JAKA certified', 'ROS 2'],
        photoKey: '/images/team/tanaka.jpg',
        country: 'Japan',
      },
    ],
    cohorts: cohortsFor('ROB', 10),
  },
  {
    slug: 'networking',
    order: 2,
    accentColor: '#1FA2FF',
    priceQar: 3800,
    durationWeeks: 8,
    examVoucherIncluded: false,
    heroImageKey: '/images/tracks/networking.jpg',
    videoKey: 'public/videos/networking.mp4',
    titleEn: 'Networking',
    titleAr: 'الشبكات',
    taglineEn: 'Real racks, Cisco and Huawei gear, your hands on every port.',
    taglineAr: 'راكات حقيقية، أجهزة سيسكو وهواوي… وبيدك كل بورت.',
    descriptionEn:
      'Five racks with Cisco Catalyst/ISR, Huawei CloudEngine, MikroTik and Fortinet devices plus EVE-NG/CML emulation. You cable, configure, break and fix real topologies, then sit CCNA, HCIA Datacom or Network+ in our exam room.',
    descriptionAr:
      'خمس راكات بأجهزة سيسكو وهواوي وميكروتك وفورتينت مع محاكاة EVE-NG/CML. تركّب وتضبط وتعطّل وتصلّح شبكات حقيقية، ثم تختبر CCNA أو HCIA أو Network+ في قاعة الاختبارات عندنا.',
    certifications: [
      { name: 'CCNA 200-301', body: 'Cisco', examPriceUsd: 300 },
      { name: 'HCIA-Datacom', body: 'Huawei', examPriceUsd: 200 },
      { name: 'CompTIA Network+', body: 'CompTIA', examPriceUsd: 369 },
      { name: 'CCNP ENCOR (advanced cohort)', body: 'Cisco', examPriceUsd: 400 },
    ],
    courses: [
      {
        titleEn: 'CCNA + HCIA Practice Lab',
        titleAr: 'معمل CCNA + HCIA العملي',
        hours: 80,
        level: 'BEGINNER',
        modules: [
          {
            titleEn: 'Cabling, VLANs, trunks',
            titleAr: 'الكيبلات وVLAN والترنك',
            labEn: 'Build a 3-switch campus',
            labAr: 'بناء شبكة 3 سويتشات',
            hours: 16,
          },
          {
            titleEn: 'Routing: static, OSPF',
            titleAr: 'التوجيه: ثابت وOSPF',
            labEn: 'Two-site WAN with failover',
            labAr: 'شبكة موقعين مع تبديل تلقائي',
            hours: 20,
          },
          {
            titleEn: 'Security basics, ACLs, NAT, firewall',
            titleAr: 'أساسيات الأمن وACL وNAT',
            labEn: 'Publish a service behind FortiGate',
            labAr: 'نشر خدمة خلف FortiGate',
            hours: 16,
          },
          {
            titleEn: 'Wireless, automation, troubleshooting',
            titleAr: 'اللاسلكي والأتمتة وحل المشاكل',
            labEn: 'Timed fault-fix challenges',
            labAr: 'تحديات إصلاح أعطال بوقت',
            hours: 28,
          },
        ],
      },
    ],
    trainers: [
      {
        name: 'Rajesh Menon',
        titleEn: 'Network lab lead',
        titleAr: 'مسؤول معمل الشبكات',
        bioEn:
          'CCIE-track engineer who has run enterprise and data-centre networks across the GCC for a decade.',
        bioAr: 'مهندس شبكات على مسار CCIE، أدار شبكات مؤسسية ومراكز بيانات في الخليج لعشر سنوات.',
        credentials: ['CCNP Enterprise', 'HCIP-Datacom', 'Fortinet NSE 4'],
        photoKey: '/images/team/rajesh.jpg',
        country: 'India',
      },
    ],
    cohorts: cohortsFor('NET', 8),
  },
  {
    slug: 'cybersecurity',
    order: 3,
    accentColor: '#222222',
    priceQar: 12000,
    durationWeeks: 10,
    examVoucherIncluded: true,
    heroImageKey: '/images/tracks/cybersecurity.jpg',
    videoKey: 'public/videos/cybersecurity.mp4',
    titleEn: 'Cybersecurity',
    titleAr: 'الأمن السيبراني',
    taglineEn: 'Attack and defend legally on real servers, then get certified on site.',
    taglineAr: 'هاجم ودافع بشكل قانوني على سيرفرات حقيقية… واختبر عندنا.',
    descriptionEn:
      'An isolated 20-seat cyber range with real servers, switches and firewalls, Hack The Box Enterprise and TryHackMe labs, EC-Council iLabs, red-vs-blue exercises, and trainers holding CEH, OSCP, CISSP and Security+. Exams for CEH and CompTIA are sat in our Pearson VUE room.',
    descriptionAr:
      'ميدان سيبراني معزول بعشرين مقعداً، سيرفرات وسويتشات وفايروولات حقيقية، معامل Hack The Box وTryHackMe وiLabs، تمارين فريق أحمر/أزرق، ومدربون يحملون CEH وOSCP وCISSP وSecurity+. اختبارات CEH وCompTIA في قاعة Pearson VUE عندنا.',
    certifications: [
      { name: 'CEH v13', body: 'EC-Council', examPriceUsd: 1199 },
      { name: 'CompTIA Security+ SY0-701', body: 'CompTIA', examPriceUsd: 439 },
      { name: 'CompTIA CySA+ / PenTest+', body: 'CompTIA', examPriceUsd: 450 },
      { name: 'OSCP (advanced cohort)', body: 'OffSec', examPriceUsd: 1749, examOnSite: false },
      { name: 'CISSP (professional cohort)', body: 'ISC2', examPriceUsd: 749 },
    ],
    courses: [
      {
        titleEn: 'Ethical Hacking Practice Range',
        titleAr: 'ميدان الاختراق الأخلاقي العملي',
        hours: 80,
        level: 'INTERMEDIATE',
        modules: [
          {
            titleEn: 'Recon & scanning',
            titleAr: 'الاستكشاف والفحص',
            labEn: 'Map a live lab network',
            labAr: 'رسم خريطة شبكة معمل حقيقية',
            hours: 12,
          },
          {
            titleEn: 'Exploitation & privilege escalation',
            titleAr: 'الاستغلال ورفع الصلاحيات',
            labEn: 'Capture flags on 10 range machines',
            labAr: 'التقاط أعلام على 10 أجهزة',
            hours: 24,
          },
          {
            titleEn: 'Defence: SIEM, firewall, hardening',
            titleAr: 'الدفاع: SIEM وفايروول وتحصين',
            labEn: 'Blue-team a live attack',
            labAr: 'الدفاع في هجمة حية',
            hours: 24,
          },
          {
            titleEn: 'Reporting & exam prep',
            titleAr: 'التقارير والتحضير للاختبار',
            labEn: 'Write a pentest report; mock exam',
            labAr: 'كتابة تقرير اختراق واختبار تجريبي',
            hours: 20,
          },
        ],
      },
    ],
    trainers: [
      {
        name: 'Layla Al-Kuwari',
        titleEn: 'Cyber range lead',
        titleAr: 'مسؤولة الميدان السيبراني',
        bioEn:
          'Offensive security specialist and blue-team lead; runs red-vs-blue exercises for regional enterprises.',
        bioAr:
          'متخصصة في الأمن الهجومي وقائدة فريق أزرق؛ تدير تمارين أحمر/أزرق لمؤسسات في المنطقة.',
        credentials: ['CEH', 'OSCP', 'CompTIA Security+'],
        photoKey: '/images/team/layla.jpg',
        country: 'Qatar',
      },
    ],
    cohorts: cohortsFor('CYB', 10),
  },
  {
    slug: 'ai',
    order: 4,
    accentColor: '#0F7B6C',
    priceQar: 9000,
    durationWeeks: 10,
    examVoucherIncluded: true,
    heroImageKey: '/images/tracks/ai.jpg',
    videoKey: 'public/videos/ai.mp4',
    titleEn: 'Artificial Intelligence',
    titleAr: 'الذكاء الاصطناعي',
    taglineEn: 'Python, real data and GPUs in front of you. No lectures, code.',
    taglineAr: 'بايثون وبيانات حقيقية وكروت GPU قدّامك… مب محاضرات، كود.',
    descriptionEn:
      'From Python to machine learning, deep learning, LLM apps (Arabic RAG assistants) and edge AI on NVIDIA Jetson. RTX 5090 workstations, a shared RTX PRO 6000 server and DGX Spark. NVIDIA DLI workshops, Huawei HCIA-AI and AWS ML credentials.',
    descriptionAr:
      'من بايثون إلى تعلم الآلة والتعلم العميق وتطبيقات النماذج اللغوية (مساعدات عربية RAG) والذكاء الاصطناعي الطرفي على NVIDIA Jetson. محطات RTX 5090 وسيرفر RTX PRO 6000 وDGX Spark. ورش NVIDIA DLI وشهادات HCIA-AI وAWS.',
    certifications: [
      { name: 'NVIDIA DLI certificates', body: 'NVIDIA', examPriceUsd: 0 },
      { name: 'HCIA-AI', body: 'Huawei', examPriceUsd: 200 },
      {
        name: 'AWS Certified Machine Learning Engineer – Associate',
        body: 'AWS',
        examPriceUsd: 150,
      },
    ],
    courses: [
      {
        titleEn: 'Practical AI Engineer',
        titleAr: 'مهندس ذكاء اصطناعي عملي',
        hours: 80,
        level: 'BEGINNER',
        modules: [
          {
            titleEn: 'Python & data',
            titleAr: 'بايثون والبيانات',
            labEn: 'Clean and explore a Qatar open dataset',
            labAr: 'تنظيف وتحليل بيانات قطرية مفتوحة',
            hours: 16,
          },
          {
            titleEn: 'Classical ML',
            titleAr: 'تعلم الآلة الكلاسيكي',
            labEn: 'Train and evaluate 5 models',
            labAr: 'تدريب وتقييم 5 نماذج',
            hours: 16,
          },
          {
            titleEn: 'Deep learning on GPUs',
            titleAr: 'التعلم العميق على GPU',
            labEn: 'Train a vision model on the lab server',
            labAr: 'تدريب نموذج رؤية على سيرفر المعمل',
            hours: 20,
          },
          {
            titleEn: 'LLM apps & deployment',
            titleAr: 'تطبيقات النماذج اللغوية والنشر',
            labEn: 'Ship an Arabic RAG assistant + Jetson demo',
            labAr: 'نشر مساعد عربي RAG وعرض على Jetson',
            hours: 28,
          },
        ],
      },
    ],
    trainers: [],
    cohorts: cohortsFor('AI', 10),
  },
  {
    slug: 'marketing',
    order: 5,
    accentColor: '#C77B00',
    priceQar: 6000,
    durationWeeks: 6,
    examVoucherIncluded: false,
    heroImageKey: '/images/tracks/marketing.jpg',
    videoKey: 'public/videos/marketing.mp4',
    titleEn: 'Marketing & Software',
    titleAr: 'التسويق والبرمجة',
    taglineEn: 'Build a mobile app, then market it with WhatsApp, Meta and AI content.',
    taglineAr: 'ابنِ تطبيق جوال… وسوّق له بواتساب وميتا ومحتوى الذكاء الاصطناعي.',
    descriptionEn:
      'Expo + AWS Amplify app development with push notifications, WhatsApp Business API campaigns (opt-in, templates, lead capture from ads), Meta/Google/Snapchat ads, AI-generated video and creative. Taught by people who run real campaigns every day.',
    descriptionAr:
      'تطوير تطبيقات بـ Expo وAWS Amplify مع الإشعارات، حملات واتساب بزنس API (الموافقة، القوالب، جمع العملاء من الإعلانات)، إعلانات ميتا وقوقل وسناب، وفيديو ومحتوى بالذكاء الاصطناعي. يدرّسه ناس يديرون حملات حقيقية كل يوم.',
    certifications: [
      { name: 'Meta Certified Digital Marketing Associate', body: 'Meta', examPriceUsd: 99 },
      { name: 'Google Ads Search / Analytics', body: 'Google', examPriceUsd: 0 },
      { name: 'AWS Certified Cloud Practitioner', body: 'AWS', examPriceUsd: 100 },
    ],
    courses: [
      {
        titleEn: 'App + Growth Bootcamp',
        titleAr: 'معسكر التطبيق والنمو',
        hours: 60,
        level: 'BEGINNER',
        modules: [
          {
            titleEn: 'Build the app (Expo + Amplify)',
            titleAr: 'بناء التطبيق',
            labEn: 'Ship a working app with login and notifications',
            labAr: 'إطلاق تطبيق يعمل بتسجيل دخول وإشعارات',
            hours: 24,
          },
          {
            titleEn: 'WhatsApp Business API',
            titleAr: 'واتساب بزنس API',
            labEn: 'Approved template + opt-in campaign',
            labAr: 'قالب معتمد وحملة بموافقة',
            hours: 12,
          },
          {
            titleEn: 'Meta & Google ads',
            titleAr: 'إعلانات ميتا وقوقل',
            labEn: 'Run a QAR 500 live campaign and read the numbers',
            labAr: 'تشغيل حملة حقيقية بـ 500 ريال وتحليل النتائج',
            hours: 12,
          },
          {
            titleEn: 'AI content',
            titleAr: 'محتوى الذكاء الاصطناعي',
            labEn: 'Produce a 30-second ad with Flow/Veo + Arabic voiceover',
            labAr: 'إنتاج إعلان 30 ثانية بـ Flow/Veo وتعليق صوتي عربي',
            hours: 12,
          },
        ],
      },
    ],
    trainers: [],
    cohorts: cohortsFor('MKT', 6),
  },
  {
    slug: 'coming-soon',
    order: 6,
    accentColor: '#6B6B6B',
    priceQar: 0,
    durationWeeks: 0,
    isComingSoon: true,
    examVoucherIncluded: false,
    heroImageKey: '/images/tracks/coming-soon.jpg',
    videoKey: '',
    titleEn: 'Coming soon',
    titleAr: 'قريباً',
    taglineEn: 'Cloud, IoT, 3D printing, game development… and many more.',
    taglineAr:
      'الحوسبة السحابية، إنترنت الأشياء، الطباعة ثلاثية الأبعاد، تطوير الألعاب… ووايد غيرها.',
    descriptionEn: 'Tell us what you want to learn next.',
    descriptionAr: 'قول لنا شنو تبي تتعلم بعدين.',
    certifications: [],
    courses: [],
    trainers: [],
    cohorts: [],
  },
]

export const seedTestimonials = [
  {
    name: 'Abdulla Al-Marri',
    roleEn: 'Computer engineering graduate, Qatar University',
    roleAr: 'خريج هندسة حاسب، جامعة قطر',
    quoteEn:
      'I had written code for four years and never touched a robot. In the first week I had a cobot doing pick-and-place that I programmed myself.',
    quoteAr:
      'كتبت كود أربع سنوات وما لمست روبوت. في أول أسبوع كان عندي ذراع تعاونية تسوي التقاط ووضع ببرمجتي أنا.',
    photoKey: '',
    isPublished: true,
  },
  {
    name: 'Noora Al-Sulaiti',
    roleEn: 'Network engineer, government entity',
    roleAr: 'مهندسة شبكات، جهة حكومية',
    quoteEn:
      'The racks are the difference. I broke a topology on purpose and had to fix it under time pressure — that is what the job actually feels like.',
    quoteAr:
      'الراكات هي الفرق. عطّلت الشبكة بقصد واضطريت أصلّحها تحت ضغط الوقت — هذا بالضبط إحساس الشغل الحقيقي.',
    photoKey: '',
    isPublished: true,
  },
  {
    name: 'Mohammed Al-Hajri',
    roleEn: 'Security analyst, banking sector',
    roleAr: 'محلل أمن سيبراني، القطاع المصرفي',
    quoteEn:
      'Sitting CEH in the same room I trained in removed the whole travel and logistics problem. I passed first time.',
    quoteAr: 'اختبرت CEH في نفس القاعة اللي تدربت فيها، فما في سفر ولا تعقيد. ونجحت من أول مرة.',
    photoKey: '',
    isPublished: true,
  },
]

export const seedPartners: { name: string; kind: PartnerKind; url?: string }[] = [
  { name: 'Doosan Robotics', kind: 'MANUFACTURER' },
  { name: 'JAKA Robotics', kind: 'MANUFACTURER' },
  { name: 'Dobot', kind: 'MANUFACTURER' },
  { name: 'Elephant Robotics', kind: 'MANUFACTURER' },
  { name: 'Unitree', kind: 'MANUFACTURER' },
  { name: 'DEEP Robotics', kind: 'MANUFACTURER' },
  { name: 'AgileX', kind: 'MANUFACTURER' },
  { name: 'Brokk', kind: 'MANUFACTURER' },
  { name: 'Festo Didactic', kind: 'MANUFACTURER' },
  { name: 'Holybro', kind: 'MANUFACTURER' },
  { name: 'CUAV', kind: 'MANUFACTURER' },
  { name: 'Terra Drone', kind: 'MANUFACTURER' },
  { name: 'XAG', kind: 'MANUFACTURER' },
  { name: 'Fourier Rehab', kind: 'MANUFACTURER' },
  { name: 'Koenig Solutions', kind: 'CERTIFICATION' },
  { name: 'EC-Council', kind: 'CERTIFICATION' },
  { name: 'CompTIA', kind: 'CERTIFICATION' },
  { name: 'Cisco', kind: 'CERTIFICATION' },
  { name: 'Huawei', kind: 'CERTIFICATION' },
  { name: 'NVIDIA DLI', kind: 'CERTIFICATION' },
  { name: 'Meta Blueprint', kind: 'CERTIFICATION' },
  { name: 'Pearson VUE', kind: 'CERTIFICATION' },
]

/** Ten entry-test slots: two per weekday, starting next Sunday. */
export function seedTestSlots() {
  const slots: { start: string; end: string; capacity: number; booked: number }[] = []
  const first = new Date()
  first.setDate(first.getDate() + ((7 - first.getDay()) % 7 || 7)) // next Sunday
  first.setHours(0, 0, 0, 0)
  for (let day = 0; day < 5; day++) {
    for (const hour of [10, 17]) {
      const start = new Date(first)
      start.setDate(start.getDate() + day)
      start.setHours(hour, 0, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + 45)
      slots.push({ start: start.toISOString(), end: end.toISOString(), capacity: 12, booked: 0 })
    }
  }
  return slots
}

/** Volume tiers used by the corporate ROI calculator and by the admin quote sheet. */
export const CORPORATE_DISCOUNT_TIERS = [
  { minSeats: 10, discount: 0.1 },
  { minSeats: 20, discount: 0.15 },
  { minSeats: 40, discount: 0.2 },
  { minSeats: 80, discount: 0.25 },
] as const

export function corporateDiscountFor(seats: number) {
  return CORPORATE_DISCOUNT_TIERS.reduce(
    (acc, tier) => (seats >= tier.minSeats ? tier.discount : acc),
    0
  )
}

/** Lab gallery — images 1–7 referenced in section 8 of the brief. */
export const LAB_GALLERY = [
  { src: '/images/sections/workshop.jpg', span: 'tall' },
  { src: '/images/tracks/robotics.jpg', span: 'wide' },
  { src: '/images/tracks/networking.jpg', span: 'normal' },
  { src: '/images/tracks/cybersecurity.jpg', span: 'normal' },
  { src: '/images/tracks/ai.jpg', span: 'tall' },
  { src: '/images/sections/health-robotics.jpg', span: 'normal' },
  { src: '/images/sections/exam-centre.jpg', span: 'wide' },
] as const
