/**
 * Field specifications for the generic admin CRUD screens.
 *
 * One spec per model keeps the editor, the table columns and the CSV export in
 * step, instead of nine near-identical bespoke screens.
 */

export type FieldKind = 'text' | 'longtext' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'list'

export type FieldSpec = {
  name: string
  labelEn: string
  labelAr: string
  kind: FieldKind
  options?: readonly string[]
  required?: boolean
  /** Shown in the list table (in this order). */
  inTable?: boolean
  hint?: string
}

export type ModelSpec = {
  /** Must match a model name in `amplify/data/resource.ts`. */
  model: string
  labelEn: string
  labelAr: string
  fields: FieldSpec[]
  /** Enables drag-and-drop and the up/down buttons. */
  orderField?: string
  /** Parent id field, so children can be filtered in the UI. */
  parentField?: string
}

const bilingual = (base: string, en: string, ar: string, kind: FieldKind = 'text'): FieldSpec[] => [
  { name: `${base}En`, labelEn: `${en} (EN)`, labelAr: `${ar} (إنجليزي)`, kind, inTable: true },
  { name: `${base}Ar`, labelEn: `${en} (AR)`, labelAr: `${ar} (عربي)`, kind, inTable: true },
]

export const MODEL_SPECS: ModelSpec[] = [
  {
    model: 'Track',
    labelEn: 'Tracks',
    labelAr: 'المسارات',
    orderField: 'order',
    fields: [
      { name: 'slug', labelEn: 'Slug', labelAr: 'المعرّف', kind: 'text', required: true, inTable: true },
      ...bilingual('title', 'Title', 'العنوان'),
      ...bilingual('tagline', 'Tagline', 'الوصف المختصر'),
      ...bilingual('description', 'Description', 'الوصف', 'longtext'),
      { name: 'priceQar', labelEn: 'Price (QAR)', labelAr: 'السعر (ريال)', kind: 'number', inTable: true },
      { name: 'durationWeeks', labelEn: 'Weeks', labelAr: 'الأسابيع', kind: 'number', inTable: true },
      { name: 'accentColor', labelEn: 'Accent colour', labelAr: 'اللون', kind: 'text' },
      { name: 'heroImageKey', labelEn: 'Hero image', labelAr: 'صورة الغلاف', kind: 'text' },
      { name: 'videoKey', labelEn: 'Video key', labelAr: 'مفتاح الفيديو', kind: 'text' },
      { name: 'examVoucherIncluded', labelEn: 'Voucher included', labelAr: 'قسيمة الاختبار مشمولة', kind: 'boolean' },
      { name: 'isComingSoon', labelEn: 'Coming soon', labelAr: 'قريباً', kind: 'boolean' },
      { name: 'isPublished', labelEn: 'Published', labelAr: 'منشور', kind: 'boolean', inTable: true },
      { name: 'order', labelEn: 'Order', labelAr: 'الترتيب', kind: 'number' },
    ],
  },
  {
    model: 'Course',
    labelEn: 'Courses',
    labelAr: 'المقررات',
    orderField: 'order',
    parentField: 'trackId',
    fields: [
      { name: 'trackId', labelEn: 'Track ID', labelAr: 'معرّف المسار', kind: 'text', required: true },
      ...bilingual('title', 'Title', 'العنوان'),
      { name: 'hours', labelEn: 'Hours', labelAr: 'الساعات', kind: 'number', inTable: true },
      {
        name: 'level',
        labelEn: 'Level',
        labelAr: 'المستوى',
        kind: 'enum',
        options: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        inTable: true,
      },
      { name: 'order', labelEn: 'Order', labelAr: 'الترتيب', kind: 'number' },
    ],
  },
  {
    model: 'Module',
    labelEn: 'Modules',
    labelAr: 'الوحدات',
    orderField: 'order',
    parentField: 'courseId',
    fields: [
      { name: 'courseId', labelEn: 'Course ID', labelAr: 'معرّف المقرر', kind: 'text', required: true },
      ...bilingual('title', 'Title', 'العنوان'),
      ...bilingual('lab', 'Lab', 'المعمل', 'longtext'),
      { name: 'hours', labelEn: 'Hours', labelAr: 'الساعات', kind: 'number', inTable: true },
      { name: 'order', labelEn: 'Order', labelAr: 'الترتيب', kind: 'number' },
    ],
  },
  {
    model: 'Lesson',
    labelEn: 'Lessons',
    labelAr: 'الدروس',
    orderField: 'order',
    parentField: 'trackId',
    fields: [
      { name: 'trackId', labelEn: 'Track ID', labelAr: 'معرّف المسار', kind: 'text' },
      { name: 'moduleId', labelEn: 'Module ID', labelAr: 'معرّف الوحدة', kind: 'text' },
      ...bilingual('title', 'Title', 'العنوان'),
      {
        name: 'videoKey',
        labelEn: 'Video key',
        labelAr: 'مفتاح الفيديو',
        kind: 'text',
        hint: 'protected/lessons/… for cohort-only video',
      },
      { name: 'durationSeconds', labelEn: 'Duration (s)', labelAr: 'المدة (ثانية)', kind: 'number' },
      { name: 'isPublic', labelEn: 'Public', labelAr: 'عام', kind: 'boolean', inTable: true },
      { name: 'order', labelEn: 'Order', labelAr: 'الترتيب', kind: 'number' },
    ],
  },
  {
    model: 'Cohort',
    labelEn: 'Cohorts',
    labelAr: 'الدفعات',
    parentField: 'trackId',
    fields: [
      { name: 'trackId', labelEn: 'Track ID', labelAr: 'معرّف المسار', kind: 'text', required: true },
      { name: 'code', labelEn: 'Code', labelAr: 'الرمز', kind: 'text', required: true, inTable: true },
      { name: 'startDate', labelEn: 'Start', labelAr: 'البداية', kind: 'date', inTable: true },
      { name: 'endDate', labelEn: 'End', labelAr: 'النهاية', kind: 'date' },
      ...bilingual('schedule', 'Schedule', 'المواعيد'),
      { name: 'seats', labelEn: 'Seats', labelAr: 'المقاعد', kind: 'number', inTable: true },
      { name: 'seatsLeft', labelEn: 'Seats left', labelAr: 'المتبقي', kind: 'number', inTable: true },
      { name: 'priceQar', labelEn: 'Price (QAR)', labelAr: 'السعر', kind: 'number' },
      {
        name: 'status',
        labelEn: 'Status',
        labelAr: 'الحالة',
        kind: 'enum',
        options: ['DRAFT', 'OPEN', 'FULL', 'RUNNING', 'DONE'],
        inTable: true,
      },
    ],
  },
  {
    model: 'TestSlot',
    labelEn: 'Test slots',
    labelAr: 'مواعيد الاختبار',
    fields: [
      { name: 'start', labelEn: 'Start', labelAr: 'البداية', kind: 'datetime', required: true, inTable: true },
      { name: 'end', labelEn: 'End', labelAr: 'النهاية', kind: 'datetime' },
      { name: 'room', labelEn: 'Room', labelAr: 'القاعة', kind: 'text', inTable: true },
      { name: 'capacity', labelEn: 'Capacity', labelAr: 'السعة', kind: 'number', inTable: true },
      { name: 'booked', labelEn: 'Booked', labelAr: 'المحجوز', kind: 'number', inTable: true },
      { name: 'isOpen', labelEn: 'Open', labelAr: 'مفتوح', kind: 'boolean', inTable: true },
    ],
  },
  {
    model: 'Trainer',
    labelEn: 'Trainers',
    labelAr: 'المدربون',
    parentField: 'trackId',
    fields: [
      { name: 'trackId', labelEn: 'Track ID', labelAr: 'معرّف المسار', kind: 'text' },
      { name: 'name', labelEn: 'Name', labelAr: 'الاسم', kind: 'text', required: true, inTable: true },
      ...bilingual('title', 'Title', 'المسمى'),
      ...bilingual('bio', 'Bio', 'نبذة', 'longtext'),
      { name: 'credentials', labelEn: 'Credentials', labelAr: 'الشهادات', kind: 'list' },
      { name: 'photoKey', labelEn: 'Photo', labelAr: 'الصورة', kind: 'text' },
      { name: 'country', labelEn: 'Country', labelAr: 'الدولة', kind: 'text', inTable: true },
    ],
  },
  {
    model: 'Certification',
    labelEn: 'Certifications',
    labelAr: 'الشهادات',
    parentField: 'trackId',
    fields: [
      { name: 'trackId', labelEn: 'Track ID', labelAr: 'معرّف المسار', kind: 'text', required: true },
      { name: 'name', labelEn: 'Name', labelAr: 'الاسم', kind: 'text', required: true, inTable: true },
      { name: 'body', labelEn: 'Body', labelAr: 'الجهة', kind: 'text', inTable: true },
      { name: 'examPriceUsd', labelEn: 'Exam price (USD)', labelAr: 'سعر الاختبار', kind: 'number', inTable: true },
      { name: 'url', labelEn: 'URL', labelAr: 'الرابط', kind: 'text' },
      { name: 'examOnSite', labelEn: 'On site', labelAr: 'في مقرنا', kind: 'boolean', inTable: true },
    ],
  },
  {
    model: 'Testimonial',
    labelEn: 'Testimonials',
    labelAr: 'الشهادات الشخصية',
    fields: [
      { name: 'name', labelEn: 'Name', labelAr: 'الاسم', kind: 'text', required: true, inTable: true },
      ...bilingual('role', 'Role', 'الصفة'),
      ...bilingual('quote', 'Quote', 'الاقتباس', 'longtext'),
      { name: 'photoKey', labelEn: 'Photo', labelAr: 'الصورة', kind: 'text' },
      { name: 'isPublished', labelEn: 'Published', labelAr: 'منشور', kind: 'boolean', inTable: true },
    ],
  },
  {
    model: 'Partner',
    labelEn: 'Partners',
    labelAr: 'الشركاء',
    fields: [
      { name: 'name', labelEn: 'Name', labelAr: 'الاسم', kind: 'text', required: true, inTable: true },
      { name: 'logoKey', labelEn: 'Logo', labelAr: 'الشعار', kind: 'text' },
      {
        name: 'kind',
        labelEn: 'Kind',
        labelAr: 'النوع',
        kind: 'enum',
        options: ['MANUFACTURER', 'CERTIFICATION', 'CORPORATE', 'UNIVERSITY'],
        inTable: true,
      },
      {
        name: 'status',
        labelEn: 'Status',
        labelAr: 'الحالة',
        kind: 'enum',
        options: ['IN_DISCUSSION', 'SIGNED'],
        inTable: true,
      },
      { name: 'url', labelEn: 'URL', labelAr: 'الرابط', kind: 'text' },
    ],
  },
  {
    model: 'Post',
    labelEn: 'News posts',
    labelAr: 'الأخبار',
    fields: [
      { name: 'slug', labelEn: 'Slug', labelAr: 'المعرّف', kind: 'text', required: true, inTable: true },
      ...bilingual('title', 'Title', 'العنوان'),
      ...bilingual('excerpt', 'Excerpt', 'المقتطف', 'longtext'),
      ...bilingual('body', 'Body (Markdown)', 'النص (ماركداون)', 'longtext'),
      { name: 'coverKey', labelEn: 'Cover image', labelAr: 'صورة الغلاف', kind: 'text' },
      { name: 'publishedAt', labelEn: 'Published at', labelAr: 'تاريخ النشر', kind: 'datetime', inTable: true },
      { name: 'isPublished', labelEn: 'Published', labelAr: 'منشور', kind: 'boolean', inTable: true },
    ],
  },
  {
    model: 'Announcement',
    labelEn: 'Announcements',
    labelAr: 'الإعلانات',
    fields: [
      ...bilingual('title', 'Title', 'العنوان'),
      ...bilingual('body', 'Body', 'النص', 'longtext'),
      { name: 'publishedAt', labelEn: 'Published at', labelAr: 'تاريخ النشر', kind: 'datetime', inTable: true },
      { name: 'isPublished', labelEn: 'Published', labelAr: 'منشور', kind: 'boolean', inTable: true },
    ],
  },
  {
    model: 'VideoAsset',
    labelEn: 'Video assets',
    labelAr: 'ملفات الفيديو',
    fields: [
      { name: 'title', labelEn: 'Title', labelAr: 'العنوان', kind: 'text', required: true, inTable: true },
      { name: 's3Key', labelEn: 'S3 key', labelAr: 'مفتاح S3', kind: 'text', required: true, inTable: true },
      {
        name: 'purpose',
        labelEn: 'Purpose',
        labelAr: 'الغرض',
        kind: 'enum',
        options: ['HERO', 'TRACK', 'LESSON', 'TESTIMONIAL'],
        inTable: true,
      },
      { name: 'trackSlug', labelEn: 'Track slug', labelAr: 'معرّف المسار', kind: 'text' },
      { name: 'durationSeconds', labelEn: 'Duration (s)', labelAr: 'المدة', kind: 'number' },
    ],
  },
]

export const REGISTRATION_STATUSES = [
  'APPLIED',
  'TEST_SCHEDULED',
  'TESTED',
  'SELECTED',
  'WAITLIST',
  'REJECTED',
  'ENROLLED',
] as const

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'ENROLLED', 'CLOSED'] as const
