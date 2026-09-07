import 'server-only'

/**
 * Cloudflare Turnstile verification.
 *
 * Both keys are optional: with no secret configured the check is skipped and the
 * honeypot alone guards the public forms. Set `TURNSTILE_SECRET_KEY` (server) and
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client) to switch it on — no code change.
 */
export async function verifyTurnstile(token?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      cache: 'no-store',
    })
    const body = (await res.json()) as { success?: boolean }
    return body.success === true
  } catch (err) {
    console.error('[turnstile] verification failed', err)
    // Fail closed: a verification outage must not become an open spam window.
    return false
  }
}
