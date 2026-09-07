# Qatar Tech Education — أكاديمية قطر للتقنية

The academy's website: Next.js 15 (App Router) on AWS Amplify Gen 2, Arabic-first
and bilingual, with a learner portal and an admin back office.

---

## 1. Quick start

```bash
npm install
npm run dev            # http://localhost:3000 → redirects to /ar
```

The site runs **without an AWS backend**. When `amplify_outputs.json` is missing,
`scripts/ensure-outputs.mjs` writes a clearly-marked placeholder, `lib/amplify.ts`
reports `isAmplifyConfigured === false`, and every public page renders from
[`data/seed-content.ts`](data/seed-content.ts). Forms are disabled in that state
rather than failing at submit time.

To get the real thing:

```bash
npx ampx sandbox       # deploys a personal backend, writes amplify_outputs.json
npm run seed           # upserts tracks, courses, cohorts, partners, test slots
npm run dev
```

`ampx sandbox` needs valid AWS credentials (`aws configure` or `aws sso login`).

### Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server                                          |
| `npm run build`     | Production build (runs `ensure-outputs` first)      |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | `tsc --noEmit`                                      |
| `npm run format`    | Prettier                                            |
| `npm test`          | Vitest unit tests                                   |
| `npm run test:e2e`  | Playwright smoke suite (builds and serves on :3100) |
| `npm run seed`      | Seeds the backend from `data/seed-content.ts`       |
| `npm run sandbox`   | `ampx sandbox`                                      |

---

## 2. Layout

```text
amplify/                 Gen 2 backend
  auth/                  Cognito, Admins group
  data/                  the full schema + custom mutations
  storage/               qteMedia bucket (public / protected / private)
  functions/             notify-lead, notify-corporate, book-test-slot, my-portal
app/
  [locale]/              every page; renders <html lang dir>
  actions/forms.ts       Server Actions for the three public forms
  api/whatsapp/          Meta Cloud API webhook (placeholder)
  sitemap.ts robots.ts
components/
  ui/                    shadcn-pattern primitives (Radix + cva)
  site/                  header, footer, hero, cards, blocks
  forms/ register/ portal/ admin/
data/seed-content.ts     bilingual source content + offline fallback
i18n/                    next-intl routing and request config
lib/                     content readers, Amplify clients, utils, validation
messages/{ar,en}.json    every UI string
tests/unit  tests/e2e
```

### Rendering

| Route                                                            | Mode                                     |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `/`, `/tracks`, `/tracks/[slug]`, `/news`, `/news/[slug]`        | ISR, 5 min                               |
| `/exam-centre`, `/corporate`, `/about`, `/investors`, `/contact` | ISR, 1 h                                 |
| `/privacy`, `/terms`                                             | ISR, 24 h                                |
| `/register`                                                      | dynamic — slot availability must be live |
| `/portal`, `/admin`                                              | dynamic, authenticated                   |

---

## 3. Backend notes

**Authorisation.** `apiKey` is the default mode (public read of content, create
on `Lead`, `Registration` and `CorporateEnquiry`). Everything else requires
Cognito, and writes to content models require the `Admins` group.

**Why `myPortal` exists.** Registrations are created anonymously, so they carry
no `owner` field. Widening read access on the model would expose every
applicant's personal data to any signed-in user, so the portal reads through the
`my-portal` Lambda, which matches strictly on the caller's verified Cognito
e-mail claim.

**Atomic seat booking.** `book-test-slot` claims a seat with a single conditional
DynamoDB `UpdateItem` (`booked < capacity`) rather than a read-then-write through
AppSync, so two simultaneous registrations cannot oversell a slot. If the
appointment or registration update then fails, the seat is released. The physical
table name is injected in `amplify/backend.ts`.

**Add an admin.** In the Cognito console, or:

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <from amplify_outputs.json> \
  --username <email> --group-name Admins
