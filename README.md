# Qatar Tech Academy — أكاديمية قطر للتقنية

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

> **The outputs file must come from this repo's backend.** An
> `amplify_outputs.json` copied from another Amplify app (the Todo starter, for
> instance) has a data endpoint but none of these models. `lib/amplify.ts`
> fingerprints the file and treats a mismatch like a missing file — seed
> content, forms disabled — and `npm run build` prints which models it found.

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

**Add an admin (also what the seed runs as).** Content models are public-read
but Admins-write, so `npm run seed` signs in as an Admin. Create one — the pool
id is `auth.user_pool_id` in `amplify_outputs.json`:

```bash
POOL=<user pool id>; EMAIL=<you@example.com>; PASS=<a strong password>
aws cognito-idp admin-create-user --user-pool-id $POOL --username $EMAIL   --user-attributes Name=email,Value=$EMAIL Name=email_verified,Value=true --message-action SUPPRESS
aws cognito-idp admin-set-user-password --user-pool-id $POOL --username $EMAIL --password "$PASS" --permanent
aws cognito-idp admin-add-user-to-group --user-pool-id $POOL --username $EMAIL --group-name Admins
```

Then put `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local` (git-ignored)
and run `npm run seed`. The same account signs in at `/admin`. The sandbox and
the Hosting branch have **separate** user pools, so do this once per pool.

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

| Variable                                       | Purpose                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `TURNSTILE_SECRET_KEY`                         | Enables server-side Turnstile verification                        |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`      | Admins-group user the seed script signs in as (`.env.local` only) |
| `WHATSAPP_SECRET_ENABLED`                      | `1` once the `WHATSAPP_TOKEN` secret exists (see below)           |
| `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | `/api/whatsapp` webhook                                           |

### Backend functions (build-time, read in `amplify/functions/*/resource.ts`)

| Variable                 | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `NOTIFY_EMAIL_TO`        | Where lead and registration alerts go (comma-separated) |
| `NOTIFY_EMAIL_FROM`      | Must be an SES-verified identity                        |
| `WHATSAPP_PHONE_ID`      | Meta Cloud API phone number ID                          |
| `WHATSAPP_TO`            | Staff alert number, digits only                         |
| `WHATSAPP_TEMPLATE_LEAD` | Approved template, 4 body params                        |
| `WHATSAPP_TEMPLATE_TEST` | Approved template, 3 body params                        |

Plus one secret, which is **opt-in**: `secret()` aborts the whole backend
deploy if the secret does not exist yet, so the functions only reference it when
the build environment variable `WHATSAPP_SECRET_ENABLED=1` is set. Create the
secret first, then set that variable, then redeploy:

