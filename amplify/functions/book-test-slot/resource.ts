import { defineFunction, secret } from '@aws-amplify/backend'

// `secret()` makes the deploy fail if the secret has not been created for the
// branch yet (Amplify console → Hosting → Secrets). Opt in with the
// WHATSAPP_SECRET_ENABLED=1 build environment variable once it exists; until
// then WhatsApp sends are skipped and e-mail still goes out.
const whatsappToken: Record<string, ReturnType<typeof secret>> = process.env
  .WHATSAPP_SECRET_ENABLED === '1'
  ? { WHATSAPP_TOKEN: secret('WHATSAPP_TOKEN') }
  : {}

export const bookTestSlot = defineFunction({
  name: 'book-test-slot',
  entry: './handler.ts',
  // Data handlers that also call the data API must live in the data stack;
  // in their own stack CloudFormation reports a circular dependency.
  resourceGroupName: 'data',
  timeoutSeconds: 25,
  environment: {
    NOTIFY_EMAIL_TO: process.env.NOTIFY_EMAIL_TO ?? '',
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM ?? '',
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? '',
    WHATSAPP_TO: process.env.WHATSAPP_TO ?? '',
    WHATSAPP_TEMPLATE_TEST: process.env.WHATSAPP_TEMPLATE_TEST ?? 'test_appointment_confirmed',
    ...whatsappToken,
    // TEST_SLOT_TABLE is injected in amplify/backend.ts once the table exists.
    TEST_SLOT_TABLE: '',
  },
})
