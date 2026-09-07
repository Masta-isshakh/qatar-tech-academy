import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const ses = new SESv2Client({})

export type NotifyResult = Record<string, string>

/** Sends a plain-text e-mail via SES. Skips silently when SES is not configured. */
export async function sendEmail(subject: string, lines: string[]): Promise<NotifyResult> {
  const to = process.env.NOTIFY_EMAIL_TO
  const from = process.env.NOTIFY_EMAIL_FROM
  if (!to || !from) return { email: 'skipped: NOTIFY_EMAIL_* not set' }

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: to.split(',').map((s) => s.trim()) },
      Content: {
        Simple: { Subject: { Data: subject }, Body: { Text: { Data: lines.join('\n') } } },
      },
    })
  )
  return { email: 'sent' }
}

/**
 * Sends an approved WhatsApp Cloud API template.
 * `to` defaults to the academy's own number (staff alert); pass a learner number
 * to send them a confirmation instead.
 */
export async function sendWhatsAppTemplate(
  templateEnvVar: string,
  params: string[],
  opts: { to?: string; languageCode?: string } = {}
): Promise<NotifyResult> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const to = opts.to || process.env.WHATSAPP_TO
  const template = process.env[templateEnvVar]

  if (!token || !phoneId || !to || !template) {
    return { whatsapp: `skipped: WHATSAPP_* / ${templateEnvVar} not set` }
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/[^\d]/g, ''),
      type: 'template',
      template: {
        name: template,
        language: { code: opts.languageCode ?? 'ar' },
        components: [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text: text.slice(0, 200) || '-' })),
          },
        ],
      },
    }),
  })

  const body = await res.text()
  return { whatsapp: res.ok ? 'sent' : `error ${res.status}: ${body.slice(0, 300)}` }
}

/** Runs notifiers independently so one failure never blocks the other. */
export async function runNotifiers(
  tasks: Record<string, () => Promise<NotifyResult>>
): Promise<NotifyResult> {
  const results: NotifyResult = {}
  await Promise.all(
    Object.entries(tasks).map(async ([label, task]) => {
      try {
        Object.assign(results, await task())
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results[label] = `error: ${message}`
        console.error(label, err)
      }
    })
  )
  return results
}
