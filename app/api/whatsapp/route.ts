import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * Placeholder: it verifies the subscription handshake and the payload signature,
 * then logs. Wire the message handling to the Lead model when the WhatsApp
 * Business account is live.
 *
 * Env: WHATSAPP_VERIFY_TOKEN (handshake), WHATSAPP_APP_SECRET (X-Hub signature).
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  const expected = process.env.WHATSAPP_VERIFY_TOKEN

  if (!expected) return new NextResponse('not configured', { status: 503 })
  if (mode === 'subscribe' && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET
  const raw = await request.text()

  if (secret) {
    const signature = request.headers.get('x-hub-signature-256') ?? ''
    const digest = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`
    const a = Buffer.from(signature)
    const b = Buffer.from(digest)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return new NextResponse('invalid signature', { status: 401 })
    }
  }

  try {
    const payload = JSON.parse(raw) as { entry?: unknown[] }
    console.info('[whatsapp] webhook', JSON.stringify(payload).slice(0, 800))
  } catch {
    return new NextResponse('bad request', { status: 400 })
  }

  // Meta retries on anything other than 200.
  return NextResponse.json({ received: true })
}