```

---

## 4. Environment variables

None are required to build. Set these in Amplify Hosting → _Environment
variables_ (and in `.env.local` for development). See `.env.example`.

### Public (bundled into the client)

| Variable                                                                | Purpose                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                  | Canonical origin for metadata, sitemap and OG   |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                                           | Digits only, no `+` (e.g. `97433123456`)        |
| `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_CORPORATE_EMAIL` | Footer and contact page                         |
| `NEXT_PUBLIC_ADDRESS_EN`, `NEXT_PUBLIC_ADDRESS_AR`                      | Contact page, JSON-LD                           |
| `NEXT_PUBLIC_LICENCE_NUMBER`                                            | MoEHE licence, shown in the footer once granted |
| `NEXT_PUBLIC_INSTAGRAM`, `_LINKEDIN`, `_X`, `_YOUTUBE`                  | Footer links                                    |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`                       | Analytics; loaded only after consent            |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                        | Enables the Turnstile widget                    |

### Server only

| Variable                                       | Purpose                                    |
| ---------------------------------------------- | ------------------------------------------ |
| `TURNSTILE_SECRET_KEY`                         | Enables server-side Turnstile verification |
| `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | `/api/whatsapp` webhook                    |

### Backend functions (build-time, read in `amplify/functions/*/resource.ts`)

| Variable                 | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `NOTIFY_EMAIL_TO`        | Where lead and registration alerts go (comma-separated) |
| `NOTIFY_EMAIL_FROM`      | Must be an SES-verified identity                        |
| `WHATSAPP_PHONE_ID`      | Meta Cloud API phone number ID                          |
| `WHATSAPP_TO`            | Staff alert number, digits only                         |
| `WHATSAPP_TEMPLATE_LEAD` | Approved template, 4 body params                        |
| `WHATSAPP_TEMPLATE_TEST` | Approved template, 3 body params                        |

Plus one secret:

```bash
npx ampx sandbox secret set WHATSAPP_TOKEN
```

Every notifier **skips silently** when its variables are unset, so an incomplete
messaging setup never fails a visitor's submission.

---

## 5. Deploying

`amplify.yml` is already wired for Amplify Hosting: the backend phase runs
`ampx pipeline-deploy`, which writes `amplify_outputs.json` before `npm run build`.

1. Connect the repository in the Amplify console (Next.js SSR is detected).
2. Add the environment variables above.
3. Verify `NOTIFY_EMAIL_FROM` in SES and move the account out of the sandbox.
4. Set the `WHATSAPP_TOKEN` secret for the branch.
5. Add the custom domain (`app.qatartech.education` or whichever is chosen) under
   _Hosting → Custom domains_, then update `NEXT_PUBLIC_SITE_URL` to match and
   redeploy so canonicals, hreflang and the sitemap use the live origin.
6. Point the Meta webhook at `https://<domain>/api/whatsapp`.

---

## 6. Content

`data/seed-content.ts` is the single source for track copy, and `npm run seed`
upserts it (matched on slug, code or name, so re-running never duplicates rows).
After launch, edit content in `/admin` — the seed stays as the offline fallback.

Images go in `public/images/…` with the exact names in `MediaImage` callers:

```text
logo.svg  logo-white.svg  favicon.ico  og.jpg
hero/hero-{1,2,3}.jpg          2560×1097, plus -ar mirrored variants
tracks/{robotics,networking,cybersecurity,ai,marketing,coming-soon}.jpg
sections/{exam-centre,certifications,app,corporate,university,cascade,
          health-robotics,workshop,doha-sunrise}.jpg
team/{tanaka,layla,rajesh}.jpg
```

Until a file exists, `MediaImage` falls back to a maroon-on-sand placeholder, so
a missing asset degrades to a branded panel rather than a broken image. Videos
are uploaded through **Admin → Media** to `public/videos/…` in S3.

---

## 7. Conventions worth knowing

- **No hard-coded strings.** Everything lives in `messages/{ar,en}.json`.
- **Prices use Western digits** even in Arabic (`formatPrice`, `.ltr-nums`);
  that is the brand rule and how Qatari invoices are written.
- **RTL** uses logical properties (`ms-`, `pe-`, `start-`) throughout — avoid
  `left`/`right` utilities.
- **Bilingual fallback**: `pick()` treats an empty string as missing, so a field
  left blank in the admin renders in the other language, not blank.
- **Markdown** (posts, legal pages) goes through `lib/markdown.ts`, which escapes
  all source HTML and allows only `http(s)`, `mailto:` and relative links. There
  is no sanitiser to keep patched because no raw HTML is ever passed through.
- **Motion** respects `prefers-reduced-motion` in `FadeUp`, `HoverLift` and the
  hero slider.