```bash
npx ampx sandbox secret set WHATSAPP_TOKEN      # sandbox
# Hosting: Amplify console → Hosting → Secrets → WHATSAPP_TOKEN,
#          then Environment variables → WHATSAPP_SECRET_ENABLED = 1
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
7. **Seed the branch backend.** It has its own user pool and empty tables.
   Fetch its outputs without overwriting the sandbox's, create an Admin in
   _that_ pool (§3), then seed against it:

   ```bash
   npx ampx generate outputs --app-id <app id> --branch main --out-dir .amplify/branch
   AMPLIFY_OUTPUTS=.amplify/branch/amplify_outputs.json npm run seed
   ```

---

## 6. Content

`data/seed-content.ts` is the single source for track copy, and `npm run seed`
upserts it (matched on slug, code or name, so re-running never duplicates rows).
After launch, edit content in `/admin` — the seed stays as the offline fallback.

### Images

Raw photography lives in `source-images/` (git-ignored — 35 MB of PNGs) and is
turned into what the site serves by:

```bash
npm run images
```

That script (`scripts/optimize-images.mjs`) resizes each file to the largest
width the layout ever renders, writes progressive JPEGs (~100–200 KB each,
2.8 MB in total), derives the light-theme logo, favicon and touch icon, and
records a 20 px blur placeholder per image in `data/image-manifest.json`.
`MediaImage` inlines that blur so every frame is painted with the photo's
colours on the first paint; next/image then serves per-breakpoint AVIF/WebP,
cached for 30 days. The hero slide and the header logo are `priority`, so they
are in the preload set.

Why not S3: Amplify Hosting already serves `public/` through CloudFront with no
lambda in the way. Objects in the Amplify storage bucket need a signed URL from
the Cognito guest role — an extra round-trip before the download can start,
and no preload. S3 is the right place for videos and admin uploads.

A `/images/…` path that is not in the manifest is treated as missing: the
branded placeholder renders and no request is made. Add the source file, add a
line to `PHOTOS` in the script, re-run it, commit the outputs.

Slot map (source → served):

```text
hero-1..3          hero1 (3|2|1).png     robotics trainer / caged drone / the SOC
tracks/*           image (2..7).png      robotics, networking, cyber, ai, marketing, coming-soon
sections/*         image (1,8..13).png, image (1|2).jpeg
team/*             not supplied — placeholders until portraits arrive
logo.png           derived: charcoal wordmark for light surfaces
logo-white.png     the supplied file, for dark surfaces
app/icon.png       the emblem, cropped square
```

The `-ar` mirrored hero variants from the brief are deliberately not produced:
flipping photographs mirrors screens and hands. Both locales share one image.
Videos are uploaded through **Admin → Media** to `public/videos/…` in S3.

---

## 7. Performance

`npm run build && npm run start -- --port 3100`, then in another shell:

```bash
CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm run lighthouse
```

Reports land in `lighthouse/` (git-ignored) with a `summary.json`. Latest clean
run on a Windows dev box against `next start`, mobile preset, real images:

| Page                | Perf | A11y | Best practices | SEO | FCP   | LCP   | CLS |
| ------------------- | ---- | ---- | -------------- | --- | ----- | ----- | --- |
| /ar                 | 79   | 100  | 100            | 100 | 1.8 s | 3.8 s | 0   |
| /en                 | 77   | 100  | 100            | 100 | 1.7 s | 4.1 s | 0   |
| /ar/tracks/robotics | 90   | 100  | 100            | 100 | 1.8 s | 3.4 s | 0   |
| /en/tracks/robotics | 91   | 100  | 100            | 100 | 1.7 s | 3.4 s | 0   |

Accessibility, best practices, SEO and CLS all meet their targets. Performance
does not yet reach 95: the LCP is the hero photo under Lighthouse's simulated
slow-4G, served by `next start` on a laptop. Two notes before reading too much
into it:

1. Scores on this machine swing by 10–15 points between runs (a run taken while
   the Playwright suite was executing scored 51 on /ar with 5 s of blocking
   time; the clean re-run scored 79 with 390 ms). Always measure alone.
2. Measure again after the first Amplify Hosting deploy — CloudFront in front
   of the optimiser, HTTP/2 and Brotli change the picture materially.

What was already fixed by measurement, and is worth not regressing:

- The scroll reveal used to render every section at `opacity: 0` until framer
  hydrated, which put **1.26 s of hydration inside LCP**. `FadeUp` now renders
  visible and only hides elements that are still below the fold at mount, so
  above-the-fold content paints immediately. `HoverLift` became CSS.
- `aws-amplify` was in every public page's bundle via the global
  `ConfigureAmplifyClientSide`. It is now mounted only in `/portal` and
  `/admin`, and the storage SDK is imported on demand inside `useStorageUrl`.
- Cairo at four weights was the measured cause of **CLS 0.184** on Arabic pages.
  It now loads two weights with `display: 'optional'` and no preload.

  _That is a deliberate trade-off_: on a cold, slow first visit Arabic text
  paints in the system font instead of Cairo, and Cairo appears from cache on
  every visit after. Cairo has no size-adjusted Arabic fallback, so `swap`
  reflowed whole paragraphs. To go back, set `display: 'swap'` and
  `preload: true` in `app/[locale]/layout.tsx` and expect CLS around 0.18 on
  text-heavy pages until a metric-matched fallback face is added.

- A broken image no longer calls `setState`; the placeholder is server-rendered
  behind it, so a page of missing assets does not trigger a dozen re-renders.
- **Content reads are cached with `unstable_cache`** (5 min, tag `content`).
  The Amplify data client fetches with `cache: 'no-store'`, which in Next 15
  opts the whole route out of static rendering — with a live backend every
  public page had quietly become a per-request Lambda render, and CloudFront
  answered `no-store` and missed on every hit. With the cache in place the
  route table shows `Revalidate 5m` again and responses carry `s-maxage=300`.
  If you edit content in `/admin` and want it live before the 5 minutes are
  up, call `revalidateTag('content')` (a small admin route is the natural
  home for that). Test slots are deliberately not cached: `/register` is
  dynamic and must show live availability.

## 8. Conventions worth knowing

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
