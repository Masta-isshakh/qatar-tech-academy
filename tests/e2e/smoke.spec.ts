import { test, expect } from '@playwright/test'

test.describe('home', () => {
  test('serves Arabic RTL by default', async ({ page }) => {
    await page.goto('/ar')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'ar')
    await expect(html).toHaveAttribute('dir', 'rtl')
  })

  // The brief asks for locale detection, so `/` follows Accept-Language and
  // falls back to Arabic. Set `localeDetection: false` in i18n/routing.ts to
  // send everyone to /ar regardless of their browser.
  test('routes / by Accept-Language, falling back to Arabic', async ({ browser }) => {
    const arabic = await browser.newContext({ locale: 'ar-QA' })
    const arabicPage = await arabic.newPage()
    await arabicPage.goto('/')
    await expect(arabicPage).toHaveURL(/\/ar$/)
    await arabic.close()

    const french = await browser.newContext({ locale: 'fr-FR' })
    const frenchPage = await french.newPage()
    await frenchPage.goto('/')
    await expect(frenchPage).toHaveURL(/\/ar$/)
    await french.close()

    const english = await browser.newContext({ locale: 'en-GB' })
    const englishPage = await english.newPage()
    await englishPage.goto('/')
    await expect(englishPage).toHaveURL(/\/en$/)
    await english.close()
  })

  test('shows the hero, three slides and the six track cards', async ({ page }) => {
    await page.goto('/ar')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const dots = page.getByRole('button', { name: /الانتقال للشريحة/ })
    await expect(dots).toHaveCount(3)

    // The tracks section lists five tracks plus "coming soon".
    const cards = page.locator('#tracks li')
    await expect(cards).toHaveCount(6)
    await expect(page.getByText('الروبوتات والدرونز').first()).toBeVisible()
  })

  test('opens and closes the hero video modal', async ({ page }) => {
    await page.goto('/ar')
    await page.getByRole('button', { name: 'شاهد الفيديو' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('the language switch keeps you on the same page', async ({ page }) => {
    await page.goto('/ar/tracks/robotics')
    await page.getByRole('button', { name: /Switch to English|التحويل إلى الإنجليزية/ }).click()
    await expect(page).toHaveURL(/\/en\/tracks\/robotics$/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })
})

test.describe('track detail', () => {
  test('shows price, cohorts, certifications, modules and a WhatsApp link', async ({ page }) => {
    await page.goto('/en/tracks/cybersecurity')

    await expect(page.getByRole('heading', { name: 'Cybersecurity', level: 1 })).toBeVisible()
    await expect(page.getByText('12,000').first()).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Certifications you can earn', level: 2 })
    ).toBeVisible()
    await expect(page.getByText('CEH v13').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What you will build', level: 2 })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Schedule and cohorts', level: 2 })
    ).toBeVisible()

    const whatsapp = page.getByRole('link', { name: 'Ask on WhatsApp' })
    await expect(whatsapp).toHaveAttribute('href', /wa\.me\/\d+\?text=.*Cybersecurity/)
  })

  test('emits Course JSON-LD', async ({ page }) => {
    await page.goto('/en/tracks/robotics')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(blocks.some((b) => JSON.parse(b)['@type'] === 'Course')).toBe(true)
  })
})

test.describe('register', () => {
  test('walks through all four steps and validates the details step', async ({ page }) => {
    await page.goto('/en/register')

    // Step 1 — a track must be chosen before Next does anything.
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Which track?')).toBeVisible()

    await page.getByText('Robotics & Drones').first().click()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2 — invalid e-mail keeps us here.
    await expect(page.getByLabel('Full name')).toBeVisible()
    await page.getByLabel('Full name').fill('Test Person')
    await page.getByLabel('Mobile / WhatsApp').fill('+974 3312 3456')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()

    await page.getByLabel('Email').fill('test@example.com')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3 — slots.
    await expect(page.getByText('Pick your entry-test slot')).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4 — review with the entered values.
    await expect(page.getByText('Review and confirm')).toBeVisible()
    await expect(page.getByText('Test Person')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit registration' })).toBeVisible()
  })
})

test.describe('auth areas', () => {
  test('the portal asks for sign-in', async ({ page }) => {
    await page.goto('/en/portal')
    // Either the Authenticator or the "backend not configured" panel — never a crash.
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByText(/Sign in|Something went wrong/i).first()).toBeVisible()
  })

  test('the admin area does not render admin data to an anonymous visitor', async ({ page }) => {
    await page.goto('/en/admin')
    await expect(page.getByText(/Leads|Registrations/).first()).toBeHidden()
  })
})

test.describe('seo and consent', () => {
  test('serves robots.txt and a sitemap with both locales', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.ok()).toBe(true)
    expect(await robots.text()).toContain('Sitemap:')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.ok()).toBe(true)
    const xml = await sitemap.text()
    expect(xml).toContain('/ar/tracks')
    expect(xml).toContain('/en/tracks')
    // The investor page is unlisted.
    expect(xml).not.toContain('/investors')
  })

  test('no analytics script loads before consent is given', async ({ page }) => {
    const analyticsRequests: string[] = []
    page.on('request', (r) => {
      if (/googletagmanager|connect\.facebook\.net/.test(r.url())) analyticsRequests.push(r.url())
    })

    await page.goto('/en')
    await expect(page.getByText('We use cookies')).toBeVisible()
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect(page.getByText('We use cookies')).toBeHidden()

    expect(analyticsRequests).toEqual([])
  })
})

test.describe('accessibility basics', () => {
  test('has a skip link, one h1 and a labelled main landmark', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('main#main')).toBeVisible()
  })
})
