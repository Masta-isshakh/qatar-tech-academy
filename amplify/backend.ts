import { defineBackend } from '@aws-amplify/backend'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { notifyLead } from './functions/notify-lead/resource'
import { notifyCorporate } from './functions/notify-corporate/resource'
import { bookTestSlot } from './functions/book-test-slot/resource'
import { myPortal } from './functions/my-portal/resource'

const backend = defineBackend({
  auth,
  data,
  storage,
  notifyLead,
  notifyCorporate,
  bookTestSlot,
  myPortal,
})

// --- SES -------------------------------------------------------------------
// Lead, corporate and appointment notifications are sent from Lambda through SES.
// The sending identity in NOTIFY_EMAIL_FROM must be verified in SES first.
const sesPolicy = new PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
})

for (const fn of [backend.notifyLead, backend.notifyCorporate, backend.bookTestSlot]) {
  fn.resources.lambda.addToRolePolicy(sesPolicy)
}

// --- Atomic seat booking ---------------------------------------------------
// `book-test-slot` claims a seat with a conditional DynamoDB UpdateItem rather
// than a read-then-write through AppSync, so concurrent registrations cannot
// oversell a slot. That needs the physical table name and direct write access.
const testSlotTable = backend.data.resources.tables['TestSlot']
backend.bookTestSlot.addEnvironment('TEST_SLOT_TABLE', testSlotTable.tableName)
testSlotTable.grantReadWriteData(backend.bookTestSlot.resources.lambda)

export default backend
