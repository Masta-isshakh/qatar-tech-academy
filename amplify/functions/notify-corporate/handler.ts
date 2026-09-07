import type { Schema } from '../../data/resource'
import { runNotifiers, sendEmail, sendWhatsAppTemplate } from '../shared/notify'

type Args = Schema['notifyCorporate']['args']

export const handler: Schema['notifyCorporate']['functionHandler'] = async (event) => {
  const a = event.arguments as Args
  const tracks = (a.tracks ?? []).filter(Boolean).join(', ') || '-'

  const results = await runNotifiers({
    email: () =>
      sendEmail(`Corporate enquiry — ${a.company} — ${a.headcount ?? '?'} seats`, [
        `Organisation: ${a.company}`,
        `Contact: ${a.contactName}`,
        `Phone: ${a.phone}`,
        `Email: ${a.email ?? '-'}`,
        `Headcount: ${a.headcount ?? '-'}`,
        `Tracks: ${tracks}`,
        `Locale: ${a.locale ?? '-'}`,
        `Message: ${a.message ?? '-'}`,
        `Enquiry ID: ${a.enquiryId}`,
      ]),
    whatsapp: () =>
      sendWhatsAppTemplate(
        'WHATSAPP_TEMPLATE_LEAD',
        [a.contactName, a.phone, `${a.company} (${a.headcount ?? '?'} seats)`, tracks],
        { languageCode: 'en' }
      ),
  })

  return { ok: true, enquiryId: a.enquiryId, ...results }
}
