# Changelog

## [2.1.0] - 2026-05-15
### Sprint Fix Plan — Stability & Accuracy Pass

#### Fixed
- **Bug #1: Inconsistent "Next Due Date" Calculation**
  - Created `src/utils/scheduleHelper.js` for stable weekly schedule calculation.
  - Updated Razorpay/PhonePe webhooks and manual status updates to use the same stable calculation logic.
- **Bug #2: paymentStatus Never Resets to 'unpaid' for Next Cycle**
  - Created `src/utils/dailyJobs.js` with a daily cron job running at 00:30 IST to reset 'paid' status to 'unpaid' when return date is reached.
- **Bug #3: getRiders Ignores All Query Filters**
  - Implemented server-side filtering in `getRiders` for `riderStatus`, `paymentStatus`, `isRecoveryBucket`, `search`, `dueFrom`, `dueTo`, and `vehicleNumber`.
- **Bug #4: Dashboard Revenue Numbers Don't Match Across Tabs**
  - Updated `getPaymentAnalytics` to use the `Invoice` collection as the source of truth for `totalCollected` calculation.
- **Fix 5: addRider starts totalWeeks too high**
  - New riders now start with `totalWeeks: 0`.
- **Fix 6: Reactivation wipes payment history**
  - Removed overwriting of `totalWeeks` when reactivating a past rider.
- **Fix 8: Invoice duplicate detection is fragile**
  - Added `razorpayPaymentId` field to `Invoice` model and updated Razorpay webhook to use it for robust idempotency.

#### Added
- **Fix 7: Reminder Audit Log**
  - Created `ReminderLog` model.
  - Updated `sendPaymentReminder` to log every message attempt (sent/failed).
  - Added `GET /api/whatsapp/logs` endpoint for auditing reminders.
