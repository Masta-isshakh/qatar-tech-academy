import type { Schema } from '../../data/resource'
import { runNotifiers, sendEmail, sendWhatsAppTemplate } from '../shared/notify'

type Args = Schema['notifyLead']['args']

export const handler: Schema['notifyLead']['functionHandler'] = async (event) => {
  const a = event.arguments as Args

  const results = await runNotifiers({
    email: () =>
      sendEmail(`New lead — ${a.trackSlug ?? 'general'} — ${a.name}`, [
        `Name: ${a.name}`,
        `Phone: ${a.phone}`,
        `Email: ${a.email ?? '-'}`,
        `Organisation: ${a.organisation ?? '-'}`,
        `Track: ${a.trackSlug ?? '-'}`,
        `Source: ${a.source ?? '-'}`,
        `Locale: ${a.locale ?? '-'}`,
        `Message: ${a.message ?? '-'}`,
        `Lead ID: ${a.leadId}`,
      ]),
    whatsapp: () =>
      sendWhatsAppTemplate(
        'WHATSAPP_TEMPLATE_LEAD',
        [a.name, a.phone, a.trackSlug ?? 'general', a.message ?? '-'],
        { languageCode: 'en' }
      ),
  })

  return { ok: true, leadId: a.leadId, ...results }
}
