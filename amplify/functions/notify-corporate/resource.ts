import { defineFunction, secret } from '@aws-amplify/backend'

export const notifyCorporate = defineFunction({
  name: 'notify-corporate',
  entry: './handler.ts',
  timeoutSeconds: 20,
  environment: {
    NOTIFY_EMAIL_TO: process.env.NOTIFY_EMAIL_TO ?? '',
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM ?? '',
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? '',
    WHATSAPP_TO: process.env.WHATSAPP_TO ?? '',
    WHATSAPP_TEMPLATE_LEAD: process.env.WHATSAPP_TEMPLATE_LEAD ?? 'new_lead_alert',
    WHATSAPP_TOKEN: secret('WHATSAPP_TOKEN'),
  },
})
