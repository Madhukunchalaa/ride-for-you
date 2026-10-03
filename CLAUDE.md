# Ride For You — Ops Dashboard (LEGACY, LIVE IN PRODUCTION)

## Read this first: there are two Ride For You codebases

This is the **old ops dashboard**. It is the one currently running Balram's
business and taking real money. It is **not** the new rider app.

|                  | **This repo**                          | The new app                                    |
| ---------------- | -------------------------------------- | ---------------------------------------------- |
| What it is       | Internal ops dashboard, admin-only     | Customer-facing rider app + new admin           |
| Folder           | `D:\Dev\madtech\ride`                  | `C:\Users\madte\ride-for-you`                   |
| GitHub           | `Madhukunchalaa/ride-for-you`          | `madtechsolutions2026/ride-for-you-app`         |
| Stack            | Express + MongoDB/Mongoose, React (Vite) client | Express + Prisma/Postgres, Expo RN, React admin |
| Status           | **Live. Real riders, real payments.**  | In development                                  |

The names are crossed over: this repo is the one *named* `ride-for-you`, while
the new app is the one whose *folder* is called `ride-for-you`. Check the stack
to be certain — **Mongoose means you are here; Prisma means you are in the new app.**

When Balram reports a problem with "the dashboard", he means this repo. When he
asks about "the app", he means the other one.

## What this system does

Weekly EV bike rental management for the existing business:

- Rider records, deployment and return, vehicle assignment
- Weekly rent collection via Razorpay and PhonePe payment links
- WhatsApp reminders on an escalation ladder (normal → warning → final)
- Recovery and police-recovery buckets for non-payers
- Invoices, expenses, payroll, analytics

## Domain vocabulary → schema

Balram describes things in business terms. The mapping is not obvious:

| He says              | Field                |
| -------------------- | -------------------- |
| deployment date      | `rider.deployDate`   |
| next payment date    | `rider.returnDate`   |
| weeks paid           | `rider.totalWeeks`   |

`returnDate` is **not** a date the bike comes back — it is the next rent due
date. The reminder engine drives everything off it.

## The billing rule (do not break this again)

Every due date sits exactly N whole weeks after `deployDate`. Paying does not
move the anniversary — a rider who pays five days late still owes those days.
`src/utils/scheduleHelper.js` is the only place that advances a due date, and
every caller must chain from the **previous due date**, never from `new Date()`.

Anchoring to the payment date silently forgives overdue rent and walks the
rider's cycle permanently off their deploy date. That bug shipped once, in both
payment webhooks, and cost real money before the client spotted it.

`audit_schedule_drift.js` (read-only) lists riders whose cycle has already
drifted. Run it before and after anything that touches billing dates.

## Layout

```
server.js              entry point
src/controllers/       route handlers — paymentController.js holds the webhooks
src/services/          automatedReminders.js (cron), paymentScheduler.js
src/utils/             scheduleHelper.js, paymentReminders.js, cronJobs.js
src/models/            Mongoose schemas — Rider.js is the core one
client/                React admin UI
*.js at repo root      one-off operational scripts, not part of the app
```

## Cautions

- Automated WhatsApp reminders run on a cron **every minute** and message real
  riders. `PAUSE_AUTO_REMINDERS=true` in `.env` is the kill switch — set it
  before testing anything that touches the reminder path.
- The payment webhooks are idempotent on the provider's payment id. Keep them
  that way; gateways retry.
- Root-level `test_*.js` and `fix_*.js` scripts hit the live database. Read
  before running.
