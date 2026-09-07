import { defineFunction, secret } from '@aws-amplify/backend'

export const bookTestSlot = defineFunction({
  name: 'book-test-slot',
  entry: './handler.ts',
  timeoutSeconds: 25,
  environment: {
    NOTIFY_EMAIL_TO: process.env.NOTIFY_EMAIL_TO ?? '',
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM ?? '',
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? '',
    WHATSAPP_TO: process.env.WHATSAPP_TO ?? '',
    WHATSAPP_TEMPLATE_TEST: process.env.WHATSAPP_TEMPLATE_TEST ?? 'test_appointment_confirmed',
    WHATSAPP_TOKEN: secret('WHATSAPP_TOKEN'),
    // TEST_SLOT_TABLE is injected in amplify/backend.ts once the table exists.
    TEST_SLOT_TABLE: '',
  },
})
