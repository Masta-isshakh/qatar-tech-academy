import { a, defineData, type ClientSchema } from '@aws-amplify/backend'
import { notifyLead } from '../functions/notify-lead/resource'
import { bookTestSlot } from '../functions/book-test-slot/resource'
import { notifyCorporate } from '../functions/notify-corporate/resource'
import { myPortal } from '../functions/my-portal/resource'

/** Must match the Cognito group declared in `amplify/auth/resource.ts`. */
const ADMIN_GROUP = 'Admins'

/**
 * Anyone may read; only Admins may write. Used for every public content model.
 * `allow` is untyped here because the builder type is model-specific; the rules
 * themselves are checked by `ampx sandbox` at synth time.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const publicReadAdminWrite = (allow: any) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.group(ADMIN_GROUP),
]
/* eslint-enable @typescript-eslint/no-explicit-any */

const schema = a
  .schema({
    // ---------------------------------------------------------------- content
    Track: a
      .model({
        slug: a.string().required(),
        order: a.integer().default(0),
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        taglineEn: a.string(),
        taglineAr: a.string(),
        descriptionEn: a.string(),
        descriptionAr: a.string(),
        heroImageKey: a.string(),
        videoKey: a.string(),
        videoUrl: a.string(),
        accentColor: a.string(),
        priceQar: a.integer(),
        durationWeeks: a.integer(),
        examVoucherIncluded: a.boolean().default(false),
        isComingSoon: a.boolean().default(false),
        isPublished: a.boolean().default(true),
        courses: a.hasMany('Course', 'trackId'),
        certifications: a.hasMany('Certification', 'trackId'),
        trainers: a.hasMany('Trainer', 'trackId'),
        cohorts: a.hasMany('Cohort', 'trackId'),
        leads: a.hasMany('Lead', 'trackId'),
        registrations: a.hasMany('Registration', 'trackId'),
        enrollments: a.hasMany('Enrollment', 'trackId'),
        lessons: a.hasMany('Lesson', 'trackId'),
      })
      .secondaryIndexes((index) => [index('slug')])
      .authorization(publicReadAdminWrite),

    Course: a
      .model({
        trackId: a.id().required(),
        track: a.belongsTo('Track', 'trackId'),
        order: a.integer().default(0),
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        hours: a.integer(),
        level: a.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
        modules: a.hasMany('Module', 'courseId'),
      })
      .authorization(publicReadAdminWrite),

    Module: a
      .model({
        courseId: a.id().required(),
        course: a.belongsTo('Course', 'courseId'),
        order: a.integer().default(0),
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        labEn: a.string(),
        labAr: a.string(),
        hours: a.integer(),
        lessons: a.hasMany('Lesson', 'moduleId'),
      })
      .authorization(publicReadAdminWrite),

    Certification: a
      .model({
        trackId: a.id().required(),
        track: a.belongsTo('Track', 'trackId'),
        name: a.string().required(),
        body: a.string(),
        examPriceUsd: a.float(),
        url: a.string(),
        examOnSite: a.boolean().default(true),
      })
      .authorization(publicReadAdminWrite),

    Trainer: a
      .model({
        trackId: a.id(),
        track: a.belongsTo('Track', 'trackId'),
        name: a.string().required(),
        titleEn: a.string(),
        titleAr: a.string(),
        bioEn: a.string(),
        bioAr: a.string(),
        credentials: a.string().array(),
        photoKey: a.string(),
        country: a.string(),
      })
      .authorization(publicReadAdminWrite),

    Cohort: a
      .model({
        trackId: a.id().required(),
        track: a.belongsTo('Track', 'trackId'),
        code: a.string().required(),
        startDate: a.date(),
        endDate: a.date(),
        scheduleEn: a.string(),
        scheduleAr: a.string(),
        seats: a.integer().default(20),
        seatsLeft: a.integer().default(20),
        priceQar: a.integer(),
        status: a.enum(['DRAFT', 'OPEN', 'FULL', 'RUNNING', 'DONE']),
        enrollments: a.hasMany('Enrollment', 'cohortId'),
      })
      .authorization(publicReadAdminWrite),

    // ------------------------------------------------------------- pipeline
    Lead: a
      .model({
        name: a.string().required(),
        phone: a.string().required(),
        email: a.string(),
        organisation: a.string(),
        trackId: a.id(),
        track: a.belongsTo('Track', 'trackId'),
        trackSlug: a.string(),
        message: a.string(),
        locale: a.string(),
        source: a.string(),
        status: a.enum(['NEW', 'CONTACTED', 'ENROLLED', 'CLOSED']),
      })
      .authorization((allow) => [
        allow.publicApiKey().to(['create']),
        allow.authenticated().to(['create']),
        allow.group(ADMIN_GROUP),
      ]),

    Registration: a
      .model({
        name: a.string().required(),
        phone: a.string().required(),
        email: a.string().required(),
        // Stored encrypted at rest by DynamoDB; never rendered outside the admin area.
        qid: a.string(),
        university: a.string(),
        degree: a.string(),
        occupation: a.enum(['STUDENT', 'GRADUATE', 'LECTURER', 'EMPLOYEE']),
        employer: a.string(),
        trackId: a.id(),
        track: a.belongsTo('Track', 'trackId'),
        trackSlug: a.string(),
        locale: a.string(),
        status: a.enum([
          'APPLIED',
          'TEST_SCHEDULED',
          'TESTED',
          'SELECTED',
          'WAITLIST',
          'REJECTED',
          'ENROLLED',
        ]),
        testScore: a.integer(),
        notes: a.string(),
        appointments: a.hasMany('TestAppointment', 'registrationId'),
      })
      .authorization((allow) => [
        allow.publicApiKey().to(['create']),
        allow.authenticated().to(['create']),
        allow.owner().to(['read']),
        allow.group(ADMIN_GROUP),
      ]),

    TestSlot: a
      .model({
        start: a.datetime().required(),
        end: a.datetime(),
        room: a.string(),
        capacity: a.integer().default(12),
        booked: a.integer().default(0),
        isOpen: a.boolean().default(true),
        appointments: a.hasMany('TestAppointment', 'slotId'),
      })
      .authorization(publicReadAdminWrite),

    TestAppointment: a
      .model({
        registrationId: a.id().required(),
        registration: a.belongsTo('Registration', 'registrationId'),
        slotId: a.id(),
        slot: a.belongsTo('TestSlot', 'slotId'),
        slotStart: a.datetime(),
        slotEnd: a.datetime(),
        room: a.string(),
        status: a.enum(['BOOKED', 'ATTENDED', 'NO_SHOW', 'RESCHEDULED']),
      })
      .authorization((allow) => [allow.owner().to(['read']), allow.group(ADMIN_GROUP)]),

    // ------------------------------------------------------------- learning
    Enrollment: a
      .model({
        trackId: a.id().required(),
        track: a.belongsTo('Track', 'trackId'),
        cohortId: a.id(),
        cohort: a.belongsTo('Cohort', 'cohortId'),
        userId: a.string(),
        status: a.enum(['CONFIRMED', 'IN_PROGRESS', 'CERTIFIED', 'CANCELLED']),
        paidQar: a.integer(),
        certificateKey: a.string(),
      })
      .authorization((allow) => [allow.owner(), allow.group(ADMIN_GROUP)]),

    Lesson: a
      .model({
        trackId: a.id(),
        track: a.belongsTo('Track', 'trackId'),
        moduleId: a.id(),
        module: a.belongsTo('Module', 'moduleId'),
        order: a.integer().default(0),
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        videoKey: a.string(),
        durationSeconds: a.integer(),
        // Public-API-key callers may read every Lesson row, so the pages filter on
        // `isPublic` before rendering. Private video bytes live behind
        // `protected/lessons/*` in storage, which the API key cannot reach.
        isPublic: a.boolean().default(false),
      })
      .authorization(publicReadAdminWrite),

    LessonProgress: a
      .model({
        lessonId: a.id().required(),
        userId: a.string(),
        seconds: a.integer().default(0),
        completed: a.boolean().default(false),
      })
      .authorization((allow) => [allow.owner(), allow.group(ADMIN_GROUP)]),

    LabBooking: a
      .model({
        userId: a.string(),
        lab: a.enum(['ROBOTICS', 'DRONES', 'NETWORK', 'CYBER', 'AI']),
        start: a.datetime().required(),
        end: a.datetime(),
        status: a.enum(['BOOKED', 'ATTENDED', 'CANCELLED']),
      })
      .authorization((allow) => [allow.owner(), allow.group(ADMIN_GROUP)]),

    // ---------------------------------------------------------------- media
    VideoAsset: a
      .model({
        title: a.string().required(),
        s3Key: a.string().required(),
        purpose: a.enum(['HERO', 'TRACK', 'LESSON', 'TESTIMONIAL']),
        trackSlug: a.string(),
        durationSeconds: a.integer(),
      })
      .authorization(publicReadAdminWrite),

    Testimonial: a
      .model({
        name: a.string().required(),
        roleEn: a.string(),
        roleAr: a.string(),
        quoteEn: a.string(),
        quoteAr: a.string(),
        photoKey: a.string(),
        isPublished: a.boolean().default(false),
      })
      .authorization(publicReadAdminWrite),

    Partner: a
      .model({
        name: a.string().required(),
        logoKey: a.string(),
        kind: a.enum(['MANUFACTURER', 'CERTIFICATION', 'CORPORATE', 'UNIVERSITY']),
        status: a.enum(['IN_DISCUSSION', 'SIGNED']),
        url: a.string(),
      })
      .authorization(publicReadAdminWrite),

    Post: a
      .model({
        slug: a.string().required(),
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        excerptEn: a.string(),
        excerptAr: a.string(),
        bodyEn: a.string(),
        bodyAr: a.string(),
        coverKey: a.string(),
        publishedAt: a.datetime(),
        isPublished: a.boolean().default(false),
      })
      .secondaryIndexes((index) => [index('slug')])
      .authorization(publicReadAdminWrite),

    Announcement: a
      .model({
        titleEn: a.string().required(),
        titleAr: a.string().required(),
        bodyEn: a.string(),
        bodyAr: a.string(),
        publishedAt: a.datetime(),
        isPublished: a.boolean().default(true),
      })
      .authorization(publicReadAdminWrite),

    CorporateEnquiry: a
      .model({
        company: a.string().required(),
        contactName: a.string().required(),
        phone: a.string().required(),
        email: a.string(),
        headcount: a.integer(),
        tracks: a.string().array(),
        message: a.string(),
        status: a.enum(['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST']),
      })
      .authorization((allow) => [
        allow.publicApiKey().to(['create']),
        allow.authenticated().to(['create']),
        allow.group(ADMIN_GROUP),
      ]),

    // ------------------------------------------------------- custom mutations
    notifyLead: a
      .mutation()
      .arguments({
        leadId: a.id().required(),
        name: a.string().required(),
        phone: a.string().required(),
        email: a.string(),
        organisation: a.string(),
        trackSlug: a.string(),
        message: a.string(),
        locale: a.string(),
        source: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(notifyLead)),

    bookTestSlot: a
      .mutation()
      .arguments({
        registrationId: a.id().required(),
        slotId: a.id().required(),
        locale: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(bookTestSlot)),

    notifyCorporate: a
      .mutation()
      .arguments({
        enquiryId: a.id().required(),
        company: a.string().required(),
        contactName: a.string().required(),
        phone: a.string().required(),
        email: a.string(),
        headcount: a.integer(),
        tracks: a.string().array(),
        message: a.string(),
        locale: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(notifyCorporate)),

    // Reads only the caller's own records, matched on the verified Cognito e-mail
    // claim — see amplify/functions/my-portal/resource.ts for why.
    myPortal: a
      .query()
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(myPortal)),
  })
  .authorization((allow) => [
    allow.resource(notifyLead),
    allow.resource(bookTestSlot),
    allow.resource(notifyCorporate),
    allow.resource(myPortal),
  ])

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
})
